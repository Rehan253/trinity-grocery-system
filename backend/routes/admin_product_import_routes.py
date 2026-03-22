import hashlib
import json

import requests
from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Product
from scripts.barcodes import BARCODES
from security.authorization import admin_required
from services.openfoodfacts_service import (
    fetch_product_by_barcode,
    fetch_products_page,
)


admin_import_bp = Blueprint(
    "admin_product_import",
    __name__,
    url_prefix="/admin/products",
)


CATEGORY_RULES = [
    (("fruit", "fruits"), "Fruits"),
    (("vegetable", "vegetables"), "Vegetables"),
    (("dairy", "milk", "cheese", "yogurt"), "Dairy"),
    (("bakery", "bread", "pastry", "cake", "biscuit"), "Bakery"),
    (("meat", "beef", "pork", "chicken", "turkey", "lamb"), "Meat"),
    (("seafood", "fish", "salmon", "tuna", "shrimp"), "Seafood"),
    (("beverage", "drink", "juice", "soda", "water"), "Beverages"),
    (("snack", "chips", "crisps", "chocolate", "candy"), "Snacks"),
    (("sauce", "condiment", "ketchup", "mustard"), "Condiments"),
]


def _clean_text(value):
    return str(value or "").strip()


def _first_non_empty(values):
    for value in values:
        text = _clean_text(value)
        if text:
            return text
    return ""


def _stable_seed(value: str) -> int:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def _extract_barcode(data, fallback=None):
    code = _clean_text(data.get("code") or fallback)
    if code and code.isdigit():
        return code
    return None


def _extract_brand(data):
    brands = _clean_text(data.get("brands"))
    if brands:
        return brands.split(",")[0].strip()[:100]

    brands_tags = data.get("brands_tags") or []
    if isinstance(brands_tags, list) and brands_tags:
        return brands_tags[0].split(":")[-1].replace("-", " ").strip().title()[:100]

    return ""


def _normalize_category(data):
    categories = _clean_text(data.get("categories"))
    tags = data.get("categories_tags") or []

    source_parts = [categories]
    if isinstance(tags, list):
        source_parts.extend([str(tag).split(":")[-1].replace("-", " ") for tag in tags])
    combined = " ".join([part for part in source_parts if part]).lower()

    for keywords, normalized in CATEGORY_RULES:
        if any(keyword in combined for keyword in keywords):
            return normalized

    if categories:
        return categories.split(",")[0].strip()[:100]
    if isinstance(tags, list) and tags:
        return str(tags[0]).split(":")[-1].replace("-", " ").strip().title()[:100]
    return "Other"


def extract_ingredients(data):
    ingredients_text = _clean_text(data.get("ingredients_text"))
    if ingredients_text:
        parts = [part.strip() for part in ingredients_text.replace(";", ",").split(",")]
        return [part for part in parts if part]

    ingredients_tags = data.get("ingredients_tags") or []
    if isinstance(ingredients_tags, list):
        return [tag.split(":")[-1].replace("-", " ").strip() for tag in ingredients_tags if tag]
    return []


def extract_dietary_tags(data):
    tag_sources = []
    for source in (data.get("labels_tags"), data.get("ingredients_analysis_tags")):
        if isinstance(source, list):
            tag_sources.extend(source)

    labels = data.get("labels")
    if isinstance(labels, str):
        tag_sources.extend([tag.strip() for tag in labels.split(",") if tag.strip()])

    tags = []
    for tag in tag_sources:
        tag_lower = str(tag).lower()
        if "non" in tag_lower or "unknown" in tag_lower or "maybe" in tag_lower:
            continue
        if "halal" in tag_lower and "halal" not in tags:
            tags.append("halal")
        if "kosher" in tag_lower and "kosher" not in tags:
            tags.append("kosher")
        if "vegan" in tag_lower and "vegan" not in tags:
            tags.append("vegan")
        if "vegetarian" in tag_lower and "vegetarian" not in tags:
            tags.append("vegetarian")

    return tags


def infer_dietary_tags_from_ingredients(ingredients):
    if not ingredients:
        return []

    text = " ".join(ingredients).lower()

    def contains_any(needles):
        return any(needle in text for needle in needles)

    meat_terms = [
        "beef",
        "pork",
        "ham",
        "bacon",
        "lard",
        "chicken",
        "turkey",
        "duck",
        "lamb",
        "mutton",
        "veal",
        "meat",
        "gelatin",
        "rennet",
    ]
    fish_terms = ["fish", "tuna", "salmon", "cod", "anchovy", "sardine"]
    shellfish_terms = ["shrimp", "prawn", "crab", "lobster", "scallop", "mussel", "oyster"]
    dairy_egg_terms = [
        "milk",
        "cheese",
        "butter",
        "cream",
        "yogurt",
        "whey",
        "casein",
        "egg",
        "lactose",
    ]
    honey_terms = ["honey", "beeswax"]
    alcohol_terms = ["alcohol", "ethanol", "wine", "beer", "rum", "vodka", "whisky", "whiskey", "brandy"]
    pork_terms = ["pork", "ham", "bacon", "lard", "gelatin"]

    tags = []

    if not contains_any(pork_terms + alcohol_terms):
        tags.append("halal")

    if not contains_any(meat_terms + fish_terms):
        tags.append("vegetarian")

    if not contains_any(meat_terms + fish_terms + dairy_egg_terms + honey_terms):
        tags.append("vegan")

    has_meat = contains_any(meat_terms)
    has_dairy = contains_any(dairy_egg_terms)
    has_shellfish = contains_any(shellfish_terms)
    has_pork = contains_any(pork_terms)
    if not has_pork and not has_shellfish and not (has_meat and has_dairy):
        tags.append("kosher")

    return tags


