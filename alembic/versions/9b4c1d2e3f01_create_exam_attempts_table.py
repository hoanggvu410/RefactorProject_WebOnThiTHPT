"""create exam attempts table

Revision ID: 9b4c1d2e3f01
Revises: 46af5f16aae7
Create Date: 2026-07-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9b4c1d2e3f01"
down_revision: Union[str, None] = "46af5f16aae7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exam_attempts",
        sa.Column("attempt_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("exam_id", sa.Integer(), nullable=False),
        sa.Column("result_id", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("answers_json", sa.JSON(), nullable=False),
        sa.Column("current_question_id", sa.Integer(), nullable=True),
        sa.Column("started_at", sa.DateTime(), server_default=sa.text("now()"), nullable=False),
        sa.Column("deadline_at", sa.DateTime(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
        sa.Column("uuid", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["current_question_id"], ["questions.question_id"]),
        sa.ForeignKeyConstraint(["exam_id"], ["exams.exam_id"]),
        sa.ForeignKeyConstraint(["result_id"], ["results.result_id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"]),
        sa.PrimaryKeyConstraint("attempt_id"),
        sa.UniqueConstraint("uuid"),
    )
    op.create_index("ix_exam_attempts_user_id", "exam_attempts", ["user_id"])
    op.create_index("ix_exam_attempts_exam_id", "exam_attempts", ["exam_id"])
    op.create_index("ix_exam_attempts_status", "exam_attempts", ["status"])
    op.create_index(
        "ix_exam_attempts_user_exam_status",
        "exam_attempts",
        ["user_id", "exam_id", "status"],
    )


def downgrade() -> None:
    op.drop_index("ix_exam_attempts_user_exam_status", table_name="exam_attempts")
    op.drop_index("ix_exam_attempts_status", table_name="exam_attempts")
    op.drop_index("ix_exam_attempts_exam_id", table_name="exam_attempts")
    op.drop_index("ix_exam_attempts_user_id", table_name="exam_attempts")
    op.drop_table("exam_attempts")
