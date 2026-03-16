import os
from typing import List, Dict
import requests

from models import Product

ALGOLIA_APP_ID = os.getenv("ALGOLIA_APP_ID", "")
ALGOLIA_ADMIN_API_KEY = os.getenv("ALGOLIA_WRITE_API_KEY", "")
ALGOLIA_INDEX_NAME = os.getenv("ALGOLIA_INDEX_NAME", "products")
ALGOLIA_INSIGHTS_REGION = os.getenv("ALGOLIA_INSIGHTS_REGION", "us")


def _search_headers() -> Dict[str, str]:
    return {
        "Content-Type": "application/json",
        "X-Algolia-Application-Id": ALGOLIA_APP_ID,
        "X-Algolia-API-Key": ALGOLIA_ADMIN_API_KEY,
    }


def _validate_algolia_config() -> None:
    if not ALGOLIA_APP_ID:
        raise RuntimeError("ALGOLIA_APP_ID is missing")
    if not ALGOLIA_ADMIN_API_KEY:
        raise RuntimeError("ALGOLIA_WRITE_API_KEY is missing")


def sync_products_to_algolia() -> Dict[str, int]:
    _validate_algolia_config()
    products = Product.query.all()
    if not products:
        return {"sent": 0}

    requests_payload = []
    for p in products:
        record = {
            "objectID": str(p.id),  # very important: stable unique ID
            "name": p.name,
            "brand": p.brand,
            "category": p.category,
            "description": p.description or "",
            "price": float(p.price),
            "quantity_in_stock": p.quantity_in_stock,
            "inStock": p.quantity_in_stock > 0,
            "picture_url": p.picture_url,
            "dietary_tags": p.dietary_tags,
            "ingredients": p.ingredients,
        }
        requests_payload.append({"action": "updateObject", "body": record})

    url = f"https://{ALGOLIA_APP_ID}.algolia.net/1/indexes/{ALGOLIA_INDEX_NAME}/batch"
    resp = requests.post(
        url,
        headers=_search_headers(),
        json={"requests": requests_payload},
        timeout=30,
    )
    resp.raise_for_status()

    return {"sent": len(requests_payload)}

def send_purchase_event_to_algolia(user_id: int, product_object_ids: List[str]) -> None:
    _validate_algolia_config()
    if not product_object_ids:
        return

    url = f"https://insights.{ALGOLIA_INSIGHTS_REGION}.algolia.io/1/events"
    payload = {
        "events": [
            {
                "eventType": "conversion",
                "eventName": "Order Purchased",
                "index": ALGOLIA_INDEX_NAME,
                "userToken": f"user-{user_id}",
                "authenticatedUserToken": str(user_id),
                "objectIDs": product_object_ids,
            }
        ]
    }

    resp = requests.post(url, headers=_search_headers(), json=payload, timeout=20)
    resp.raise_for_status()
