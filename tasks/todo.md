# Task List: Glossary DB-First Definition Lookup

See [tasks/plan.md](./plan.md) for phases, checkpoints, risks. Specs: [backend-spec.md](../docs/specs/backend-spec.md), [frontend-spec.md](../docs/specs/frontend-spec.md).

---

## Phase 0: Scaffolding

### Task 1: Repo scaffolding
**Description:** Create the top-level directory structure and shared config files both backend and frontend will build into.
**Acceptance criteria:**
- [x] `backend/` and `frontend/` directories exist
- [x] Root `docker-compose.yml` exists with `db`, `api`, `web` service stubs (build contexts pointed at `./backend`/`./frontend`, no full config yet — filled in by later tasks)
- [x] Root `.env.example` exists with placeholder vars for all three services
**Verification:**
- [x] `docker compose config` parses without error
**Dependencies:** None
**Files:** `docker-compose.yml`, `.env.example`, `.gitignore`, `backend/.gitkeep`, `frontend/.gitkeep`
**Estimated scope:** XS

### Task 2: Backend project skeleton
**Description:** Minimal runnable FastAPI app with settings, DB engine setup, and a health endpoint — no business logic yet.
**Acceptance criteria:**
- [x] `app/main.py` creates the FastAPI app and includes a `GET /health` route returning `{"status": "ok"}`
- [x] `app/config.py` reads `DATABASE_URL`, `UPLOADS_DIR`, `CORS_ORIGINS` via pydantic-settings
- [x] `app/db.py` sets up the async SQLAlchemy engine (not yet used by any route)
- [x] `Dockerfile` and `entrypoint.sh` build and run per `backend-spec.md`'s Docker Setup section
**Verification:**
- [x] `docker compose up --build api db` → `curl localhost:8000/health` returns 200
**Dependencies:** Task 1
**Files:** `backend/app/main.py`, `backend/app/config.py`, `backend/app/db.py`, `backend/Dockerfile`, `backend/entrypoint.sh`, `backend/requirements.txt`
**Estimated scope:** S

### Task 3: Frontend project skeleton
**Description:** Minimal runnable Next.js app with Tailwind theme tokens ported from the mock, and an empty layout shell.
**Acceptance criteria:**
- [ ] `npx create-next-app` scaffolded (App Router, TypeScript)
- [ ] `tailwind.config.ts` includes the color/radius tokens from `frontend-spec.md`'s Design Tokens section
- [ ] `app/layout.tsx` loads Inter via `next/font` and renders an empty page shell
- [ ] `Dockerfile` builds a standalone Next.js image per `frontend-spec.md`
**Verification:**
- [ ] `docker compose up --build web` → `localhost:3000` renders without error
**Dependencies:** Task 1
**Files:** `frontend/app/layout.tsx`, `frontend/tailwind.config.ts`, `frontend/next.config.js`, `frontend/Dockerfile`
**Estimated scope:** S
**Status:** Not started — skipped in this pass (backend-only build per user request)

## Checkpoint: Scaffolding
- [x] `docker compose up --build` (root) brings up `db`, `api` cleanly (`web` has no Dockerfile yet — Task 3 skipped)
- [x] `GET localhost:8000/health` → 200 (`localhost:3000` not applicable — no frontend built)
- [ ] Human review before proceeding

---

## Phase 1: Backend data layer

### Task 4: Data models + migration
**Description:** Implement the five tables from `backend-spec.md`'s Data Model section as SQLAlchemy ORM models, and generate the initial Alembic migration.
**Acceptance criteria:**
- [x] `slides`, `slide_pages`, `page_terms`, `terms`, `domain_tags` models match the spec's columns/types exactly
- [x] `terms` has the composite unique constraint on `(term_normalized, domain_tag_normalized)`
- [x] Alembic migration generated and applies cleanly
**Verification:**
- [x] `alembic upgrade head` against the Compose `db` service succeeds
- [x] `alembic downgrade base && alembic upgrade head` round-trips without error
**Dependencies:** Task 2
**Files:** `backend/app/models/slide.py`, `backend/app/models/term.py`, `backend/app/models/domain_tag.py`, `backend/app/alembic/versions/0001_initial.py`
**Estimated scope:** M

