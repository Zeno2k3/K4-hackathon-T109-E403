# Fix: Line-Wrapped Terms in PDF Text Extraction

## Problem Statement

How might we prevent PyMuPDF's line-based text extraction from splitting a
single visually-wrapped term or label (e.g. "Reactive Agent" wrapped across
two lines inside a narrow diagram box) into separate lines, which causes the
LLM's `identify()` call to evaluate "Reactive" and "Agent" as two weak
independent term candidates instead of one strong compound term?

## Investigation

Initial hypothesis was a simple heuristic on `page.get_text("blocks")`: join
lines within a block when the block is short and unpunctuated (the profile
of a diagram-box label vs. a paragraph or bullet list). This was **not**
validated against real data before proposing it, and testing against a
synthetic PDF (built with PyMuPDF's own `insert_textbox()`) turned up a
real flaw: a short bullet list inside one textbox (`"Memory\nTool Use\n
Planning\nReflection"`) also collapses into a single block with `\n`
between items — structurally indistinguishable from a genuine wrap at the
block level. The word-count/punctuation heuristic would have merged four
distinct bullet items into one string.

Testing directly against the user's real file
(`chunked-day03-tu-chatbot-den-agentic-agent-react_manh_v2.pdf`, page 2 —
the exact flow diagram from the bug report) surfaced a second, more
important finding: PyMuPDF's own block segmentation is **inconsistent**
even within one real page. "LLM\nChatbot" came back as a single block with
an internal newline, while "Reactive" / "Agent" and "Rule-based" / "Bot"
each came back as two *separate* top-level blocks. Any fix operating only
"within a block" would silently do nothing for the majority of the actual
cases on this page.

Moving to line-level geometry (`page.get_text("dict")`, unsorted / natural
content-stream order) and comparing the vertical gap between consecutive
lines — normalized by the first line's height — produced a clean,
wide-margin signal across every case on the real page:

| Relationship | Ratio (vgap / line height) |
|---|---|
| Genuine same-label / same-sentence wrap | 0.23 – 0.43 |
| Real boundary (box title → caption, section → section) | 1.63 – 2.9+ |

This held for every pair on the page, including multi-line captions like
"If/else → cứng → predictable" and "Trả lời thông minh → nhưng chủ yếu 1 →
lượt", not just short box-title labels — a more general signal than the
original word-count/punctuation heuristic, and one that's now grounded in
the actual file rather than an assumption about it.

`sort=True` (PyMuPDF's built-in reading-order heuristic) was also tested
and made things worse for this layout — it grouped all four box titles
together first, then all captions after, breaking the title→caption
adjacency the algorithm depends on. Natural (unsorted) content-stream order
was correct; the horizontal-overlap check already filters out the
cross-column noise that unsorted order introduces.

## Recommended Direction

Rewrite `extract_pages()` in `backend/app/services/extraction.py` to:

1. Use `page.get_text("dict")` instead of `page.get_text()`.
2. Flatten to a single ordered list of `(bbox, text)` lines across all
   blocks, preserving natural (unsorted) content-stream order.
3. Walk consecutive line pairs. Merge with `" "` (after stripping each
   line's text) when `(vgap / height_of_first_line) < 0.8` **and** the two
   lines' x-ranges overlap. Otherwise join with `"\n"`, exactly as before.
4. This subsumes the original single-block case ("LLM\nChatbot") and the
   cross-block case ("Reactive" + "Agent" as separate blocks) under one
   rule, since it operates on lines, not PyMuPDF's own (inconsistent) block
   grouping.

## Key Assumptions to Validate

- [x] Real wrapped labels in this deck have `vgap/height` in the 0.23–0.43
      range — confirmed against the actual PDF, not synthetic data
- [x] Real element boundaries (title → caption) have `vgap/height` in the
      1.63+ range, giving a safe threshold at ~0.8 — confirmed
- [ ] The 0.8 threshold generalizes to other slide decks/templates beyond
      this one file — only one real deck has been tested so far
- [ ] A genuinely tight bullet list (small leading between distinct items)
      could still produce a low ratio and get incorrectly merged — no case
      like this has been observed yet, but it hasn't been ruled out either;
      the HITL review step (existing `PATCH .../terms/{id}` endpoint) is
      the accepted fallback if this happens in practice

## MVP Scope

- Rewrite `extract_pages()` using the line-geometry merge rule above
- Unit test built from this real PDF (page 2) as ground truth — extract the
  exact expected joined string for the "Reactive Agent", "Rule-based Bot",
  "Autonomous Agent", and "LLM Chatbot" cases, rather than another
  synthetic approximation
- Regression test confirming title → caption boundaries stay as separate
  lines (not merged), using the same real page

## Not Doing (and Why)

- Word-count/punctuation heuristic on `get_text("blocks")` (original
  Direction A) — disproven by testing: PyMuPDF's block grouping is
  inconsistent on the real file, and the heuristic can't distinguish a
  short wrapped label from a short bullet list at the block level
- `sort=True` reading order — tested and found to break title→caption
  adjacency for this multi-column diagram layout
- Prompt-level merge instruction to the LLM — redundant once extraction is
  fixed at the root; the model would never see split fragments to begin
  with
- Detect-and-repair after LLM output — the model's importance judgment
  already happens on the weaker split terms before any repair step could
  run
- OCR/layout-model-based extraction — explicit non-goal per
  `docs/specs/backend-spec.md` (native digital PDFs only, no OCR engine)

## Open Questions

- Does the 0.8 ratio threshold need per-deck tuning, or does it hold across
  decks from different authoring tools (PowerPoint vs. Canva vs. Google
  Slides export)? Only testable once more real decks are available.
- Should the golden set (`backend/eval/`, Task 21) get a dedicated
  "wrapped-term extraction" case category, using this real PDF page as the
  fixture, alongside the existing DB-hit/conflict/no-text cases?
