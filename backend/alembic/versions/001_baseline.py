"""baseline — schema already applied via init.sql

Revision ID: 001
Revises:
Create Date: 2026-03-15

This is an empty baseline migration. The full schema (tables, triggers,
views, indexes) was created by db/init.sql when the database was first
initialized. From this point forward all schema changes must be made
through Alembic migrations.
"""
from typing import Sequence, Union

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
