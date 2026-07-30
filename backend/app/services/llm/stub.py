import re

from app.services.llm.interface import (
    ConflictingDefinition,
    DefineResult,
    IdentifiedTerm,
    IdentifyResult,
)

_CAPITALIZED_WORD = re.compile(r"\b[A-Z][a-zA-Z]{2,}\b")
_MAX_TERMS_PER_PAGE = 5


class StubTermIdentifier:
    """Deterministic placeholder — not a real LLM call.

    Picks capitalized words as "terms" and tags them with the first known
    domain tag (or "General" if none exist yet), just enough to exercise
    the pipeline end-to-end.
    """

    async def identify(self, page_text: str, known_domain_tags: list[str]) -> IdentifyResult:
        domain_tag = known_domain_tags[0] if known_domain_tags else "General"
        seen: list[str] = []
        for word in _CAPITALIZED_WORD.findall(page_text):
            if word not in seen:
                seen.append(word)
        terms = [IdentifiedTerm(term=word, domain_tag=domain_tag) for word in seen[:_MAX_TERMS_PER_PAGE]]
        return IdentifyResult(terms=terms)


class StubTermDefiner:
    """Deterministic placeholder — not a real LLM call."""

    async def define(
        self,
        term: str,
        domain_tag: str,
        page_text: str,
        conflicting_definition: ConflictingDefinition | None = None,
    ) -> DefineResult:
        return DefineResult(
            definition=f"[stub definition] {term} is a term in the '{domain_tag}' domain."
        )


def get_term_identifier() -> StubTermIdentifier:
    return StubTermIdentifier()


def get_term_definer() -> StubTermDefiner:
    return StubTermDefiner()
