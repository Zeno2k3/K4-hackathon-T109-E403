from pathlib import Path

from app.services.extraction import extract_pages

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "sample.pdf"


def test_extract_pages_returns_one_string_per_page() -> None:
    pdf_bytes = FIXTURE_PATH.read_bytes()
    pages = extract_pages(pdf_bytes)
    assert len(pages) == 3


def test_extract_pages_extracts_real_text() -> None:
    pdf_bytes = FIXTURE_PATH.read_bytes()
    pages = extract_pages(pdf_bytes)
    assert "Transformer" in pages[0]
    assert "Attention" in pages[0]
    assert "Gradient" in pages[1]


def test_extract_pages_handles_no_extractable_text() -> None:
    pdf_bytes = FIXTURE_PATH.read_bytes()
    pages = extract_pages(pdf_bytes)
    assert pages[2] == ""
