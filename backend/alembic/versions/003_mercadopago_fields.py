"""venta: add mp_preference_id, mp_payment_id; metodo_pago enum += mercadopago

Revision ID: 003
Revises: 002
Create Date: 2026-03-17

Idempotente: no falla si la DB ya tiene el schema completo (instalación fresca).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect, text

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    # ── venta: mp_preference_id, mp_payment_id ────────────────────────────────
    existing_cols = {c["name"] for c in inspector.get_columns("venta")}
    if "mp_preference_id" not in existing_cols:
        op.add_column("venta", sa.Column("mp_preference_id", sa.String(), nullable=True))
    if "mp_payment_id" not in existing_cols:
        op.add_column("venta", sa.Column("mp_payment_id", sa.String(), nullable=True))

    # ── metodo_pago enum: add 'mercadopago' if not present ───────────────────
    # ALTER TYPE … ADD VALUE IF NOT EXISTS is idempotent and safe in PostgreSQL 9.1+
    bind.execute(text("ALTER TYPE metodo_pago ADD VALUE IF NOT EXISTS 'mercadopago'"))


def downgrade() -> None:
    op.drop_column("venta", "mp_payment_id")
    op.drop_column("venta", "mp_preference_id")
    # Note: removing an enum value requires recreating the type; omitted for safety.
