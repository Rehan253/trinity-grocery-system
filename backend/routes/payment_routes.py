from datetime import datetime
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from extensions import db
from models import Invoice
from services.paypal_service import (
    capture_paypal_order,
    create_paypal_order,
    parse_capture_result,
)


payment_bp = Blueprint("payments", __name__, url_prefix="/payments")


def _to_money(value):
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError, TypeError):
        return None


def _invoice_json(invoice):
    return {
        "invoice_id": invoice.id,
        "total_amount": float(invoice.total_amount),
        "payment_method": invoice.payment_method,
        "payment_status": invoice.payment_status,
        "paypal_order_id": invoice.paypal_order_id,
        "paypal_capture_id": invoice.paypal_capture_id,
        "paid_at": invoice.paid_at.isoformat() if invoice.paid_at else None,
    }


def _load_owned_invoice(invoice_id, user_id):
    invoice = Invoice.query.get(invoice_id)
    if not invoice:
        return None, (jsonify({"message": "Invoice not found"}), 404)
    if invoice.user_id != user_id:
        return None, (jsonify({"message": "You are not allowed to access this invoice"}), 403)
    return invoice, None


@payment_bp.post("/paypal/create-order")
@jwt_required()
def paypal_create_order():
    """
    Create a PayPal order for an invoice
    ---
    tags:
      - Payments
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    invoice_id = data.get("invoice_id")

    if invoice_id is None:
        return jsonify({"errors": {"invoice_id": "invoice_id is required"}}), 400

    invoice, invoice_error = _load_owned_invoice(invoice_id, user_id)
    if invoice_error:
        return invoice_error

    total_amount = _to_money(invoice.total_amount)
    if total_amount is None or total_amount <= 0:
        return jsonify({"message": "Invoice total must be greater than 0"}), 400

    if invoice.payment_status == "paid":
        return jsonify({"message": "Invoice is already paid", "invoice": _invoice_json(invoice)}), 400

    try:
        order = create_paypal_order(total_amount)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"message": f"PayPal create order failed: {exc}"}), 502

    invoice.payment_method = "paypal"
    invoice.payment_status = "pending"
    invoice.paypal_order_id = order["order_id"]
    db.session.commit()

    return (
        jsonify(
            {
                "message": "PayPal order created",
                "order_id": order["order_id"],
                "order_status": order.get("status"),
                "approve_url": order.get("approve_url"),
                "currency_code": order.get("currency_code"),
                "amount_value": order.get("amount_value"),
                "invoice": _invoice_json(invoice),
            }
        ),
        200,
    )


@payment_bp.post("/paypal/capture-order")
@jwt_required()
def paypal_capture_order():
    """
    Capture a PayPal order and mark invoice as paid
    ---
    tags:
      - Payments
    """
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    invoice_id = data.get("invoice_id")
    request_order_id = data.get("order_id")

    if invoice_id is None:
        return jsonify({"errors": {"invoice_id": "invoice_id is required"}}), 400

    invoice, invoice_error = _load_owned_invoice(invoice_id, user_id)
    if invoice_error:
        return invoice_error

    if invoice.payment_status == "paid":
        return jsonify({"message": "Invoice is already paid", "invoice": _invoice_json(invoice)}), 200

    order_id = request_order_id or invoice.paypal_order_id
    if not order_id:
        return jsonify({"message": "order_id is required"}), 400

    try:
        capture_payload = capture_paypal_order(order_id)
    except Exception as exc:  # noqa: BLE001
        invoice.payment_status = "failed"
        db.session.commit()
        return jsonify({"message": f"PayPal capture failed: {exc}"}), 502

    capture = parse_capture_result(capture_payload)
    capture_status = capture["status"]
    captured_amount = _to_money(capture["amount_value"])
    expected_amount = _to_money(invoice.total_amount)

    if capture_status != "COMPLETED":
        invoice.payment_status = "failed"
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Payment capture is not completed",
                    "capture_status": capture_status,
                }
            ),
            400,
        )

    if captured_amount is None or expected_amount is None:
        invoice.payment_status = "failed"
        db.session.commit()
        return jsonify({"message": "Invalid captured amount from PayPal"}), 502

    if captured_amount != expected_amount:
        invoice.payment_status = "failed"
        db.session.commit()
        return (
            jsonify(
                {
                    "message": "Captured amount does not match invoice total",
                    "captured_amount": format(captured_amount, ".2f"),
                    "invoice_total": format(expected_amount, ".2f"),
                }
            ),
            400,
        )

    invoice.payment_method = "paypal"
    invoice.payment_status = "paid"
    invoice.paypal_order_id = order_id
    invoice.paypal_capture_id = capture.get("capture_id")
    invoice.paid_at = datetime.utcnow()
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Payment captured successfully",
                "capture_status": capture_status,
                "capture_id": invoice.paypal_capture_id,
                "captured_amount": format(captured_amount, ".2f"),
                "currency_code": capture.get("currency_code"),
                "invoice": _invoice_json(invoice),
            }
        ),
        200,
    )
