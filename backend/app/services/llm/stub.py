import re

from app.services.llm.interface import (
    ConflictingDefinition,
    DefineResult,
    IdentifiedTerm,
    IdentifyResult,
    PageInput,
)

_CAPITALIZED_WORD = re.compile(r"\b[A-Z][a-zA-Z]{2,}\b")
_MAX_TERMS_PER_PAGE = 5


class StubTermIdentifier:
    """Deterministic placeholder — not a real LLM call.

    Picks capitalized words as "terms" and tags them with the first known
    domain tag (or "General" if none exist yet), just enough to exercise
    the pipeline end-to-end.
    """

    async def identify(self, pages: list[PageInput], known_domain_tags: list[str]) -> IdentifyResult:
        domain_tag = known_domain_tags[0] if known_domain_tags else "General"
        terms: list[IdentifiedTerm] = []
        for page in pages:
            seen: list[str] = []
            for word in _CAPITALIZED_WORD.findall(page.text):
                if word not in seen:
                    seen.append(word)
            terms.extend(
                IdentifiedTerm(page_number=page.page_number, term=word, domain_tag=domain_tag)
                for word in seen[:_MAX_TERMS_PER_PAGE]
            )
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
