# Implementation Plan: Glossary DB-First Definition Lookup

## Overview

Build the real system behind `mock-ui/admin/`: a FastAPI backend (Postgres, PDF text extraction, a stub-backed LLM interface, DB-first term lookup with domain-tag disambiguation) and a Next.js/Tailwind frontend that visually matches the mock, both running under one root-level `docker-compose.yml`. Source specs: [docs/specs/backend-spec.md](../docs/specs/backend-spec.md), [docs/specs/frontend-spec.md](../docs/specs/frontend-spec.md), design rationale in [docs/ideas/glossary-db-first-idea.md](../docs/ideas/glossary-db-first-idea.md).

Given the hackathon timeline, this plan is sequenced to hit a **walking skeleton** — the full upload → pipeline → review → publish flow working end-to-end through the real UI against the real backend, using the stub LLM implementation — as early as possible (end of Phase 6), before any polish or rubric-specific artifacts (golden set, E2E tests, error states) are layered on in Phase 7. A working skeleton early de-risks integration; polish can be cut if time runs out without losing the demoable core.

## Architecture Decisions

- **Real LLM integration is explicitly out of scope for this plan.** `TermIdentifier`/`TermDefiner` get a stub implementation (Task 6) satisfying the Protocol contracts from the idea doc; no task implements a real provider call. This is a deliberate, user-confirmed deferral, not an oversight.
- **One root-level `docker-compose.yml`** (db + api + web), per `frontend-spec.md`'s Docker Setup section — `backend/` only owns a `Dockerfile` + `entrypoint.sh`, `frontend/` only owns a `Dockerfile`. No task should produce a second compose file.
- **Vertical slicing over horizontal**: rather than "finish all backend, then all frontend," Phase 5 (frontend shell) runs in parallel with Phases 1-4 (backend data/pipeline/API) since UI-shell work doesn't need live data. Integration only happens in Phase 6, once both sides have something to connect.
- **Backend must be runnable stand-alone before frontend integration is verified** — Phases 1-4 produce a backend testable via `curl`/`httpx` alone, independent of whether the frontend exists yet.

## Task List

### Phase 0: Scaffolding

- [x] Task 1: Repo scaffolding — `backend/`, `frontend/` directories, root `docker-compose.yml` skeleton (empty service stubs), root `.env.example`, `.gitignore` updates (`uploads/`, `.env`, `node_modules/`, `__pycache__/`, `.next/`)
- [x] Task 2: Backend project skeleton — FastAPI app (`main.py`, `config.py` via pydantic-settings, `db.py` async engine setup), `Dockerfile`, `entrypoint.sh`, `requirements.txt`, a `GET /health` endpoint
- [ ] Task 3: Frontend project skeleton — `next init` (App Router, TS), Tailwind config with design tokens from `mock-ui/admin/styles.css`, `Dockerfile`, root `layout.tsx` with Inter font + empty Topbar/Stepper

### Checkpoint: Scaffolding
- [x] `docker compose up --build` (root) brings up `db`, `api` without errors (`web` has no Dockerfile yet — Task 3 skipped in this pass)
- [x] `GET localhost:8000/health` returns 200
- [ ] `localhost:3000` renders a blank shell page (frontend not built in this pass — Task 3 skipped)
- [ ] Review with human before proceeding

### Phase 1: Backend data layer

- [x] Task 4: SQLAlchemy models + Alembic migration for `slides`, `slide_pages`, `page_terms`, `terms` (composite unique key), `domain_tags` — per backend-spec.md's Data Model section
- [x] Task 5: Normalization + composite-key matching service (`services/matching.py`) — pure functions, no DB dependency in the function signatures themselves — plus unit tests including a homonym case (e.g. "Transformer" under two domain tags)

### Checkpoint: Data layer
- [x] `alembic upgrade head` applies cleanly against the Compose `db` service
- [x] `pytest tests/unit/` passes
- [ ] Review with human before proceeding

### Phase 2: LLM interface stub

- [x] Task 6: `TermIdentifier`/`TermDefiner` Protocols + Pydantic I/O models (`services/llm/interface.py`) matching the idea doc's contracts exactly, plus a deterministic stub implementation (`services/llm/stub.py`) wired via FastAPI `Depends()`

### Phase 3: Backend walking-skeleton — upload pipeline

- [x] Task 7: PDF text extraction service (`services/extraction.py`, PyMuPDF) + unit test against a small fixture PDF (checked into `backend/tests/fixtures/`)
- [x] Task 8: Pipeline orchestration service (`services/pipeline.py`) — wires extraction → `TermIdentifier` (stub) → matching/lookup → `TermDefiner` (stub, on miss) → persists `slides`/`slide_pages`/`page_terms`, sets `is_new_domain_tag`/`has_domain_conflict`
- [x] Task 9: `POST /api/slides` (multipart upload, runs pipeline synchronously) and `GET /api/slides/{slide_id}` endpoints

### Checkpoint: Backend walking skeleton
- [x] Uploading the fixture PDF via `httpx`/curl returns a full nested slide/pages/page_terms payload using the stub LLM
- [x] Integration test covers this flow
- [ ] Review with human before proceeding

### Phase 4: Backend review & publish

- [x] Task 10: `PATCH .../terms/{id}` (edit, sets `admin_edited`, reverts page to `pending` if was `approved`), `POST .../terms` (manual add), `DELETE .../terms/{id}` (remove)
- [x] Task 11: `POST .../pages/{id}/approve`, `POST .../pages/{id}/reject`, `POST /api/slides/{slide_id}/publish` (upsert into `terms`/`domain_tags`, require all pages approved)
- [x] Task 12: `GET /api/slides` (list), `GET /api/slides/{id}/file` (stream PDF from the persistent volume), `GET /api/slides/{id}/pages/{page_number}` (published-only, learner-facing read)

