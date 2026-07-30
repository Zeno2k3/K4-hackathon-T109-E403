import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db import Base


class DomainTag(Base):
    __tablename__ = "domain_tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tag_normalized: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    tag_display: Mapped[str] = mapped_column(Text, nullable=False)
    first_seen_slide_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("slides.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
