import pytest

from app.services.llm.interface import PageInput
from app.services.llm.stub import StubTermDefiner, StubTermIdentifier


@pytest.mark.asyncio
async def test_identify_extracts_capitalized_words() -> None:
    identifier = StubTermIdentifier()
    pages = [PageInput(page_number=1, text="A Transformer uses Attention mechanisms.")]
    result = await identifier.identify(pages, known_domain_tags=[])
    terms = [t.term for t in result.terms]
    assert "Transformer" in terms
    assert "Attention" in terms


@pytest.mark.asyncio
async def test_identify_uses_first_known_domain_tag() -> None:
    identifier = StubTermIdentifier()
    pages = [PageInput(page_number=1, text="Transformer")]
    result = await identifier.identify(pages, known_domain_tags=["AI/ML", "Electronics"])
    assert result.terms[0].domain_tag == "AI/ML"


@pytest.mark.asyncio
async def test_identify_defaults_domain_tag_when_none_known() -> None:
    identifier = StubTermIdentifier()
    pages = [PageInput(page_number=1, text="Transformer")]
    result = await identifier.identify(pages, known_domain_tags=[])
    assert result.terms[0].domain_tag == "General"


@pytest.mark.asyncio
async def test_identify_deduplicates_terms() -> None:
    identifier = StubTermIdentifier()
    pages = [PageInput(page_number=1, text="Transformer models use Transformer blocks.")]
    result = await identifier.identify(pages, known_domain_tags=[])
    terms = [t.term for t in result.terms]
    assert terms.count("Transformer") == 1


@pytest.mark.asyncio
async def test_identify_tags_terms_with_their_page_number() -> None:
    identifier = StubTermIdentifier()
    pages = [
        PageInput(page_number=1, text="Transformer"),
        PageInput(page_number=2, text="Attention"),
    ]
    result = await identifier.identify(pages, known_domain_tags=[])
    by_term = {t.term: t.page_number for t in result.terms}
    assert by_term["Transformer"] == 1
    assert by_term["Attention"] == 2


@pytest.mark.asyncio
async def test_identify_is_deterministic() -> None:
    identifier = StubTermIdentifier()
    pages = [PageInput(page_number=1, text="Transformer Attention Encoder Decoder")]
    first = await identifier.identify(pages, known_domain_tags=[])
    second = await identifier.identify(pages, known_domain_tags=[])
    assert first == second


@pytest.mark.asyncio
async def test_define_returns_deterministic_placeholder() -> None:
    definer = StubTermDefiner()
    result = await definer.define("Transformer", "AI/ML", "some page text")
    assert "Transformer" in result.definition
    assert "AI/ML" in result.definition
