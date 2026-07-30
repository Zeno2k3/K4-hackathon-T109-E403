from typing import Protocol

from pydantic import BaseModel


class IdentifiedTerm(BaseModel):
    term: str
    domain_tag: str


class IdentifyResult(BaseModel):
    terms: list[IdentifiedTerm]


class TermIdentifier(Protocol):
    async def identify(self, page_text: str, known_domain_tags: list[str]) -> IdentifyResult: ...


class ConflictingDefinition(BaseModel):
    domain_tag: str
    definition: str


class DefineResult(BaseModel):
    definition: str


class TermDefiner(Protocol):
    async def define(
        self,
        term: str,
        domain_tag: str,
        page_text: str,
        conflicting_definition: ConflictingDefinition | None = None,
    ) -> DefineResult: ...
