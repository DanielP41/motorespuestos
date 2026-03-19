"""
Tests for the clientes router.

Covers:
- Public registration (duplicates, validation)
- Admin CRUD (list, get, create, update, soft-delete)
- IDOR prevention on POST /{id}/motos
- /me endpoints (cliente only)
- 401/403 enforcement
"""
import pytest


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def modelo_en_db(db_session):
    """Creates a MarcaMoto + ModeloMoto. Returns modelo id."""
    from app.models import MarcaMoto, ModeloMoto
    marca = MarcaMoto(nombre="Honda Test", pais_origen="Japón")
    db_session.add(marca)
    db_session.flush()
    modelo = ModeloMoto(marca_id=marca.id, nombre="CBR 150", anio_inicio=2020, activo=True)
    db_session.add(modelo)
    db_session.commit()
    db_session.refresh(modelo)
    return modelo.id


CLIENTE_BASE = {
    "tipo": "N",
    "documento_tipo": "CC",
    "documento_nro": "11111111",
    "nombre": "Juan Pérez",
    "email": "juan@test.com",
    "password": "juanpass123",
}


# ── Registro público ──────────────────────────────────────────────────────────

def test_registro_publico_exitoso(client):
    resp = client.post("/clientes/register", json=CLIENTE_BASE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["nombre"] == "Juan Pérez"
    assert data["email"] == "juan@test.com"
    assert "hashed_password" not in data


def test_registro_documento_duplicado(client):
    client.post("/clientes/register", json=CLIENTE_BASE)
    resp = client.post("/clientes/register", json={**CLIENTE_BASE, "email": "otro@test.com"})
    assert resp.status_code == 400
    assert "documento" in resp.json()["detail"].lower()


def test_registro_email_duplicado(client):
    client.post("/clientes/register", json=CLIENTE_BASE)
    resp = client.post("/clientes/register", json={**CLIENTE_BASE, "documento_nro": "22222222"})
    assert resp.status_code == 400
    assert "correo" in resp.json()["detail"].lower()


def test_registro_password_muy_corta(client):
    resp = client.post("/clientes/register", json={**CLIENTE_BASE, "password": "corta"})
    assert resp.status_code == 422


# ── Admin: crear cliente ──────────────────────────────────────────────────────

def test_admin_crea_cliente(client, auth_headers):
    resp = client.post("/clientes/", json=CLIENTE_BASE, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["documento_nro"] == "11111111"


def test_crear_cliente_sin_auth(client):
    resp = client.post("/clientes/", json=CLIENTE_BASE)
    assert resp.status_code == 401


def test_cliente_no_puede_crear_otro_cliente(client, cliente_headers):
    resp = client.post("/clientes/", json={**CLIENTE_BASE, "documento_nro": "33333333"},
                       headers=cliente_headers)
    assert resp.status_code == 403


# ── Admin: listar clientes ────────────────────────────────────────────────────

def test_admin_lista_clientes(client, auth_headers, cliente_en_db):
    resp = client.get("/clientes/", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_listar_clientes_sin_auth(client):
    resp = client.get("/clientes/")
    assert resp.status_code == 401


def test_cliente_no_puede_listar(client, cliente_headers):
    resp = client.get("/clientes/", headers=cliente_headers)
    assert resp.status_code == 403


# ── Admin: get por ID ─────────────────────────────────────────────────────────

def test_admin_obtiene_cliente_por_id(client, auth_headers, cliente_en_db):
    resp = client.get(f"/clientes/{cliente_en_db}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == cliente_en_db


def test_cliente_inexistente_404(client, auth_headers):
    resp = client.get("/clientes/99999", headers=auth_headers)
    assert resp.status_code == 404


# ── Admin: actualizar cliente ─────────────────────────────────────────────────

def test_admin_actualiza_cliente(client, auth_headers, cliente_en_db):
    resp = client.put(f"/clientes/{cliente_en_db}", json={"nombre": "Cliente Actualizado"},
                      headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["nombre"] == "Cliente Actualizado"


def test_actualizar_cliente_inexistente(client, auth_headers):
    resp = client.put("/clientes/99999", json={"nombre": "Nadie"}, headers=auth_headers)
    assert resp.status_code == 404


# ── Admin: eliminar cliente (soft delete) ─────────────────────────────────────

def test_admin_elimina_cliente(client, auth_headers, cliente_en_db):
    resp = client.delete(f"/clientes/{cliente_en_db}", headers=auth_headers)
    assert resp.status_code == 200

    # Soft delete: ya no aparece en GET
    resp2 = client.get(f"/clientes/{cliente_en_db}", headers=auth_headers)
    assert resp2.status_code == 404


# ── POST /{id}/motos — IDOR ────────────────────────────────────────────────────

def test_admin_agrega_moto_a_cualquier_cliente(client, auth_headers, cliente_en_db, modelo_en_db):
    resp = client.post(f"/clientes/{cliente_en_db}/motos", json={
        "modelo_moto_id": modelo_en_db,
        "placa": "ABC123",
        "anio": 2021,
        "color": "Rojo",
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["cliente_id"] == cliente_en_db


def test_cliente_agrega_moto_a_su_propia_cuenta(client, cliente_headers, cliente_en_db, modelo_en_db):
    resp = client.post(f"/clientes/{cliente_en_db}/motos", json={
        "modelo_moto_id": modelo_en_db,
        "placa": "XYZ789",
    }, headers=cliente_headers)
    assert resp.status_code == 201
    assert resp.json()["cliente_id"] == cliente_en_db


def test_cliente_no_puede_agregar_moto_a_otro_cliente(client, auth_headers, cliente_headers,
                                                       modelo_en_db, db_session):
    """IDOR: un cliente no puede asociar una moto a la cuenta de otro cliente."""
    from app.auth_utils import get_password_hash
    from app.models import Cliente

    # Crear segundo cliente
    c2 = Cliente(
        tipo="N", documento_tipo="CC", documento_nro="55555555",
        nombre="Otro", email="otro2@test.com",
        hashed_password=get_password_hash("otropass123"), activo=True,
    )
    db_session.add(c2)
    db_session.commit()
    db_session.refresh(c2)

    # cliente_headers pertenece al primer cliente — intenta agregar moto al segundo
    resp = client.post(f"/clientes/{c2.id}/motos", json={
        "modelo_moto_id": modelo_en_db,
    }, headers=cliente_headers)
    assert resp.status_code == 403


def test_agregar_moto_cliente_inexistente(client, auth_headers, modelo_en_db):
    resp = client.post("/clientes/99999/motos", json={"modelo_moto_id": modelo_en_db},
                       headers=auth_headers)
    assert resp.status_code == 404


# ── /me endpoints ─────────────────────────────────────────────────────────────

def test_cliente_obtiene_su_perfil(client, cliente_headers, cliente_en_db):
    resp = client.get("/clientes/me", headers=cliente_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == cliente_en_db


def test_admin_no_puede_usar_me(client, auth_headers):
    resp = client.get("/clientes/me", headers=auth_headers)
    assert resp.status_code == 403


def test_me_sin_auth(client):
    resp = client.get("/clientes/me")
    assert resp.status_code == 401


def test_cliente_obtiene_sus_pedidos(client, cliente_headers, cliente_en_db, db_session,
                                     repuesto_en_db):
    from app.models import Venta, ItemVenta

    venta = Venta(numero_factura="FAC-ME-001", usuario="admin",
                  metodo_pago="efectivo", estado="pagada", total=15.0,
                  cliente_id=cliente_en_db)
    db_session.add(venta)
    db_session.commit()

    resp = client.get("/clientes/me/pedidos", headers=cliente_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["cliente_id"] == cliente_en_db
