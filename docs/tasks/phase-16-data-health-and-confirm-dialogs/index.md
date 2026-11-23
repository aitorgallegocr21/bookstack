# Phase 16: Data Health, Temporal Bounds Fix (`2925`) & Native Confirmation Dialog Engine

**Status:** In Progress  
**Target Branch:** `feat/phase-16-data-health-and-confirm-dialogs` $\to$ `develop`  
**Core Mission:** Eliminate native browser `window.confirm()` alerts in favor of an accessible, Signal-driven in-app Confirmation Dialog Engine (`ConfirmDialogService` + `<app-confirm-dialog>`), resolve the anomalous year filter defect (`2925`) in `/stats` while distinguishing historical book publication years (`publicationYear`) from personal reading activity dates (`startDate`, `endDate`, `ReadingLog.date`) and external metadata provider values vs. manual user entry, and deliver a 1-click **Library Data Health Auditor** in `/settings`.

---

## 1. Architectural Summary & Resolved Decisions

1. **Temporal Sanity Bounds, Antique Book Tolerance & `/stats` Year Filter Fix (`2925` Defect):**
   - **Personal Reading Activity Dates (`startDate`, `endDate`, `ReadingLog.date`):**
     - Represent when the user personally started, finished, or logged a reading session.
     - Logical bounds for personal reading dates are enforced at **`1900-01-01` through `currentYear + 1`** across `BookSchema`, `ReadingLogSchema`, `<input type="date">` / `<input type="datetime-local">` controls (`min`/`max`), and `DataPortabilityService` import normalizers.
     - Impossible future dates (`> currentYear + 1`, such as typo year `2925` instead of `2025`) are rejected in forms and sanitized during imports.
   - **Historical / Antique Book Publication Years (`Book.publicationYear`) & Source-Aware Warning:**
     - Books can be hundreds of years old (classic or antique works from prior centuries, e.g., `1605` or `1499`). Therefore, `BookSchema` permits historical `publicationYear` values (`1000`–`currentYear + 1` or positive integers $\le \text{currentYear} + 1$) while strictly blocking impossible future years (`> currentYear + 1` like `2925`).
     - **External Database / Metadata Provider Values (`Open Library`, `Google Books`, `Wikidata`, `Apple Books`, `Internet Archive / Crossref`):** When `publicationYear` (or a date) is populated via public metadata lookup (`BookMetadataService`), integral auto-enrichment (`CoverEnrichmentService`), or backup import, historical years $\le \text{currentYear} + 1$ are trusted and saved silently without warning prompts.
     - **Manual User Entry (`BookCreateModalComponent` & `BookEditModalComponent`):** When a user **manually** types an unusually old `publicationYear` (e.g., $< 1900$) or manual date that did not originate from an external metadata provider candidate, the form does **not** hard-block saving; instead, it displays an explicit confirmation warning asking the user to verify that the antique year/date is intentional and not a typo before persisting.
   - **`AnalyticsService` Hardening (`/stats`):**
     - `AnalyticsService.availableYears()` and the `all-time` multi-year trend bucket generator strictly clamp and filter reading activity years to `[1900..currentYear + 1]` so anomalous typo years (`2925`) can never pollute the `/stats` year selector dropdown or spawn hundreds of empty chart buckets.

2. **Signal-Driven Native Confirmation Dialog Engine (`ConfirmDialogService` & `<app-confirm-dialog>`):**
   - **Zero `window.confirm()` Policy:** Replaces all native browser confirmation alerts with a Promise-based, Signal-driven modal component mounted once in the root application shell (`App`).
   - **Accessibility & Shell Integration:** Integrates with `UiStateService.acquireScrollLock()` / `releaseScrollLock()`, traps focus, supports `Escape` and backdrop dismissal, and uses discrete Tailwind CSS v4 transitions.
   - **Contextual Entity Summaries & Severity Variants:**
     - Supports `danger` (destructive deletion / library overwrite), `warning` (unlinking from saga, antique manual year confirmation, reversible bulk actions), and `info` variants.
     - Renders an optional contextual entity summary card inside the modal (e.g., cover thumbnail + book title/author when deleting a book; formatted date + pages read when deleting a reading session; saga name + volume count when unlinking a book or deleting saga metadata).
   - **Optional Minor-Action Suppression ("Do not ask again for minor actions"):**
     - Supports a `suppressibleKey?: ConfirmSuppressionKey` option (e.g., `'deleteReadingLog' | 'unlinkSagaBook'`). When checked by the user, future prompts for that minor action key auto-resolve to `true` via persisted preferences in `StorageAdapterService` (while destructive high-impact actions like deleting a book or overwriting the entire library always require explicit confirmation).

