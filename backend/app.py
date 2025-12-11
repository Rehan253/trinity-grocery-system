from flask import Flask, jsonify
from flasgger import Swagger

# Create the Flask application
app = Flask(__name__)

# Basic Swagger configuration
app.config["SWAGGER"] = {
    "title": "Trinity Grocery API",
    "uiversion": 3  # use Swagger UI v3
}

# Attach Swagger to our Flask app
swagger = Swagger(app)


@app.route("/", methods=["GET"])
def index():
    """
    Root endpoint
    ---
    tags:
      - System
    responses:
      200:
        description: Root endpoint saying the API is running
        examples:
          application/json: { "message": "Trinity Grocery API is running" }
    """
    return jsonify({"message": "Trinity Grocery API is running"})


@app.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint
    ---
    tags:
      - System
    responses:
      200:
        description: API is running correctly
        examples:
          application/json: { "status": "ok" }
    """
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    # host="0.0.0.0" makes it reachable from Windows when running in WSL
    app.run(host="0.0.0.0", port=5000, debug=True)
