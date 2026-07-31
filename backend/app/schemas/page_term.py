from pydantic import BaseModel


class PageTermUpdate(BaseModel):
    term_display: str | None = None
    domain_tag_display: str | None = None
    definition: str | None = None


class PageTermCreate(BaseModel):
    term_display: str
    domain_tag_display: str
    definition: str
