import os
from datetime import timedelta


class Config:
    """
    Application configuration.
    This file holds settings for database, JWT authentication, and Swagger.
    """

    # ===============================
    # Database configuration
    # ===============================

    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///trinity_grocery.db",
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ===============================
    # Flask core security
    # ===============================

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    # ===============================
    # JWT Authentication configuration
    # ===============================

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # Access token: short-lived (15 minutes) — used for every API request
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)

    # Refresh token: long-lived (30 days) — used only to get new access tokens
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ===============================
    # PayPal configuration
    # ===============================

    PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")
    PAYPAL_CLIENT_ID = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET = os.getenv("PAYPAL_CLIENT_SECRET", "")
    PAYPAL_CURRENCY = os.getenv("PAYPAL_CURRENCY", "USD")
    PAYPAL_RETURN_URL = os.getenv("PAYPAL_RETURN_URL", "")
    PAYPAL_CANCEL_URL = os.getenv("PAYPAL_CANCEL_URL", "")
    PAYPAL_WEBHOOK_ID = os.getenv("PAYPAL_WEBHOOK_ID", "")
    PAYPAL_MOCK_MODE = os.getenv("PAYPAL_MOCK_MODE", "false").lower() in (
        "1",
        "true",
        "yes",
    )

    # ===============================
    # Swagger configuration
    # ===============================

    SWAGGER = {
        "title": "Trinity Grocery API",
        "uiversion": 3
    }
