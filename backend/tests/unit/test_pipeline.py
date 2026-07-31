import uuid
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.slide import SlideStatus
from app.models.term import Term, TermSource
from app.services.llm.interface import ConflictingDefinition, DefineResult
from app.services.llm.stub import StubTermDefiner, StubTermIdentifier
from app.services.pipeline import PipelineService

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "sample.pdf"


class SpyTermDefiner:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, ConflictingDefinition | None]] = []
        self._delegate = StubTermDefiner()

    async def define(
        self,
        term: str,
        domain_tag: str,
        page_text: str,
        conflicting_definition: ConflictingDefinition | None = None,
    ) -> DefineResult:
        self.calls.append((term, domain_tag, conflicting_definition))
        return await self._delegate.define(term, domain_tag, page_text, conflicting_definition)


@pytest.fixture
def pdf_bytes() -> bytes:
    return FIXTURE_PATH.read_bytes()


@pytest.mark.asyncio
async def test_pipeline_creates_one_slide_page_per_page(db_session: AsyncSession, pdf_bytes: bytes) -> None:
    service = PipelineService(StubTermIdentifier(), SpyTermDefiner(), uploads_dir="uploads")
    slide = await service.process_upload("sample.pdf", pdf_bytes, db_session)

    assert slide.page_count == 3
    assert len(slide.pages) == 3
    assert slide.status == SlideStatus.reviewing


@pytest.mark.asyncio
async def test_pipeline_blank_page_produces_no_terms(db_session: AsyncSession, pdf_bytes: bytes) -> None:
    service = PipelineService(StubTermIdentifier(), SpyTermDefiner(), uploads_dir="uploads")
    slide = await service.process_upload("sample.pdf", pdf_bytes, db_session)

    blank_page = next(p for p in slide.pages if p.page_number == 3)
    assert blank_page.terms == []


@pytest.mark.asyncio
async def test_pipeline_db_hit_skips_definer_call(db_session: AsyncSession, pdf_bytes: bytes) -> None:
    seed_slide_id = uuid.uuid4()
    from app.models.slide import Slide

    db_session.add(
        Slide(
            id=seed_slide_id,
            filename="seed.pdf",
            file_path="uploads/seed.pdf",
            page_count=1,
            status=SlideStatus.published,
        )
    )
    await db_session.flush()
    db_session.add(
        Term(
            term_normalized="transformer",
            domain_tag_normalized="general",
            term_display="Transformer",
            domain_tag_display="General",
            definition="Existing canonical definition.",
            source=TermSource.db,
            first_seen_slide_id=seed_slide_id,
        )
    )
    await db_session.commit()

    definer = SpyTermDefiner()
    service = PipelineService(StubTermIdentifier(), definer, uploads_dir="uploads")
    slide = await service.process_upload("sample.pdf", pdf_bytes, db_session)

    page1 = next(p for p in slide.pages if p.page_number == 1)
    transformer_term = next(t for t in page1.terms if t.term_display == "Transformer")
    assert transformer_term.source == TermSource.db
    assert transformer_term.definition == "Existing canonical definition."
    assert not any(call[0] == "Transformer" for call in definer.calls)


@pytest.mark.asyncio
async def test_pipeline_miss_calls_definer_and_sets_llm_generated(
    db_session: AsyncSession, pdf_bytes: bytes
) -> None:
    definer = SpyTermDefiner()
    service = PipelineService(StubTermIdentifier(), definer, uploads_dir="uploads")
    slide = await service.process_upload("sample.pdf", pdf_bytes, db_session)

    page1 = next(p for p in slide.pages if p.page_number == 1)
    transformer_term = next(t for t in page1.terms if t.term_display == "Transformer")
    assert transformer_term.source == TermSource.llm_generated
    assert transformer_term.is_new_domain_tag is True
    assert transformer_term.has_domain_conflict is False
    assert any(call[0] == "Transformer" for call in definer.calls)


@pytest.mark.asyncio
async def test_pipeline_domain_conflict_detected(db_session: AsyncSession, pdf_bytes: bytes) -> None:
    seed_slide_id = uuid.uuid4()
    from app.models.slide import Slide

    db_session.add(
        Slide(
            id=seed_slide_id,
            filename="seed.pdf",
            file_path="uploads/seed.pdf",
            page_count=1,
            status=SlideStatus.published,
        )
    )
    await db_session.flush()
    db_session.add(
        Term(
            term_normalized="transformer",
            domain_tag_normalized="electronics",
            term_display="Transformer",
            domain_tag_display="Electronics",
            definition="A device that transfers electrical energy.",
            source=TermSource.db,
            first_seen_slide_id=seed_slide_id,
        )
    )
    await db_session.commit()

    definer = SpyTermDefiner()
    service = PipelineService(StubTermIdentifier(), definer, uploads_dir="uploads")
    slide = await service.process_upload("sample.pdf", pdf_bytes, db_session)

    page1 = next(p for p in slide.pages if p.page_number == 1)
    transformer_term = next(t for t in page1.terms if t.term_display == "Transformer")
    assert transformer_term.source == TermSource.llm_generated
    assert transformer_term.has_domain_conflict is True
    assert transformer_term.conflict_domain_tag_display == "Electronics"

    conflict_call = next(call for call in definer.calls if call[0] == "Transformer")
    assert conflict_call[2] is not None
    assert conflict_call[2].domain_tag == "Electronics"


@pytest.mark.asyncio
async def test_pipeline_deduplicates_terms_per_page(db_session: AsyncSession) -> None:
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Transformer models use Transformer blocks and Transformer layers.")
    pdf_bytes = doc.tobytes()
    doc.close()

    service = PipelineService(StubTermIdentifier(), SpyTermDefiner(), uploads_dir="uploads")
    slide = await service.process_upload("dedup.pdf", pdf_bytes, db_session)

    page1 = slide.pages[0]
    transformer_terms = [t for t in page1.terms if t.term_display == "Transformer"]
    assert len(transformer_terms) == 1
