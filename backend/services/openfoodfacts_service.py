import requests

BASE_V2_URL = "https://world.openfoodfacts.org/api/v2/product"
SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"
REQUEST_HEADERS = {
    "User-Agent": "TrinityGrocery/1.0 (dev; contact: admin@trinity.com)",
}


DEFAULT_SEARCH_FIELDS = [
    "code",
    "product_name",
    "product_name_en",
    "generic_name",
    "generic_name_en",
    "brands",
    "brands_tags",
    "categories",
    "categories_tags",
    "quantity",
    "image_front_url",
    "image_url",
    "nutriments",
    "ingredients_text",
    "ingredients_tags",
    "labels",
    "labels_tags",
    "ingredients_analysis_tags",
]


def _request_json(url: str, *, params=None, retries: int = 3, timeout=(5, 20)):
    last_error = None
    for _ in range(max(1, retries)):
        try:
            response = requests.get(url, headers=REQUEST_HEADERS, params=params, timeout=timeout)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            last_error = exc

    if last_error:
        raise last_error
    return {}


def fetch_product_by_barcode(barcode: str):
    """
    Fetch a single product from OpenFoodFacts v2 API using barcode
    """
    url = f"{BASE_V2_URL}/{barcode}"
    data = _request_json(url, retries=3, timeout=(3, 8))

    # OpenFoodFacts returns status = 1 when product exists
    if data.get("status") != 1:
        return None

    return data.get("product")


def fetch_products_page(page: int, page_size: int = 100, fields=None):
    """
    Fetch a page of products from OpenFoodFacts search API.
    """
    if page <= 0:
        raise ValueError("page must be >= 1")
    if page_size <= 0:
        raise ValueError("page_size must be >= 1")

    selected_fields = fields or DEFAULT_SEARCH_FIELDS
    params = {
        "action": "process",
        "json": 1,
        "page": page,
        "page_size": page_size,
        "fields": ",".join(selected_fields),
    }
    payload = _request_json(SEARCH_URL, params=params, retries=3, timeout=(5, 20))
    products = payload.get("products") or []
    if not isinstance(products, list):
        products = []

    return {
        "count": payload.get("count"),
        "page": payload.get("page", page),
        "page_size": page_size,
        "products": products,
    }
