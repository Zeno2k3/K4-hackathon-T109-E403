import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db import Base


class SlideStatus(str, enum.Enum):
    processing = "processing"
    reviewing = "reviewing"
    published = "published"
    failed = "failed"


class SlidePageStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"


class Slide(Base):
    __tablename__ = "slides"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SlideStatus] = mapped_column(
        Enum(SlideStatus, name="slide_status"), nullable=False, default=SlideStatus.processing
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    pages: Mapped[list["SlidePage"]] = relationship(
        back_populates="slide", cascade="all, delete-orphan", order_by="SlidePage.page_number"
    )


class SlidePage(Base):
    __tablename__ = "slide_pages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slide_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("slides.id", ondelete="CASCADE"), nullable=False
    )
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[SlidePageStatus] = mapped_column(
        Enum(SlidePageStatus, name="slide_page_status"), nullable=False, default=SlidePageStatus.pending
    )

    slide: Mapped["Slide"] = relationship(back_populates="pages")
    terms: Mapped[list["PageTerm"]] = relationship(back_populates="page", cascade="all, delete-orphan")
