import uuid
from pathlib import Path

import pytest
from httpx import AsyncClient

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "sample.pdf"


async def _upload_sample(client: AsyncClient) -> dict:
    pdf_bytes = FIXTURE_PATH.read_bytes()
    response = await client.post(
        "/api/slides",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
    )
    return response.json()


async def _approve_and_publish(client: AsyncClient, slide: dict) -> None:
    for page in slide["pages"]:
        await client.post(f"/api/slides/{slide['id']}/pages/{page['id']}/approve")
    response = await client.post(f"/api/slides/{slide['id']}/publish")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_list_slides_returns_summaries(client: AsyncClient) -> None:
    slide = await _upload_sample(client)

    response = await client.get("/api/slides")
    assert response.status_code == 200
    body = response.json()
    assert any(s["id"] == slide["id"] for s in body)
    listed = next(s for s in body if s["id"] == slide["id"])
    assert set(listed.keys()) == {"id", "filename", "status", "page_count", "uploaded_at"}


@pytest.mark.asyncio
async def test_get_slide_file_streams_pdf(client: AsyncClient) -> None:
    slide = await _upload_sample(client)

    response = await client.get(f"/api/slides/{slide['id']}/file")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


@pytest.mark.asyncio
async def test_get_slide_file_404_for_unknown_slide(client: AsyncClient) -> None:
    response = await client.get(f"/api/slides/{uuid.uuid4()}/file")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_learner_page_read_404_before_publish(client: AsyncClient) -> None:
    slide = await _upload_sample(client)

    response = await client.get(f"/api/slides/{slide['id']}/pages/1")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_learner_page_read_returns_terms_after_publish(client: AsyncClient) -> None:
    slide = await _upload_sample(client)
    await _approve_and_publish(client, slide)

    response = await client.get(f"/api/slides/{slide['id']}/pages/1")
    assert response.status_code == 200
    body = response.json()
    assert body["page_number"] == 1
    assert any(t["term_display"] == "Transformer" for t in body["terms"])
