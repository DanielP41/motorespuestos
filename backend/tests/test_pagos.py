"""
Tests for the pagos router (MercadoPago integration).

MP_ACCESS_TOKEN y mercadopago.SDK se mockean para no requerir credenciales reales.
El webhook HMAC se verifica con la lógica real (_verificar_firma_mp).

Covers:
- 503 cuando MP no está configurado
- Validaciones: repuesto inexistente, stock insuficiente, repuesto inactivo
- IDOR: cliente no puede usar cliente_id ajeno
- Flujo exitoso con SDK mockeado
- Webhook: ignorar eventos no-payment
- Webhook: firma obligatoria cuando MP_WEBHOOK_SECRET está configurado
- Webhook: firma inválida rechazada
"""
import hashlib
import hmac
import os
from unittest.mock import MagicMock, patch

import pytest


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mp_sdk_mock(preference_response: dict):
    """Returns a patched mercadopago.SDK that returns the given response."""
    mock_sdk = MagicMock()
    mock_sdk.return_value.preference.return_value.create.return_value = preference_response
    return mock_sdk


MP_SUCCESS = {
    "status": 201,
    "response": {
        "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=test-pref",
        "id": "test-pref-123",
    },
}

PREFERENCIA_BASE = {
    "items": [{"repuesto_id": None, "cantidad": 1, "descuento_pct": 0}],
    "payer_email": "buyer@test.com",
}


def _preferencia(repuesto_id: int, cantidad: int = 1, cliente_id: int = None) -> dict:
    body = {
        "items": [{"repuesto_id": repuesto_id, "cantidad": cantidad, "descuento_pct": 0}],
        "payer_email": "buyer@test.com",
    }
    if cliente_id is not None:
        body["cliente_id"] = cliente_id
    return body


# ── POST /pagos/crear-preferencia ─────────────────────────────────────────────

def test_crear_preferencia_sin_auth(client, repuesto_en_db):
    resp = client.post("/pagos/crear-preferencia", json=_preferencia(repuesto_en_db))
    assert resp.status_code == 401


def test_crear_preferencia_mp_no_configurado(client, auth_headers, repuesto_en_db):
    """503 cuando MP_ACCESS_TOKEN está vacío (default)."""
    with patch("app.routers.pagos.MP_ACCESS_TOKEN", ""):
        resp = client.post("/pagos/crear-preferencia",
                           json=_preferencia(repuesto_en_db), headers=auth_headers)
    assert resp.status_code == 503


def test_crear_preferencia_repuesto_inexistente(client, auth_headers):
    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        resp = client.post("/pagos/crear-preferencia",
                           json=_preferencia(99999), headers=auth_headers)
    assert resp.status_code == 404


def test_crear_preferencia_stock_insuficiente(client, auth_headers, repuesto_en_db):
    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        resp = client.post("/pagos/crear-preferencia",
                           json=_preferencia(repuesto_en_db, cantidad=9999),
                           headers=auth_headers)
    assert resp.status_code == 400
    assert "stock" in resp.json()["detail"].lower()


def test_crear_preferencia_repuesto_inactivo(client, auth_headers, db_session, repuesto_en_db):
    from app.models import Repuesto
    rep = db_session.query(Repuesto).filter(Repuesto.id == repuesto_en_db).first()
    rep.estado = "descontinuado"
    db_session.commit()

    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        resp = client.post("/pagos/crear-preferencia",
                           json=_preferencia(repuesto_en_db), headers=auth_headers)
    assert resp.status_code == 400
    assert "disponible" in resp.json()["detail"].lower()


def test_crear_preferencia_items_vacios(client, auth_headers):
    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        resp = client.post("/pagos/crear-preferencia", json={
            "items": [],
            "payer_email": "buyer@test.com",
        }, headers=auth_headers)
    assert resp.status_code == 422


def test_crear_preferencia_cantidad_cero(client, auth_headers, repuesto_en_db):
    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        resp = client.post("/pagos/crear-preferencia",
                           json=_preferencia(repuesto_en_db, cantidad=0),
                           headers=auth_headers)
    assert resp.status_code == 422


def test_crear_preferencia_descuento_invalido(client, auth_headers, repuesto_en_db):
    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        resp = client.post("/pagos/crear-preferencia", json={
            "items": [{"repuesto_id": repuesto_en_db, "cantidad": 1, "descuento_pct": 150}],
            "payer_email": "buyer@test.com",
        }, headers=auth_headers)
    assert resp.status_code == 422


