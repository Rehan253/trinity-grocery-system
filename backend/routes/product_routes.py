from flask import Blueprint, jsonify
from models import Product
from flask import request
from flask_jwt_extended import jwt_required
from extensions import db
product_bp = Blueprint("products", __name__, url_prefix="/products")


@product_bp.get("/")
def get_products():
    """
    Get all products
    ---
    tags:
      - Products
    responses:
      200:
        description: List of products
    """

    products = Product.query.all()

    result = []
    for product in products:
        result.append({
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "category": product.category,
            "price": float(product.price),
            "quantity_in_stock": product.quantity_in_stock,
            "picture_url": product.picture_url,
            "nutritional_info": product.nutritional_info,
            "created_at": product.created_at.isoformat()
        })

    return jsonify(result), 200


@product_bp.get("/<int:product_id>")
def get_product_by_id(product_id):
    """
    Get product by ID
    ---
    tags:
      - Products
    parameters:
      - name: product_id
        in: path
        type: integer
        required: true
        description: ID of the product
    responses:
      200:
        description: Product found
      404:
        description: Product not found
    """

    # Fetch product by ID
    product = Product.query.get(product_id)

    # If product does not exist
    if not product:
        return jsonify({"message": "Product not found"}), 404

    # Return product data
    return jsonify({
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "price": float(product.price),
        "quantity_in_stock": product.quantity_in_stock,
        "picture_url": product.picture_url,
        "nutritional_info": product.nutritional_info,
        "created_at": product.created_at.isoformat()
    }), 200


@product_bp.post("/")
@jwt_required()
def create_product():
    """
    Create a new product
    ---
    tags:
      - Products
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - name
              - brand
              - category
              - price
              - quantity_in_stock
          properties:
            name:
              type: string
            brand:
              type: string
            category:
              type: string
            price:
              type: number
            quantity_in_stock:
              type: integer
            picture_url:
              type: string
            nutritional_info:
              type: string
    responses:
      201:
        description: Product created successfully
      400:
        description: Validation error
      401:
        description: Unauthorized
    """

    data = request.get_json(silent=True) or {}

    # Validation
    required_fields = ["name", "brand", "category", "price", "quantity_in_stock"]
    errors = {}

    for field in required_fields:
        if field not in data or data[field] in ("", None):
            errors[field] = f"{field} is required"

    if errors:
        return jsonify({"errors": errors}), 400

    # Create product
    product = Product(
        name=data["name"],
        brand=data["brand"],
        category=data["category"],
        price=data["price"],
        quantity_in_stock=data["quantity_in_stock"],
        picture_url=data.get("picture_url"),
        nutritional_info=data.get("nutritional_info"),
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({
        "message": "Product created successfully",
        "product_id": product.id
    }), 201

@product_bp.put("/<int:product_id>")
@jwt_required()
def update_product(product_id):
    """
    Update a product
    ---
    tags:
      - Products
    parameters:
      - name: product_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Product updated successfully
      404:
        description: Product not found
      401:
        description: Unauthorized
    """

    product = Product.query.get(product_id)

    if not product:
        return jsonify({"message": "Product not found"}), 404

    data = request.get_json(silent=True) or {}

    # Update fields only if provided
    if "name" in data:
        product.name = data["name"]
    if "brand" in data:
        product.brand = data["brand"]
    if "category" in data:
        product.category = data["category"]
    if "price" in data:
        product.price = data["price"]
    if "quantity_in_stock" in data:
        product.quantity_in_stock = data["quantity_in_stock"]
    if "picture_url" in data:
        product.picture_url = data["picture_url"]
    if "nutritional_info" in data:
        product.nutritional_info = data["nutritional_info"]

    db.session.commit()

    return jsonify({"message": "Product updated successfully"}), 200


@product_bp.delete("/<int:product_id>")
@jwt_required()
def delete_product(product_id):
    """
    Delete a product
    ---
    tags:
      - Products
    parameters:
      - name: product_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Product deleted successfully
      404:
        description: Product not found
      401:
        description: Unauthorized
    """

    product = Product.query.get(product_id)

    if not product:
        return jsonify({"message": "Product not found"}), 404

    db.session.delete(product)
    db.session.commit()

    return jsonify({"message": "Product deleted successfully"}), 200
