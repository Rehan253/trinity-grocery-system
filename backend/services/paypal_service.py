from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from uuid import uuid4

import requests
from flask import current_app


MOCK_ORDERS = {}


def _is_mock_mode():
    return bool(current_app.config.get("PAYPAL_MOCK_MODE"))


def _paypal_base_url():
    mode = str(current_app.config.get("PAYPAL_MODE", "sandbox")).lower()
    if mode == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


def _amount_to_string(amount):
    value = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return format(value, ".2f")


def _parse_error_message(response):
    try:
        payload = response.json()
    except ValueError:
        return response.text or "Unknown PayPal error"

    if isinstance(payload, dict):
        message = payload.get("message")
        if message:
            return str(message)
        details = payload.get("details")
        if isinstance(details, list) and details:
            first = details[0] or {}
            description = first.get("description")
            if description:
                return str(description)
    return "PayPal request failed"


def get_paypal_access_token():
    if _is_mock_mode():
        return "mock-access-token"

    client_id = current_app.config.get("PAYPAL_CLIENT_ID") or ""
    client_secret = current_app.config.get("PAYPAL_CLIENT_SECRET") or ""
    if not client_id or not client_secret:
        raise RuntimeError("PayPal credentials are not configured")

    response = requests.post(
        f"{_paypal_base_url()}/v1/oauth2/token",
        auth=(client_id, client_secret),
        data={"grant_type": "client_credentials"},
        headers={
            "Accept": "application/json",
            "Accept-Language": "en_US",
        },
        timeout=20,
    )
    if response.status_code >= 400:
        raise RuntimeError(_parse_error_message(response))

    token = (response.json() or {}).get("access_token")
    if not token:
        raise RuntimeError("PayPal token was not returned")
    return token


def create_paypal_order(amount):
    amount_value = _amount_to_string(amount)
    currency = current_app.config.get("PAYPAL_CURRENCY", "USD")

    if _is_mock_mode():
        order_id = f"MOCK-ORDER-{uuid4().hex[:12].upper()}"
        MOCK_ORDERS[order_id] = amount_value
        return {
            "order_id": order_id,
            "status": "CREATED",
            "approve_url": f"https://mock-paypal.local/checkoutnow?token={order_id}",
            "currency_code": currency,
            "amount_value": amount_value,
        }

    access_token = get_paypal_access_token()
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "amount": {
                    "currency_code": currency,
                    "value": amount_value,
                }
            }
        ],
    }
    response = requests.post(
        f"{_paypal_base_url()}/v2/checkout/orders",
        json=payload,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        timeout=20,
    )
    if response.status_code >= 400:
        raise RuntimeError(_parse_error_message(response))

    data = response.json() or {}
    order_id = data.get("id")
    if not order_id:
        raise RuntimeError("PayPal order ID was not returned")

    approve_url = None
    for link in data.get("links", []):
        if link.get("rel") == "approve":
            approve_url = link.get("href")
            break

    return {
        "order_id": order_id,
        "status": data.get("status", "CREATED"),
        "approve_url": approve_url,
        "currency_code": currency,
        "amount_value": amount_value,
    }


def capture_paypal_order(order_id):
    currency = current_app.config.get("PAYPAL_CURRENCY", "USD")

    if _is_mock_mode():
        amount_value = MOCK_ORDERS.get(order_id)
        if not amount_value:
            raise RuntimeError("Unknown PayPal mock order ID")
        capture_id = f"MOCK-CAPTURE-{uuid4().hex[:12].upper()}"
        return {
            "id": order_id,
            "status": "COMPLETED",
            "purchase_units": [
                {
                    "payments": {
                        "captures": [
                            {
                                "id": capture_id,
                                "status": "COMPLETED",
                                "amount": {
                                    "currency_code": currency,
                                    "value": amount_value,
                                },
                            }
                        ]
                    }
                }
            ],
        }

    access_token = get_paypal_access_token()
    response = requests.post(
        f"{_paypal_base_url()}/v2/checkout/orders/{order_id}/capture",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        timeout=20,
    )
    if response.status_code >= 400:
        raise RuntimeError(_parse_error_message(response))
    return response.json() or {}


def parse_capture_result(capture_payload):
    purchase_units = capture_payload.get("purchase_units") or []
    first_unit = purchase_units[0] if purchase_units else {}

    payments = first_unit.get("payments") or {}
    captures = payments.get("captures") or []
    first_capture = captures[0] if captures else {}

    amount = first_capture.get("amount") or first_unit.get("amount") or {}
    amount_value = amount.get("value")
    if amount_value is not None:
        try:
            amount_value = format(
                Decimal(str(amount_value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                ".2f",
            )
        except (InvalidOperation, ValueError):
            amount_value = None

    status = (first_capture.get("status") or capture_payload.get("status") or "").upper()
    return {
        "status": status,
        "capture_id": first_capture.get("id"),
        "amount_value": amount_value,
        "currency_code": amount.get("currency_code"),
    }
