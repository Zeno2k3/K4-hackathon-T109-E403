"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-07-30

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

slide_status = postgresql.ENUM("processing", "reviewing", "published", "failed", name="slide_status")
slide_page_status = postgresql.ENUM("pending", "approved", name="slide_page_status")
term_source = postgresql.ENUM("db", "llm_generated", "admin_edited", "manual", name="term_source")


def upgrade() -> None:
    bind = op.get_bind()
    slide_status.create(bind, checkfirst=True)
    slide_page_status.create(bind, checkfirst=True)
    term_source.create(bind, checkfirst=True)

    op.create_table(
        "slides",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("filename", sa.Text(), nullable=False),
        sa.Column("file_path", sa.Text(), nullable=False),
        sa.Column("page_count", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM(
                "processing", "reviewing", "published", "failed", name="slide_status", create_type=False
            ),
            nullable=False,
        ),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "slide_pages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "slide_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("slides.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("extracted_text", sa.Text(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("pending", "approved", name="slide_page_status", create_type=False),
            nullable=False,
        ),
    )

    op.create_table(
        "page_terms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "slide_page_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("slide_pages.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("term_display", sa.Text(), nullable=False),
        sa.Column("domain_tag_display", sa.Text(), nullable=False),
        sa.Column("definition", sa.Text(), nullable=False),
        sa.Column(
            "source",
            postgresql.ENUM(
                "db", "llm_generated", "admin_edited", "manual", name="term_source", create_type=False
            ),
            nullable=False,
        ),
        sa.Column("is_new_domain_tag", sa.Boolean(), nullable=False),
        sa.Column("has_domain_conflict", sa.Boolean(), nullable=False),
        sa.Column("conflict_domain_tag_display", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "terms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("term_normalized", sa.Text(), nullable=False),
        sa.Column("domain_tag_normalized", sa.Text(), nullable=False),
        sa.Column("term_display", sa.Text(), nullable=False),
        sa.Column("domain_tag_display", sa.Text(), nullable=False),
        sa.Column("definition", sa.Text(), nullable=False),
        sa.Column(
            "source",
            postgresql.ENUM(
                "db", "llm_generated", "admin_edited", "manual", name="term_source", create_type=False
            ),
            nullable=False,
        ),
        sa.Column(
            "first_seen_slide_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("slides.id"), nullable=False
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("term_normalized", "domain_tag_normalized", name="uq_term_domain"),
    )

    op.create_table(
        "domain_tags",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tag_normalized", sa.Text(), nullable=False, unique=True),
        sa.Column("tag_display", sa.Text(), nullable=False),
        sa.Column(
            "first_seen_slide_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("slides.id"), nullable=False
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("domain_tags")
    op.drop_table("terms")
    op.drop_table("page_terms")
    op.drop_table("slide_pages")
    op.drop_table("slides")

    bind = op.get_bind()
    term_source.drop(bind, checkfirst=True)
    slide_page_status.drop(bind, checkfirst=True)
    slide_status.drop(bind, checkfirst=True)
