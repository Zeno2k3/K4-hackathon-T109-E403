import uuid
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.slide import SlidePage, SlidePageStatus

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "sample.pdf"


async def _upload_sample(client: AsyncClient) -> dict:
    pdf_bytes = FIXTURE_PATH.read_bytes()
    response = await client.post(
        "/api/slides",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
    )
    return response.json()


@pytest.mark.asyncio
async def test_patch_term_updates_fields_and_sets_admin_edited(client: AsyncClient) -> None:
    slide = await _upload_sample(client)
    page = slide["pages"][0]
    term = page["terms"][0]

    response = await client.patch(
        f"/api/slides/{slide['id']}/pages/{page['id']}/terms/{term['id']}",
        json={"definition": "A corrected definition."},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["definition"] == "A corrected definition."
    assert body["source"] == "admin_edited"


@pytest.mark.asyncio
async def test_patch_term_reverts_approved_page_to_pending(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    slide = await _upload_sample(client)
    page = slide["pages"][0]
    term = page["terms"][0]

    db_page = (
        await db_session.execute(select(SlidePage).where(SlidePage.id == uuid.UUID(page["id"])))
    ).scalar_one()
    db_page.status = SlidePageStatus.approved
    await db_session.commit()

    response = await client.patch(
        f"/api/slides/{slide['id']}/pages/{page['id']}/terms/{term['id']}",
        json={"definition": "Edited after approval."},
    )
    assert response.status_code == 200

    slide_response = await client.get(f"/api/slides/{slide['id']}")
    patched_page = next(p for p in slide_response.json()["pages"] if p["id"] == page["id"])
    assert patched_page["status"] == "pending"


@pytest.mark.asyncio
async def test_post_term_creates_manual_term(client: AsyncClient) -> None:
    slide = await _upload_sample(client)
    page = slide["pages"][0]

    response = await client.post(
        f"/api/slides/{slide['id']}/pages/{page['id']}/terms",
        json={
            "term_display": "Backpropagation",
            "domain_tag_display": "AI/ML",
            "definition": "An algorithm for training neural networks.",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["source"] == "manual"
    assert body["term_display"] == "Backpropagation"


@pytest.mark.asyncio
async def test_delete_term_removes_it(client: AsyncClient) -> None:
    slide = await _upload_sample(client)
    page = slide["pages"][0]
    term = page["terms"][0]

    response = await client.delete(f"/api/slides/{slide['id']}/pages/{page['id']}/terms/{term['id']}")
    assert response.status_code == 204

    slide_response = await client.get(f"/api/slides/{slide['id']}")
    patched_page = next(p for p in slide_response.json()["pages"] if p["id"] == page["id"])
    assert term["id"] not in [t["id"] for t in patched_page["terms"]]


@pytest.mark.asyncio
async def test_patch_term_404_for_unknown_term(client: AsyncClient) -> None:
    slide = await _upload_sample(client)
    page = slide["pages"][0]

    response = await client.patch(
        f"/api/slides/{slide['id']}/pages/{page['id']}/terms/{uuid.uuid4()}",
        json={"definition": "x"},
    )
    assert response.status_code == 404