### Checkpoint: Backend complete
- [x] Full backend API surface is walkable via API calls alone: upload → edit/approve every page → publish → re-fetch shows `published`
- [x] A second upload containing a previously-published `(term, domain_tag)` produces a `source='db'` page_term (no stub-LLM define call)
- [x] A same-term/different-domain case (e.g. "Transformer") produces two distinct rows with `has_domain_conflict=true` on the second
- [x] Integration tests cover every endpoint (happy path + one error case each)
- [ ] Review with human before proceeding

### Phase 5: Frontend shell (parallel with Phases 1-4)

- [ ] Task 13: Shared components — `Button` (primary/ghost/success/dashed variants), `Card`, `Badge`, `Stepper`, `Topbar` — matching `mock-ui/admin/` visually
- [ ] Task 14: Upload screen (`app/page.tsx`) — dropzone, "dùng file mẫu" button (can point at a bundled fixture PDF), pipeline loading sub-state UI (static step list + spinner, no live data yet)
- [ ] Task 15: Review screen shell (`app/slides/[slideId]/review/page.tsx`) — `PageListSidebar`, `TermRow` (with `ProvenanceBadge`, `DomainTagChip`, `ConflictWarning`), `PublishBar` — built against mock/hardcoded fixture data, no live API calls yet
- [ ] Task 16: Done screen + slide list screen (`app/slides/[slideId]/done/page.tsx`, `app/slides/page.tsx`) — static/mock data

### Checkpoint: Frontend shell
- [ ] `npm run dev` renders all four screens with mock data, visually matching `mock-ui/admin/` (side-by-side comparison)
- [ ] `tsc --noEmit` and `lint` pass
- [ ] Review with human before proceeding

### Phase 6: Frontend–backend integration

- [ ] Task 17: `lib/api.ts` typed fetch wrappers + `lib/types.ts` mirroring backend Pydantic schemas; verify CORS works end-to-end (backend's `CORS_ORIGINS` covers `localhost:3000`)
- [ ] Task 18: Wire upload screen to `POST /api/slides`; navigate to `/slides/{slideId}/review` on success; basic error display on failure
- [ ] Task 19: Wire review screen to live data via SWR — edit/add/remove/approve/reject all call real endpoints, badges/chips/warnings render from real `page_terms` fields
- [ ] Task 20: Wire publish button + done screen + slide list screen to real endpoints

### Checkpoint: WALKING SKELETON — human review required
- [ ] Full upload → review (edit at least one term, see badge/chip/warning render correctly) → approve all pages → publish → done flow works end-to-end through the real UI against the real backend (stub LLM)
- [ ] Refreshing mid-review on `/slides/{slideId}/review` correctly reloads state
- [ ] Visual comparison against `mock-ui/admin/` holds up
- [ ] **This is the core deliverable — everything in Phase 7 is enhancement, not required for a demoable prototype**

### Phase 7: Hackathon rubric artifacts & polish

- [ ] Task 21: Golden set (`backend/eval/golden_set.json`, ≥20 cases per backend-spec.md's Testing Strategy) + eval runner script producing a pass/fail results table against the stub LLM
- [ ] Task 22: Playwright E2E test (`frontend/e2e/`) driving the full flow against the Compose stack with a fixture PDF
- [ ] Task 23: Error states — oversized/invalid upload, extraction failure, backend 5xx — on both frontend (inline error UI) and backend (validation + meaningful error responses)

### Checkpoint: Complete
- [ ] All Success Criteria from both `backend-spec.md` and `frontend-spec.md` are met
- [ ] Golden set results table exists and is committed (per rubric R4)
- [ ] Ready for demo

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Async SQLAlchemy + Alembic setup eats more time than expected (common first-time friction) | Med | Task 4 is early and isolated; if it stalls, fall back to sync SQLAlchemy (documented as an acceptable spec deviation) rather than block the whole plan |
| PyMuPDF extraction behaves oddly on a real slide-deck PDF (weird encodings, image-only pages) | Med | Task 7 includes a unit test against a real fixture PDF, not just a trivial one; the "no extractable text" edge case is already in the golden set (Task 21) |
| Time runs out before Phase 7 | Low (by design) | Walking skeleton (end of Phase 6) is the real milestone; Phase 7 tasks are explicitly ordered last and individually droppable |
| CORS/networking misconfig between `web` and `api` containers wastes debugging time | Med | Task 17 explicitly calls out CORS verification as its own acceptance criterion, done before any UI wiring depends on it |
| Frontend and backend drift on the shape of `page_terms` fields (`is_new_domain_tag`, `has_domain_conflict`, etc.) | Med | `lib/types.ts` (Task 17) is written directly against `backend-spec.md`'s Data Model table, not guessed from memory |

## Open Questions

- Should Phase 5 (frontend shell) actually start in parallel with Phase 1, or does the team prefer strictly sequential backend-then-frontend given hackathon team size/coordination overhead? Plan assumes parallel is safe since Phase 6 is the only integration point, but this depends on how many people are available to work simultaneously.
- Fixture PDF for Task 7/14/22 — needs to be sourced or created (a small real or representative slide deck) before those tasks can start; not blocking Phase 0-2 but should be lined up early.
