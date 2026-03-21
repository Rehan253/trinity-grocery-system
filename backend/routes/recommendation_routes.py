import os
import requests
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_

from models import Invoice, Product, User
from security.authorization import admin_required
from services.algolia_service import sync_products_to_algolia

ALGOLIA_APP_ID = os.getenv("ALGOLIA_APP_ID", "")
ALGOLIA_ADMIN_API_KEY = os.getenv("ALGOLIA_WRITE_API_KEY", "")
ALGOLIA_INDEX_NAME = os.getenv("ALGOLIA_INDEX_NAME", "products")

recommendation_bp = Blueprint("recommendations", __name__, url_prefix="/recommendations")


def _headers():
    return {
        "Content-Type": "application/json",
        "X-Algolia-Application-Id": ALGOLIA_APP_ID,
        "X-Algolia-API-Key": ALGOLIA_ADMIN_API_KEY,
    }


def _recommend_for_product(product_id: int, limit: int = 8):
    url = f"https://{ALGOLIA_APP_ID}.algolia.net/1/indexes/*/recommendations"
    payload = {
        "requests": [
            {
                "indexName": ALGOLIA_INDEX_NAME,
                "model": "bought-together",
                "objectID": str(product_id),
                "maxRecommendations": limit,
                "threshold": 0,
                "fallbackParameters": {
                    "filters": "inStock:true"
                },
            }
        ]
    }
    resp = requests.post(url, headers=_headers(), json=payload, timeout=20)
    resp.raise_for_status()
    data = resp.json()
    return data.get("results", [{}])[0].get("hits", [])


def _product_to_json(product):
    return {
        "objectID": str(product.id),
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "price": float(product.price),
        "picture_url": product.picture_url,
    }


def _recommend_checkout_based(purchased_product_ids, limit=8):
    excluded_ids = [pid for pid in purchased_product_ids if pid is not None]

    if not excluded_ids:
        fallback = Product.query.order_by(Product.created_at.desc()).limit(limit).all()
        return [_product_to_json(product) for product in fallback]

    purchased_products = Product.query.filter(Product.id.in_(excluded_ids)).all()
    categories = [product.category for product in purchased_products if product.category]
    brands = [product.brand for product in purchased_products if product.brand]

    query = Product.query.filter(~Product.id.in_(excluded_ids))
    if categories or brands:
        filters = []
        if categories:
            filters.append(Product.category.in_(categories))
        if brands:
            filters.append(Product.brand.in_(brands))
        query = query.filter(or_(*filters))

    candidates = query.order_by(Product.created_at.desc()).limit(limit * 2).all()
    checkout_based = [_product_to_json(product) for product in candidates][:limit]

    if checkout_based:
        return checkout_based

    fallback = Product.query.filter(~Product.id.in_(excluded_ids)).order_by(Product.created_at.desc()).limit(limit).all()
    return [_product_to_json(product) for product in fallback]


def _recommend_also_bought(purchased_product_ids, limit=8):
    if not purchased_product_ids:
        return []

    also_bought = []
    seen = set(str(pid) for pid in purchased_product_ids if pid is not None)

    for product_id in purchased_product_ids:
        try:
            hits = _recommend_for_product(product_id, limit=limit)
        except Exception:
            hits = []

        for hit in hits:
            object_id = str(hit.get("objectID", ""))
            if not object_id or object_id in seen:
                continue

            seen.add(object_id)
            also_bought.append(
                {
                    "objectID": object_id,
                    "name": hit.get("name"),
                    "brand": hit.get("brand"),
                    "category": hit.get("category"),
                    "price": hit.get("price"),
                    "picture_url": hit.get("picture_url"),
                }
            )

            if len(also_bought) >= limit:
                return also_bought

    return also_bought


def _merge_unique_recommendations(*recommendation_lists, limit=12):
    merged = []
    seen = set()

    for recommendation_list in recommendation_lists:
        for recommendation in recommendation_list:
            object_id = str(recommendation.get("objectID", ""))
            if not object_id or object_id in seen:
                continue
            seen.add(object_id)
            merged.append(recommendation)

            if len(merged) >= limit:
                return merged

    return merged


@recommendation_bp.post("/sync-products")
@admin_required
def sync_products():
    try:
        result = sync_products_to_algolia()
        return jsonify({"message": "Products synced to Algolia", **result}), 200
    except requests.HTTPError as exc:
        response = getattr(exc, "response", None)
        provider_status = getattr(response, "status_code", None)
        provider_body = None
        if response is not None:
            try:
                provider_body = response.text
            except Exception:  # noqa: BLE001
                provider_body = None

        return (
            jsonify(
                {
                    "message": "Algolia sync failed",
                    "provider_status": provider_status,
                    "provider_error": provider_body or str(exc),
                }
            ),
            502,
        )
    except Exception as exc:  # noqa: BLE001
        return jsonify({"message": "Algolia sync failed", "error": str(exc)}), 502


@recommendation_bp.get("/<int:user_id>")
@jwt_required()
def get_recommendations(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)

    if not current_user:
        return jsonify({"message": "Current user not found"}), 404

    # user can read own recommendations; admin can read any user
    if current_user_id != user_id and current_user.role != "admin":
        return jsonify({"message": "Forbidden"}), 403

    # 1) Get recent purchased product IDs from DB
    recent_invoices = (
        Invoice.query.filter_by(user_id=user_id, payment_status="paid")
        .order_by(Invoice.created_at.desc())
        .limit(10)
        .all()
    )

    purchased_product_ids = []
    for inv in recent_invoices:
        for item in inv.invoice_items:
            purchased_product_ids.append(item.product_id)

    purchased_product_ids = list(dict.fromkeys(purchased_product_ids))[:5]

    # 2) Build two recommendation categories:
    # checkout_based: from user's own paid checkout profile (category/brand similarity)
    # also_bought: Algolia bought-together model (community behavior)
    checkout_based = _recommend_checkout_based(purchased_product_ids, limit=8)
    also_bought = _recommend_also_bought(purchased_product_ids, limit=8)
    merged = _merge_unique_recommendations(also_bought, checkout_based, limit=12)

    # Safety fallback to keep API non-empty for frontend
    if not merged:
        fallback_products = Product.query.order_by(Product.created_at.desc()).limit(8).all()
        merged = [_product_to_json(product) for product in fallback_products]
        if not checkout_based:
            checkout_based = merged[:8]

    return jsonify(
        {
            "user_id": user_id,
            "purchased_product_ids": [int(pid) for pid in purchased_product_ids if pid is not None],
            "checkout_based_count": len(checkout_based),
            "also_bought_count": len(also_bought),
            "checkout_based": checkout_based[:12],
            "also_bought": also_bought[:12],
            "recommended_count": len(merged),
            "recommendations": merged[:12],
        }
    ), 200
