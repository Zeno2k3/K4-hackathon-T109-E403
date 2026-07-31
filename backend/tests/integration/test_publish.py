from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.term import Term

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "sample.pdf"


async def _upload_sample(client: AsyncClient) -> dict:
    pdf_bytes = FIXTURE_PATH.read_bytes()
    response = await client.post(
        "/api/slides",
        files={"file": ("sample.pdf", pdf_bytes, "application/pdf")},
    )
    return response.json()


async def _approve_all_pages(client: AsyncClient, slide: dict) -> None:
    for page in slide["pages"]:
        response = await client.post(f"/api/slides/{slide['id']}/pages/{page['id']}/approve")
        assert response.status_code == 200


@pytest.mark.asyncio
async def test_approve_and_reject_toggle_page_status(client: AsyncClient) -> None:
    slide = await _upload_sample(client)
    page = slide["pages"][0]

    approve_response = await client.post(f"/api/slides/{slide['id']}/pages/{page['id']}/approve")
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "approved"

    reject_response = await client.post(f"/api/slides/{slide['id']}/pages/{page['id']}/reject")
    assert reject_response.status_code == 200
    assert reject_response.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_publish_rejects_if_any_page_not_approved(client: AsyncClient) -> None:
    slide = await _upload_sample(client)
    await client.post(f"/api/slides/{slide['id']}/pages/{slide['pages'][0]['id']}/approve")
    # remaining pages stay pending

    response = await client.post(f"/api/slides/{slide['id']}/publish")
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_publish_sets_status_and_writes_terms(client: AsyncClient) -> None:
    slide = await _upload_sample(client)
    await _approve_all_pages(client, slide)

    response = await client.post(f"/api/slides/{slide['id']}/publish")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "published"
    assert body["published_at"] is not None


@pytest.mark.asyncio
async def test_reupload_after_publish_gets_db_hit(client: AsyncClient) -> None:
    first_slide = await _upload_sample(client)
    await _approve_all_pages(client, first_slide)
    await client.post(f"/api/slides/{first_slide['id']}/publish")

    second_slide = await _upload_sample(client)
    page1 = second_slide["pages"][0]
    transformer_term = next(t for t in page1["terms"] if t["term_display"] == "Transformer")
    assert transformer_term["source"] == "db"


def _make_single_word_pdf(word: str) -> bytes:
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), word)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


async def _publish_with_domain(client: AsyncClient, filename: str, domain_tag: str) -> dict:
    pdf_bytes = _make_single_word_pdf("Transformer")
    upload_resp = await client.post("/api/slides", files={"file": (filename, pdf_bytes, "application/pdf")})
    slide = upload_resp.json()
    page = slide["pages"][0]
    term = page["terms"][0]

    await client.patch(
        f"/api/slides/{slide['id']}/pages/{page['id']}/terms/{term['id']}",
        json={"domain_tag_display": domain_tag},
    )
    await _approve_all_pages(client, slide)
    await client.post(f"/api/slides/{slide['id']}/publish")
    return slide


@pytest.mark.asyncio
async def test_domain_conflict_produces_two_distinct_terms_rows(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    await _publish_with_domain(client, "electronics.pdf", "Electronics")
    await _publish_with_domain(client, "ai.pdf", "AI/ML")

    rows = (
        (await db_session.execute(select(Term).where(Term.term_normalized == "transformer")))
        .scalars()
        .all()
    )
    assert len(rows) == 2
    domains = {row.domain_tag_normalized for row in rows}
    assert domains == {"electronics", "ai/ml"}
