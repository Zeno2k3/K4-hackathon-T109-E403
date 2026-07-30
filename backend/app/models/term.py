import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db import Base


class TermSource(str, enum.Enum):
    db = "db"
    llm_generated = "llm_generated"
    admin_edited = "admin_edited"
    manual = "manual"


class PageTerm(Base):
    __tablename__ = "page_terms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slide_page_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("slide_pages.id", ondelete="CASCADE"), nullable=False
    )
    term_display: Mapped[str] = mapped_column(Text, nullable=False)
    domain_tag_display: Mapped[str] = mapped_column(Text, nullable=False)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[TermSource] = mapped_column(Enum(TermSource, name="term_source"), nullable=False)
    is_new_domain_tag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_domain_conflict: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    conflict_domain_tag_display: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    page: Mapped["SlidePage"] = relationship(back_populates="terms")  # noqa: F821


class Term(Base):
    __tablename__ = "terms"
    __table_args__ = (
        UniqueConstraint("term_normalized", "domain_tag_normalized", name="uq_term_domain"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    term_normalized: Mapped[str] = mapped_column(Text, nullable=False)
    domain_tag_normalized: Mapped[str] = mapped_column(Text, nullable=False)
    term_display: Mapped[str] = mapped_column(Text, nullable=False)
    domain_tag_display: Mapped[str] = mapped_column(Text, nullable=False)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[TermSource] = mapped_column(Enum(TermSource, name="term_source"), nullable=False)
    first_seen_slide_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("slides.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )
