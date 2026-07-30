import unicodedata


def normalize(text: str) -> str:
    """Lowercase, trim, and strip accents/diacritics (including Vietnamese)."""
    stripped = "".join(
        char for char in unicodedata.normalize("NFD", text) if unicodedata.category(char) != "Mn"
    )
    # NFD decomposition doesn't fully decompose Vietnamese đ/Đ into a base + combining mark.
    stripped = stripped.replace("đ", "d").replace("Đ", "D")
    return " ".join(stripped.lower().strip().split())


def composite_key(term: str, domain_tag: str) -> tuple[str, str]:
    return normalize(term), normalize(domain_tag)


def find_conflicting_domain_tag(
    term_normalized: str,
    domain_tag_normalized: str,
    existing_keys: list[tuple[str, str]],
) -> str | None:
    """Return the other domain_tag_normalized this term exists under, if any."""
    for existing_term, existing_domain in existing_keys:
        if existing_term == term_normalized and existing_domain != domain_tag_normalized:
            return existing_domain
    return None
