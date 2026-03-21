"""widen product.picture_url for long image CDN URLs

Revision ID: c3a8e1f0b2d1
Revises: 5d1c7f9b2a4e
Create Date: 2026-03-20

"""
from alembic import op
import sqlalchemy as sa


revision = "c3a8e1f0b2d1"
down_revision = "5d1c7f9b2a4e"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    if is_sqlite:
        with op.batch_alter_table("products", schema=None) as batch_op:
            batch_op.alter_column(
                "picture_url",
                existing_type=sa.String(length=255),
                type_=sa.Text(),
                existing_nullable=True,
            )
    else:
        op.alter_column(
            "products",
            "picture_url",
            existing_type=sa.String(length=255),
            type_=sa.Text(),
            existing_nullable=True,
        )


def downgrade():
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    if is_sqlite:
        with op.batch_alter_table("products", schema=None) as batch_op:
            batch_op.alter_column(
                "picture_url",
                existing_type=sa.Text(),
                type_=sa.String(length=255),
                existing_nullable=True,
            )
    else:
        op.alter_column(
            "products",
            "picture_url",
            existing_type=sa.Text(),
            type_=sa.String(length=255),
            existing_nullable=True,
        )
