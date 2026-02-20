from extensions import db
from models import Product


def test_get_product_by_barcode_returns_product(client, app):
    with app.app_context():
        product = Product(
            name="Milk",
            brand="Demo Brand",
            barcode="1234567890123",
            category="Dairy",
            unit="1L",
            price=3.99,
            quantity_in_stock=20,
        )
        db.session.add(product)
        db.session.commit()

    response = client.get("/products/barcode/1234567890123")
    body = response.get_json()

    assert response.status_code == 200
    assert body["name"] == "Milk"
    assert body["barcode"] == "1234567890123"


def test_get_product_by_barcode_returns_404_when_not_found(client):
    response = client.get("/products/barcode/0000000000000")
    body = response.get_json()

    assert response.status_code == 404
    assert body["message"] == "Product not found"
