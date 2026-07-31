import uuid
from pathlib import Path

import pytest
from httpx import AsyncClient

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "sample.pdf"


@pytest.mark.asyncio
async def test_upload_slide_returns_nested_payload(client: AsyncClient) -> None:
    pdf_bytes = FIXTURE_PATH.read_bytes()
    response = await client.post(
        "/api/slides",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "sample.pdf"
    assert body["status"] == "reviewing"
    assert len(body["pages"]) == 3
    assert body["pages"][0]["page_number"] == 1
    assert any(t["term_display"] == "Transformer" for t in body["pages"][0]["terms"])


@pytest.mark.asyncio
async def test_upload_slide_rejects_non_pdf(client: AsyncClient) -> None:
    response = await client.post(
        "/api/slides",
        files={"file": ("notes.txt", b"hello", "text/plain")},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_slide_returns_same_nested_shape(client: AsyncClient) -> None:
    pdf_bytes = FIXTURE_PATH.read_bytes()
    upload_response = await client.post(
        "/api/slides",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
    )
    slide_id = upload_response.json()["id"]

    get_response = await client.get(f"/api/slides/{slide_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == slide_id
    assert len(get_response.json()["pages"]) == 3


@pytest.mark.asyncio
async def test_get_slide_404_for_unknown_id(client: AsyncClient) -> None:
    response = await client.get(f"/api/slides/{uuid.uuid4()}")
    assert response.status_code == 404