3. **Application-Wide Confirmation Dialog Integrations:**
   - **Books Domain (`/books`):** Deleting a book from `BooksPage` (grid cards, detailed cards, compact rows) or `BookDetailModalComponent`, and deleting a `ReadingLog` session from `BooksPage` or `BookDetailModalComponent`.
   - **Series Domain (`/series`):** Unlinking a book from a saga in `SagaDetailModalComponent` and deleting custom persisted `SeriesMetadata` when managing sagas.
   - **Settings Domain (`/settings`):** Confirming destructive `Overwrite` mode in `DataPortabilitySectionComponent` before replacing the existing library, and confirming manual antique date/year warnings in book forms.

4. **Library Data Health Auditor & 1-Click Remediation Engine (`DataHealthService` in `/settings`):**
   - **100% Local Diagnostic Scanner:** Inspects persisted books, reading logs, and sagas in a single pass to detect 4 categories of data health anomalies:
     1. **Temporal Anomalies:** Impossible future years/dates (`> currentYear + 1`, such as `2925`), unconfirmed ancient reading activity dates (`< 1900`), or inverted date ranges (`endDate < startDate`).
     2. **Progress & Page Count Inconsistencies:** Books marked as `completed` with `totalPages <= 1` or `currentPage < totalPages`, or books where `currentPage > totalPages`.
     3. **Probable Duplicate Books:** Distinct book records sharing the same normalized ISBN-10/13 or identical normalized `title + author` key.
     4. **Fragmented or Near-Duplicate Sagas:** Series names differing only by casing, accents, punctuation, or trailing whitespace, or saga volumes missing `volumeNumber`.
   - **Guided 1-Click Remediations:**
     - Fix anomalous dates/years in-place (e.g., auto-correcting `2925` $\to$ `2025` or clamping/swapping inverted `startDate`/`endDate`), sync `currentPage = totalPages` on completed books, unify near-duplicate saga names, or remove duplicate records with `<app-confirm-dialog>` verification.

---

## 2. Atomic Task Breakdown

- [x] **[Task 16.1: Temporal Bounds Hardening, Manual Antique Year Warning Rule & `/stats` Anomalous Year (`2925`) Fix](task-16.1-temporal-bounds-and-stats-2925-year-fix.md)** — Create centralized temporal validation utilities (`temporal-bounds.utils.ts`), harden `AnalyticsService.availableYears()` and `all-time` trend buckets against `2925`, enforce reading date bounds in `BookSchema`/`ReadingLogSchema` and `DataPortabilityService`, and distinguish external provider `publicationYear` values from manual antique years ($< 1900$).
- [x] **[Task 16.2: Signal-Driven Confirmation Dialog Engine (`ConfirmDialogService` & `<app-confirm-dialog>`)](task-16.2-confirm-dialog-engine-and-preferences.md)** — Build `ConfirmDialogService`, `<app-confirm-dialog>`, contextual entity preview cards, severity variants (`danger`, `warning`, `info`), minor-action suppression persistence in `StorageAdapterService`, root shell mounting in `App`, and bilingual `es`/`en` i18n keys.
- [x] **[Task 16.3: Application-Wide Confirmation Dialog Integrations (`/books`, `/series`, `/settings` & Manual Antique Year Prompt)](task-16.3-app-wide-confirm-dialog-integrations.md)** — Replace all `window.confirm()` calls in `BooksPage` and `BookDetailModalComponent`, wire confirmation dialogs for manual antique year/date entry in `BookCreateModalComponent`/`BookEditModalComponent`, saga unlinking/deletion in `SagaDetailModalComponent`, and `Overwrite` backup import in `DataPortabilitySectionComponent`.
- [x] **[Task 16.4: Library Data Health Auditor & 1-Click Remediation Engine (`/settings`)](task-16.4-library-data-health-auditor-and-remediation.md)** — Implement `DataHealthService` and `<app-data-health-section>` in `/settings` to detect and fix anomalous dates (`2925`, `endDate < startDate`), completed-book page mismatches, probable duplicates, and fragmented saga names in 1 click.
- [ ] **[Task 16.5: Phase 16 Verification, Regression Specs & Playwright E2E Suite](task-16.5-e2e-verification-and-tier-2-docs-sync.md)** — Add Playwright E2E tests covering custom confirmation dialogs, the `/stats` `2925` year filter immunity, manual antique year confirmation vs. provider lookup, and the `/settings` Data Health Auditor, then execute the Tier 2 Per-Phase Documentation & Branch Hygiene Sync.
