BASE_USER = {
    "first_name": "Test",
    "last_name": "User",
    "email": "test.user@example.com",
    "password": "Password123",
    "phone_number": "+15551234567",
    "address": "123 Main St",
    "zip_code": "10001",
    "city": "New York",
    "country": "USA",
}


def register_user(client, **overrides):
    payload = {**BASE_USER, **overrides}
    return client.post("/auth/register", json=payload)


def login_user(client, email=None, password=None):
    return client.post(
        "/auth/login",
        json={
            "email": email or BASE_USER["email"],
            "password": password or BASE_USER["password"],
        },
    )


def test_register_success(client):
    response = register_user(client)
    body = response.get_json()

    assert response.status_code == 201
    assert body["message"] == "User registered successfully"
    assert body["user"]["email"] == BASE_USER["email"]
    assert body["user"]["role"] == "customer"


def test_register_duplicate_email_returns_409(client):
    register_user(client)
    response = register_user(client)
    body = response.get_json()

    assert response.status_code == 409
    assert body["message"] == "Email already registered"


def test_register_missing_required_field_returns_400(client):
    response = register_user(client, first_name="")
    body = response.get_json()

    assert response.status_code == 400
    assert "errors" in body
    assert body["errors"]["first_name"] == "first_name is required"


def test_login_success_returns_access_token(client):
    register_user(client)
    response = login_user(client)
    body = response.get_json()

    assert response.status_code == 200
    assert "access_token" in body
    assert body["user"]["email"] == BASE_USER["email"]


def test_login_wrong_password_returns_401(client):
    register_user(client)
    response = login_user(client, password="WrongPassword123")
    body = response.get_json()

    assert response.status_code == 401
    assert body["message"] == "Invalid email or password"


def test_me_requires_jwt(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_me_returns_user_profile_with_valid_jwt(client):
    register_user(client)
    login_response = login_user(client)
    token = login_response.get_json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    body = response.get_json()

    assert response.status_code == 200
    assert body["email"] == BASE_USER["email"]
    assert body["first_name"] == BASE_USER["first_name"]
    assert body["last_name"] == BASE_USER["last_name"]
