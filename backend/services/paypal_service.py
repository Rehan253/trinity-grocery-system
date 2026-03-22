from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from uuid import uuid4

import requests
from flask import current_app, has_request_context, request


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
        details = payload.get("details")
        if isinstance(details, list) and details:
            first = details[0] or {}
            issue = first.get("issue")
            description = first.get("description")
            if issue and description:
                return f"{issue}: {description}"
            if issue:
                return str(issue)
            if description:
                return str(description)
        message = payload.get("message")
        if message:
            return str(message)
        debug_id = payload.get("debug_id")
        if debug_id:
            return f"PayPal request failed (debug_id: {debug_id})"
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


def _default_redirect_urls():
    """Build default PayPal return/cancel URLs from the current request."""
    if has_request_context():
        base = request.host_url.rstrip("/")
    else:
        base = "http://localhost:5000"
    return f"{base}/payments/paypal/return", f"{base}/payments/paypal/cancel"


def create_paypal_order(amount, return_url=None, cancel_url=None):
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

    if not return_url or not cancel_url:
        default_return, default_cancel = _default_redirect_urls()
        return_url = return_url or default_return
        cancel_url = cancel_url or default_cancel

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
        "payment_source": {
            "paypal": {
                "experience_context": {
                    "landing_page": "LOGIN",
                    "user_action": "PAY_NOW",
                    "shipping_preference": "NO_SHIPPING",
                    "return_url": return_url,
                    "cancel_url": cancel_url,
                }
            }
        },
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
        if link.get("rel") in {"approve", "payer-action"}:
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


def _header_value(headers, key):
    if hasattr(headers, "get"):
        value = headers.get(key)
        if value:
            return value

    lowered_key = key.lower()
    for header_key, value in dict(headers or {}).items():
        if str(header_key).lower() == lowered_key:
            return value
    return None


def verify_paypal_webhook_signature(headers, webhook_event):
    if _is_mock_mode():
        return True

    webhook_id = current_app.config.get("PAYPAL_WEBHOOK_ID") or ""
    if not webhook_id:
        raise RuntimeError("PayPal webhook id is not configured")

    transmission_id = _header_value(headers, "PayPal-Transmission-Id")
    transmission_time = _header_value(headers, "PayPal-Transmission-Time")
    cert_url = _header_value(headers, "PayPal-Cert-Url")
    auth_algo = _header_value(headers, "PayPal-Auth-Algo")
    transmission_sig = _header_value(headers, "PayPal-Transmission-Sig")

    required_values = [
        transmission_id,
        transmission_time,
        cert_url,
        auth_algo,
        transmission_sig,
    ]
    if any(not value for value in required_values):
        raise RuntimeError("Missing PayPal webhook headers")

    access_token = get_paypal_access_token()
    payload = {
        "auth_algo": auth_algo,
        "cert_url": cert_url,
        "transmission_id": transmission_id,
        "transmission_sig": transmission_sig,
        "transmission_time": transmission_time,
        "webhook_id": webhook_id,
        "webhook_event": webhook_event or {},
    }
    response = requests.post(
        f"{_paypal_base_url()}/v1/notifications/verify-webhook-signature",
        json=payload,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        timeout=20,
    )
    if response.status_code >= 400:
        raise RuntimeError(_parse_error_message(response))

    verification_status = (response.json() or {}).get("verification_status")
    return verification_status == "SUCCESS"


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
