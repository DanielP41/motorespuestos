"""
Tests for sales registration.

⚠️  SQLite does not run the PostgreSQL triggers, so:
    - Stock is NOT decremented automatically on sale creation
    - Venta totals (subtotal, impuesto_monto) are NOT recalculated by trigger T3
    These flows must be verified against a real Postgres instance.

    What IS tested here (Python-layer):
    - 404 when repuesto doesn't exist
    - 401 without auth
    - 201 + response shape when data is valid
    - Auto-generated numero_factura
    - List and detail endpoints
"""


def test_crear_venta_exitosa(client, auth_headers, repuesto_en_db):
    resp = client.post("/ventas/", json={
        "metodo_pago": "efectivo",
        "impuesto_pct": 0,
        "items": [
            {
                "repuesto_id": repuesto_en_db,
                "cantidad": 2,
                "precio_unitario": 15.0,
                "descuento_pct": 0,
            }
        ],
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["metodo_pago"] == "efectivo"
    assert data["estado"] == "pendiente"
    assert len(data["items"]) == 1
    assert data["items"][0]["cantidad"] == 2


def test_crear_venta_genera_numero_factura(client, auth_headers, repuesto_en_db):
    resp = client.post("/ventas/", json={
        "metodo_pago": "transferencia",
        "impuesto_pct": 0,
        "items": [{"repuesto_id": repuesto_en_db, "cantidad": 1, "precio_unitario": 15.0, "descuento_pct": 0}],
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["numero_factura"].startswith("FAC-")


def test_crear_venta_numero_factura_personalizado(client, auth_headers, repuesto_en_db):
    resp = client.post("/ventas/", json={
        "numero_factura": "FAC-CUSTOM-001",
        "metodo_pago": "efectivo",
        "impuesto_pct": 0,
        "items": [{"repuesto_id": repuesto_en_db, "cantidad": 1, "precio_unitario": 15.0, "descuento_pct": 0}],
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["numero_factura"] == "FAC-CUSTOM-001"


def test_crear_venta_repuesto_inexistente(client, auth_headers):
    resp = client.post("/ventas/", json={
        "metodo_pago": "efectivo",
        "impuesto_pct": 0,
        "items": [{"repuesto_id": 99999, "cantidad": 1, "precio_unitario": 10.0, "descuento_pct": 0}],
    }, headers=auth_headers)
    assert resp.status_code == 404


def test_crear_venta_sin_auth(client, repuesto_en_db):
    resp = client.post("/ventas/", json={
        "metodo_pago": "efectivo",
        "impuesto_pct": 0,
        "items": [{"repuesto_id": repuesto_en_db, "cantidad": 1, "precio_unitario": 15.0, "descuento_pct": 0}],
    })
    assert resp.status_code == 401


def test_listar_ventas(client, auth_headers, repuesto_en_db):
    # Create two sales
    for _ in range(2):
        client.post("/ventas/", json={
            "metodo_pago": "efectivo",
            "impuesto_pct": 0,
            "items": [{"repuesto_id": repuesto_en_db, "cantidad": 1, "precio_unitario": 15.0, "descuento_pct": 0}],
        }, headers=auth_headers)

    resp = client.get("/ventas/", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_obtener_venta_por_id(client, auth_headers, repuesto_en_db):
    create_resp = client.post("/ventas/", json={
        "metodo_pago": "efectivo",
        "impuesto_pct": 0,
        "items": [{"repuesto_id": repuesto_en_db, "cantidad": 1, "precio_unitario": 15.0, "descuento_pct": 0}],
    }, headers=auth_headers)
    venta_id = create_resp.json()["id"]

    resp = client.get(f"/ventas/{venta_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == venta_id


def test_obtener_venta_inexistente(client, auth_headers):
    resp = client.get("/ventas/99999", headers=auth_headers)
    assert resp.status_code == 404
