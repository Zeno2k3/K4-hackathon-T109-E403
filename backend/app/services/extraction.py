import pymupdf

_WRAP_GAP_RATIO_THRESHOLD = 0.8


def extract_pages(pdf_bytes: bytes) -> list[str]:
    """Return one extracted text string per page, in page order.

    Pages with no extractable text yield an empty string rather than raising.

    Uses line-level geometry (not PyMuPDF's own block grouping, which is
    inconsistent — see docs/ideas/wrapped-term-extraction.md) to rejoin a
    single visually-wrapped label or sentence that PDF text extraction would
    otherwise split across multiple lines, e.g. "Reactive Agent" wrapped
    across two lines inside a narrow diagram box. Consecutive lines are
    merged with a space when the vertical gap between them is small relative
    to line height AND they horizontally overlap; otherwise the line break
    is preserved.
    """
    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        return [_extract_page_text(page) for page in doc]


def _extract_page_text(page: pymupdf.Page) -> str:
    lines = _page_lines(page)
    if not lines:
        return ""

    parts: list[str] = [lines[0][4]]
    for previous, current in zip(lines, lines[1:]):
        if _is_wrap_continuation(previous, current):
            parts.append(" ")
        else:
            parts.append("\n")
        parts.append(current[4])

    return "".join(parts).strip()


def _page_lines(page: pymupdf.Page) -> list[tuple[float, float, float, float, str]]:
    lines: list[tuple[float, float, float, float, str]] = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            x0, y0, x1, y1 = line["bbox"]
            text = "".join(span["text"] for span in line["spans"]).strip()
            if text:
                lines.append((x0, y0, x1, y1, text))
    return lines


def _is_wrap_continuation(
    previous: tuple[float, float, float, float, str],
    current: tuple[float, float, float, float, str],
) -> bool:
    x0a, y0a, x1a, y1a, _ = previous
    x0b, y0b, x1b, _, _ = current

    height = y1a - y0a
    if height <= 0:
        return False

    vertical_gap = y0b - y1a
    horizontal_overlap = min(x1a, x1b) - max(x0a, x0b)

    return horizontal_overlap > 0 and (vertical_gap / height) < _WRAP_GAP_RATIO_THRESHOLD
