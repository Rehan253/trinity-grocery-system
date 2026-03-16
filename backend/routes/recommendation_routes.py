import os
import requests
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

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

    # 2) Ask Algolia for bought-together recommendations
    merged = []
    seen = set(str(pid) for pid in purchased_product_ids)

    for pid in purchased_product_ids:
        try:
            hits = _recommend_for_product(pid, limit=8)
        except Exception:
            hits = []

        for h in hits:
            oid = str(h.get("objectID", ""))
            if not oid or oid in seen:
                continue
            seen.add(oid)
            merged.append(
                {
                    "objectID": oid,
                    "name": h.get("name"),
                    "brand": h.get("brand"),
                    "category": h.get("category"),
                    "price": h.get("price"),
                    "picture_url": h.get("picture_url"),
                }
            )

    # 3) Fallback if user has no history yet
    if not merged:
        fallback_products = Product.query.order_by(Product.created_at.desc()).limit(8).all()
        merged = [
            {
                "objectID": str(p.id),
                "name": p.name,
                "brand": p.brand,
                "category": p.category,
                "price": float(p.price),
                "picture_url": p.picture_url,
            }
            for p in fallback_products
        ]

    return jsonify(
        {
            "user_id": user_id,
            "recommended_count": len(merged),
            "recommendations": merged[:12],
        }
    ), 200
