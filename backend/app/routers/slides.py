import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_session
from app.models.slide import Slide, SlidePage
from app.schemas.slide import SlideDetail
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
