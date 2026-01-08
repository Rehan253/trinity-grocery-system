from flask import Flask, jsonify
from flasgger import Swagger

from config import Config
from extensions import db, migrate
import models





def create_app():
    """
    Application factory.
    Creates and configures the Flask app.
    """
    app = Flask(__name__)

    # Load configuration from config.py
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    Swagger(app)

    # ---------------- ROUTES ----------------

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
              application/json: { "message": "Trinity Grocery API is running" }
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
              application/json: { "status": "ok" }
        """
        return jsonify({"status": "ok"})

    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
