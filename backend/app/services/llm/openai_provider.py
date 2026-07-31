"""Real TermIdentifier/TermDefiner implementation backed by the OpenAI API.

Wired in via app/services/pipeline.py's get_pipeline_service() Depends() —
no other file needs to change to swap this in for the stub.
"""

from openai import AsyncOpenAI

from app.config import settings
from app.services.llm.interface import (
    ConflictingDefinition,
    DefineResult,
    IdentifyResult,
    TermDefiner,
    TermIdentifier,
)

_IDENTIFY_SYSTEM_PROMPT = """\
TODO: instruct the model to read one slide page of text and return the
important domain-specific terms on it, each tagged with a short domain
(e.g. "AI/ML", "Electronics"). Emphasize:
- only genuinely important/technical terms, not every capitalized word
- reuse one of the provided known_domain_tags when the term clearly
  belongs to that domain, instead of inventing near-duplicate tags
- terms must be substrings/paraphrases grounded in the given page text
"""

_DEFINE_SYSTEM_PROMPT = """\
TODO: instruct the model to write a concise definition for a single term
within its given domain tag, using the page text as grounding context.
If conflicting_definition is provided (the same term already means
something different in another domain), the new definition must stay
scoped to *this* domain_tag and should not blend the two meanings.
"""

# Bước 1 của LLM: Xác định thuật ngữ trong trang slide
class OpenAITermIdentifier(TermIdentifier):
    def __init__(self, client: AsyncOpenAI | None = None, model: str | None = None) -> None:
        self._client = client or AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = model or settings.openai_model

    async def identify(self, page_text: str, known_domain_tags: list[str]) -> IdentifyResult:
        user_prompt = self._build_identify_prompt(page_text, known_domain_tags)

        # TODO: log raw request/response to the repo per backend-spec.md's R5
        # requirement, once real calls are actually happening.
        response = await self._client.beta.chat.completions.parse(
            model=self._model,
            messages=[
                {"role": "system", "content": _IDENTIFY_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format=IdentifyResult,
        )

        result = response.choices[0].message.parsed
        if result is None:
            raise ValueError("OpenAI identify() call returned no parsed result")
        return result

    def _build_identify_prompt(self, page_text: str, known_domain_tags: list[str]) -> str:
        # TODO: fill in the actual prompt template.
        return (
            f"Known domain tags: {known_domain_tags}\n\n"
            f"Page text:\n{page_text}"
        )

# Bước 2 của LLM: Generate định nghĩa cho terms
class OpenAITermDefiner(TermDefiner):
    def __init__(self, client: AsyncOpenAI | None = None, model: str | None = None) -> None:
        self._client = client or AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = model or settings.openai_model

    async def define(
        self,
        term: str,
        domain_tag: str,
        page_text: str,
        conflicting_definition: ConflictingDefinition | None = None,
    ) -> DefineResult:
        user_prompt = self._build_define_prompt(term, domain_tag, page_text, conflicting_definition)

        # TODO: log raw request/response to the repo per backend-spec.md's R5
        # requirement, once real calls are actually happening.
        response = await self._client.beta.chat.completions.parse(
            model=self._model,
            messages=[
                {"role": "system", "content": _DEFINE_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format=DefineResult,
        )

        result = response.choices[0].message.parsed
        if result is None:
            raise ValueError("OpenAI define() call returned no parsed result")
        return result

    def _build_define_prompt(
        self,
        term: str,
        domain_tag: str,
        page_text: str,
        conflicting_definition: ConflictingDefinition | None,
    ) -> str:
        # TODO: fill in the actual prompt template.
        conflict_note = ""
        if conflicting_definition is not None:
            conflict_note = (
                f"\n\nNote: this same term already has a different meaning under domain "
                f"'{conflicting_definition.domain_tag}': {conflicting_definition.definition}\n"
                f"Define it specifically for the '{domain_tag}' domain instead."
            )

        return f"Term: {term}\nDomain: {domain_tag}\n\nPage text:\n{page_text}{conflict_note}"


def get_term_identifier() -> OpenAITermIdentifier:
    return OpenAITermIdentifier()


def get_term_definer() -> OpenAITermDefiner:
    return OpenAITermDefiner()
