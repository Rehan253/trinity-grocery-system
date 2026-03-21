import requests

BASE_V2_URL = "https://world.openfoodfacts.org/api/v2/product"
REQUEST_HEADERS = {
    "User-Agent": "TrinityGrocery/1.0 (dev; contact: admin@trinity.com)",
}


def fetch_product_by_barcode(barcode: str):
    """
    Fetch a single product from OpenFoodFacts v2 API using barcode
    """
    url = f"{BASE_V2_URL}/{barcode}"

    response = requests.get(url, headers=REQUEST_HEADERS, timeout=(3, 6))
    response.raise_for_status()

    data = response.json()

    # OpenFoodFacts returns status = 1 when product exists
    if data.get("status") != 1:
        return None

    return data.get("product")
