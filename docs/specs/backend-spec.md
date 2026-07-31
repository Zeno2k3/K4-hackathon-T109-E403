# Spec: Backend — Glossary DB-First Definition Lookup

Builds on [docs/ideas/glossary-db-first-idea.md](../ideas/glossary-db-first-idea.md) — read that first for the product design, the DB-first / domain-tag rationale, and the LLM call I/O contracts. This spec is the backend-only implementation plan: API, data model, pipeline orchestration, LLM-call interface (not implementation), and Docker setup. A separate frontend spec covers the Next.js/Tailwind UI.

## Objective

Give the admin-upload flow shown in `mock-ui/admin/` (upload → pipeline → HITL review → publish) a real backend: extract text from an uploaded PDF, identify important terms per page via LLM, resolve each term's definition from a shared Postgres glossary when possible (falling back to LLM generation only for genuinely new terms), let the admin review/edit/approve per page, and publish — writing approved terms back into the shared glossary and persisting the source PDF so a future learner-facing view can open it with terms already resolved.

User: a single admin (no auth in this MVP). Success: the mock UI's exact flow works against real endpoints, with two real LLM calls per page as required by the hackathon rubric (CP3/R5), and the uploaded PDF remains durably retrievable after publish.

## Tech Stack

- Python 3.12, FastAPI (async)
- SQLAlchemy 2.0 (async engine, `asyncpg` driver), Alembic for migrations
- Pydantic v2 for request/response schemas
- Postgres 16
- PyMuPDF (`pymupdf`) for PDF text extraction — no OCR engine, decks are native digital PDFs
- pytest + pytest-asyncio + httpx `AsyncClient` for tests
- Docker + Docker Compose for local run and deployment

## Commands

```
Dev (with Docker):     docker compose up --build
Dev (local, no Docker): uvicorn app.main:app --reload
Migrate:                docker compose exec api alembic upgrade head
New migration:          docker compose exec api alembic revision --autogenerate -m "message"
Test:                   docker compose exec api pytest
Lint/format:             docker compose exec api ruff check . && ruff format .
```

## Project Structure

```
backend/
  app/
    main.py              → FastAPI app instance, router registration
    config.py             → settings (env vars via pydantic-settings)
    db.py                  → async engine/session setup
    models/                → SQLAlchemy ORM models (slide.py, term.py, domain_tag.py)
    schemas/                → Pydantic request/response models
    routers/
      slides.py             → upload, list, get, file-serving, publish endpoints
      pages.py               → per-page term edit/add/delete/approve endpoints
    services/
      extraction.py          → PDF text extraction (PyMuPDF)
      pipeline.py             → orchestrates extract → identify → lookup → define → aggregate
      matching.py              → normalization + composite-key lookup logic
      llm/
        interface.py           → TermIdentifier / TermDefiner Protocols + Pydantic I/O models
        stub.py                 → stub implementation (not real LLM calls — placeholder)
    alembic/                    → migration scripts
  tests/
    unit/                       → matching/normalization logic, pipeline logic with stub LLM
    integration/                 → endpoint tests against a test Postgres DB
  eval/                          → golden-set runner script + golden_set.json (hackathon rubric R4)
  uploads/                       → local dev fallback dir (gitignored; real persistence is the Docker volume)
  Dockerfile
  entrypoint.sh                  → waits for DB, runs `alembic upgrade head`, then `exec uvicorn`
  .env.example
  requirements.txt (or pyproject.toml)
```

## Code Style

Type-hinted, async endpoints, Pydantic models for every request/response boundary — never return raw ORM objects. Example endpoint shape:

```python
@router.post("/slides", response_model=SlideDetail, status_code=201)
async def upload_slide(
    file: UploadFile,
    pipeline: PipelineService = Depends(get_pipeline_service),
    session: AsyncSession = Depends(get_session),
) -> SlideDetail:
    slide = await pipeline.process_upload(file, session)
    return SlideDetail.model_validate(slide)
```

`app/main.py` also registers CORS middleware so the Next.js frontend (a separate origin, per `frontend-spec.md`) can call these endpoints from the browser:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # e.g. ["http://localhost:3000"]
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`settings.cors_origins` comes from a `CORS_ORIGINS` env var (comma-separated), read via `config.py`'s `pydantic-settings` — no hardcoded origin in code.

- snake_case for functions/variables, PascalCase for classes/Pydantic models.
- One service class per pipeline concern (`ExtractionService`, `PipelineService`, `MatchingService`) — routers stay thin, call services.
- No bare `dict`/`Any` at API boundaries; every endpoint has an explicit Pydantic response model.

## Data Model

**`slides`**
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| filename | text | original uploaded filename |
| file_path | text | path within the persistent uploads volume |
| page_count | int | |
| status | enum: `processing`, `reviewing`, `published`, `failed` | |
| uploaded_at | timestamptz | |
| published_at | timestamptz, nullable | |

**`slide_pages`**
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| slide_id | uuid, FK → slides | |
| page_number | int | |
| extracted_text | text | |
| status | enum: `pending`, `approved` | |

