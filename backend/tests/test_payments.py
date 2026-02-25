from uuid import uuid4

from extensions import db
from models import Invoice, Product


BASE_PASSWORD = "Password123"


def register_user(client, email):
    return client.post(
        "/auth/register",
        json={
            "first_name": "Payment",
            "last_name": "Tester",
            "email": email,
            "password": BASE_PASSWORD,
            "phone_number": "+15551112222",
            "address": "10 Payment Street",
            "zip_code": "10001",
            "city": "New York",
            "country": "USA",
        },
    )


def login_and_get_token(client, email):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": BASE_PASSWORD},
    )
    assert response.status_code == 200
    return response.get_json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def create_product(app, price=5.0, quantity_in_stock=20):
    barcode = f"PAY-{uuid4().hex[:12]}"
    with app.app_context():
        product = Product(
            name="Payment Product",
            brand="Payment Brand",
            barcode=barcode,
            category="General",
            unit="1 unit",
            price=price,
            quantity_in_stock=quantity_in_stock,
        )
        db.session.add(product)
        db.session.commit()
        return product.id


def create_invoice(client, token):
    response = client.post(
        "/invoices/",
        json={
            "paymentMethod": "paypal",
            "deliveryAddress": {
                "fullName": "Payment Tester",
                "email": "payment.tester@example.com",
                "phone": "+15551112222",
                "address": "10 Payment Street",
                "city": "New York",
                "state": "NY",
                "zipCode": "10001",
            },
        },
        headers=auth_headers(token),
    )
    assert response.status_code == 201
    return response.get_json()["invoice_id"]


def add_invoice_item(client, token, invoice_id, product_id, quantity):
    response = client.post(
        f"/invoices/{invoice_id}/items",
        json={"product_id": product_id, "quantity": quantity},
        headers=auth_headers(token),
    )
    assert response.status_code == 201
    return response.get_json()


def test_create_paypal_order_sets_pending_status(client, app, monkeypatch):
    email = "payments.create@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(app, price=5.0)
    invoice_id = create_invoice(client, token)
    add_invoice_item(client, token, invoice_id, product_id, 2)  # total 10.00

    def fake_create_paypal_order(amount):
        assert str(amount) == "10.00"
        return {
            "order_id": "ORDER-123",
            "status": "CREATED",
            "approve_url": "https://paypal.test/approve/ORDER-123",
            "currency_code": "USD",
            "amount_value": "10.00",
        }

    monkeypatch.setattr("routes.payment_routes.create_paypal_order", fake_create_paypal_order)

    response = client.post(
        "/payments/paypal/create-order",
        json={"invoice_id": invoice_id},
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["message"] == "PayPal order created"
    assert body["order_id"] == "ORDER-123"
    assert body["invoice"]["payment_status"] == "pending"
    assert body["invoice"]["paypal_order_id"] == "ORDER-123"

    with app.app_context():
        invoice = Invoice.query.get(invoice_id)
        assert invoice.payment_method == "paypal"
        assert invoice.payment_status == "pending"
        assert invoice.paypal_order_id == "ORDER-123"


def test_create_paypal_order_forbidden_for_non_owner(client, app, monkeypatch):
    owner_email = "payments.owner@example.com"
    other_email = "payments.other@example.com"
    register_user(client, owner_email)
    register_user(client, other_email)

    owner_token = login_and_get_token(client, owner_email)
    other_token = login_and_get_token(client, other_email)

    product_id = create_product(app, price=4.0)
    invoice_id = create_invoice(client, owner_token)
    add_invoice_item(client, owner_token, invoice_id, product_id, 1)

    monkeypatch.setattr(
        "routes.payment_routes.create_paypal_order",
        lambda amount: {
            "order_id": "ORDER-BLOCKED",
            "status": "CREATED",
            "approve_url": "https://paypal.test/approve/ORDER-BLOCKED",
            "currency_code": "USD",
            "amount_value": "4.00",
        },
    )

    response = client.post(
        "/payments/paypal/create-order",
        json={"invoice_id": invoice_id},
        headers=auth_headers(other_token),
    )
    body = response.get_json()

    assert response.status_code == 403
    assert body["message"] == "You are not allowed to access this invoice"


def test_capture_paypal_order_marks_invoice_paid(client, app, monkeypatch):
    email = "payments.capture@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(app, price=3.25)
    invoice_id = create_invoice(client, token)
    add_invoice_item(client, token, invoice_id, product_id, 2)  # total 6.50

    with app.app_context():
        invoice = Invoice.query.get(invoice_id)
        invoice.payment_method = "paypal"
        invoice.payment_status = "pending"
        invoice.paypal_order_id = "ORDER-PAID-1"
        db.session.commit()

    monkeypatch.setattr(
        "routes.payment_routes.capture_paypal_order",
        lambda order_id: {
            "id": order_id,
            "status": "COMPLETED",
            "purchase_units": [
                {
                    "payments": {
                        "captures": [
                            {
                                "id": "CAPTURE-1",
                                "status": "COMPLETED",
                                "amount": {"currency_code": "USD", "value": "6.50"},
                            }
                        ]
                    }
                }
            ],
        },
    )

    response = client.post(
        "/payments/paypal/capture-order",
        json={"invoice_id": invoice_id},
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["message"] == "Payment captured successfully"
    assert body["capture_id"] == "CAPTURE-1"
    assert body["invoice"]["payment_status"] == "paid"

    with app.app_context():
        invoice = Invoice.query.get(invoice_id)
        assert invoice.payment_status == "paid"
        assert invoice.paypal_capture_id == "CAPTURE-1"
        assert invoice.paid_at is not None


def test_capture_paypal_order_rejects_amount_mismatch(client, app, monkeypatch):
    email = "payments.mismatch@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(app, price=10.0)
    invoice_id = create_invoice(client, token)
    add_invoice_item(client, token, invoice_id, product_id, 1)  # total 10.00

    with app.app_context():
        invoice = Invoice.query.get(invoice_id)
        invoice.payment_method = "paypal"
        invoice.payment_status = "pending"
        invoice.paypal_order_id = "ORDER-MISMATCH-1"
        db.session.commit()

    monkeypatch.setattr(
        "routes.payment_routes.capture_paypal_order",
        lambda order_id: {
            "id": order_id,
            "status": "COMPLETED",
            "purchase_units": [
                {
                    "payments": {
                        "captures": [
                            {
                                "id": "CAPTURE-MISMATCH",
                                "status": "COMPLETED",
                                "amount": {"currency_code": "USD", "value": "9.00"},
                            }
                        ]
                    }
                }
            ],
        },
    )

    response = client.post(
        "/payments/paypal/capture-order",
        json={"invoice_id": invoice_id},
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 400
    assert body["message"] == "Captured amount does not match invoice total"

    with app.app_context():
        invoice = Invoice.query.get(invoice_id)
        assert invoice.payment_status == "failed"
        assert invoice.paypal_capture_id is None


def test_create_paypal_order_rejects_zero_total_invoice(client):
    email = "payments.zero-total@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    invoice_id = create_invoice(client, token)

    response = client.post(
        "/payments/paypal/create-order",
        json={"invoice_id": invoice_id},
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 400
    assert body["message"] == "Invoice total must be greater than 0"