def _infer_price(data, barcode, existing_price=None):
    def _try_float(value):
        try:
            val = float(value)
            return val if val > 0 else None
        except (TypeError, ValueError):
            return None

    for key in ("price", "price_usd", "price_value"):
        parsed = _try_float(data.get(key))
        if parsed is not None:
            return round(parsed, 2)

    if existing_price is not None:
        try:
            existing = float(existing_price)
            if existing > 0:
                return round(existing, 2)
        except (TypeError, ValueError):
            pass

    category_text = (_clean_text(data.get("categories"))).lower()
    low, high = 1.49, 12.99
    if any(token in category_text for token in ("meat", "seafood", "fish")):
        low, high = 4.99, 18.99
    elif any(token in category_text for token in ("dairy", "milk", "cheese")):
        low, high = 2.49, 9.99
    elif any(token in category_text for token in ("snack", "chocolate", "chips")):
        low, high = 1.99, 7.49
    elif any(token in category_text for token in ("beverage", "drink", "juice", "water")):
        low, high = 0.99, 5.99

    seed = _stable_seed(barcode or _first_non_empty([data.get("product_name"), data.get("generic_name"), "product"]))
    cents_span = int(round((high - low) * 100))
    return round(low + ((seed % (cents_span + 1)) / 100.0), 2)


def _infer_stock(barcode):
    seed = _stable_seed(barcode or "stock")
    return 25 + (seed % 176)


def _build_product_payload(data, fallback_barcode=None):
    barcode = _extract_barcode(data, fallback_barcode)
    name = _first_non_empty(
        [
            data.get("product_name"),
            data.get("product_name_en"),
            data.get("generic_name"),
            data.get("generic_name_en"),
        ]
    )[:200]
    brand = _extract_brand(data)
    if not name or not brand:
        return None

    category = _normalize_category(data)[:100]
    image_url = _first_non_empty([data.get("image_front_url"), data.get("image_url")])
    nutriments = data.get("nutriments")
    ingredients = extract_ingredients(data)
    dietary_tags = extract_dietary_tags(data)
    inferred_tags = infer_dietary_tags_from_ingredients(ingredients)
    for tag in inferred_tags:
        if tag not in dietary_tags:
            dietary_tags.append(tag)

    quantity = _clean_text(data.get("quantity"))[:50] or "1 item"
    description = _first_non_empty(
        [
            data.get("generic_name_en"),
            data.get("generic_name"),
            data.get("product_name_en"),
            data.get("product_name"),
        ]
    )
    if not description:
        description = f"{name} by {brand}"

    return {
        "name": name,
        "brand": brand,
        "barcode": barcode,
        "category": category or "Other",
        "unit": quantity,
        "description": description[:2000],
        "picture_url": image_url or None,
        "nutritional_info": json.dumps(nutriments) if nutriments else None,
        "ingredients": json.dumps(ingredients) if ingredients else None,
        "dietary_tags": json.dumps(dietary_tags) if dietary_tags else None,
    }


def _upsert_product(payload):
    barcode = payload.get("barcode")
    existing = None
    if barcode:
        existing = Product.query.filter_by(barcode=barcode).first()
    if not existing:
        existing = Product.query.filter_by(name=payload["name"], brand=payload["brand"]).first()

    if existing:
        existing.category = payload["category"] or existing.category
        existing.unit = payload["unit"] or existing.unit
        existing.description = payload["description"] or existing.description
        existing.picture_url = payload["picture_url"] or existing.picture_url
        existing.nutritional_info = payload["nutritional_info"] or existing.nutritional_info
        existing.ingredients = payload["ingredients"] or existing.ingredients
        existing.dietary_tags = payload["dietary_tags"] or existing.dietary_tags
        if barcode and not existing.barcode:
            existing.barcode = barcode

        if not existing.price or existing.price <= 0:
            existing.price = _infer_price(payload, barcode or str(existing.id), existing_price=existing.price)
        if not existing.original_price or existing.original_price < existing.price:
            existing.original_price = round(float(existing.price) * 1.12, 2)
        if not existing.quantity_in_stock or existing.quantity_in_stock <= 0:
            existing.quantity_in_stock = _infer_stock(barcode or str(existing.id))

        db.session.commit()
        return "updated"

    price = _infer_price(payload, barcode or payload["name"])
    product = Product(
        name=payload["name"],
        brand=payload["brand"],
        barcode=barcode,
        category=payload["category"],
        description=payload["description"],
        unit=payload["unit"],
        price=price,
        original_price=round(price * 1.12, 2),
        quantity_in_stock=_infer_stock(barcode or payload["name"]),
        picture_url=payload["picture_url"],
        nutritional_info=payload["nutritional_info"],
        ingredients=payload["ingredients"],
        dietary_tags=payload["dietary_tags"],
    )

    db.session.add(product)
    db.session.commit()
    return "created"


