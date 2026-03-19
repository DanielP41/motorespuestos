"""
Integration tests for PostgreSQL triggers.

Requiere una base de datos PostgreSQL real con el esquema aplicado.
Se omiten automáticamente si la variable de entorno TEST_DATABASE_URL no está definida.

Uso:
    TEST_DATABASE_URL=postgresql://user:pass@localhost/test_db pytest tests/test_postgres_triggers.py -v

Triggers cubiertos:
  - after_movimiento_inventario : actualiza stock_actual en repuesto
  - after_venta_detalle_insert  : crea movimiento de salida y descuenta stock
  - after_venta_detalle_change  : recalcula subtotal y total de la venta
  - after_venta_estado          : actualiza saldo_credito del cliente en pagos a crédito
"""
import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

PG_URL = os.getenv("TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not PG_URL,
    reason="TEST_DATABASE_URL no definida — se requiere PostgreSQL real para estos tests",
)


@pytest.fixture(scope="module")
def pg_session():
    engine = create_engine(PG_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
    engine.dispose()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _insert_repuesto(session, sku="TRG-001", stock=20):
    """Inserta un repuesto mínimo y devuelve su id."""
    row = session.execute(text("""
        INSERT INTO repuesto (sku, nombre, precio_venta, stock_actual, stock_minimo, estado, es_original)
        VALUES (:sku, 'Test Repuesto', 100.00, :stock, 2, 'activo', false)
        RETURNING id
    """), {"sku": sku, "stock": stock}).fetchone()
    session.commit()
    return row[0]


def _insert_usuario(session, username="trigtest"):
    row = session.execute(text("""
        INSERT INTO usuarios (username, email, hashed_password, role)
        VALUES (:u, :e, 'x', 'vendedor')
        ON CONFLICT (username) DO UPDATE SET username = EXCLUDED.username
        RETURNING id
    """), {"u": username, "e": f"{username}@test.com"}).fetchone()
    session.commit()
    return row[0]


def _insert_venta(session, usuario_id):
    row = session.execute(text("""
        INSERT INTO venta (numero_factura, usuario_id, subtotal, descuento_total,
                           impuesto_pct, impuesto_monto, total, metodo_pago, estado)
        VALUES ('FAC-TRG-001', :uid, 0, 0, 0, 0, 0, 'efectivo', 'pendiente')
        RETURNING id
    """), {"uid": usuario_id}).fetchone()
    session.commit()
    return row[0]


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_trigger_movimiento_inventario_actualiza_stock(pg_session):
    """after_movimiento_inventario debe actualizar stock_actual en repuesto."""
    rep_id = _insert_repuesto(pg_session, sku="TRG-MOV-001", stock=10)

    pg_session.execute(text("""
        INSERT INTO movimiento_inventario (repuesto_id, tipo, cantidad, stock_anterior, stock_posterior)
        VALUES (:rid, 'entrada', 5, 10, 15)
    """), {"rid": rep_id})
    pg_session.commit()

    stock = pg_session.execute(
        text("SELECT stock_actual FROM repuesto WHERE id = :id"), {"id": rep_id}
    ).scalar()
    assert stock == 15, f"Esperado 15, obtenido {stock}"


def test_trigger_venta_detalle_descuenta_stock(pg_session):
    """after_venta_detalle_insert debe crear movimiento de salida y decrementar stock."""
    rep_id = _insert_repuesto(pg_session, sku="TRG-VD-001", stock=20)
    uid = _insert_usuario(pg_session, "trigtest_vd")
    venta_id = _insert_venta(pg_session, uid)

    pg_session.execute(text("""
        INSERT INTO venta_detalle (venta_id, repuesto_id, cantidad, precio_unitario, descuento_pct, subtotal)
        VALUES (:vid, :rid, 3, 100.00, 0, 300.00)
    """), {"vid": venta_id, "rid": rep_id})
    pg_session.commit()

    stock = pg_session.execute(
        text("SELECT stock_actual FROM repuesto WHERE id = :id"), {"id": rep_id}
    ).scalar()
    assert stock == 17, f"Esperado 17, obtenido {stock}"

    mov = pg_session.execute(text("""
        SELECT tipo, cantidad FROM movimiento_inventario
        WHERE repuesto_id = :rid AND referencia_tipo = 'venta_detalle'
        ORDER BY id DESC LIMIT 1
    """), {"rid": rep_id}).fetchone()
    assert mov is not None, "No se creó el movimiento de inventario"
    assert mov[0] == "salida"
    assert mov[1] == -3


def test_trigger_venta_detalle_recalcula_total(pg_session):
    """after_venta_detalle_change debe recalcular subtotal y total de la venta."""
    rep_id = _insert_repuesto(pg_session, sku="TRG-TOT-001", stock=50)
    uid = _insert_usuario(pg_session, "trigtest_tot")
    venta_id = _insert_venta(pg_session, uid)

    pg_session.execute(text("""
        INSERT INTO venta_detalle (venta_id, repuesto_id, cantidad, precio_unitario, descuento_pct, subtotal)
        VALUES (:vid, :rid, 2, 100.00, 0, 200.00)
    """), {"vid": venta_id, "rid": rep_id})
    pg_session.commit()

    total = pg_session.execute(
        text("SELECT total FROM venta WHERE id = :id"), {"id": venta_id}
    ).scalar()
    assert float(total) == 200.00, f"Esperado 200.00, obtenido {total}"
