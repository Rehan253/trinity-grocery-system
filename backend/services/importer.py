from extensions import db
from models import Product
from services.openfoodfacts_service import fetch_product_by_barcode
from scripts.barcodes import BARCODES
from sqlalchemy.exc import IntegrityError

def import_products_logic():
    """
    Core logic to import products from OpenFoodFacts using the barcode list.
    Returns a dict with stats: {'imported': int, 'skipped': int, 'errors': int}
    """
    imported = 0
    skipped = 0
    errors = 0

    print(f"Starting import for {len(BARCODES)} barcodes...")

    for barcode in BARCODES:
        try:
            # Check if product already exists to avoid unnecessary API calls
            # (Optimization: though the original code checked DB *after* fetch for name/brand match, 
            # we can't check by barcode easily as Product model doesn't store barcode! 
            # Wait, checking models.py... Product has name, brand, etc. No barcode.
            # So we must fetch first to get the name/brand to check existence.
            
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
                print(f"Skipping existing: {name}")
                skipped += 1
                continue

            product = Product(
                name=name[:200],
                brand=brand[:100],
                category=(categories or "Unknown")[:100],
                price=0.0,  # Default price
                quantity_in_stock=100,
                picture_url=image_url,
                nutritional_info=str(nutriments) if nutriments else None,
            )

            db.session.add(product)
            db.session.commit()
            imported += 1
            print(f"Imported: {name}")

        except IntegrityError:
            db.session.rollback()
            skipped += 1
        except Exception as e:
            print(f"Error importing {barcode}: {e}")
            db.session.rollback()
            errors += 1

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors
    }
