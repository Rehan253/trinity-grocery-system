"""add product barcode

Revision ID: 34d1b6a8f9c2
Revises: e7f33e1e9113
Create Date: 2026-02-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "34d1b6a8f9c2"
down_revision = "e7f33e1e9113"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("products", schema=None) as batch_op:
        batch_op.add_column(sa.Column("barcode", sa.String(length=64), nullable=True))
        batch_op.create_unique_constraint("uq_products_barcode", ["barcode"])


def downgrade():
    with op.batch_alter_table("products", schema=None) as batch_op:
        batch_op.drop_constraint("uq_products_barcode", type_="unique")
        batch_op.drop_column("barcode")
