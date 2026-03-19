"""
Script para crear el usuario administrador inicial.

Uso:
    cd backend
    python -m app.scripts.create_admin

Variables de entorno requeridas (en .env):
    ADMIN_INIT_PASSWORD  — contraseña del admin (obligatorio)
    ADMIN_USERNAME       — por defecto: admin
    ADMIN_EMAIL          — por defecto: admin@motorespuestos.com
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

password = os.getenv("ADMIN_INIT_PASSWORD")
if not password:
    print("ERROR: Define ADMIN_INIT_PASSWORD en el archivo .env")
    sys.exit(1)

username = os.getenv("ADMIN_USERNAME", "admin")
email = os.getenv("ADMIN_EMAIL", "admin@motorespuestos.com")

# Import after env is loaded so DATABASE_URL is available
from ..database import SessionLocal
from ..models import User
from ..auth_utils import get_password_hash

db = SessionLocal()
try:
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        print(f"El usuario '{username}' ya existe. Omitiendo.")
        sys.exit(0)

    admin = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        nombre_completo="Administrador Principal",
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print(f"✓ Usuario admin '{username}' creado correctamente.")
finally:
    db.close()
