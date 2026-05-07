"""Create Phone Number Column for User

Revision ID: fcf32c6e484c
Revises: 
Create Date: 2026-04-09 12:26:27.089082

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fcf32c6e484c'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column("phone_number", sa.String(), nullable=True)
    )
    pass


def downgrade() -> None:
    op.drop_column("user","phone_number")
    pass
