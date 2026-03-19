"""
Shared fixtures for the test suite.

Uses SQLite in-memory per-test so no running Postgres is required.

⚠️  PostgreSQL triggers (stock validation on ventas, total recalculation) are
    NOT present in SQLite. Tests here cover Python-layer logic only.
    For trigger coverage, run the app against a real Postgres instance.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# DATABASE_URL debe existir antes de importar app (database.py lo requiere al arrancar)
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-only-for-testing")

from app.main import app
from app.database import Base, get_db
from app.models import Categoria, UnidadMedida, Repuesto

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    from app.limiter import limiter
    limiter._storage.reset()
    yield


@pytest.fixture
def client(setup_db):
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register a test admin user and return Bearer auth headers."""
    client.post("/auth/registro", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123",
        "nombre_completo": "Test User",
        "role": "admin",
    })
    resp = client.post("/auth/token", data={
        "username": "testuser",
        "password": "testpass123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def db_session(setup_db):
    """Yields a raw DB session for direct fixture setup (bypasses API layer)."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def cliente_en_db(db_session):
    """Creates a Cliente with login credentials. Returns the cliente id."""
    from app.auth_utils import get_password_hash
    from app.models import Cliente
    c = Cliente(
        tipo="N",
        documento_tipo="CC",
        documento_nro="12345678",
        nombre="Cliente Test",
        email="cliente@test.com",
        hashed_password=get_password_hash("clientepass123"),
        activo=True,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c.id


@pytest.fixture
def cliente_headers(client, cliente_en_db):
    """Returns Bearer auth headers for the test cliente."""
    resp = client.post("/auth/token", data={
        "username": "cliente@test.com",
        "password": "clientepass123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def repuesto_en_db(setup_db):
    """Insert a test repuesto with stock=10 directly in the test DB. Returns its id."""
    session = TestingSessionLocal()
    try:
        cat = Categoria(nombre="Motor", slug="motor", activa=True)
        session.add(cat)
        session.flush()

        um = UnidadMedida(codigo="UND", nombre="Unidad")
        session.add(um)
        session.flush()

        rep = Repuesto(
            sku="BUJIA-001",
            nombre="Bujía NGK",
            categoria_id=cat.id,
            unidad_medida_id=um.id,
            precio_venta=15.0,
            stock_actual=10,
            stock_minimo=2,
            estado="activo",
        )
        session.add(rep)
        session.commit()
        return rep.id
    finally:
        session.close()
