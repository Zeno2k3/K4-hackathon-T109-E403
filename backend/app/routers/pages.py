import uuid

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models.slide import SlidePage, SlidePageStatus
from app.models.term import PageTerm, TermSource
from app.schemas.page_term import PageTermCreate, PageTermUpdate
from app.schemas.slide import PageTermOut

router = APIRouter(prefix="/api/slides/{slide_id}/pages/{page_id}", tags=["pages"])


async def _get_page(slide_id: uuid.UUID, page_id: uuid.UUID, session: AsyncSession) -> SlidePage:
    result = await session.execute(
        select(SlidePage).where(SlidePage.id == page_id, SlidePage.slide_id == slide_id)
    )
    page = result.scalar_one_or_none()
    if page is None:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


async def _get_page_term(page_id: uuid.UUID, term_id: uuid.UUID, session: AsyncSession) -> PageTerm:
    result = await session.execute(
        select(PageTerm).where(PageTerm.id == term_id, PageTerm.slide_page_id == page_id)
    )
    term = result.scalar_one_or_none()
    if term is None:
        raise HTTPException(status_code=404, detail="Term not found")
    return term


@router.patch("/terms/{term_id}", response_model=PageTermOut)
async def update_term(
    slide_id: uuid.UUID,
    page_id: uuid.UUID,
    term_id: uuid.UUID,
    payload: PageTermUpdate,
    session: AsyncSession = Depends(get_session),
) -> PageTermOut:
    page = await _get_page(slide_id, page_id, session)
    term = await _get_page_term(page_id, term_id, session)

    if payload.term_display is not None:
        term.term_display = payload.term_display
    if payload.domain_tag_display is not None:
        term.domain_tag_display = payload.domain_tag_display
    if payload.definition is not None:
        term.definition = payload.definition
    term.source = TermSource.admin_edited

    if page.status == SlidePageStatus.approved:
        page.status = SlidePageStatus.pending

    await session.commit()
    await session.refresh(term)
    return PageTermOut.model_validate(term)


@router.post("/terms", response_model=PageTermOut, status_code=201)
async def add_term(
    slide_id: uuid.UUID,
    page_id: uuid.UUID,
    payload: PageTermCreate,
    session: AsyncSession = Depends(get_session),
) -> PageTermOut:
    page = await _get_page(slide_id, page_id, session)

    term = PageTerm(
        slide_page_id=page.id,
        term_display=payload.term_display,
        domain_tag_display=payload.domain_tag_display,
        definition=payload.definition,
        source=TermSource.manual,
        is_new_domain_tag=False,
        has_domain_conflict=False,
        conflict_domain_tag_display=None,
    )
    session.add(term)
    await session.commit()
    await session.refresh(term)
    return PageTermOut.model_validate(term)


@router.delete("/terms/{term_id}", status_code=204)
async def delete_term(
    slide_id: uuid.UUID,
    page_id: uuid.UUID,
    term_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
) -> Response:
    await _get_page(slide_id, page_id, session)
    term = await _get_page_term(page_id, term_id, session)

    await session.delete(term)
    await session.commit()
    return Response(status_code=204)