**`page_terms`** — mutable, editable-during-review term instances scoped to one page. Not the canonical glossary; merged into `terms` only on publish.
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| slide_page_id | uuid, FK → slide_pages | |
| term_display | text | |
| domain_tag_display | text | |
| definition | text | |
| source | enum: `db`, `llm_generated`, `admin_edited`, `manual` | `manual` = admin-added term never touched by the pipeline |
| is_new_domain_tag | bool | true if `domain_tag` wasn't in `domain_tags` at generation time |
| has_domain_conflict | bool | true if this term string exists under a *different* domain tag already |
| conflict_domain_tag_display | text, nullable | the other domain's tag, for the review-screen warning |
| created_at / updated_at | timestamptz | |

**`terms`** — canonical, global glossary.
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| term_normalized | text | lowercase, trimmed, accents stripped |
| domain_tag_normalized | text | same normalization |
| term_display | text | |
| domain_tag_display | text | |
| definition | text | |
| source | enum: `db`, `llm_generated`, `admin_edited`, `manual` | provenance of the *current* definition (last writer wins) |
| first_seen_slide_id | uuid, FK → slides | |
| created_at / updated_at | timestamptz | |
| | | **UNIQUE (term_normalized, domain_tag_normalized)** |

**`domain_tags`**
| column | type | notes |
|---|---|---|
| id | uuid, PK | |
| tag_normalized | text, unique | |
| tag_display | text | |
| first_seen_slide_id | uuid, FK → slides | |
| created_at | timestamptz | |

## LLM Call Interface (contract only — no real implementation in this spec)

Matches the idea doc's I/O contracts exactly, expressed as an injectable Python interface so the pipeline never talks to a provider SDK directly:

```python
# app/services/llm/interface.py
from typing import Protocol

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
```

`app/services/llm/stub.py` provides a placeholder implementation (e.g. deterministic fake output, or `raise NotImplementedError`) satisfying both Protocols, wired via FastAPI `Depends()`. Swapping in real LLM calls later means writing one new class and changing the dependency wiring — no router or pipeline code changes.

## Pipeline Orchestration (`PipelineService.process_upload`)

1. Save uploaded PDF to the persistent uploads volume at `uploads/{slide_id}.pdf`; insert `slides` row, `status=processing`.
2. Extract text per page (`ExtractionService`, PyMuPDF); insert one `slide_pages` row per page (`status=pending`).
3. For each page: call `TermIdentifier.identify(page_text, known_domain_tags)` where `known_domain_tags` is the current `domain_tags.tag_display` list.
4. For each returned `(term, domain_tag)` pair (de-duplicated per page by the service, not assumed unique from the LLM):
   - Normalize both fields.
   - Look up `terms` by composite key `(term_normalized, domain_tag_normalized)`.
   - **Hit:** create `page_terms` row, `source='db'`, definition copied from the canonical entry.
   - **Miss:** check whether `term_normalized` exists under a *different* `domain_tag_normalized` — if so, fetch that definition as `conflicting_definition` context. Call `TermDefiner.define(...)`. Create `page_terms` row, `source='llm_generated'`, `has_domain_conflict` set accordingly, `is_new_domain_tag` set if the tag isn't in `domain_tags` yet.
5. Set `slides.status='reviewing'`. Return the full nested slide/pages/page_terms payload.

This whole sequence runs synchronously inside the `POST /api/slides` request — no background job queue, consistent with hackathon scope. A large deck will mean a slow request; that's an accepted tradeoff, not a bug.

## API Endpoints

