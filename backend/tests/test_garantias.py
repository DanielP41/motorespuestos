"""
Tests for the garantias router.

Covers:
- Authorization: admin vs cliente vs unauthenticated
- RBAC: clientes only see/access their own garantías
- CRUD operations
- Seguimiento (audit trail)
"""
import datetime
import pytest


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def garantia_en_db(db_session, repuesto_en_db, cliente_en_db):
    """Creates a full Garantia chain (venta → venta_detalle → garantia).
    Returns the garantia id.
    SQLite has no PG triggers, so direct inserts are safe.
    """
    from app.models import Venta, ItemVenta, Garantia

    venta = Venta(
        numero_factura="FAC-TEST-GAR-001",
        usuario="testuser",
        metodo_pago="efectivo",
        estado="pagada",
        total=15.0,
    )
    db_session.add(venta)
    db_session.flush()

    item = ItemVenta(
        venta_id=venta.id,
        repuesto_id=repuesto_en_db,
        cantidad=1,
        precio_unitario=15.0,
        subtotal=15.0,
    )
    db_session.add(item)
    db_session.flush()

    garantia = Garantia(
        venta_detalle_id=item.id,
        cliente_id=cliente_en_db,
        repuesto_id=repuesto_en_db,
        fecha_vencimiento=datetime.date.today() + datetime.timedelta(days=90),
        dias_garantia=90,
        descripcion_falla="Pieza defectuosa de prueba",
        estado="abierta",
    )
    db_session.add(garantia)
    db_session.commit()
    db_session.refresh(garantia)
    return garantia.id


# ── GET / ─────────────────────────────────────────────────────────────────────

def test_listar_garantias_sin_auth(client):
    resp = client.get("/garantias/")
    assert resp.status_code == 401


def test_admin_lista_todas_garantias(client, auth_headers, garantia_en_db):
    resp = client.get("/garantias/", headers=auth_headers)
    assert resp.status_code == 200
    ids = [g["id"] for g in resp.json()]
    assert garantia_en_db in ids


def test_cliente_solo_ve_sus_garantias(client, cliente_headers, garantia_en_db):
    resp = client.get("/garantias/", headers=cliente_headers)
    assert resp.status_code == 200
    # La garantia fue creada con cliente_en_db, que es el mismo cliente logueado
    ids = [g["id"] for g in resp.json()]
    assert garantia_en_db in ids


def test_cliente_no_ve_garantias_de_otros(client, auth_headers, db_session, repuesto_en_db):
    """Un segundo cliente no debe ver la garantía del primero."""
    from app.auth_utils import get_password_hash
    from app.models import Cliente, Venta, ItemVenta, Garantia

    # Crear segundo cliente
    c2 = Cliente(
        tipo="N", documento_tipo="CC", documento_nro="99999999",
        nombre="Otro Cliente", email="otro@test.com",
        hashed_password=get_password_hash("otropass123"), activo=True,
    )
    db_session.add(c2)
    db_session.commit()
    db_session.refresh(c2)

    # Crear garantía para el segundo cliente
    venta = Venta(numero_factura="FAC-OTRO-001", usuario="admin",
                  metodo_pago="efectivo", estado="pagada", total=15.0)
    db_session.add(venta)
    db_session.flush()
    item = ItemVenta(venta_id=venta.id, repuesto_id=repuesto_en_db,
                     cantidad=1, precio_unitario=15.0, subtotal=15.0)
    db_session.add(item)
    db_session.flush()
    g2 = Garantia(
        venta_detalle_id=item.id, cliente_id=c2.id, repuesto_id=repuesto_en_db,
        fecha_vencimiento=datetime.date.today() + datetime.timedelta(days=90),
        descripcion_falla="Falla del segundo cliente", estado="abierta",
    )
    db_session.add(g2)
    db_session.commit()
    db_session.refresh(g2)
    g2_id = g2.id

    # Login como segundo cliente
    from app.main import app
    from app.database import get_db
    resp_login = client.post("/auth/token", data={"username": "otro@test.com", "password": "otropass123"})
    token = resp_login.json()["access_token"]
    headers_c2 = {"Authorization": f"Bearer {token}"}

    # c2 solo ve su propia garantía, no la del primer cliente
    resp = client.get("/garantias/", headers=headers_c2)
    assert resp.status_code == 200
    ids = [g["id"] for g in resp.json()]
    assert g2_id in ids
    # No debe contener garantías de otros clientes (solo las de c2)
    for g in resp.json():
        assert g["cliente_id"] == c2.id


# ── GET /{id} ─────────────────────────────────────────────────────────────────

