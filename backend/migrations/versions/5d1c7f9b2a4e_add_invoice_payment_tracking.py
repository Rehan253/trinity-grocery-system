"""add invoice payment tracking

Revision ID: 5d1c7f9b2a4e
Revises: 34d1b6a8f9c2
Create Date: 2026-02-25 15:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5d1c7f9b2a4e"
down_revision = "34d1b6a8f9c2"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    with op.batch_alter_table("invoices", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "payment_status",
                sa.String(length=30),
                nullable=False,
                server_default="unpaid",
            )
        )
        batch_op.add_column(sa.Column("paypal_order_id", sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column("paypal_capture_id", sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column("paid_at", sa.DateTime(), nullable=True))

        # SQLite batch mode can fail with CircularDependencyError for these constraints.
        if not is_sqlite:
            batch_op.create_unique_constraint(
                "uq_invoices_paypal_order_id", ["paypal_order_id"]
            )
            batch_op.create_unique_constraint(
                "uq_invoices_paypal_capture_id", ["paypal_capture_id"]
            )


def downgrade():
    bind = op.get_bind()
    is_sqlite = bind.dialect.name == "sqlite"

    with op.batch_alter_table("invoices", schema=None) as batch_op:
        if not is_sqlite:
            batch_op.drop_constraint("uq_invoices_paypal_capture_id", type_="unique")
            batch_op.drop_constraint("uq_invoices_paypal_order_id", type_="unique")
        batch_op.drop_column("paid_at")
        batch_op.drop_column("paypal_capture_id")
        batch_op.drop_column("paypal_order_id")
        batch_op.drop_column("payment_status")