| Method & path | Purpose |
|---|---|
| `POST /api/slides` | Upload PDF, run the full pipeline synchronously, return nested slide detail |
| `GET /api/slides` | List slides (id, filename, status, page_count, uploaded_at) |
| `GET /api/slides/{slide_id}` | Full nested detail: slide + pages + page_terms (review screen state) |
| `GET /api/slides/{slide_id}/file` | Stream the stored PDF (`application/pdf`) — for admin re-view and future learner view |
| `PATCH /api/slides/{slide_id}/pages/{page_id}/terms/{term_id}` | Edit a page_term's term/definition/domain_tag; sets `source='admin_edited'`; if the page was `approved`, revert it to `pending` (mirrors mock's edit-reverts-approval behavior) |
| `POST /api/slides/{slide_id}/pages/{page_id}/terms` | Admin manually adds a term to a page; `source='manual'` |
| `DELETE /api/slides/{slide_id}/pages/{page_id}/terms/{term_id}` | Remove a term from a page |
| `POST /api/slides/{slide_id}/pages/{page_id}/approve` | Mark page `approved` |
| `POST /api/slides/{slide_id}/pages/{page_id}/reject` | Mark page `pending` (mirrors mock's reject button) |
| `POST /api/slides/{slide_id}/publish` | Requires all pages `approved`; for each `page_term`, upsert into `terms` (on conflict of the composite key, overwrite definition/source/updated_at) and upsert any new tag into `domain_tags`; set `slides.status='published'`, `published_at=now()` |
| `GET /api/slides/{slide_id}/pages/{page_number}` | Published-only: page terms for learner-facing consumption |

Publish behavior implements the assumption you confirmed: an admin-edited definition always overwrites the canonical `terms` entry — no "diverge without overwriting" branch in this MVP.

## Testing Strategy

- **Unit tests** (`tests/unit/`): normalization function, composite-key matching logic, domain-conflict detection — pure functions, no DB.
- **Integration tests** (`tests/integration/`): full endpoint flows against a real test Postgres database (a second database in the same Compose Postgres instance, or a `docker compose --profile test` service), using the stub LLM implementation so tests are deterministic and don't require real API calls.
- **Golden set** (`eval/`): per hackathon rubric R4 — ≥20 cases covering DB-hit, LLM-miss (new term), LLM-miss (domain conflict, e.g. "Transformer"), ambiguous term, deliberately-wrong-LLM-definition-to-catch-in-review, near-duplicate domain-tag proposal, and a PDF page with no extractable text. Golden set runs against the pipeline with whatever `TermIdentifier`/`TermDefiner` implementation is currently wired (stub now, real later) and records a results table with pass/fail % against the quality bar defined in `spec.md`.
- Coverage expectation: pipeline and matching logic covered by unit tests; every endpoint covered by at least one integration test (happy path + one error case).

## Docker Setup

**`Dockerfile`** (single-stage, hackathon-appropriate):
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chmod +x entrypoint.sh
EXPOSE 8000
ENTRYPOINT ["./entrypoint.sh"]
```

**`entrypoint.sh`**: waits for Postgres to accept connections, runs `alembic upgrade head`, then `exec uvicorn app.main:app --host 0.0.0.0 --port 8000`.

**Compose ownership:** there is **one `docker-compose.yml`, at the repo root**, covering `db` + `api` + `web` together — defined in full in [`frontend-spec.md`](./frontend-spec.md)'s Docker Setup section, since that's the spec written after both services existed. This backend spec only owns the `Dockerfile` and `entrypoint.sh` that the root compose's `api` service builds via `build: ./backend`. Don't create a second `docker-compose.yml` under `backend/` — the `api` service's env vars (`DATABASE_URL`, `UPLOADS_DIR`, `CORS_ORIGINS`), the `pdf_uploads` named volume, and the Postgres `db` service are all specified there, not duplicated here.

**`.env.example`** (backend-relevant vars — actual `.env` lives at repo root alongside the compose file):
```
POSTGRES_USER=vlearn
POSTGRES_PASSWORD=changeme
POSTGRES_DB=glossary
CORS_ORIGINS=http://localhost:3000
# LLM_API_KEY=            # unused — placeholder for when a real TermIdentifier/TermDefiner is wired in
```

## Boundaries

- **Always:** validate every request/response through Pydantic models; run `pytest` before committing; keep schema changes in Alembic migrations (never hand-edit the DB); log the raw LLM interface call/response to the repo per R5's real-AI-call requirement (once a real implementation is wired in).
- **Ask first:** changing the `terms`/`domain_tags` composite-key design; adding a background job queue or auth; changing the publish-overwrite behavior (the confirmed assumption above); adding any new external dependency (cloud OCR, embeddings, etc. — all explicit non-goals in the idea doc).
- **Never:** commit `.env` or real API keys; commit uploaded PDFs or the `uploads/` dev folder into git; implement the real `TermIdentifier`/`TermDefiner` in this pass (explicitly deferred by the user); bypass the composite-key uniqueness constraint with an ad-hoc query.

## Success Criteria

- `docker compose up --build` (root-level compose, per `frontend-spec.md`) brings up `db` + `api` (+ `web` once built), migrations apply automatically, and `POST /api/slides` with a real PDF returns a full nested pipeline result (using the stub LLM implementation).
- The full mock UI flow (upload → review with edit/approve per page → publish) is achievable purely via these endpoints.
- A `Transformer`-style domain-conflict case, run through the pipeline, produces two distinct `page_terms`/`terms` rows rather than one overwriting the other, and `has_domain_conflict` is set correctly.
- Publishing writes approved terms into `terms` and any new tags into `domain_tags`, and a subsequent upload whose page contains the same `(term, domain_tag)` gets a DB hit (`source='db'`, no LLM call).
- The uploaded PDF is retrievable via `GET /api/slides/{id}/file` after a container restart (proves volume persistence, not just in-request availability).
- Golden set runner in `eval/` executes end-to-end against the stub LLM and produces a results table (pass/fail per case), ready to be re-run once a real LLM implementation replaces the stub.

## Open Questions

- Should `GET /api/slides/{slide_id}/pages/{page_number}` (the learner-facing read) be restricted to `published` slides only, or should it 404 vs. 403 differently for `processing`/`reviewing` states? Left as a small decision for implementation time.
- Golden-set quality bar (the actual `%` threshold) isn't defined here — per hackathon rubric R4, that number must be locked in `spec.md` before 23:59 N1, separately from this backend spec.
- File size / page-count limits on upload aren't specified — worth a sane default (e.g. reject >50MB or >200 pages) to avoid a pathological synchronous request, but not blocking for MVP.
