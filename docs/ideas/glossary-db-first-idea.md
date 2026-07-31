# Glossary DB-First Definition Lookup

## Problem Statement
How might we let admins upload a slide deck and get an accurate, reusable glossary — reusing verified definitions from a shared database when they exist, and calling the LLM only for genuinely new terms — so definitions stay consistent across decks instead of drifting each time a term is re-explained?

## Recommended Direction
Extend the existing mock flow (`flow-b-upload-slide.mermaid`) with a real pipeline:

- **B — Real OCR/extraction:** direct PDF text extraction (PyMuPDF/pdfplumber pulling the embedded text layer) per page. Not image-based OCR — slide decks are native digital PDFs, so the text layer is already present; this is far more reliable and needs no external service or system dependency like Tesseract.
- **E — LLM job 1, identify:** LLM reads each page's extracted text and identifies the important terms — the ambiguous, central AI decision (chỗ khó ②). For each term, the same call also outputs a **domain tag** (e.g. "AI/ML", "electronics") — no extra AI call, just a richer structured output.
- **F1 — DB lookup:** normalize the term (lowercase, trim, strip accents) and normalize the domain tag the same way, then look up in a global Postgres `terms` table by the **composite key `(term_normalized, domain_tag_normalized)`**. On hit, use the stored definition — no LLM call.
- **F2 — LLM job 2, define new terms only:** on miss, call the LLM to generate a definition. A miss includes both "term never seen before" and "term seen before, but under a different domain tag" — the latter produces a new row (a distinct sense of the same term), never overwrites the existing one.

**Why composite, not bare string match:** a bare-string match fails on homonyms across contexts — e.g. "Transformer" means a neural-net architecture in an AI slide and an electrical device in an electronics slide. Domain-tag scoping prevents the wrong-sense definition from being silently reused.

