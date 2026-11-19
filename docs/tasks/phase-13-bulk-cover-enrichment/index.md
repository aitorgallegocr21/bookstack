# Phase 13: Post-Import Bulk Cover Enrichment & Library Cover Assistant

**Status:** Completed  
**Target Branch:** `feature/13-bulk-cover-enrichment` $\to$ `develop`  
**Core Mission:** Deliver a privacy-first, opt-in **Bulk Cover Enrichment Engine & Interactive Cover Assistant** in `/settings` that detects books without cover images immediately after JSON/CSV imports (and anytime across the library), automatically fetches and compresses verified covers by **strict ISBN-10/13 lookup** with anti-placeholder dimension guards ($\ge 80\times120\text{px}$), and provides a dual resolution flow for remaining books without ISBN: either a **Step-by-Step Visual Cover Picker Assistant** (1-click selection or skip) or an opt-in **Strict Title + Author (+ Publisher/Year) Automated Search** with explicit user warning and a detailed verification report of skipped/unmatched books.

---

## 1. Architectural Summary & Decisions

1. **Dual Activation Entry Points (`Post-Import Banner` + `Permanent Library Cover Scanner`):**
   - Completing a JSON or CSV import in `DataPortabilitySectionComponent` reports `missingCoversCount` and `missingCoversWithIsbnCount` in `ImportExecutionResult` and offers a 1-click action to jump straight into the cover enrichment workflow.
   - `CoverEnrichmentSectionComponent` in `/settings` continuously reflects the reactive count of library books without `coverUrl` (`BooksService.books()`), allowing users to enrich missing covers at any time.
2. **Zero-False-Positive Automated ISBN Enrichment (`Tier 1 — Strict ISBN + Image Guard`):**
   - Only books with a mathematically valid ISBN-10 or ISBN-13 (`isValidIsbn()`) enter the primary automated queue.
   - Uses Open Library's multi-bibkey endpoint (`/api/books?bibkeys=ISBN:...,ISBN:...&format=json&jscmd=data`) in batches of up to 20 ISBNs per request, falling back to Google Books (`isbn:{isbn}`) when Open Library has no cover for a given ISBN.
   - Every candidate cover image is fetched and validated through `ImageOptimizerService.optimizeRemoteUrl(url, { minWidth: 80, minHeight: 120 })` before Canvas WebP/JPEG compression ($\le 360\text{px}$), rejecting $1\times1\text{px}$ blank GIFs and tiny broken placeholders.
3. **Dual Resolution for Books Without ISBN or Unmatched by ISBN (`Tier 2`):**
   - For books that lack an ISBN or whose ISBN returned no valid cover image, the user can choose between:
     - **Option A — Step-by-Step Visual Cover Assistant ("Review One by One"):** Queries `BookMetadataService.searchByQuery()` across remaining books and **only pauses for manual selection when 2 or more candidate covers exist** (displaying up to 3 covers with edition metadata for 1-click selection or skip). Books with **0 available covers** (or invalid/broken images) are automatically skipped without manual clicks and listed together in a compact **"Books without covers found"** summary panel at the end.
     - **Option B — Automated Title + Author Search (with Warning Gate):** Displays an explicit warning that non-ISBN lookups can occasionally match a different edition. Upon confirmation, runs a rate-limited queue that prefers exact normalized title and author token agreement (ranking by `publisher` / `publicationYear`), **directly applies any unique single-cover match (`candidatesWithCover.length === 1`)** even across translated titles or author spelling variations, and always enforces the $\ge 80\times120\text{px}$ cover dimension guard.
4. **Rate-Limited Queue, Incremental Persistence & Verification Report:**
   - Controlled concurrency (`2` parallel image downloads, `250ms` pacing between batches) with real-time progress bar, **Pause / Resume**, and **Cancel** controls.
   - Incremental persistence via `BooksService.updateMany()` every 5 resolved covers so progress is immediately saved to `IndexedDB` even if paused or cancelled midway.
   - Expandable **Verification & Skipped Books Report** listing every book that remained without a cover and its exact verification status (`missing_isbn`, `no_metadata_found`, `no_cover_in_provider`, `mismatch_verification`, `invalid_cover_dimensions`, `network_error`).

---

## 2. Atomic Task Breakdown

- [x] **[Task 13.1: Cover Dimension Guard, Multi-ISBN Batch Metadata Lookup & Bilingual i18n](task-13.1-cover-dimension-guard-batch-metadata-and-i18n.md)** — Add `minWidth`/`minHeight` anti-placeholder verification to `ImageOptimizerService`, multi-ISBN batch parsing & strict title/author verification helpers to `BookMetadataService` and `book-metadata.schema.ts`, and bilingual `es`/`en` translations in `settings.i18n.ts`.
- [x] **[Task 13.2: Bulk Cover Enrichment Service, Rate-Limited Queue, Incremental IndexedDB Sync & Verification Report](task-13.2-cover-enrichment-service-queue-and-report.md)** — Define `cover-enrichment.model.ts`, build `CoverEnrichmentService` with reactive missing-cover detection, pausable/cancellable ISBN & strict Title+Author queues, incremental `BooksService.updateMany()` persistence, and extend `ImportExecutionResult` with missing-cover counters.
- [x] **[Task 13.3: Interactive Cover Enrichment Panel, Post-Import Prompt, Strict Title+Author Flow & Step-by-Step Visual Assistant](task-13.3-cover-enrichment-panel-and-visual-assistant.md)** — Build `CoverEnrichmentSectionComponent` in `/settings` featuring the missing-cover audit card, live progress bar with Pause/Cancel, warning-gated strict Title+Author runner, 1-click Step-by-Step Visual Cover Assistant, and collapsible verification report.
- [x] **[Task 13.4: Settings Integration, Playwright E2E Verification & Tier 2 Per-Phase Sync](task-13.4-settings-integration-e2e-and-docs-sync.md)** — Wire `CoverEnrichmentSectionComponent` and post-import CTA into `SettingsPage` and `DataPortabilitySectionComponent`, add Playwright E2E coverage in `tests/e2e/settings-flow.spec.ts`, pass `npm run verify:quiet` + `npm run test:e2e`, and execute Tier 2 Per-Phase documentation sync.

---

## 3. Post-Phase Refinements (Direct Fixes on `develop`)

- [x] **Single-Cover Auto-Application in Title + Author Pass & Multi-Cover-Only Visual Assistant:**
  - `BookMetadataService.verifyStrictTitleAuthorCandidate()` now accepts any unique single-cover result (`candidatesWithCover.length === 1`) directly during the automated Title + Author enrichment pass (even when title translation or author transliteration/formatting differs), reserving `mismatch_verification` strictly for ambiguous multi-cover results.
  - `CoverEnrichmentService.startVisualAssistant()` now pauses for manual review **only on books with $\ge 2$ candidate covers**. Books with 0 available covers (or invalid single covers failing the $\ge 80\times120\text{px}$ guard) are automatically collected into `assistantNotFoundBooks` and displayed in a single compact summary card (`visual-assistant-not-found-card`) instead of forcing one-by-one manual skipping.
