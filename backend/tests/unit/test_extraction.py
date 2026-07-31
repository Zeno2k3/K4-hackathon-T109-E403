from pathlib import Path

from app.services.extraction import extract_pages

FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "sample.pdf"
WRAPPED_TERMS_FIXTURE_PATH = Path(__file__).parent.parent / "fixtures" / "wrapped_terms_sample.pdf"


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


def test_extract_pages_rejoins_wrapped_diagram_labels() -> None:
    """Regression test for docs/ideas/wrapped-term-extraction.md.

    Real slide from the bug report: "Reactive Agent" etc. are word-wrapped
    across two lines inside narrow diagram boxes. Naive per-line extraction
    would split each into "Reactive" / "Agent", weakening them as term
    candidates for the LLM. Ground truth here is the actual reconstructed
    text from the real PDF, not a synthetic approximation.
    """
    pdf_bytes = WRAPPED_TERMS_FIXTURE_PATH.read_bytes()
    pages = extract_pages(pdf_bytes)
    page_text = pages[1]  # page 2 (0-indexed) contains the flow diagram

    assert "Rule-based Bot" in page_text
    assert "Reactive Agent" in page_text
    assert "Autonomous Agent" in page_text
    assert "LLM Chatbot" in page_text
    # multi-line captions should also rejoin, not just short box titles
    assert "If/else cứng predictable" in page_text
    assert "Dùng tools + loop quan sát theo từng bước" in page_text


def test_extract_pages_keeps_distinct_elements_on_separate_lines() -> None:
    """A box's title and the caption below it are genuinely distinct
    elements (larger vertical gap relative to line height) and must NOT be
    merged into one run-on line, even though both are short.
    """
    pdf_bytes = WRAPPED_TERMS_FIXTURE_PATH.read_bytes()
    pages = extract_pages(pdf_bytes)
    page_text = pages[1]

    assert "Reactive Agent Dùng tools" not in page_text
    assert "Rule-based Bot If/else" not in page_text
