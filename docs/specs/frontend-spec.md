# Spec: Frontend — Glossary DB-First Definition Lookup (Admin UI)

Builds on [docs/ideas/glossary-db-first-idea.md](../ideas/glossary-db-first-idea.md) (product design) and [docs/specs/backend-spec.md](./backend-spec.md) (API this UI talks to). **Visual design must follow `mock-ui/admin/` exactly** — same layout, colors, component shapes, copy style (Vietnamese) — this is a re-implementation of that mock against a real API, not a redesign.

## Objective

Rebuild `mock-ui/admin/`'s four-screen flow (Upload → Pipeline → Review/HITL → Done) as a real Next.js app calling the FastAPI backend: upload a PDF, wait for the real pipeline to run, review/edit terms per page (with provenance badges, domain-tag chips, and conflict warnings the mock didn't have), approve pages, and publish. Success = the mock's exact look and interaction feel, now backed by real data and real LLM-call results instead of hardcoded fixtures.

## Tech Stack

- Next.js 14+ (App Router), TypeScript
- Tailwind CSS — theme tokens ported directly from `mock-ui/admin/styles.css`
- SWR for data fetching/mutation revalidation
- `next/font` for Inter (mock uses `Inter, Segoe UI, Arial, Helvetica, sans-serif`)
- Docker for deployment (joins the backend's Postgres + API in one Compose stack)

## Commands

```
Dev:        npm run dev
Build:      npm run build
Start:      npm run start
Lint:       npm run lint
Type-check: npx tsc --noEmit
```

## Project Structure

```
frontend/
  app/
    layout.tsx                 → root layout: Inter font, Topbar+Stepper shell
    page.tsx                    → Upload screen ("/"), includes pipeline loading sub-state
    slides/
      page.tsx                   → slide list ("/slides") — resume/reopen a previous upload
      [slideId]/
        review/page.tsx           → HITL review screen
        done/page.tsx              → Done/publish-summary screen
  components/
    Topbar.tsx / Stepper.tsx      → shared header, step indicator (upload/pipeline/review/done)
    Button.tsx                     → variant prop: primary | ghost | success | dashed
    Card.tsx
    Dropzone.tsx                    → upload screen's drag-drop area
    PipelineStepList.tsx             → static step list + progress bar (loading sub-state)
    PageListSidebar.tsx               → review screen's left page nav + status pills
    TermRow.tsx                        → editable term/definition row + badges/chips
    ProvenanceBadge.tsx                 → "📚 Từ CSDL" / "✨ AI tạo mới"
    DomainTagChip.tsx                    → tag chip, "mới" variant for newly-proposed tags
    ConflictWarning.tsx                   → same-term/different-domain banner
    PublishBar.tsx                         → sticky bottom bar, approved-count + publish button
  lib/
    api.ts                        → typed fetch wrappers for every backend endpoint
    types.ts                       → TypeScript types mirroring backend Pydantic schemas
  styles/
    globals.css                   → Tailwind base + any non-utility overrides
  tailwind.config.ts
  next.config.js
  Dockerfile
  .env.example
```

## Design Tokens (ported from `mock-ui/admin/styles.css`)

```ts
// tailwind.config.ts (excerpt)
theme: {
  extend: {
    colors: {
      bg: '#f3f7fb',
      accent: '#123a6b',
      muted: '#7a8aa3',
      card: '#ffffff',
      brand: {
        blue: '#0b62cc',
        green: '#1e9e63',
        red: '#c93a3a',
      },
      border: '#e6edf6',
    },
    fontFamily: {
      sans: ['var(--font-inter)', 'Segoe UI', 'Arial', 'Helvetica', 'sans-serif'],
    },
    borderRadius: {
      card: '16px',
      pill: '999px',
    },
  },
},
```

Component shapes to preserve exactly: pill-shaped stepper dots (active=blue fill, done=green fill), card with `border-radius:16px` + soft shadow, dashed-border "add term" button, status pills (`pending`=amber `#fff4e0`/`#9a6400`, `approved`=green `#e4f6ec`/`#1e9e63`), sticky bottom publish bar.

## Code Style

Functional components, typed props, no `any`. Example:

```tsx
type TermRowProps = {
  term: PageTerm;
  onChange: (patch: Partial<PageTerm>) => void;
  onRemove: () => void;
};

export function TermRow({ term, onChange, onRemove }: TermRowProps) {
  return (
    <div className="flex gap-3 rounded-xl border border-border p-3.5">
      <ProvenanceBadge source={term.source} />
      <DomainTagChip tag={term.domain_tag_display} isNew={term.is_new_domain_tag} />
      {term.has_domain_conflict && (
        <ConflictWarning existingDomain={term.conflict_domain_tag_display} />
      )}
      {/* term/definition inputs */}
    </div>
  );
}
```

- One component per file, colocated with its own types where narrow, shared types in `lib/types.ts`.
- All backend calls go through `lib/api.ts` — no raw `fetch()` inside components.
- Tailwind utility classes only; no separate CSS files per component (matches the mock's single-stylesheet simplicity, just expressed as Tailwind).

## Screens & API Integration

**1. Upload (`/`)** — mirrors `screen-upload` + `screen-pipeline`.
- Dropzone accepts `.pdf` only (backend only does PDF text extraction — no `.pptx` support, unlike the mock's placeholder `accept`).
- On "Bắt đầu xử lý AI": switch to the pipeline loading sub-state (same visual step list as the mock: extract → identify+tag → DB lookup → define-on-miss → aggregate, restated to match what the backend actually does), call `POST /api/slides` with the file, show an indeterminate spinner/progress bar (not per-step live status — the backend call is one blocking request, so there's nothing to poll). On success, `router.push('/slides/{slideId}/review')`.
- Error state (e.g. extraction failure, oversized file): show inline error, stay on upload screen — mock has no error path to reference, this is new.

**2. Slide list (`/slides`)** — new, not in the mock. Calls `GET /api/slides`; simple list (filename, status, page count, uploaded date) linking into `/slides/{id}/review`. Exists so a page refresh or a return visit isn't a dead end.

**3. Review (`/slides/[slideId]/review`)** — mirrors `screen-review`.
- On mount: `GET /api/slides/{slideId}` (SWR, revalidate after every mutation).
- Sidebar (`PageListSidebar`): page list with status pills, click switches the active page in local state (no route change, matching the mock's instant client-side switching).
- Main panel (`TermRow` per term): editable term/definition text inputs, editable domain-tag text input, remove button — each edit calls `PATCH /api/slides/{slideId}/pages/{pageId}/terms/{termId}` (debounced), which per the backend spec also reverts the page to `pending` if it was `approved` — reflect that by re-rendering the badge from the revalidated data, not by optimistically guessing.
- Each `TermRow` renders `ProvenanceBadge` (from `term.source`), `DomainTagChip` (flagged if `term.is_new_domain_tag`), and `ConflictWarning` (if `term.has_domain_conflict`, showing `term.conflict_domain_tag_display`) — **these three are new relative to the mock** and are must-have per the idea doc's HAX/PAIR transparency principle, not optional polish.
- "+ Thêm thuật ngữ thủ công" → `POST .../terms` (empty term+def, focus the new row, same UX as the mock).
- "Cần chỉnh sửa thêm" → `POST .../pages/{pageId}/reject`. "✓ Đồng ý — Duyệt trang này" → `POST .../pages/{pageId}/approve`.
- Sticky `PublishBar`: shows `{approved}/{total} trang đã duyệt` from the fetched slide state; "Lưu & Xuất bản" disabled until all approved, calls `POST /api/slides/{slideId}/publish`, then `router.push('/slides/{slideId}/done')`.

**4. Done (`/slides/[slideId]/done`)** — mirrors `screen-done`.
- Shows publish summary (term count, filename) from the publish response or a `GET /api/slides/{slideId}` refetch.
- "Xem lại danh sách thuật ngữ đã lưu" → back to the review route (now read-mostly, since the slide is `published`; still allow viewing, editing after publish is a v2 concern — see Open Questions).
- "Tải lên slide khác" → `router.push('/')`.

## Testing Strategy

- Component tests: React Testing Library for `TermRow` (edit/remove/badge-rendering logic), `PageListSidebar` (status pill rendering), `PipelineStepList` (loading state rendering) — Vitest as the runner.
- Integration/E2E: Playwright, one flow test driving upload → review → approve-all → publish → done against a running backend (docker compose stack), using a small fixture PDF checked into `frontend/e2e/fixtures/`.
- No unit tests for pure-presentational components without logic (badges, chips) beyond a basic render smoke test.

## Boundaries

- **Always:** run `lint` + `tsc --noEmit` before committing; keep all backend calls in `lib/api.ts`; keep colors/spacing on the Tailwind theme tokens (no ad-hoc hex values in components).
- **Ask first:** adding a global state library (Redux/Zustand/etc.) — SWR + local state should be sufficient at this scope; changing the route structure; adding any UI screen not present in `mock-ui/admin/` beyond the two explicitly-justified additions (`/slides` list, error states).
- **Never:** call the backend directly from a Server Component with hardcoded URLs (use `NEXT_PUBLIC_API_BASE_URL`); commit `.env`; diverge from the mock's visual language (colors, badge/pill shapes, card layout) without flagging it first.

## Docker Setup

**`frontend/Dockerfile`** (standard Next.js standalone multi-stage build):
```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```
(`next.config.js` needs `output: 'standalone'` for this to work.)

**Root-level `docker-compose.yml`** — consolidates the backend spec's `db`+`api` services with the new `web` service into one stack (supersedes the nested `backend/docker-compose.yml` from the backend spec):
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build: ./backend
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      UPLOADS_DIR: /app/uploads
      CORS_ORIGINS: http://localhost:3000
    volumes:
      - pdf_uploads:/app/uploads
    ports:
      - "8000:8000"

  web:
    build: ./frontend
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_BASE_URL: http://localhost:8000
    ports:
      - "3000:3000"

volumes:
  pg_data:
  pdf_uploads:
```

`NEXT_PUBLIC_API_BASE_URL` points at `localhost:8000` (not the Docker-internal `api` hostname) because API calls happen client-side in the browser, which is outside the Compose network — the browser hits the host-published port.

**`.env.example`** (frontend):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Backend follow-up required (not implemented in this spec):** the backend needs CORS middleware allowing `http://localhost:3000` — a small addition to `backend-spec.md`'s `app/main.py`, tracked here since this spec depends on it but doesn't own the backend code.

## Success Criteria

- `docker compose up --build` at the repo root brings up `db` + `api` + `web`; visiting `localhost:3000` shows the upload screen matching the mock's visual design.
- Full flow works end-to-end against the real backend (with whatever LLM implementation is wired in, stub or real): upload → loading state → review with provenance badges/domain chips/conflict warnings visible and functioning → approve all pages → publish → done screen.
- A domain-conflict case (e.g. "Transformer") visibly renders the `ConflictWarning` banner in review — this is the concrete UI proof that the backend's composite-key design is surfaced to the admin, not just implemented silently.
- Refreshing the browser mid-review does not lose the slide — `/slides/{slideId}/review` reloads correctly from `GET /api/slides/{slideId}`.
- Side-by-side with `mock-ui/admin/` open, a reviewer can't tell which is the mock and which is the real app from visual design alone.

## Open Questions

- Should editing terms be allowed *after* publish (from the Done screen's "xem lại" link), and if so, does that trigger a re-publish/re-write to the canonical `terms` table, or is post-publish view read-only for this MVP? Leaning read-only for MVP; not resolved here.
- Domain-tag autocomplete against the known-tags list was explicitly deferred (assumption #5) — worth reconsidering once the backend exposes a tags-list endpoint, if typos in manually-entered tags turn out to be a real problem in testing.
- Error-state design (failed extraction, backend 5xx, oversized upload) has no mock reference to follow — needs its own small design pass at implementation time, not fully specified here.
