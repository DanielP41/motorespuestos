import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

load_dotenv()

# Alembic Config object — gives access to values in alembic.ini
config = context.config

# Override sqlalchemy.url from environment variable
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import all models so Alembic can detect schema changes automatically
from app.models import (  # noqa: F401
    Base,
    User,
    MarcaMoto,
    ModeloMoto,
    Categoria,
    UnidadMedida,
    Cliente,
    ClienteMoto,
    Repuesto,
    MovimientoInventario,
    Venta,
    ItemVenta,
    Garantia,
    GarantiaSeguimiento,
)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations without a live DB connection (generates SQL script)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
