import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from routes.product_routes import product_bp
from routes.invoice_routes import invoice_bp
from routes.payment_routes import payment_bp
from routes.admin_product_import_routes import admin_import_bp
from routes.admin_promotion_routes import admin_promotions_bp
from routes.admin_user_routes import admin_users_bp
from routes.kpi_routes import kpi_bp

from config import Config
from extensions import db, migrate
import models

from routes.auth_routes import auth_bp

load_dotenv()

try:
    from flasgger import Swagger
except Exception as swagger_import_error:  # noqa: F401
    class Swagger:  # pylint: disable=too-few-public-methods
        def __init__(self, *args, **kwargs):
            print("WARNING: Swagger disabled due to dependency error.")


def seed_super_admin():
    """
    Ensure the super admin exists for first-time setup.
    """
    from models import User
    from security_utils import hash_password

    admin_email = os.getenv("SUPER_ADMIN_EMAIL", "admin@trinity.com")
    admin_password = os.getenv("SUPER_ADMIN_PASSWORD", "admin123")

    if not User.query.filter_by(email=admin_email).first():
        print(f" Seeding Super Admin: {admin_email}")
        admin = User(
            first_name="Super",
            last_name="Admin",
            email=admin_email,
            password_hash=hash_password(admin_password),
            phone_number="+33100000000",
            address="1 Admin Way",
            zip_code="75000",
            city="Paris",
            country="France",
            role="admin"
        )
        db.session.add(admin)
        db.session.commit()
        print("Super Admin created.")
    else:
        print("ℹ Super Admin already exists.")


def create_app(config_overrides=None):
    """
    Application factory.
    Creates and configures the Flask app.
    """
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)
    if config_overrides:
        app.config.update(config_overrides)

    # Initialize CORS
    local_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:19006",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082",
        "http://127.0.0.1:19006",
        r"http://172\.\d+\.\d+\.\d+:\d+",
        r"http://192\.168\.\d+\.\d+:\d+",
        r"http://10\.\d+\.\d+\.\d+:\d+",
    ]

    CORS(app, resources={
        r"/auth/*": {"origins": local_origins},
        r"/api/*": {"origins": local_origins},
        r"/products": {"origins": local_origins},
        r"/products/*": {"origins": local_origins},
        r"/*": {"origins": local_origins}
    }, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Initialize JWT
    JWTManager(app)

    #  Simple, stable Swagger (documentation only)
    Swagger(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(invoice_bp)
    app.register_blueprint(payment_bp)
    app.register_blueprint(admin_import_bp)
    app.register_blueprint(admin_users_bp)
    app.register_blueprint(admin_promotions_bp)
    app.register_blueprint(kpi_bp)

    @app.before_request
    def ensure_super_admin():
        if app.config.get("_SUPER_ADMIN_SEEDED"):
            return
        try:
            seed_super_admin()
            app.config["_SUPER_ADMIN_SEEDED"] = True
        except Exception as e:
            print(f"❌ Error seeding admin: {e}")


    


    # ---------------- SYSTEM ROUTES ----------------

    @app.route("/", methods=["GET"])
    def index():
        """
        Root endpoint
        ---
        tags:
          - System
        responses:
          200:
            description: API is running
            examples:
              application/json:
                message: Trinity Grocery API is running
        """
        return jsonify({"message": "Trinity Grocery API is running"})

    @app.route("/health", methods=["GET"])
    def health():
        """
        Health check
        ---
        tags:
          - System
        responses:
          200:
            description: Health OK
            examples:
              application/json:
                status: ok
        """
        return jsonify({"status": "ok"})

    return app


# Create app instance
app = create_app()

if __name__ == "__main__":
    with app.app_context():
        # Create tables first
        db.create_all()
        seed_super_admin()

    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    host = os.getenv("FLASK_HOST", "127.0.0.1")
    app.run(host=host, port=5000, debug=debug)
