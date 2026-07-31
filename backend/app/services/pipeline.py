import uuid
from pathlib import Path

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.domain_tag import DomainTag
from app.models.slide import Slide, SlidePage, SlidePageStatus, SlideStatus
from app.models.term import PageTerm, Term, TermSource
from app.services.extraction import extract_pages
from app.services.llm.interface import ConflictingDefinition, PageInput, TermDefiner, TermIdentifier
from app.services.llm.openai_provider import get_term_identifier
from app.services.llm.stub import get_term_definer
from app.services.matching import composite_key, find_conflicting_domain_tag

_IDENTIFY_BATCH_SIZE = 10


class PipelineService:
    def __init__(self, identifier: TermIdentifier, definer: TermDefiner, uploads_dir: str) -> None:
        self.identifier = identifier
        self.definer = definer
        self.uploads_dir = Path(uploads_dir)

    async def process_upload(self, filename: str, pdf_bytes: bytes, session: AsyncSession) -> Slide:
        slide_id = uuid.uuid4()
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        file_path = self.uploads_dir / f"{slide_id}.pdf"
        file_path.write_bytes(pdf_bytes)

        pages_text = extract_pages(pdf_bytes)

        slide = Slide(
            id=slide_id,
            filename=filename,
            file_path=str(file_path),
            page_count=len(pages_text),
            status=SlideStatus.processing,
        )
        session.add(slide)
        await session.flush()

        slide_pages: list[SlidePage] = []
        for page_number, text in enumerate(pages_text, start=1):
            slide_page = SlidePage(
                slide_id=slide.id,
                page_number=page_number,
                extracted_text=text,
                status=SlidePageStatus.pending,
            )
            session.add(slide_page)
            slide_pages.append(slide_page)
        await session.flush()

        for batch_start in range(0, len(slide_pages), _IDENTIFY_BATCH_SIZE):
            batch = slide_pages[batch_start : batch_start + _IDENTIFY_BATCH_SIZE]
            await self._process_batch(session, batch)

        slide.status = SlideStatus.reviewing
        await session.commit()
        await session.refresh(slide, attribute_names=["pages"])
        for page in slide.pages:
            await session.refresh(page, attribute_names=["terms"])
        return slide

    async def _process_batch(self, session: AsyncSession, batch: list[SlidePage]) -> None:
        known_domain_tags = await self._known_domain_tag_displays(session)
        known_domain_tags_normalized = {t.tag_normalized for t in (await self._all_domain_tags(session))}

        pages_by_number = {slide_page.page_number: slide_page for slide_page in batch}
        pages_input = [
            PageInput(page_number=slide_page.page_number, text=slide_page.extracted_text)
            for slide_page in batch
        ]
        identify_result = await self.identifier.identify(pages_input, known_domain_tags)

        seen_keys_per_page: dict[int, set[tuple[str, str]]] = {}
        for identified in identify_result.terms:
            slide_page = pages_by_number.get(identified.page_number)
            if slide_page is None:
                continue

            seen_keys = seen_keys_per_page.setdefault(identified.page_number, set())
            key = composite_key(identified.term, identified.domain_tag)
            if key in seen_keys:
                continue
            seen_keys.add(key)
            term_normalized, domain_tag_normalized = key

            existing_rows = (
                (await session.execute(select(Term).where(Term.term_normalized == term_normalized)))
                .scalars()
                .all()
            )
            hit = next((r for r in existing_rows if r.domain_tag_normalized == domain_tag_normalized), None)

            if hit is not None:
                page_term = PageTerm(
                    slide_page_id=slide_page.id,
                    term_display=identified.term,
                    domain_tag_display=identified.domain_tag,
                    definition=hit.definition,
                    source=TermSource.db,
                    is_new_domain_tag=False,
                    has_domain_conflict=False,
                    conflict_domain_tag_display=None,
                )
                session.add(page_term)
                continue

            existing_keys = [(r.term_normalized, r.domain_tag_normalized) for r in existing_rows]
            conflict_domain_normalized = find_conflicting_domain_tag(
                term_normalized, domain_tag_normalized, existing_keys
            )
            conflicting_definition = None
            conflict_domain_tag_display = None
            if conflict_domain_normalized is not None:
                conflict_row = next(
                    r for r in existing_rows if r.domain_tag_normalized == conflict_domain_normalized
                )
                conflicting_definition = ConflictingDefinition(
                    domain_tag=conflict_row.domain_tag_display, definition=conflict_row.definition
                )
                conflict_domain_tag_display = conflict_row.domain_tag_display

            define_result = await self.definer.define(
                identified.term, identified.domain_tag, slide_page.extracted_text, conflicting_definition
            )

            page_term = PageTerm(
                slide_page_id=slide_page.id,
                term_display=identified.term,
                domain_tag_display=identified.domain_tag,
                definition=define_result.definition,
                source=TermSource.llm_generated,
                is_new_domain_tag=domain_tag_normalized not in known_domain_tags_normalized,
                has_domain_conflict=conflict_domain_normalized is not None,
                conflict_domain_tag_display=conflict_domain_tag_display,
            )
            session.add(page_term)

    async def _all_domain_tags(self, session: AsyncSession) -> list[DomainTag]:
        return list((await session.execute(select(DomainTag))).scalars().all())

    async def _known_domain_tag_displays(self, session: AsyncSession) -> list[str]:
        return [t.tag_display for t in await self._all_domain_tags(session)]


def get_pipeline_service(
    identifier: TermIdentifier = Depends(get_term_identifier),
    definer: TermDefiner = Depends(get_term_definer),
) -> PipelineService:
    return PipelineService(identifier=identifier, definer=definer, uploads_dir=settings.uploads_dir)