def _parse_positive_int(value, field_name, default=None, max_allowed=None):
    if value is None:
        return default

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a positive integer")

    if parsed <= 0:
        raise ValueError(f"{field_name} must be a positive integer")

    if max_allowed is not None and parsed > max_allowed:
        raise ValueError(f"{field_name} must be <= {max_allowed}")

    return parsed


@admin_import_bp.post("/import")
@admin_required
def import_products():
    """
    Import products from OpenFoodFacts.
    Query params:
    - source=search|barcodes (default: search)
    - pages (search mode only, default: 12)
    - page_size (search mode only, default: 100, max: 100)
    - limit (optional max products to process)
    """
    source = (_clean_text(request.args.get("source")) or "search").lower()
    if source not in {"search", "barcodes"}:
        return jsonify({"message": "source must be 'search' or 'barcodes'"}), 400

    try:
        limit = _parse_positive_int(request.args.get("limit"), "limit", default=None)
        pages = _parse_positive_int(request.args.get("pages"), "pages", default=12)
        page_size = _parse_positive_int(request.args.get("page_size"), "page_size", default=100, max_allowed=100)
    except ValueError as exc:
        return jsonify({"message": str(exc)}), 400

    imported = 0
    updated = 0
    skipped = 0
    errors = 0
    attempted = 0
    last_network_error = None

    def process_payload(raw_product, fallback_barcode=None):
        nonlocal imported, updated, skipped, errors, attempted
        attempted += 1

        payload = _build_product_payload(raw_product, fallback_barcode=fallback_barcode)
        if not payload:
            skipped += 1
            return

        try:
            status = _upsert_product(payload)
            if status == "created":
                imported += 1
            else:
                updated += 1
        except IntegrityError:
            db.session.rollback()
            skipped += 1
        except Exception:  # noqa: BLE001
            db.session.rollback()
            errors += 1

    if source == "barcodes":
        selected_barcodes = BARCODES[:limit] if limit else BARCODES
        consecutive_network_errors = 0

        for barcode in selected_barcodes:
            try:
                data = fetch_product_by_barcode(barcode)
                consecutive_network_errors = 0
                if not data:
                    skipped += 1
                    attempted += 1
                    continue
                process_payload(data, fallback_barcode=barcode)
            except requests.RequestException as exc:
                db.session.rollback()
                errors += 1
                attempted += 1
                consecutive_network_errors += 1
                last_network_error = str(exc)

                if imported == 0 and updated == 0 and consecutive_network_errors >= 3:
                    return jsonify(
                        {
                            "message": "Import stopped: cannot reach OpenFoodFacts",
                            "source": source,
                            "attempted": len(selected_barcodes),
                            "processed": imported + updated + skipped + errors,
                            "imported": imported,
                            "updated": updated,
                            "skipped": skipped,
                            "errors": errors,
                            "last_network_error": last_network_error,
                        }
                    ), 502
    else:
        processed_limit_reached = False
        consecutive_network_errors = 0
        off_total_count = None

        for page in range(1, pages + 1):
            if limit and attempted >= limit:
                processed_limit_reached = True
                break

            try:
                page_result = fetch_products_page(page=page, page_size=page_size)
                consecutive_network_errors = 0
            except requests.RequestException as exc:
                errors += 1
                consecutive_network_errors += 1
                last_network_error = str(exc)
                if imported == 0 and updated == 0 and consecutive_network_errors >= 3:
                    return jsonify(
                        {
                            "message": "Import stopped: cannot reach OpenFoodFacts",
                            "source": source,
                            "attempted_pages": pages,
                            "processed": imported + updated + skipped + errors,
                            "imported": imported,
                            "updated": updated,
                            "skipped": skipped,
                            "errors": errors,
                            "last_network_error": last_network_error,
                        }
                    ), 502
                continue

            if off_total_count is None:
                off_total_count = page_result.get("count")

            products = page_result.get("products") or []
            if not products:
                break

            for row in products:
                if limit and attempted >= limit:
                    processed_limit_reached = True
                    break
                process_payload(row, fallback_barcode=_extract_barcode(row))

            if processed_limit_reached:
                break

    result = {
        "message": "Import completed",
        "source": source,
        "attempted": attempted,
        "processed": imported + updated + skipped + errors,
        "imported": imported,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
    }
    if source == "barcodes":
        result["total_available"] = len(BARCODES)
    if source == "search":
        result["pages_requested"] = pages
        result["page_size"] = page_size
    if last_network_error:
        result["last_network_error"] = last_network_error

    return jsonify(result), 200
