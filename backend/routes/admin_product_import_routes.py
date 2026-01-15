from flask import Blueprint, jsonify
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Product
from security.authorization import admin_required
from services.openfoodfacts_service import fetch_product_by_barcode
from scripts.barcodes import BARCODES


admin_import_bp = Blueprint(
    "admin_product_import",
    __name__,
    url_prefix="/admin/products"
)


@admin_import_bp.post("/import")
@admin_required
def import_products():
    """
    Import products from OpenFoodFacts (one-time admin operation)
    ---
    tags:
      - Admin
    responses:
      200:
        description: Import completed
      403:
        description: Admin access required
    """

    imported = 0
    skipped = 0
    errors = 0

    for barcode in BARCODES:
        try:
            data = fetch_product_by_barcode(barcode)
            if not data:
                skipped += 1
                continue

            name = data.get("product_name")
            brand = data.get("brands")
            categories = data.get("categories")
            image_url = data.get("image_front_url")
            nutriments = data.get("nutriments")

            if not name or not brand:
                skipped += 1
                continue

            # Prevent duplicates (by name + brand)
            existing = Product.query.filter_by(name=name, brand=brand).first()
            if existing:
                skipped += 1
                continue

            product = Product(
                name=name[:200],
                brand=brand[:100],
                category=(categories or "Unknown")[:100],
                price=0.0,  # Admin can update later
                quantity_in_stock=100,
                picture_url=image_url,
                nutritional_info=str(nutriments) if nutriments else None,
            )

            db.session.add(product)
            db.session.commit()
            imported += 1

        except IntegrityError:
            db.session.rollback()
            skipped += 1
        except Exception:
            db.session.rollback()
            errors += 1

    return jsonify({
        "message": "Import completed",
        "imported": imported,
        "skipped": skipped,
        "errors": errors
    }), 200