def test_admin_obtiene_garantia_por_id(client, auth_headers, garantia_en_db):
    resp = client.get(f"/garantias/{garantia_en_db}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == garantia_en_db


def test_cliente_obtiene_su_propia_garantia(client, cliente_headers, garantia_en_db):
    resp = client.get(f"/garantias/{garantia_en_db}", headers=cliente_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == garantia_en_db


def test_cliente_no_puede_ver_garantia_ajena(client, db_session, repuesto_en_db, garantia_en_db):
    """Un cliente que no es dueño de la garantía recibe 403."""
    from app.auth_utils import get_password_hash
    from app.models import Cliente

    c2 = Cliente(
        tipo="N", documento_tipo="CC", documento_nro="77777777",
        nombre="Intruso", email="intruso@test.com",
        hashed_password=get_password_hash("intropass123"), activo=True,
    )
    db_session.add(c2)
    db_session.commit()

    resp_login = client.post("/auth/token", data={"username": "intruso@test.com", "password": "intropass123"})
    token = resp_login.json()["access_token"]
    headers_intruso = {"Authorization": f"Bearer {token}"}

    resp = client.get(f"/garantias/{garantia_en_db}", headers=headers_intruso)
    assert resp.status_code == 403


def test_obtener_garantia_inexistente(client, auth_headers):
    resp = client.get("/garantias/99999", headers=auth_headers)
    assert resp.status_code == 404


# ── POST / ───────────────────────────────────────────────────────────────────

def test_admin_crea_garantia(client, auth_headers, db_session, repuesto_en_db, cliente_en_db):
    from app.models import Venta, ItemVenta

    venta = Venta(numero_factura="FAC-CREATE-001", usuario="testuser",
                  metodo_pago="efectivo", estado="pagada", total=15.0)
    db_session.add(venta)
    db_session.flush()
    item = ItemVenta(venta_id=venta.id, repuesto_id=repuesto_en_db,
                     cantidad=1, precio_unitario=15.0, subtotal=15.0)
    db_session.add(item)
    db_session.commit()

    resp = client.post("/garantias/", json={
        "venta_detalle_id": item.id,
        "cliente_id": cliente_en_db,
        "repuesto_id": repuesto_en_db,
        "fecha_vencimiento": (datetime.date.today() + datetime.timedelta(days=90)).isoformat(),
        "descripcion_falla": "No enciende",
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["descripcion_falla"] == "No enciende"
    assert data["estado"] == "abierta"


def test_cliente_no_puede_crear_garantia(client, cliente_headers, repuesto_en_db, cliente_en_db):
    resp = client.post("/garantias/", json={
        "venta_detalle_id": 1,
        "cliente_id": cliente_en_db,
        "repuesto_id": repuesto_en_db,
        "fecha_vencimiento": (datetime.date.today() + datetime.timedelta(days=90)).isoformat(),
        "descripcion_falla": "Intento no autorizado",
    }, headers=cliente_headers)
    assert resp.status_code == 403


# ── PUT /{id} ─────────────────────────────────────────────────────────────────

def test_admin_actualiza_garantia(client, auth_headers, garantia_en_db):
    resp = client.put(f"/garantias/{garantia_en_db}", json={
        "estado": "en_proceso",
        "notas_resolucion": "Revisando la pieza",
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["estado"] == "en_proceso"
    assert data["notas_resolucion"] == "Revisando la pieza"


def test_cliente_no_puede_actualizar_garantia(client, cliente_headers, garantia_en_db):
    resp = client.put(f"/garantias/{garantia_en_db}", json={"estado": "resuelta"},
                      headers=cliente_headers)
    assert resp.status_code == 403


def test_actualizar_garantia_inexistente(client, auth_headers):
    resp = client.put("/garantias/99999", json={"estado": "resuelta"}, headers=auth_headers)
    assert resp.status_code == 404


# ── POST /{id}/seguimiento ────────────────────────────────────────────────────

def test_admin_agrega_seguimiento(client, auth_headers, garantia_en_db):
    resp = client.post(f"/garantias/{garantia_en_db}/seguimiento", json={
        "descripcion": "Se contactó al cliente para revisión",
        "usuario": "testuser",
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["garantia_id"] == garantia_en_db
    assert data["descripcion"] == "Se contactó al cliente para revisión"


def test_cliente_no_puede_agregar_seguimiento(client, cliente_headers, garantia_en_db):
    resp = client.post(f"/garantias/{garantia_en_db}/seguimiento", json={
        "descripcion": "Intento no autorizado",
    }, headers=cliente_headers)
    assert resp.status_code == 403


def test_seguimiento_en_garantia_inexistente(client, auth_headers):
    resp = client.post("/garantias/99999/seguimiento", json={
        "descripcion": "No debería funcionar",
    }, headers=auth_headers)
    assert resp.status_code == 404


def test_seguimiento_aparece_en_get_garantia(client, auth_headers, garantia_en_db):
    client.post(f"/garantias/{garantia_en_db}/seguimiento", json={
        "descripcion": "Primera nota de seguimiento",
    }, headers=auth_headers)

    resp = client.get(f"/garantias/{garantia_en_db}", headers=auth_headers)
    assert resp.status_code == 200
    seguimientos = resp.json()["seguimientos"]
    assert len(seguimientos) == 1
    assert seguimientos[0]["descripcion"] == "Primera nota de seguimiento"
