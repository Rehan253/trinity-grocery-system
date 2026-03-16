from datetime import datetime
from uuid import uuid4

from extensions import db
from models import Invoice, Product


BASE_PASSWORD = "Password123"


def register_user(client, email):
    return client.post(
        "/auth/register",
        json={
            "first_name": "Recommendation",
            "last_name": "Tester",
            "email": email,
            "password": BASE_PASSWORD,
            "phone_number": "+15559990000",
            "address": "9 Test Street",
            "zip_code": "10001",
            "city": "New York",
            "country": "USA",
        },
    )


def login_user(client, email):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": BASE_PASSWORD},
    )
    assert response.status_code == 200
    return response.get_json()


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def create_product(app, name, price=5.0):
    with app.app_context():
        product = Product(
            name=name,
            brand="Reco Brand",
            barcode=f"REC-{uuid4().hex[:12]}",
            category="General",
            unit="1 unit",
            price=price,
            quantity_in_stock=50,
        )
        db.session.add(product)
        db.session.commit()
        return product.id


def create_invoice_with_item(client, token, product_id, quantity=1):
    invoice_response = client.post(
        "/invoices/",
        json={
            "paymentMethod": "paypal",
            "deliveryAddress": {
                "fullName": "Recommendation Tester",
                "email": "recommendation.tester@example.com",
                "phone": "+15559990000",
                "address": "9 Test Street",
                "city": "New York",
                "state": "NY",
                "zipCode": "10001",
            },
        },
        headers=auth_headers(token),
    )
    assert invoice_response.status_code == 201
    invoice_id = invoice_response.get_json()["invoice_id"]

    add_item_response = client.post(
        f"/invoices/{invoice_id}/items",
        json={"product_id": product_id, "quantity": quantity},
        headers=auth_headers(token),
    )
    assert add_item_response.status_code == 201
    return invoice_id


def mark_invoice_paid(app, invoice_id):
    with app.app_context():
        invoice = Invoice.query.get(invoice_id)
        invoice.payment_status = "paid"
        invoice.paid_at = datetime.utcnow()
        db.session.commit()


def test_recommendations_forbidden_for_other_user(client):
    user_one_email = "reco.user.one@example.com"
    user_two_email = "reco.user.two@example.com"
    register_user(client, user_one_email)
    register_user(client, user_two_email)

    user_one_login = login_user(client, user_one_email)
    user_two_login = login_user(client, user_two_email)

    response = client.get(
        f"/recommendations/{user_two_login['user']['id']}",
        headers=auth_headers(user_one_login["access_token"]),
    )
    body = response.get_json()

    assert response.status_code == 403
    assert body["message"] == "Forbidden"


def test_recommendations_fallback_without_purchase_history(client, app):
    email = "reco.fallback@example.com"
    register_user(client, email)
    login = login_user(client, email)
    token = login["access_token"]
    user_id = login["user"]["id"]

    create_product(app, "Fallback Product 1")
    create_product(app, "Fallback Product 2")
    create_product(app, "Fallback Product 3")

    response = client.get(
        f"/recommendations/{user_id}",
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["user_id"] == user_id
    assert body["recommended_count"] >= 1
    assert len(body["recommendations"]) >= 1


def test_recommendations_use_algolia_hits_when_purchase_history_exists(client, app, monkeypatch):
    email = "reco.algolia@example.com"
    register_user(client, email)
    login = login_user(client, email)
    token = login["access_token"]
    user_id = login["user"]["id"]

    purchased_id = create_product(app, "Purchased Product", price=6.0)
    recommended_id_1 = create_product(app, "Recommended Product 1", price=7.5)
    recommended_id_2 = create_product(app, "Recommended Product 2", price=8.25)

    invoice_id = create_invoice_with_item(client, token, purchased_id, quantity=2)
    mark_invoice_paid(app, invoice_id)

    def fake_recommend_for_product(product_id, limit=8):
        assert product_id == purchased_id
        return [
            {
                "objectID": str(recommended_id_1),
                "name": "Recommended Product 1",
                "brand": "Reco Brand",
                "category": "General",
                "price": 7.5,
                "picture_url": None,
            },
            {
                "objectID": str(purchased_id),  # Should be filtered out
                "name": "Purchased Product",
                "brand": "Reco Brand",
                "category": "General",
                "price": 6.0,
                "picture_url": None,
            },
            {
                "objectID": str(recommended_id_2),
                "name": "Recommended Product 2",
                "brand": "Reco Brand",
                "category": "General",
                "price": 8.25,
                "picture_url": None,
            },
        ]

    monkeypatch.setattr("routes.recommendation_routes._recommend_for_product", fake_recommend_for_product)

    response = client.get(
        f"/recommendations/{user_id}",
        headers=auth_headers(token),
    )
    body = response.get_json()

    assert response.status_code == 200
    ids = {item["objectID"] for item in body["recommendations"]}
    assert str(recommended_id_1) in ids
    assert str(recommended_id_2) in ids
    assert str(purchased_id) not in ids
