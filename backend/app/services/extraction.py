import pymupdf


def extract_pages(pdf_bytes: bytes) -> list[str]:
    """Return one extracted text string per page, in page order.

    Pages with no extractable text yield an empty string rather than raising.
    """
    with pymupdf.open(stream=pdf_bytes, filetype="pdf") as doc:
        return [page.get_text().strip() for page in doc]
