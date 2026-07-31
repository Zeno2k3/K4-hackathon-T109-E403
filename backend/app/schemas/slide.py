import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.slide import SlidePageStatus, SlideStatus
from app.models.term import TermSource


class PageTermOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    term_display: str
    domain_tag_display: str
    definition: str
    source: TermSource
    is_new_domain_tag: bool
    has_domain_conflict: bool
    conflict_domain_tag_display: str | None
    created_at: datetime
    updated_at: datetime


class SlidePageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    page_number: int
    extracted_text: str
    status: SlidePageStatus
    terms: list[PageTermOut]


class SlideDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    page_count: int
    status: SlideStatus
    uploaded_at: datetime
    published_at: datetime | None
    pages: list[SlidePageOut]


class SlideSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    status: SlideStatus
    page_count: int
    uploaded_at: datetime
