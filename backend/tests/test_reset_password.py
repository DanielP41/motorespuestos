"""
Tests para el flujo de reset de contraseña (forgot-password / reset-password).

Cubre:
  - forgot_password: siempre 204, no revela si el email existe
  - forgot_password: genera token y expiry en BD cuando el email existe
  - reset_password: cambia la contraseña con token válido
  - reset_password: invalida el token después de usarlo (no se puede reusar)
  - reset_password: rechaza token expirado
  - reset_password: rechaza token inexistente
  - reset_password: rechaza contraseña menor a 6 caracteres
  - reset_password: invalida tokens JWT anteriores al resetear
  - Flujo completo: forgot → reset → login con nueva contraseña
"""

import uuid
from datetime import datetime, timedelta

import pytest
from sqlalchemy import text

from app.models import User
from tests.conftest import TestingSessionLocal


# ── helpers ──────────────────────────────────────────────────────────────────

def _register(client, username="resetuser", email="reset@example.com", password="original123"):
    client.post("/auth/registro", json={
        "username": username,
        "email": email,
        "password": password,
        "nombre_completo": "Reset User",
        "role": "vendedor",
    })
    return email, password


def _get_user(email: str) -> User | None:
    db = TestingSessionLocal()
    try:
        return db.query(User).filter(User.email == email).first()
    finally:
        db.close()


def _set_token_expired(email: str):
    """Fuerza que el token del usuario ya haya expirado."""
    db = TestingSessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        user.password_reset_expires = datetime.utcnow() - timedelta(hours=2)
        db.commit()
    finally:
        db.close()


# ── forgot-password ───────────────────────────────────────────────────────────

def test_forgot_password_email_existente_devuelve_204(client):
    _register(client)
    resp = client.post("/auth/forgot-password", json={"email": "reset@example.com"})
    assert resp.status_code == 204


def test_forgot_password_email_inexistente_devuelve_204(client):
    """No debe revelar si el email está registrado."""
    resp = client.post("/auth/forgot-password", json={"email": "noexiste@example.com"})
    assert resp.status_code == 204


def test_forgot_password_genera_token_en_bd(client):
    email, _ = _register(client)
    client.post("/auth/forgot-password", json={"email": email})

    user = _get_user(email)
    assert user.password_reset_token is not None
    assert user.password_reset_expires is not None
    assert user.password_reset_expires > datetime.utcnow()


def test_forgot_password_sobreescribe_token_anterior(client):
    email, _ = _register(client)
    client.post("/auth/forgot-password", json={"email": email})
    token1 = _get_user(email).password_reset_token

    client.post("/auth/forgot-password", json={"email": email})
    token2 = _get_user(email).password_reset_token

    assert token1 != token2


# ── reset-password ────────────────────────────────────────────────────────────

def test_reset_password_exitoso(client):
    email, _ = _register(client)
    client.post("/auth/forgot-password", json={"email": email})
    token = _get_user(email).password_reset_token

    resp = client.post("/auth/reset-password", json={
        "token": token,
        "new_password": "nuevapass123",
    })
    assert resp.status_code == 204


def test_reset_password_limpia_token_en_bd(client):
    email, _ = _register(client)
    client.post("/auth/forgot-password", json={"email": email})
    token = _get_user(email).password_reset_token

    client.post("/auth/reset-password", json={"token": token, "new_password": "nuevapass123"})

    user = _get_user(email)
    assert user.password_reset_token is None
    assert user.password_reset_expires is None


def test_reset_password_token_no_reutilizable(client):
    email, _ = _register(client)
    client.post("/auth/forgot-password", json={"email": email})
    token = _get_user(email).password_reset_token

    client.post("/auth/reset-password", json={"token": token, "new_password": "nuevapass111"})
    resp = client.post("/auth/reset-password", json={"token": token, "new_password": "nuevapass222"})
    assert resp.status_code == 400


def test_reset_password_token_inexistente(client):
    resp = client.post("/auth/reset-password", json={
        "token": str(uuid.uuid4()),
        "new_password": "cualquiera123",
    })
    assert resp.status_code == 400


def test_reset_password_token_expirado(client):
    email, _ = _register(client)
    client.post("/auth/forgot-password", json={"email": email})
    _set_token_expired(email)
    token = _get_user(email).password_reset_token

    resp = client.post("/auth/reset-password", json={"token": token, "new_password": "nuevapass123"})
    assert resp.status_code == 400


def test_reset_password_contrasena_corta(client):
    email, _ = _register(client)
    client.post("/auth/forgot-password", json={"email": email})
    token = _get_user(email).password_reset_token

    resp = client.post("/auth/reset-password", json={"token": token, "new_password": "corta"})
    assert resp.status_code == 400


def test_reset_password_invalida_tokens_jwt_anteriores(client):
    email, _ = _register(client)

    # Login antes del reset → token viejo
    resp = client.post("/auth/token", data={"username": "resetuser", "password": "original123"})
    token_viejo = resp.json()["access_token"]

    # Reset de contraseña
    client.post("/auth/forgot-password", json={"email": email})
    reset_token = _get_user(email).password_reset_token
    client.post("/auth/reset-password", json={"token": reset_token, "new_password": "nuevapass123"})

    # El token viejo ya no debe ser válido
    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token_viejo}"})
    assert resp.status_code == 401


# ── flujo completo ────────────────────────────────────────────────────────────

def test_flujo_completo_forgot_reset_login(client):
    """forgot-password → reset-password → login con nueva contraseña funciona."""
    email, old_pass = _register(client, username="flujouser", email="flujo@example.com")

    # 1. Solicitar reset
    client.post("/auth/forgot-password", json={"email": email})
    token = _get_user(email).password_reset_token

    # 2. Resetear contraseña
    client.post("/auth/reset-password", json={"token": token, "new_password": "nuevapass456"})

    # 3. Login con contraseña vieja falla
    resp = client.post("/auth/token", data={"username": "flujouser", "password": old_pass})
    assert resp.status_code == 401

    # 4. Login con contraseña nueva funciona
    resp = client.post("/auth/token", data={"username": "flujouser", "password": "nuevapass456"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
