from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger
from flask_jwt_extended import JWTManager
from routes.product_routes import product_bp
from routes.invoice_routes import invoice_bp
from routes.admin_product_import_routes import admin_import_bp
from routes.kpi_routes import kpi_bp

from config import Config
from extensions import db, migrate
import models

from routes.auth_routes import auth_bp


def create_app():
    """
    Application factory.
    Creates and configures the Flask app.
    """
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Initialize CORS
    CORS(app, resources={
        r"/auth/*": {"origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]},
        r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]},
        r"/products": {"origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]},
        r"/products/*": {"origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]},
        r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]}
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
    app.register_blueprint(admin_import_bp)
    app.register_blueprint(kpi_bp)



    


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
    app.run(host="0.0.0.0", port=5000, debug=True)
