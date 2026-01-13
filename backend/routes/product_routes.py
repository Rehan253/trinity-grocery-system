from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from models import Product


# Create blueprint
product_bp = Blueprint("products", __name__, url_prefix="/products")


@product_bp.get("/")
@jwt_required()
def get_products():
    """
    Get all products
    ---
    tags:
      - Products
    responses:
      200:
        description: List of products
      401:
        description: Unauthorized
    """

    # Fetch all products from database
    products = Product.query.all()

    # Convert products to JSON-safe format
    result = []
    for product in products:
        result.append({
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "category": product.category,
            "price": product.price,
            "quantity_in_stock": product.quantity_in_stock
        })

    return jsonify(result), 200
