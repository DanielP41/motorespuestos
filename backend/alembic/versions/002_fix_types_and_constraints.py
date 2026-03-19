"""fix types and constraints — Float→NUMERIC, cliente email unique

Revision ID: 002
Revises: 001
Create Date: 2026-03-16

Versiona los cambios de db/patch_002.sql:
- cliente.email → UNIQUE + índice
- Columnas monetarias Float → NUMERIC(14,2)

Idempotente: no falla si la DB ya tiene el schema completo (instalación fresca).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    # ── cliente: email UNIQUE + índice ────────────────────────────────────────
    existing_uc = {c["name"] for c in inspector.get_unique_constraints("cliente")}
    if "cliente_email_unique" not in existing_uc:
        op.create_unique_constraint("cliente_email_unique", "cliente", ["email"])

    existing_idx = {i["name"] for i in inspector.get_indexes("cliente")}
    if "idx_cliente_email" not in existing_idx:
        op.create_index("idx_cliente_email", "cliente", ["email"])

    # ── Type changes: safe no-ops when column already is the target type ──────
    # PostgreSQL allows ALTER COLUMN TYPE to the same type without error.

    # cliente: monetarias
    op.alter_column("cliente", "limite_credito", type_=sa.Numeric(14, 2), existing_nullable=True)
    op.alter_column("cliente", "saldo_credito",  type_=sa.Numeric(14, 2), existing_nullable=True)

    # repuesto: monetarias
    op.alter_column("repuesto", "precio_compra",    type_=sa.Numeric(14, 2), existing_nullable=True)
    op.alter_column("repuesto", "precio_venta",     type_=sa.Numeric(14, 2), existing_nullable=False)
    op.alter_column("repuesto", "precio_venta_min", type_=sa.Numeric(14, 2), existing_nullable=True)

    # movimiento_inventario: monetarias
    op.alter_column("movimiento_inventario", "costo_unitario", type_=sa.Numeric(14, 2), existing_nullable=True)

    # venta: monetarias
    op.alter_column("venta", "subtotal",        type_=sa.Numeric(14, 2), existing_nullable=False)
    op.alter_column("venta", "descuento_total", type_=sa.Numeric(14, 2), existing_nullable=False)
    op.alter_column("venta", "impuesto_pct",    type_=sa.Numeric(5,  2), existing_nullable=False)
    op.alter_column("venta", "impuesto_monto",  type_=sa.Numeric(14, 2), existing_nullable=False)
    op.alter_column("venta", "total",           type_=sa.Numeric(14, 2), existing_nullable=False)

    # venta_detalle: monetarias
    op.alter_column("venta_detalle", "precio_unitario", type_=sa.Numeric(14, 2), existing_nullable=False)
    op.alter_column("venta_detalle", "descuento_pct",   type_=sa.Numeric(5,  2), existing_nullable=False)
    op.alter_column("venta_detalle", "subtotal",        type_=sa.Numeric(14, 2), existing_nullable=False)
    op.alter_column("venta_detalle", "costo_unitario",  type_=sa.Numeric(14, 2), existing_nullable=True)


def downgrade() -> None:
    op.drop_index("idx_cliente_email", table_name="cliente")
    op.drop_constraint("cliente_email_unique", "cliente", type_="unique")

    # Revert monetarias a Float (DOUBLE PRECISION en PostgreSQL)
    for table, col in [
        ("cliente", "limite_credito"), ("cliente", "saldo_credito"),
        ("repuesto", "precio_compra"), ("repuesto", "precio_venta"), ("repuesto", "precio_venta_min"),
        ("movimiento_inventario", "costo_unitario"),
        ("venta", "subtotal"), ("venta", "descuento_total"), ("venta", "impuesto_pct"),
        ("venta", "impuesto_monto"), ("venta", "total"),
        ("venta_detalle", "precio_unitario"), ("venta_detalle", "descuento_pct"),
        ("venta_detalle", "subtotal"), ("venta_detalle", "costo_unitario"),
    ]:
        op.alter_column(table, col, type_=sa.Float(), existing_nullable=True)