### Task 5: Normalization + matching service
**Description:** Pure-function normalization (lowercase/trim/strip-accents) and composite-key matching logic, independently testable without a live DB connection in the function signature.
**Acceptance criteria:**
- [x] `normalize(text: str) -> str` handles Vietnamese diacritics correctly
- [x] Matching logic correctly distinguishes `("Transformer", "AI/ML")` from `("Transformer", "electronics")` as separate keys
- [x] Unit tests include the homonym case explicitly
**Verification:**
- [x] `pytest tests/unit/test_matching.py` passes
**Dependencies:** Task 4 (for type alignment with model fields, though logic itself has no DB dependency)
**Files:** `backend/app/services/matching.py`, `backend/tests/unit/test_matching.py`
**Estimated scope:** S

## Checkpoint: Data layer
- [x] Migrations apply cleanly; unit tests pass
- [ ] Human review before proceeding

---

## Phase 2: LLM interface stub

### Task 6: LLM interface + stub implementation
**Description:** Define the `TermIdentifier`/`TermDefiner` Protocols and Pydantic I/O models exactly matching the idea doc's contracts, plus a stub implementation for local dev/testing (no real LLM calls).
**Acceptance criteria:**
- [x] `IdentifyResult`/`DefineResult`/`ConflictingDefinition` Pydantic models match the idea doc's JSON shapes
- [x] Stub `identify()` returns deterministic fake terms+tags from input text (e.g. simple keyword heuristic, not a real model call)
- [x] Stub `define()` returns a deterministic placeholder definition string
- [x] Both wired via FastAPI `Depends()` so a real implementation can be swapped in later without touching callers
**Verification:**
- [x] `pytest tests/unit/test_llm_stub.py` passes
**Dependencies:** Task 2
**Files:** `backend/app/services/llm/interface.py`, `backend/app/services/llm/stub.py`, `backend/tests/unit/test_llm_stub.py`
**Estimated scope:** S

---

## Phase 3: Backend walking-skeleton — upload pipeline

