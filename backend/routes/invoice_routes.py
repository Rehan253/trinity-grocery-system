from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Invoice


invoice_bp = Blueprint("invoices", __name__, url_prefix="/invoices")


@invoice_bp.post("/")
@jwt_required()
def create_invoice():
    """
    Create a new invoice (order)
    ---
    tags:
      - Invoices
    responses:
      201:
        description: Invoice created successfully
      401:
        description: Unauthorized
    """

    # Get logged-in user ID from JWT
    user_id = int(get_jwt_identity())

    # Create invoice with total = 0
    invoice = Invoice(
        user_id=user_id,
        total_amount=0
    )

    db.session.add(invoice)
    db.session.commit()

    return jsonify({
        "message": "Invoice created successfully",
        "invoice_id": invoice.id
    }), 201
