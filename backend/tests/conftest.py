import os
import sys
import types

import pytest

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Some local environments have a broken flasgger/jsonschema runtime.
# For tests, we can safely stub Swagger to keep API logic testable.
try:
    import flasgger  # noqa: F401
except Exception:
    fake_flasgger = types.ModuleType("flasgger")

    class Swagger:  # pylint: disable=too-few-public-methods
        def __init__(self, *args, **kwargs):
            pass

    fake_flasgger.Swagger = Swagger
    sys.modules["flasgger"] = fake_flasgger

from app import create_app
from extensions import db


@pytest.fixture
def app():
    app = create_app(
        {
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
            "JWT_SECRET_KEY": "test-jwt-secret",
            "SECRET_KEY": "test-secret",
            "_SUPER_ADMIN_SEEDED": True,
        }
    )

    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    with app.test_client() as client:
        yield client
