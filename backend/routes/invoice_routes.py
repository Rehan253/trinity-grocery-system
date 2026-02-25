from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models import Invoice, InvoiceItem, Product


invoice_bp = Blueprint("invoices", __name__, url_prefix="/invoices")


def parse_quantity(value):
    if value is None:
        return None, "quantity is required"
    try:
        quantity = int(value)
    except (TypeError, ValueError):
        return None, "quantity must be an integer"
    if quantity <= 0:
        return None, "quantity must be greater than 0"
    return quantity, None


def get_owned_invoice(invoice_id, user_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return None, (jsonify({"message": "Invoice not found"}), 404)
    if invoice.user_id != user_id:
        return None, (jsonify({"message": "You are not allowed to modify this invoice"}), 403)
    return invoice, None


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
    user_id = int(get_jwt_identity())

    data = request.get_json(silent=True) or {}
    delivery = data.get("deliveryAddress") or {}

    invoice = Invoice(
        user_id=user_id,
        total_amount=0,
        delivery_full_name=delivery.get("fullName"),
        delivery_email=delivery.get("email"),
        delivery_phone=delivery.get("phone"),
        delivery_address=delivery.get("address"),
        delivery_apartment=delivery.get("apartment"),
        delivery_city=delivery.get("city"),
        delivery_state=delivery.get("state"),
        delivery_zip_code=delivery.get("zipCode"),
        delivery_notes=delivery.get("deliveryNotes"),
        payment_method=data.get("paymentMethod"),
    )

    db.session.add(invoice)
    db.session.commit()

    return jsonify(
        {
            "message": "Invoice created successfully",
            "invoice_id": invoice.id,
            "created_at": invoice.created_at.isoformat(),
        }
    ), 201


@invoice_bp.post("/<int:invoice_id>/items")
@jwt_required()
def add_invoice_item(invoice_id):
    """
    Add an item to an invoice
    ---
    tags:
      - Invoices
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    product_id = data.get("product_id")
    quantity, quantity_error = parse_quantity(data.get("quantity"))

    errors = {}
    if product_id is None:
        errors["product_id"] = "product_id is required"
    if quantity_error:
        errors["quantity"] = quantity_error
    if errors:
        return jsonify({"errors": errors}), 400

    invoice, invoice_error = get_owned_invoice(invoice_id, user_id)
    if invoice_error:
        return invoice_error

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404

    if product.quantity_in_stock < quantity:
        return jsonify(
            {"message": "Not enough stock", "available_stock": product.quantity_in_stock}
        ), 400

    unit_price = product.price
    line_total = float(unit_price) * quantity

    item = InvoiceItem(
        invoice_id=invoice.id,
        product_id=product.id,
        quantity=quantity,
        unit_price=unit_price,
    )

    product.quantity_in_stock -= quantity
    invoice.total_amount = float(invoice.total_amount) + line_total

    db.session.add(item)
    db.session.commit()

    return jsonify(
        {
            "message": "Item added successfully",
            "invoice_id": invoice.id,
            "item": {
                "id": item.id,
                "product_id": product.id,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            },
            "new_total_amount": float(invoice.total_amount),
            "remaining_stock": product.quantity_in_stock,
        }
    ), 201


@invoice_bp.patch("/<int:invoice_id>/items/<int:item_id>")
@jwt_required()
def update_invoice_item(invoice_id, item_id):
    """
    Update an invoice item's quantity
    ---
    tags:
      - Invoices
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    new_quantity, quantity_error = parse_quantity(data.get("quantity"))
    if quantity_error:
        return jsonify({"errors": {"quantity": quantity_error}}), 400

    invoice, invoice_error = get_owned_invoice(invoice_id, user_id)
    if invoice_error:
        return invoice_error

    item = InvoiceItem.query.filter_by(id=item_id, invoice_id=invoice.id).first()
    if not item:
        return jsonify({"message": "Invoice item not found"}), 404

    product = Product.query.get(item.product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404

    old_quantity = item.quantity
    quantity_delta = new_quantity - old_quantity

    if quantity_delta > 0 and product.quantity_in_stock < quantity_delta:
        return jsonify(
            {"message": "Not enough stock", "available_stock": product.quantity_in_stock}
        ), 400

    if quantity_delta > 0:
        product.quantity_in_stock -= quantity_delta
    elif quantity_delta < 0:
        product.quantity_in_stock += abs(quantity_delta)

    invoice.total_amount = float(invoice.total_amount) + (
        float(item.unit_price) * quantity_delta
    )
    item.quantity = new_quantity

    db.session.commit()

    return jsonify(
        {
            "message": "Item updated successfully",
            "invoice_id": invoice.id,
            "item": {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            },
            "new_total_amount": float(invoice.total_amount),
            "remaining_stock": product.quantity_in_stock,
        }
    ), 200


@invoice_bp.delete("/<int:invoice_id>/items/<int:item_id>")
@jwt_required()
def delete_invoice_item(invoice_id, item_id):
    """
    Remove an item from an invoice
    ---
    tags:
      - Invoices
    """
    user_id = int(get_jwt_identity())
    invoice, invoice_error = get_owned_invoice(invoice_id, user_id)
    if invoice_error:
        return invoice_error

    item = InvoiceItem.query.filter_by(id=item_id, invoice_id=invoice.id).first()
    if not item:
        return jsonify({"message": "Invoice item not found"}), 404

    product = Product.query.get(item.product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404

    line_total = float(item.unit_price) * item.quantity
    product.quantity_in_stock += item.quantity
    invoice.total_amount = max(0.0, float(invoice.total_amount) - line_total)

    db.session.delete(item)
    db.session.commit()

    return jsonify(
        {
            "message": "Item removed successfully",
            "invoice_id": invoice.id,
            "item_id": item_id,
            "new_total_amount": float(invoice.total_amount),
            "remaining_stock": product.quantity_in_stock,
        }
    ), 200


@invoice_bp.get("/<int:invoice_id>")
@jwt_required()
def get_invoice_details(invoice_id):
    """
    Get invoice details
    ---
    tags:
      - Invoices
    """
    user_id = int(get_jwt_identity())
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return jsonify({"message": "Invoice not found"}), 404

    if invoice.user_id != user_id:
        return jsonify({"message": "You are not allowed to view this invoice"}), 403

    items = []
    for item in invoice.invoice_items:
        items.append(
            {
                "id": item.id,
                "product_id": item.product.id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "line_total": float(item.unit_price) * item.quantity,
            }
        )

    return jsonify(
        {
            "invoice_id": invoice.id,
            "user_id": invoice.user_id,
            "total_amount": float(invoice.total_amount),
            "created_at": invoice.created_at.isoformat(),
            "deliveryAddress": {
                "fullName": invoice.delivery_full_name,
                "email": invoice.delivery_email,
                "phone": invoice.delivery_phone,
                "address": invoice.delivery_address,
                "apartment": invoice.delivery_apartment,
                "city": invoice.delivery_city,
                "state": invoice.delivery_state,
                "zipCode": invoice.delivery_zip_code,
                "deliveryNotes": invoice.delivery_notes,
            },
            "paymentMethod": invoice.payment_method,
            "items": items,
        }
    ), 200


@invoice_bp.get("/me")
@jwt_required()
def get_my_invoices():
    """
    Get current user's invoices
    ---
    tags:
      - Invoices
    """
    user_id = int(get_jwt_identity())
    invoices = (
        Invoice.query.filter_by(user_id=user_id)
        .order_by(Invoice.created_at.desc())
        .all()
    )

    result = []
    for invoice in invoices:
        result.append(
            {
                "invoice_id": invoice.id,
                "total_amount": float(invoice.total_amount),
                "created_at": invoice.created_at.isoformat(),
                "item_count": len(invoice.invoice_items),
            }
        )

    return jsonify(result), 200