def test_idor_cliente_no_puede_usar_cliente_id_ajeno(client, cliente_headers,
                                                      cliente_en_db, repuesto_en_db, db_session):
    """Un cliente no puede asociar la compra a otro cliente_id."""
    from app.auth_utils import get_password_hash
    from app.models import Cliente

    c2 = Cliente(
        tipo="N", documento_tipo="CC", documento_nro="66666666",
        nombre="Víctima IDOR", email="victima@test.com",
        hashed_password=get_password_hash("victimapass"), activo=True,
    )
    db_session.add(c2)
    db_session.commit()
    db_session.refresh(c2)

    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        resp = client.post("/pagos/crear-preferencia",
                           json=_preferencia(repuesto_en_db, cliente_id=c2.id),
                           headers=cliente_headers)
    assert resp.status_code == 403


def test_crear_preferencia_exitosa(client, auth_headers, repuesto_en_db):
    """Flujo completo con SDK mockeado: debe retornar init_point, venta_id y numero_factura."""
    mock_sdk = _mp_sdk_mock(MP_SUCCESS)

    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        with patch("app.routers.pagos.mercadopago.SDK", mock_sdk):
            resp = client.post("/pagos/crear-preferencia",
                               json=_preferencia(repuesto_en_db), headers=auth_headers)

    assert resp.status_code == 201
    data = resp.json()
    assert data["init_point"] == MP_SUCCESS["response"]["init_point"]
    assert data["numero_factura"].startswith("FAC-")
    assert isinstance(data["venta_id"], int)


def test_crear_preferencia_error_mp(client, auth_headers, repuesto_en_db):
    """502 cuando MercadoPago devuelve un error."""
    mock_sdk = _mp_sdk_mock({"status": 500, "response": {"error": "internal"}})

    with patch("app.routers.pagos.MP_ACCESS_TOKEN", "TEST_TOKEN"):
        with patch("app.routers.pagos.mercadopago.SDK", mock_sdk):
            resp = client.post("/pagos/crear-preferencia",
                               json=_preferencia(repuesto_en_db), headers=auth_headers)
    assert resp.status_code == 502


# ── POST /pagos/webhook ────────────────────────────────────────────────────────

def test_webhook_ignora_evento_no_payment(client):
    resp = client.post("/pagos/webhook", json={"type": "merchant_order", "data": {"id": "123"}})
    assert resp.status_code == 200
    assert resp.json()["status"] == "ignored"


def test_webhook_ignora_sin_payment_id(client):
    resp = client.post("/pagos/webhook", json={"type": "payment", "data": {}})
    assert resp.status_code == 200
    assert resp.json()["status"] == "ignored"


def test_webhook_body_invalido(client):
    resp = client.post("/pagos/webhook", content=b"not-json",
                       headers={"Content-Type": "application/json"})
    assert resp.status_code == 400


def test_webhook_sin_secret_no_verifica_firma(client):
    """Cuando MP_WEBHOOK_SECRET está vacío, acepta webhooks sin firma."""
    with patch("app.routers.pagos.MP_WEBHOOK_SECRET", ""):
        with patch("app.routers.pagos._procesar_pago"):  # evitar llamada real a MP
            resp = client.post("/pagos/webhook",
                               json={"type": "payment", "data": {"id": "456"}})
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_webhook_requiere_firma_cuando_secret_configurado(client):
    """401 cuando hay secret pero el request no tiene x-signature."""
    with patch("app.routers.pagos.MP_WEBHOOK_SECRET", "mi-secreto"):
        resp = client.post("/pagos/webhook",
                           json={"type": "payment", "data": {"id": "789"}})
    assert resp.status_code == 401
    assert "firma" in resp.json()["detail"].lower()


def test_webhook_firma_invalida_rechazada(client):
    """401 cuando la firma x-signature no coincide con el HMAC esperado."""
    with patch("app.routers.pagos.MP_WEBHOOK_SECRET", "mi-secreto"):
        resp = client.post("/pagos/webhook",
                           json={"type": "payment", "data": {"id": "999"}},
                           headers={
                               "x-signature": "ts=1234567890,v1=firma_incorrecta",
                               "x-request-id": "req-abc",
                           })
    assert resp.status_code == 401
    assert "inválida" in resp.json()["detail"].lower()


def test_webhook_firma_valida_aceptada(client):
    """200 cuando la firma HMAC-SHA256 es correcta."""
    secret = "mi-secreto-real"
    payment_id = "12345"
    request_id = "req-xyz"
    ts = "1700000000"

    manifest = f"id:{payment_id};request-id:{request_id};ts:{ts}"
    v1 = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    signature_header = f"ts={ts},v1={v1}"

    with patch("app.routers.pagos.MP_WEBHOOK_SECRET", secret):
        with patch("app.routers.pagos._procesar_pago"):
            resp = client.post(
                "/pagos/webhook",
                json={"type": "payment", "data": {"id": payment_id}},
                headers={"x-signature": signature_header, "x-request-id": request_id},
            )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
