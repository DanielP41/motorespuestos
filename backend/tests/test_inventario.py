"""
Tests for inventory movements.

Stock validation in this router is done in Python, so all cases
are fully covered here without needing PostgreSQL triggers.
"""


def test_entrada_aumenta_stock(client, auth_headers, repuesto_en_db):
    resp = client.post("/inventario/", json={
        "repuesto_id": repuesto_en_db,
        "tipo": "entrada",
        "cantidad": 5,
        "notas": "Reposición de prueba",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["stock_anterior"] == 10
    assert data["stock_posterior"] == 15
    assert data["tipo"] == "entrada"


def test_ajuste_negativo_valido(client, auth_headers, repuesto_en_db):
    """Un ajuste negativo que no deja el stock en negativo debe aceptarse."""
    resp = client.post("/inventario/", json={
        "repuesto_id": repuesto_en_db,
        "tipo": "ajuste",
        "cantidad": -3,
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["stock_posterior"] == 7


def test_ajuste_negativo_deja_stock_negativo(client, auth_headers, repuesto_en_db):
    """Un ajuste que dejaría el stock negativo debe rechazarse con 400."""
    resp = client.post("/inventario/", json={
        "repuesto_id": repuesto_en_db,
        "tipo": "ajuste",
        "cantidad": -999,
    }, headers=auth_headers)
    assert resp.status_code == 400
    assert "negativo" in resp.json()["detail"]


def test_tipo_invalido(client, auth_headers, repuesto_en_db):
    resp = client.post("/inventario/", json={
        "repuesto_id": repuesto_en_db,
        "tipo": "salida",  # salida es solo via trigger de ventas
        "cantidad": 1,
    }, headers=auth_headers)
    assert resp.status_code == 400


def test_repuesto_inexistente(client, auth_headers):
    resp = client.post("/inventario/", json={
        "repuesto_id": 99999,
        "tipo": "entrada",
        "cantidad": 5,
    }, headers=auth_headers)
    assert resp.status_code == 404


def test_movimiento_requiere_auth(client, repuesto_en_db):
    resp = client.post("/inventario/", json={
        "repuesto_id": repuesto_en_db,
        "tipo": "entrada",
        "cantidad": 1,
    })
    assert resp.status_code == 401


def test_stock_critico(client, auth_headers, repuesto_en_db):
    """El repuesto de prueba tiene stock=10 y minimo=2, no debe aparecer en crítico."""
    resp = client.get("/inventario/stock-critico", headers=auth_headers)
    assert resp.status_code == 200
    ids = [r["id"] for r in resp.json()]
    assert repuesto_en_db not in ids


def test_stock_critico_sin_auth(client):
    """stock-critico requiere autenticación."""
    resp = client.get("/inventario/stock-critico")
    assert resp.status_code == 401


def test_stock_critico_aparece_cuando_bajo(client, auth_headers, repuesto_en_db):
    """Después de bajar el stock por debajo del mínimo debe aparecer en crítico."""
    # Ajuste para dejar stock en 1 (minimo es 2)
    client.post("/inventario/", json={
        "repuesto_id": repuesto_en_db,
        "tipo": "ajuste",
        "cantidad": -9,
    }, headers=auth_headers)

    resp = client.get("/inventario/stock-critico", headers=auth_headers)
    assert resp.status_code == 200
    ids = [r["id"] for r in resp.json()]
    assert repuesto_en_db in ids