### Task 7: PDF extraction service
**Description:** Extract per-page text from an uploaded PDF using PyMuPDF.
**Acceptance criteria:**
- [x] `extract_pages(pdf_bytes: bytes) -> list[str]` returns one text string per page
- [x] Handles a page with no extractable text (returns empty string, doesn't crash)
**Verification:**
- [x] `pytest tests/unit/test_extraction.py` passes against a fixture PDF (checked into `backend/tests/fixtures/`)
**Dependencies:** Task 2
**Files:** `backend/app/services/extraction.py`, `backend/tests/unit/test_extraction.py`, `backend/tests/fixtures/sample.pdf`
**Estimated scope:** S

### Task 8: Pipeline orchestration service
**Description:** Wire extraction → identify (stub) → composite-key lookup → define-on-miss (stub) → persistence, per `backend-spec.md`'s Pipeline Orchestration section.
**Acceptance criteria:**
- [x] Given a PDF, produces one `slide_pages` row per page and the correct set of `page_terms` rows
- [x] DB-hit terms get `source='db'` with no `TermDefiner` call
- [x] Miss terms get `source='llm_generated'`, `is_new_domain_tag` and `has_domain_conflict` set correctly
- [ ] `slides.status` set to `processing` then `reviewing`
**Verification:**
- [x] `pytest tests/unit/test_pipeline.py` passes using the stub LLM and a seeded `terms` table (to exercise the DB-hit path)
**Dependencies:** Tasks 4, 5, 6, 7
**Files:** `backend/app/services/pipeline.py`, `backend/tests/unit/test_pipeline.py`
**Estimated scope:** M

### Task 9: Upload + get-slide endpoints
**Description:** `POST /api/slides` (multipart, runs Task 8's pipeline synchronously, persists the PDF to the uploads volume) and `GET /api/slides/{slide_id}` (full nested detail).
**Acceptance criteria:**
- [x] `POST /api/slides` with the fixture PDF returns 201 and a full nested slide/pages/page_terms payload
- [x] Uploaded PDF is saved to `UPLOADS_DIR/{slide_id}.pdf`
- [x] `GET /api/slides/{slide_id}` returns the same nested shape
**Verification:**
- [x] `pytest tests/integration/test_slides_upload.py` passes against the test DB
**Dependencies:** Task 8
**Files:** `backend/app/routers/slides.py`, `backend/app/schemas/slide.py`, `backend/tests/integration/test_slides_upload.py`
**Estimated scope:** S

## Checkpoint: Backend walking skeleton
- [x] Upload → nested response flow verified via integration test
- [ ] Human review before proceeding

---

## Phase 4: Backend review & publish

### Task 10: Term edit/add/delete endpoints
**Description:** `PATCH`, `POST`, `DELETE` on `page_terms`, per `backend-spec.md`'s API Endpoints table.
**Acceptance criteria:**
- [x] `PATCH` updates term/definition/domain_tag, sets `source='admin_edited'`
- [x] `PATCH` reverts the parent page's `status` to `pending` if it was `approved`
- [x] `POST` creates a new `page_terms` row with `source='manual'`
- [x] `DELETE` removes the row
**Verification:**
- [x] `pytest tests/integration/test_page_terms.py` covers all three, including the approval-revert behavior
**Dependencies:** Task 9
**Files:** `backend/app/routers/pages.py`, `backend/tests/integration/test_page_terms.py`
**Estimated scope:** M

### Task 11: Approve/reject/publish endpoints
**Description:** `POST .../approve`, `POST .../reject`, `POST /api/slides/{slide_id}/publish`.
**Acceptance criteria:**
- [x] Approve/reject toggle `slide_pages.status`
- [x] Publish rejects (400) if any page isn't `approved`
- [x] Publish upserts every `page_term` into `terms` (composite-key conflict → overwrite) and any new tag into `domain_tags`
- [x] Publish sets `slides.status='published'`, `published_at`
**Verification:**
- [x] `pytest tests/integration/test_publish.py` — includes a re-upload test proving a previously-published term now returns `source='db'`, and a domain-conflict test (e.g. "Transformer") proving two distinct rows are created, not one overwritten
**Dependencies:** Task 10
**Files:** `backend/app/routers/pages.py`, `backend/app/routers/slides.py`, `backend/tests/integration/test_publish.py`
**Estimated scope:** M

### Task 12: List, file-serving, learner-read endpoints
**Description:** `GET /api/slides`, `GET /api/slides/{id}/file`, `GET /api/slides/{id}/pages/{page_number}`.
**Acceptance criteria:**
- [x] List returns id/filename/status/page_count/uploaded_at for all slides
- [x] File endpoint streams the PDF from the persistent volume with `application/pdf` content type
- [x] Page-read endpoint 404s (or documented alternative status) for non-published slides
**Verification:**
- [x] `pytest tests/integration/test_slides_read.py` passes; manual check that the PDF survives a `docker compose restart api`
**Dependencies:** Task 9
**Files:** `backend/app/routers/slides.py`, `backend/tests/integration/test_slides_read.py`
**Estimated scope:** S

## Checkpoint: Backend complete
- [x] Full API surface walkable end-to-end via API calls alone; all endpoints have integration test coverage
- [ ] Human review before proceeding

---

## Phase 5: Frontend shell (parallel with Phases 1-4)

### Task 13: Shared components
**Description:** `Button`, `Card`, `Badge`, `Stepper`, `Topbar` matching `mock-ui/admin/`'s visual design via Tailwind.
**Acceptance criteria:**
- [ ] Button variants (primary/ghost/success/dashed) match the mock's colors/states pixel-for-pixel where reasonable
- [ ] Stepper renders 4 steps with active/done states matching the mock's dot-fill behavior
**Verification:**
- [ ] Storybook-less manual visual check side-by-side with `mock-ui/admin/index.html` in a browser; `npm run lint` passes
**Dependencies:** Task 3
**Files:** `frontend/components/Button.tsx`, `Card.tsx`, `Badge.tsx`, `Stepper.tsx`, `Topbar.tsx`
**Estimated scope:** M

### Task 14: Upload screen
**Description:** `app/page.tsx` — dropzone, sample-file button, pipeline loading sub-state (static step list + spinner, no live API call yet — stub the transition with a `setTimeout` placeholder).
**Acceptance criteria:**
- [ ] Dropzone accepts `.pdf` only, matches mock's drag-over states
- [ ] Clicking "Bắt đầu xử lý AI" shows the loading sub-state UI
**Verification:**
- [ ] Manual visual check against mock; `tsc --noEmit` passes
**Dependencies:** Task 13
**Files:** `frontend/app/page.tsx`, `frontend/components/Dropzone.tsx`, `frontend/components/PipelineStepList.tsx`
**Estimated scope:** M

### Task 15: Review screen shell
**Description:** `app/slides/[slideId]/review/page.tsx` built against hardcoded fixture data (no live fetch yet) — sidebar, term rows with all three badge/chip/warning components, publish bar.
**Acceptance criteria:**
- [ ] `PageListSidebar` renders page list + status pills from fixture data
- [ ] `TermRow` renders editable inputs + `ProvenanceBadge` + `DomainTagChip` (including "mới" variant) + `ConflictWarning` (conditionally)
- [ ] `PublishBar` shows approved-count and disables publish until all approved (against fixture data)
**Verification:**
- [ ] Manual visual check against mock; `tsc --noEmit` passes
**Dependencies:** Task 13
**Files:** `frontend/app/slides/[slideId]/review/page.tsx`, `frontend/components/PageListSidebar.tsx`, `TermRow.tsx`, `ProvenanceBadge.tsx`, `DomainTagChip.tsx`, `ConflictWarning.tsx`, `PublishBar.tsx`
**Estimated scope:** L — consider splitting `TermRow` + badges into its own task if it drags past one session

### Task 16: Done + slide-list screens
**Description:** `app/slides/[slideId]/done/page.tsx` and `app/slides/page.tsx`, static/fixture data.
**Acceptance criteria:**
- [ ] Done screen matches mock's layout with summary text + two action buttons
- [ ] Slide list renders a fixture array of slides with links
**Verification:**
- [ ] Manual visual check; `tsc --noEmit` passes
**Dependencies:** Task 13
**Files:** `frontend/app/slides/[slideId]/done/page.tsx`, `frontend/app/slides/page.tsx`
**Estimated scope:** S

## Checkpoint: Frontend shell
- [ ] All four screens render with mock data, visually match `mock-ui/admin/`
- [ ] `tsc --noEmit` and `lint` pass
- [ ] Human review before proceeding

---

## Phase 6: Frontend–backend integration

### Task 17: API client + types + CORS verification
**Description:** Typed fetch wrappers and shared types mirroring the backend schemas; confirm CORS actually works between containers.
**Acceptance criteria:**
- [ ] `lib/types.ts` types match `backend-spec.md`'s Data Model table field-for-field
- [ ] `lib/api.ts` has one function per backend endpoint, typed request/response
- [ ] A test fetch from `localhost:3000` (browser) to `localhost:8000` succeeds without a CORS error
**Verification:**
- [ ] Manual browser check (Network tab, no CORS error); `tsc --noEmit` passes
**Dependencies:** Task 12 (backend complete), Task 3
**Files:** `frontend/lib/api.ts`, `frontend/lib/types.ts`
**Estimated scope:** S

### Task 18: Wire upload screen
**Description:** Replace Task 14's `setTimeout` placeholder with a real `POST /api/slides` call.
**Acceptance criteria:**
- [ ] Successful upload navigates to `/slides/{slideId}/review`
- [ ] Failed upload shows an inline error, stays on the upload screen
**Verification:**
- [ ] Manual: upload the fixture PDF through the real UI, confirm navigation
**Dependencies:** Task 17, Task 14
**Files:** `frontend/app/page.tsx`
**Estimated scope:** S

### Task 19: Wire review screen
**Description:** Replace Task 15's fixture data with live SWR-backed fetches and real mutation calls.
**Acceptance criteria:**
- [ ] `GET /api/slides/{slideId}` populates the screen on mount
- [ ] Edit/add/remove/approve/reject all call the real endpoints and the UI reflects the revalidated state (including the approval-revert-on-edit behavior)
- [ ] Badges/chips/warnings render correctly from real `page_terms` data, including a real domain-conflict case
**Verification:**
- [ ] Manual: full review-screen interaction against the real backend, using a fixture PDF that includes at least one homonym term
**Dependencies:** Task 17, Task 15
**Files:** `frontend/app/slides/[slideId]/review/page.tsx`, related components
**Estimated scope:** M

### Task 20: Wire publish + done + slide-list screens
**Description:** Replace remaining fixture data with real endpoint calls.
**Acceptance criteria:**
- [ ] Publish button calls `POST .../publish`, navigates to done screen on success
- [ ] Done screen shows real summary data
- [ ] Slide list fetches `GET /api/slides` and links correctly
**Verification:**
- [ ] Manual: full flow, upload to done, then revisit via slide list
**Dependencies:** Task 17, Task 16, Task 19
**Files:** `frontend/app/slides/[slideId]/review/page.tsx`, `done/page.tsx`, `frontend/app/slides/page.tsx`
**Estimated scope:** S

## Checkpoint: WALKING SKELETON — human review required
- [ ] Full upload → review (edit, see badges/chips/warnings) → approve all → publish → done flow works end-to-end through the real UI against the real backend
- [ ] Refresh mid-review reloads correctly
- [ ] Visual comparison against `mock-ui/admin/` holds up
- [ ] **This is the core demoable deliverable**

---

## Phase 7: Hackathon rubric artifacts & polish

### Task 21: Golden set + eval runner
**Description:** ≥20 golden-set cases and a runner script producing a results table, per `backend-spec.md`'s Testing Strategy and rubric R4.
**Acceptance criteria:**
- [ ] Cases cover: DB-hit, LLM-miss (new term), LLM-miss (domain conflict), ambiguous term, deliberately-wrong-definition-to-catch-in-review, near-duplicate domain-tag proposal, no-extractable-text page
- [ ] Runner executes the pipeline against each case (stub LLM) and outputs pass/fail % against a placeholder quality bar
**Verification:**
- [ ] `python eval/run_eval.py` produces a results table file
**Dependencies:** Task 11
**Files:** `backend/eval/golden_set.json`, `backend/eval/run_eval.py`
**Estimated scope:** M

### Task 22: E2E test
**Description:** Playwright test driving the full flow against the Compose stack.
**Acceptance criteria:**
- [ ] Test uploads the fixture PDF, edits a term, approves all pages, publishes, asserts the done screen
**Verification:**
- [ ] `npx playwright test` passes against `docker compose up`
**Dependencies:** Checkpoint: Walking Skeleton
**Files:** `frontend/e2e/upload-to-publish.spec.ts`
**Estimated scope:** S

### Task 23: Error states
**Description:** Oversized/invalid upload, extraction failure, backend 5xx — both backend validation and frontend inline error UI.
**Acceptance criteria:**
- [ ] Backend rejects non-PDF/oversized uploads with a clear 4xx + message
- [ ] Frontend shows that message inline on the upload screen instead of a silent failure
**Verification:**
- [ ] Manual: attempt an oversized/invalid upload through the real UI
**Dependencies:** Checkpoint: Walking Skeleton
**Files:** `backend/app/routers/slides.py`, `frontend/app/page.tsx`
**Estimated scope:** S

## Checkpoint: Complete
- [ ] All Success Criteria from both specs met
- [ ] Golden set results committed
- [ ] Ready for demo
