"""usuarios/cliente: add token_invalidated_at and password reset columns

Revision ID: 004
Revises: 003
Create Date: 2026-03-17

Versiona los cambios de db/patch_003.sql:
- usuarios: token_invalidated_at, password_reset_token, password_reset_expires
- cliente: token_invalidated_at, password_reset_token, password_reset_expires
- Índices para búsqueda por reset token

Idempotente: no falla si la DB ya tiene el schema completo (instalación fresca).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect as sa_inspect

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa_inspect(bind)

    # ── usuarios ──────────────────────────────────────────────────────────────
    usuarios_cols = {c["name"] for c in inspector.get_columns("usuarios")}
    if "token_invalidated_at" not in usuarios_cols:
        op.add_column("usuarios", sa.Column(
            "token_invalidated_at", sa.DateTime(timezone=True), nullable=True))
    if "password_reset_token" not in usuarios_cols:
        op.add_column("usuarios", sa.Column(
            "password_reset_token", sa.String(100), nullable=True))
    if "password_reset_expires" not in usuarios_cols:
        op.add_column("usuarios", sa.Column(
            "password_reset_expires", sa.DateTime(timezone=True), nullable=True))

    # ── cliente ───────────────────────────────────────────────────────────────
    cliente_cols = {c["name"] for c in inspector.get_columns("cliente")}
    if "token_invalidated_at" not in cliente_cols:
        op.add_column("cliente", sa.Column(
            "token_invalidated_at", sa.DateTime(timezone=True), nullable=True))
    if "password_reset_token" not in cliente_cols:
        op.add_column("cliente", sa.Column(
            "password_reset_token", sa.String(100), nullable=True))
    if "password_reset_expires" not in cliente_cols:
        op.add_column("cliente", sa.Column(
            "password_reset_expires", sa.DateTime(timezone=True), nullable=True))

    # ── Índices ───────────────────────────────────────────────────────────────
    usuarios_idx = {i["name"] for i in inspector.get_indexes("usuarios")}
    if "idx_usuarios_reset_token" not in usuarios_idx:
        op.create_index("idx_usuarios_reset_token", "usuarios", ["password_reset_token"])

    cliente_idx = {i["name"] for i in inspector.get_indexes("cliente")}
    if "idx_cliente_reset_token" not in cliente_idx:
        op.create_index("idx_cliente_reset_token", "cliente", ["password_reset_token"])


def downgrade() -> None:
    op.drop_index("idx_cliente_reset_token", table_name="cliente")
    op.drop_index("idx_usuarios_reset_token", table_name="usuarios")
    for col in ("password_reset_expires", "password_reset_token", "token_invalidated_at"):
        op.drop_column("cliente", col)
        op.drop_column("usuarios", col)
