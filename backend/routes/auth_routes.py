from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import User
from security import hash_password


auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


@auth_bp.post("/register")
def register():
    """
    Register a new user
    ---
    tags:
      - Authentication
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - first_name
            - last_name
            - email
            - password
            - phone_number
            - address
            - zip_code
            - city
            - country
          properties:
            first_name:
              type: string
              example: John
            last_name:
              type: string
              example: Doe
            email:
              type: string
              example: john.doe@example.com
            password:
              type: string
              example: StrongPass123
            phone_number:
              type: string
              example: "+33123456789"
            address:
              type: string
              example: 10 Rue de Paris
            zip_code:
              type: string
              example: "75001"
            city:
              type: string
              example: Paris
            country:
              type: string
              example: France
    responses:
      201:
        description: User registered successfully
      400:
        description: Validation error
      409:
        description: Email already exists
    """

    data = request.get_json(silent=True) or {}

    # Extract fields
    first_name = (data.get("first_name") or "").strip()
    last_name = (data.get("last_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    phone_number = (data.get("phone_number") or "").strip()
    address = (data.get("address") or "").strip()
    zip_code = (data.get("zip_code") or "").strip()
    city = (data.get("city") or "").strip()
    country = (data.get("country") or "").strip()

    # Validation
    errors = {}

    if not first_name:
        errors["first_name"] = "first_name is required"
    if not last_name:
        errors["last_name"] = "last_name is required"
    if not email:
        errors["email"] = "email is required"
    if not password:
        errors["password"] = "password is required"
    elif len(password) < 8:
        errors["password"] = "password must be at least 8 characters"
    if not phone_number:
        errors["phone_number"] = "phone_number is required"
    if not address:
        errors["address"] = "address is required"
    if not zip_code:
        errors["zip_code"] = "zip_code is required"
    if not city:
        errors["city"] = "city is required"
    if not country:
        errors["country"] = "country is required"

    if errors:
        return jsonify({"errors": errors}), 400

    # Check duplicate email
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 409

    # Create user
    user = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        password_hash=hash_password(password),
        phone_number=phone_number,
        address=address,
        zip_code=zip_code,
        city=city,
        country=country,
    )

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Email already registered"}), 409

    return jsonify(
        {
            "message": "User registered successfully",
            "user": {
                "id": user.id,
                "email": user.email,
            },
        }
    ), 201
