"""Tests for authentication flows: registro, login, /me."""


def test_register_success(client):
    resp = client.post("/auth/registro", json={
        "username": "nuevo",
        "email": "nuevo@example.com",
        "password": "pass1234",
        "nombre_completo": "Nuevo Usuario",
        "role": "vendedor",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "nuevo"
    assert data["email"] == "nuevo@example.com"
    assert "hashed_password" not in data


def test_register_duplicate_username(client):
    payload = {
        "username": "duplicado",
        "email": "a@example.com",
        "password": "pass1234",
        "nombre_completo": "",
        "role": "vendedor",
    }
    client.post("/auth/registro", json=payload)
    payload["email"] = "b@example.com"
    resp = client.post("/auth/registro", json=payload)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"]


def test_register_duplicate_email(client):
    payload = {
        "username": "user1",
        "email": "mismo@example.com",
        "password": "pass1234",
        "nombre_completo": "",
        "role": "vendedor",
    }
    client.post("/auth/registro", json=payload)
    payload["username"] = "user2"
    resp = client.post("/auth/registro", json=payload)
    assert resp.status_code == 400


def test_login_success(client):
    client.post("/auth/registro", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "mypassword",
        "nombre_completo": "",
        "role": "vendedor",
    })
    resp = client.post("/auth/token", data={
        "username": "loginuser",
        "password": "mypassword",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/auth/registro", json={
        "username": "loginuser2",
        "email": "login2@example.com",
        "password": "correctpass",
        "nombre_completo": "",
        "role": "vendedor",
    })
    resp = client.post("/auth/token", data={
        "username": "loginuser2",
        "password": "wrongpass",
    })
    assert resp.status_code == 401


def test_login_nonexistent_user(client):
    resp = client.post("/auth/token", data={
        "username": "noexiste",
        "password": "cualquiera",
    })
    assert resp.status_code == 401


def test_me_with_valid_token(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["username"] == "testuser"


def test_me_without_token(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 401
