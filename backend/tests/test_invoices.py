from extensions import db
from models import Invoice, InvoiceItem, Product


BASE_PASSWORD = "Password123"


def register_user(client, email):
    return client.post(
        "/auth/register",
        json={
            "first_name": "Invoice",
            "last_name": "Tester",
            "email": email,
            "password": BASE_PASSWORD,
            "phone_number": "+15550001111",
            "address": "1 Test Street",
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


def create_product(app, **overrides):
    defaults = {
        "name": "Orange Juice",
        "brand": "Fresh Farm",
        "barcode": "9000000000001",
        "category": "Drinks",
        "unit": "1L",
        "price": 5.0,
        "quantity_in_stock": 10,
    }
    defaults.update(overrides)

    with app.app_context():
        product = Product(**defaults)
        db.session.add(product)
        db.session.commit()
        return product.id


def create_invoice(client, token, payment_method="cash"):
    response = client.post(
        "/invoices/",
        json={
            "paymentMethod": payment_method,
            "deliveryAddress": {
                "fullName": "Invoice Tester",
                "email": "invoice.tester@example.com",
                "phone": "+15550001111",
                "address": "1 Test Street",
                "apartment": "2A",
                "city": "New York",
                "state": "NY",
                "zipCode": "10001",
                "deliveryNotes": "Leave at door",
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


def test_create_invoice_success(client):
    email = "invoice.create@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    response = client.post(
        "/invoices/",
        json={
            "paymentMethod": "paypal",
            "deliveryAddress": {
                "fullName": "Invoice Create",
                "email": "invoice.create@example.com",
                "phone": "+15550002222",
                "address": "2 Test Street",
                "city": "New York",
                "state": "NY",
                "zipCode": "10002",
            },
        },
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 201
    assert body["message"] == "Invoice created successfully"
    assert "invoice_id" in body
    assert "created_at" in body


def test_add_invoice_item_reduces_stock_and_updates_total(client, app):
    email = "invoice.add-item@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(
        app,
        barcode="9000000000002",
        price=4.5,
        quantity_in_stock=12,
    )
    invoice_id = create_invoice(client, token)

    response = client.post(
        f"/invoices/{invoice_id}/items",
        json={"product_id": product_id, "quantity": 3},
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 201
    assert body["new_total_amount"] == 13.5
    assert body["remaining_stock"] == 9
    assert body["item"]["product_id"] == product_id
    assert body["item"]["quantity"] == 3

    with app.app_context():
        product = Product.query.get(product_id)
        invoice = Invoice.query.get(invoice_id)
        assert product.quantity_in_stock == 9
        assert float(invoice.total_amount) == 13.5


def test_add_invoice_item_returns_400_when_stock_is_not_enough(client, app):
    email = "invoice.low-stock@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(
        app,
        barcode="9000000000003",
        quantity_in_stock=2,
    )
    invoice_id = create_invoice(client, token)

    response = client.post(
        f"/invoices/{invoice_id}/items",
        json={"product_id": product_id, "quantity": 5},
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 400
    assert body["message"] == "Not enough stock"
    assert body["available_stock"] == 2


def test_user_cannot_modify_other_users_invoice(client, app):
    owner_email = "invoice.owner@example.com"
    other_email = "invoice.other@example.com"

    register_user(client, owner_email)
    register_user(client, other_email)

    owner_token = login_and_get_token(client, owner_email)
    other_token = login_and_get_token(client, other_email)

    product_id = create_product(app, barcode="9000000000004")
    owner_invoice_id = create_invoice(client, owner_token)

    response = client.post(
        f"/invoices/{owner_invoice_id}/items",
        json={"product_id": product_id, "quantity": 1},
        headers=auth_headers(other_token),
    )
    body = response.get_json()

    assert response.status_code == 403
    assert body["message"] == "You are not allowed to modify this invoice"


def test_get_invoice_details_returns_items_for_owner(client, app):
    email = "invoice.details@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(
        app,
        barcode="9000000000005",
        name="Greek Yogurt",
        brand="Fresh Farm",
        price=3.25,
    )
    invoice_id = create_invoice(client, token, payment_method="paypal")

    add_item_response = client.post(
        f"/invoices/{invoice_id}/items",
        json={"product_id": product_id, "quantity": 2},
        headers=auth_headers(token),
    )
    assert add_item_response.status_code == 201

    response = client.get(
        f"/invoices/{invoice_id}",
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["invoice_id"] == invoice_id
    assert body["paymentMethod"] == "paypal"
    assert body["total_amount"] == 6.5
    assert body["deliveryAddress"]["city"] == "New York"
    assert len(body["items"]) == 1
    assert body["items"][0]["product_id"] == product_id
    assert body["items"][0]["quantity"] == 2


def test_get_my_invoices_returns_only_current_user_history(client):
    user_email = "invoice.history.user@example.com"
    other_email = "invoice.history.other@example.com"

    register_user(client, user_email)
    register_user(client, other_email)

    user_token = login_and_get_token(client, user_email)
    other_token = login_and_get_token(client, other_email)

    first_invoice_id = create_invoice(client, user_token)
    second_invoice_id = create_invoice(client, user_token)
    create_invoice(client, other_token)

    response = client.get(
        "/invoices/me",
        headers=auth_headers(user_token),
    )
    body = response.get_json()

    assert response.status_code == 200
    assert len(body) == 2

    invoice_ids = {item["invoice_id"] for item in body}
    assert first_invoice_id in invoice_ids
    assert second_invoice_id in invoice_ids


def test_update_invoice_item_increase_quantity_updates_total_and_stock(client, app):
    email = "invoice.patch.increase@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(
        app,
        barcode="9000000000006",
        price=2.5,
        quantity_in_stock=10,
    )
    invoice_id = create_invoice(client, token)
    add_body = add_invoice_item(client, token, invoice_id, product_id, 2)
    item_id = add_body["item"]["id"]

    response = client.patch(
        f"/invoices/{invoice_id}/items/{item_id}",
        json={"quantity": 5},
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["message"] == "Item updated successfully"
    assert body["item"]["quantity"] == 5
    assert body["new_total_amount"] == 12.5
    assert body["remaining_stock"] == 5

    with app.app_context():
        product = Product.query.get(product_id)
        invoice = Invoice.query.get(invoice_id)
        item = InvoiceItem.query.get(item_id)
        assert product.quantity_in_stock == 5
        assert float(invoice.total_amount) == 12.5
        assert item.quantity == 5


def test_update_invoice_item_decrease_quantity_restores_stock_and_total(client, app):
    email = "invoice.patch.decrease@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(
        app,
        barcode="9000000000007",
        price=3.0,
        quantity_in_stock=8,
    )
    invoice_id = create_invoice(client, token)
    add_body = add_invoice_item(client, token, invoice_id, product_id, 4)
    item_id = add_body["item"]["id"]

    response = client.patch(
        f"/invoices/{invoice_id}/items/{item_id}",
        json={"quantity": 1},
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["item"]["quantity"] == 1
    assert body["new_total_amount"] == 3.0
    assert body["remaining_stock"] == 7

    with app.app_context():
        product = Product.query.get(product_id)
        invoice = Invoice.query.get(invoice_id)
        assert product.quantity_in_stock == 7
        assert float(invoice.total_amount) == 3.0


def test_update_invoice_item_forbidden_for_other_user(client, app):
    owner_email = "invoice.patch.owner@example.com"
    other_email = "invoice.patch.other@example.com"
    register_user(client, owner_email)
    register_user(client, other_email)

    owner_token = login_and_get_token(client, owner_email)
    other_token = login_and_get_token(client, other_email)

    product_id = create_product(app, barcode="9000000000008")
    invoice_id = create_invoice(client, owner_token)
    add_body = add_invoice_item(client, owner_token, invoice_id, product_id, 1)
    item_id = add_body["item"]["id"]

    response = client.patch(
        f"/invoices/{invoice_id}/items/{item_id}",
        json={"quantity": 2},
        headers=auth_headers(other_token),
    )
    body = response.get_json()

    assert response.status_code == 403
    assert body["message"] == "You are not allowed to modify this invoice"


def test_delete_invoice_item_restores_stock_and_reduces_total(client, app):
    email = "invoice.delete@example.com"
    register_user(client, email)
    token = login_and_get_token(client, email)

    product_id = create_product(
        app,
        barcode="9000000000009",
        price=1.5,
        quantity_in_stock=9,
    )
    invoice_id = create_invoice(client, token)
    add_body = add_invoice_item(client, token, invoice_id, product_id, 3)
    item_id = add_body["item"]["id"]

    response = client.delete(
        f"/invoices/{invoice_id}/items/{item_id}",
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["message"] == "Item removed successfully"
    assert body["new_total_amount"] == 0.0
    assert body["remaining_stock"] == 9

    with app.app_context():
        product = Product.query.get(product_id)
        invoice = Invoice.query.get(invoice_id)
        item = InvoiceItem.query.get(item_id)
        assert product.quantity_in_stock == 9
        assert float(invoice.total_amount) == 0.0
        assert item is None


def test_delete_invoice_item_forbidden_for_other_user(client, app):
    owner_email = "invoice.delete.owner@example.com"
    other_email = "invoice.delete.other@example.com"
    register_user(client, owner_email)
    register_user(client, other_email)

    owner_token = login_and_get_token(client, owner_email)
    other_token = login_and_get_token(client, other_email)

    product_id = create_product(app, barcode="9000000000010")
    invoice_id = create_invoice(client, owner_token)
    add_body = add_invoice_item(client, owner_token, invoice_id, product_id, 2)
    item_id = add_body["item"]["id"]

    response = client.delete(
        f"/invoices/{invoice_id}/items/{item_id}",
        headers=auth_headers(other_token),
    )
    body = response.get_json()

    assert response.status_code == 403
    assert body["message"] == "You are not allowed to modify this invoice"
