import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models.domain_tag import DomainTag
from app.models.slide import Slide, SlidePage, SlidePageStatus, SlideStatus
from app.models.term import Term
from app.schemas.slide import SlideDetail
from app.services.matching import composite_key
from app.services.pipeline import PipelineService, get_pipeline_service

router = APIRouter(prefix="/api/slides", tags=["slides"])


async def _get_slide_with_pages(slide_id: uuid.UUID, session: AsyncSession) -> Slide:
    result = await session.execute(
        select(Slide)
        .where(Slide.id == slide_id)
        .options(selectinload(Slide.pages).selectinload(SlidePage.terms))
    )
    slide = result.scalar_one_or_none()
    if slide is None:
        raise HTTPException(status_code=404, detail="Slide not found")
    return slide


@router.post("", response_model=SlideDetail, status_code=201)
async def upload_slide(
    file: UploadFile,
    pipeline: PipelineService = Depends(get_pipeline_service),
    session: AsyncSession = Depends(get_session),
) -> SlideDetail:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    pdf_bytes = await file.read()
    slide = await pipeline.process_upload(file.filename or "upload.pdf", pdf_bytes, session)
    return SlideDetail.model_validate(slide)


@router.get("/{slide_id}", response_model=SlideDetail)
async def get_slide(slide_id: uuid.UUID, session: AsyncSession = Depends(get_session)) -> SlideDetail:
    slide = await _get_slide_with_pages(slide_id, session)
    return SlideDetail.model_validate(slide)


@router.post("/{slide_id}/publish", response_model=SlideDetail)
async def publish_slide(slide_id: uuid.UUID, session: AsyncSession = Depends(get_session)) -> SlideDetail:
    slide = await _get_slide_with_pages(slide_id, session)

    if not slide.pages or any(page.status != SlidePageStatus.approved for page in slide.pages):
        raise HTTPException(status_code=400, detail="All pages must be approved before publishing")

    for page in slide.pages:
        for page_term in page.terms:
            term_normalized, domain_tag_normalized = composite_key(
                page_term.term_display, page_term.domain_tag_display
            )

            term_stmt = pg_insert(Term).values(
                term_normalized=term_normalized,
                domain_tag_normalized=domain_tag_normalized,
                term_display=page_term.term_display,
                domain_tag_display=page_term.domain_tag_display,
                definition=page_term.definition,
                source=page_term.source,
                first_seen_slide_id=slide.id,
            )
            term_stmt = term_stmt.on_conflict_do_update(
                index_elements=["term_normalized", "domain_tag_normalized"],
                set_={
                    "term_display": term_stmt.excluded.term_display,
                    "domain_tag_display": term_stmt.excluded.domain_tag_display,
                    "definition": term_stmt.excluded.definition,
                    "source": term_stmt.excluded.source,
                    "updated_at": datetime.now(UTC),
                },
            )
            await session.execute(term_stmt)

            tag_stmt = pg_insert(DomainTag).values(
                tag_normalized=domain_tag_normalized,
                tag_display=page_term.domain_tag_display,
                first_seen_slide_id=slide.id,
            )
            tag_stmt = tag_stmt.on_conflict_do_nothing(index_elements=["tag_normalized"])
            await session.execute(tag_stmt)

    slide.status = SlideStatus.published
    slide.published_at = datetime.now(UTC)
    await session.commit()

    slide = await _get_slide_with_pages(slide_id, session)
    return SlideDetail.model_validate(slide)