**Domain tag vocabulary — a growing, LLM-guided list, not free text or a fixed enum:**
- Maintain a small `domain_tags` table (`tag`, normalized the same way as terms).
- The identify prompt is given the **current list of known tags** and instructed: reuse an existing tag if one reasonably fits; only propose a new one if none do. This nudges the vocabulary to converge (later decks reuse earlier decks' tags) without hardcoding a taxonomy upfront.
- A newly-proposed tag is only added to the shared `domain_tags` table **on admin approval** (same moment as the term write-back) — an unapproved page's invented tag never pollutes the shared list.
- This is a soft constraint, not a guarantee — the LLM can still occasionally propose a near-duplicate tag. Acceptable residual risk for hackathon scope (worth one golden-set case to observe frequency), not solved with embeddings/clustering (stays consistent with the existing "no semantic matching" non-goal).

The **central AI decision** (the one required by CP3/R5, and the one the spec's lát cắt should hang on) is **term identification (LLM job 1)** — "which words on this page matter enough to define, and in what context" — because it's genuinely ambiguous, unlike DB lookup (deterministic composite-key match) or LLM job 2 (only fires on an already-scoped subset: terms+domain the identification step flagged AND the DB doesn't have).

Approving a page in the review screen (HITL) writes the (possibly admin-edited) term+definition+domain_tag back into the `terms` table as the canonical entry, and writes any newly-proposed domain tag into `domain_tags` — this is how both lists grow and how the LLM-call rate drops over time, deck after deck.

**Review screen UI additions (both must-have, not nice-to-have):**
- Every term row carries a **provenance badge** ("📚 Từ CSDL" vs "✨ AI tạo mới") — the concrete UI anchor for a HAX/PAIR transparency/appropriate-trust principle (R2 requires ≥4 principles each pointing to a specific prototype location): admins should scrutinize AI-generated definitions harder than reused ones.
- Every term row also shows its **domain tag** as a small chip next to the term (e.g. `AI/ML`). If the tag is newly proposed by this page (not yet in the shared `domain_tags` list), the chip is visually marked as new (e.g. "✨ Tag mới: AI/ML") — so the admin's approval is also implicitly an approval of adding that tag to the shared vocabulary, not just the definition. This is the same transparency principle extended one level: admins shouldn't unknowingly expand the shared taxonomy without seeing it happen.
- If a term-string already exists in the DB under a *different* domain tag (a miss caused by domain mismatch, not a brand-new term), flag it explicitly: "thuật ngữ này đã tồn tại ở lĩnh vực khác: [tag cũ] — đây có phải nghĩa khác không?" — because a same-string/different-domain case is exactly the scenario where an admin skimming a "from DB"-style badge could most easily miss a wrong-sense reuse.

Stack: Next.js + Tailwind frontend (mirroring the existing mock UI's screens/flow), FastAPI backend, Postgres for the terms table, Docker for deployment. Hackathon-scoped: single admin, no auth, no job queue — synchronous pipeline call is fine at this scale.

## LLM Call Contracts (interface only — not implemented yet)

Both LLM calls are treated as black boxes behind a fixed I/O contract, so the backend, review UI, and golden-set eval can all be built against the contract before any prompt/model/provider decision is made.

**Job 1 — Identify terms + domain tags**

Input:
```json
{
  "page_text": "string — extracted text of one slide page",
  "known_domain_tags": ["string", "..."]  // current contents of domain_tags table, normalized display form
}
```

Output:
```json
{
  "terms": [
    { "term": "string — display form, as it appears in context", "domain_tag": "string — reused from known_domain_tags if one fits, otherwise a newly proposed tag" }
  ]
}
```
Contract notes: `terms` may be empty (a page with no meaningful terms is valid, not an error). Duplicate `(term, domain_tag)` pairs within one page's output should be deduplicated by the caller, not assumed absent from the LLM. The caller — not the LLM — computes normalization and decides DB-hit vs miss; the LLM only proposes display-form values.

**Job 2 — Define a new term**

Input:
```json
{
  "term": "string — display form",
  "domain_tag": "string — display form",
  "page_text": "string — the page context this term was identified on",
  "conflicting_definition": {                 // present only on a same-term/different-domain miss; omitted on a brand-new term
    "domain_tag": "string — the other domain this term already has a definition under",
    "definition": "string"
  }
}
```

Output:
```json
{
  "definition": "string"
}
```
Contract notes: called once per miss (not batched across a page), so job 2's cost scales with novelty, not page size. When `conflicting_definition` is present, the definition should be written for the *current* domain tag's sense specifically — the contract doesn't ask the LLM to compare or judge the conflict, that's left to the admin in review.

Neither contract specifies model, provider, prompt wording, temperature, or retry behavior — those are implementation decisions deferred to spec/build time.

## Key Assumptions to Validate
- [ ] Composite `(term, domain_tag)` matching is a good enough proxy for "same concept" — validate by running the golden set and checking false-hit / false-miss rate, including at least one deliberate homonym case (like "Transformer").
- [ ] Admins will catch and correct bad LLM-generated definitions before approving, rather than rubber-stamping (the HITL safety net actually works) — validate with ≥1 golden-set case that seeds a deliberately wrong LLM definition and checks whether it gets caught in review.
- [ ] A global (not per-course) terms table is safe for the pilot's actual term set now that domain-tag scoping exists — validate by checking the golden set / real slide deck for any term that still collides even with domain tags applied.
- [ ] The LLM reliably reuses existing domain tags instead of inventing near-duplicates when shown the current tag list — validate by tracking how often a genuinely-new tag is proposed vs. how often it should have matched an existing one, across the golden set.

## MVP Scope
**In:**
- Upload → real PDF text extraction (per page) → LLM identify terms + domain tags (job 1) → DB lookup by composite `(term, domain_tag)` → LLM define on miss only (job 2) → aggregate → HITL review (edit/remove/add, per-page approve) → publish, writing approved terms + any new domain tags back to Postgres.
- Provenance badge per term (📚 Từ CSDL vs ✨ AI tạo mới) in review screen.
- Domain tag chip per term row, visually marked when the tag is newly proposed (not yet in the shared `domain_tags` list).
- Same-string/different-domain flag in review screen when a miss is caused by domain mismatch rather than a brand-new term.
- Global `terms` table: `term_normalized` + `domain_tag_normalized` (composite unique key), `term_display`, `domain_tag_display`, `definition`, `source` (db|llm_generated|admin_edited), `first_seen_slide`, timestamps.
- `domain_tags` table: `tag_normalized` (unique), `tag_display`, `first_seen_slide`, timestamps.
- Two real LLM calls per page at the central decision (identify+tag, then define-on-miss only), logged/traced in repo per R5.
- Golden set ≥20 cases covering: DB-hit path, LLM-miss (new term) path, LLM-miss (same term/different domain, e.g. Transformer) path, ambiguous/borderline term, deliberately-wrong-LLM-def-to-catch-in-review case, near-duplicate domain-tag proposal, PDF page with no extractable text (edge case).

**Out (see Not Doing):** image-based OCR/Tesseract/cloud OCR, semantic/embedding matching for terms or tags, per-course scoping, multi-file batch upload, term versioning/history, standalone glossary CRUD UI, auth/roles, background job queue.

## Not Doing (and Why)
- **Image-based OCR (Tesseract/cloud OCR API)** — slide decks are native digital PDFs with an embedded text layer; direct extraction (PyMuPDF/pdfplumber) is simpler, free, faster, and avoids a system dependency or API cost for a case that likely doesn't occur in practice. Revisit only if real slides turn out to be scanned/flattened images.
- **Semantic/embedding matching (for terms or domain tags)** — composite exact-normalized match is simpler, predictable, and buildable in hackathon time; embeddings add vector-store infra and false-positive risk for a benefit not yet proven necessary. The growing LLM-guided tag list is the cheaper mitigation for tag-vocabulary drift.
- **Fixed, upfront domain-tag taxonomy** — predicting the right tag granularity before seeing real content risks tags too coarse (collisions persist within a bucket) or too fine (unnecessary fragmentation); a growing list that the LLM is nudged to reuse adapts to actual content instead.
- **Per-course glossary scoping** — global table maximizes reuse (the actual point of this feature) and avoids upfront "what counts as a course" design work; revisit only if the golden set surfaces real cross-course term collisions.
- **Term versioning/history** — no product need yet for tracking how a definition changed over time; approval simply overwrites the canonical entry.
- **Standalone admin glossary CRUD screen** — the only DB-write path for hackathon scope is via slide-review approval; a separate glossary management UI is a distinct feature or a v2.
- **Auth/roles/background job queue** — single-admin hackathon scope; synchronous pipeline call is fine at this data size and doesn't need retry/observability infra to prove the concept.

## Open Questions
- Should the review screen let an admin see *which other slide* a reused DB definition originally came from (traceability), or is the badge alone enough for MVP?
- What exactly counts as the golden-set "quality bar" for a definition (accuracy vs a rubric, or just admin-approved-without-edit rate)? Needs a number before spec.md locks per R4.
- Does "admin edits a DB-sourced definition" count as a new `admin_edited` provenance, and does that edit overwrite the shared canonical entry for all future decks, or just this page? (Affects poisoning-risk severity — worth a scenario in spec.md §5-6.)
- Should an admin be able to manually merge two domain tags that turn out to mean the same thing (e.g. "AI/ML" and "machine-learning" both got created)? Not in MVP scope, but worth a scenario for what happens if drift occurs anyway despite the reuse nudge.
- If a term already exists under a different domain tag and the admin confirms "yes, same meaning, wrong tag" — should the system offer a one-click merge into the existing entry, or just let the admin manually delete the duplicate and re-approve? Affects how heavy the review-screen conflict-resolution UI needs to be.
