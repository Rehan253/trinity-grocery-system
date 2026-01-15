from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from services.kpi_service import get_top_high_sugar_products
from services.kpi_service import get_average_calories_by_category
from services.kpi_service import get_best_selling_products
from services.kpi_service import get_low_stock_products

# Blueprint MUST be defined at top-level
kpi_bp = Blueprint("kpis", __name__, url_prefix="/kpis")


@kpi_bp.get("/average-calories-by-category")
@jwt_required()
def average_calories_by_category():
    """
    Average calories per product category
    ---
    tags:
      - KPIs
    security:
      - BearerAuth: []
    responses:
      200:
        description: Average calories grouped by category
      401:
        description: Unauthorized
    """
    data = get_average_calories_by_category()
    return jsonify(data), 200

@kpi_bp.get("/top-high-sugar-products")
@jwt_required()
def top_high_sugar_products():
    """
    Top high-sugar products
    ---
    tags:
      - KPIs
    security:
      - BearerAuth: []
    parameters:
      - name: limit
        in: query
        type: integer
        required: false
        description: Number of products to return (default 5)
    responses:
      200:
        description: List of products with highest sugar content
        content:
          application/json:
            example:
              - name: "Chocolate Bar"
                sugars_100g: 52.0
      401:
        description: Unauthorized
    """
    limit = 5
    try:
        limit = int(request.args.get("limit", 5))
    except ValueError:
        pass

    data = get_top_high_sugar_products(limit)
    return jsonify(data), 200

@kpi_bp.get("/best-selling-products")
@jwt_required()
def best_selling_products():
    """
    Best-selling products
    ---
    tags:
      - KPIs
    security:
      - BearerAuth: []
    parameters:
      - name: limit
        in: query
        type: integer
        required: false
        description: Number of products to return (default 5)
    responses:
      200:
        description: Best-selling products by quantity
        content:
          application/json:
            example:
              - name: "Ketchup"
                total_sold: 42
      401:
        description: Unauthorized
    """
    limit = 5
    try:
        limit = int(request.args.get("limit", 5))
    except ValueError:
        pass

    data = get_best_selling_products(limit)
    return jsonify(data), 200


@kpi_bp.get("/low-stock-products")
@jwt_required()
def low_stock_products():
    """
    Low stock products
    ---
    tags:
      - KPIs
    security:
      - BearerAuth: []
    parameters:
      - name: threshold
        in: query
        type: integer
        required: false
        description: Stock threshold (default 10)
    responses:
      200:
        description: Products with low stock
      401:
        description: Unauthorized
    """
    threshold = 10
    try:
        threshold = int(request.args.get("threshold", 10))
    except ValueError:
        pass

    data = get_low_stock_products(threshold)
    return jsonify(data), 200
