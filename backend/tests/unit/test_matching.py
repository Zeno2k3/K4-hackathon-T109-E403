from app.services.matching import composite_key, find_conflicting_domain_tag, normalize


def test_normalize_lowercases_and_trims() -> None:
    assert normalize("  Transformer  ") == "transformer"


def test_normalize_strips_vietnamese_diacritics() -> None:
    assert normalize("Định nghĩa") == "dinh nghia"


def test_normalize_collapses_internal_whitespace() -> None:
    assert normalize("Machine   Learning") == "machine learning"


def test_composite_key_normalizes_both_fields() -> None:
    assert composite_key(" Transformer ", "AI/ML") == ("transformer", "ai/ml")


def test_homonym_distinct_composite_keys() -> None:
    ai_key = composite_key("Transformer", "AI/ML")
    electronics_key = composite_key("Transformer", "Electronics")
    assert ai_key != electronics_key
    assert ai_key[0] == electronics_key[0]  # same term_normalized
    assert ai_key[1] != electronics_key[1]  # different domain_tag_normalized


def test_find_conflicting_domain_tag_detects_homonym() -> None:
    existing = [("transformer", "electronics"), ("gradient descent", "ai/ml")]
    conflict = find_conflicting_domain_tag("transformer", "ai/ml", existing)
    assert conflict == "electronics"


def test_find_conflicting_domain_tag_no_conflict_for_same_domain() -> None:
    existing = [("transformer", "ai/ml")]
    assert find_conflicting_domain_tag("transformer", "ai/ml", existing) is None


def test_find_conflicting_domain_tag_no_conflict_for_unrelated_term() -> None:
    existing = [("gradient descent", "ai/ml")]
    assert find_conflicting_domain_tag("transformer", "ai/ml", existing) is None
