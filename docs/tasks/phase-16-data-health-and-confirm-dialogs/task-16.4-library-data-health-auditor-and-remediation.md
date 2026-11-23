# Task 16.4: Library Data Health Auditor & 1-Click Remediation Engine (`/settings`)

**Phase:** Phase 16: Data Health, Temporal Bounds Fix (`2925`) & Native Confirmation Dialog Engine  
**Status:** Pending  
**Estimated Impact:** High (Delivers a 100% local Library Data Health Auditor in `/settings` that detects anomalous years like `2925`, inverted reading dates, completed books with `0`/`1` pages, probable duplicate books, and fragmented saga names, offering guided 1-click fixes).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/services/books.service.ts` (`L1-133`): Book CRUD and batch persistence (`update`, `remove`).
- `src/app/features/books/services/reading-log.service.ts` (`L1-98`): Reading log CRUD and update methods.
- `src/app/features/series/services/series.service.ts` (`L1-160`): Saga grouping and bulk series name updates.
- `src/app/features/settings/pages/settings-page/settings-page.ts` (`L1-60`) & `settings-page.html` (`L1-26`): Settings sections layout.
- `src/app/core/i18n/domains/settings.i18n.ts` (`L1-354`): Settings domain dictionary (`ES_SETTINGS` / `EN_SETTINGS`).

**Files to Create / Update:**

- `src/app/features/settings/models/data-health.model.ts` _(new)_
- `src/app/features/settings/services/data-health.service.ts` _(new)_
- `src/app/features/settings/services/data-health.service.spec.ts` _(new)_
- `src/app/features/settings/components/data-health-section/data-health-section.ts` _(new)_
- `src/app/features/settings/components/data-health-section/data-health-section.html` _(new)_
- `src/app/features/settings/components/data-health-section/data-health-section.spec.ts` _(new)_
- `src/app/features/settings/pages/settings-page/settings-page.ts`
- `src/app/features/settings/pages/settings-page/settings-page.html`
- `src/app/features/settings/pages/settings-page/settings-page.spec.ts`
- `src/app/core/i18n/domains/settings.i18n.ts`

---

## 2. Technical Objectives

1. **Data Health Domain Contracts (`src/app/features/settings/models/data-health.model.ts`):**
   - Define structured issue types and remediation actions:
     ```ts
     export type DataHealthIssueCategory =
       'temporal-anomaly' | 'progress-mismatch' | 'duplicate-book' | 'fragmented-saga';

     export type DataHealthIssueSeverity = 'high' | 'medium' | 'low';

     export interface DataHealthIssue {
       id: string;
       category: DataHealthIssueCategory;
       severity: DataHealthIssueSeverity;
       title: string;
       description: string;
       affectedBookIds: string[];
       affectedLogIds?: string[];
       suggestedValueLabel?: string;
       canAutoFix: boolean;
     }

     export interface DataHealthReport {
       totalIssuesCount: number;
       autoFixableCount: number;
       healthScorePercent: number;
       issuesByCategory: Record<DataHealthIssueCategory, DataHealthIssue[]>;
       allIssues: DataHealthIssue[];
     }
     ```

2. **Reactive Single-Pass Diagnostic & Remediation Engine (`src/app/features/settings/services/data-health.service.ts`):**
   - Compute `readonly report = computed<DataHealthReport>(...)` reactively from `BooksService.books()`, `ReadingLogService.readingLogs()`, and `SeriesService`:
     1. **Temporal Anomalies (`temporal-anomaly`):**
        - Detects any `Book` where `publicationYear > getMaxAllowedYear()` (e.g., `2925`) or `startDate` / `endDate` contains an out-of-range year (`< 1900` or `> getMaxAllowedYear()`, e.g., `2925-04-12`).
        - Detects inverted reading ranges (`startDate && endDate && endDate < startDate`).
        - Detects any `ReadingLog` where `log.date` contains an out-of-range year (`< 1900` or `> getMaxAllowedYear()`).
        - **1-Click Auto-Fix:** Rewrites typo years using `suggestCorrectedYear()` (e.g., `2925` $\to$ `2025`) or swaps inverted `startDate`/`endDate`.
     2. **Progress & Page Count Inconsistencies (`progress-mismatch`):**
        - Detects books with `status === 'completed'` where `currentPage < totalPages` or placeholder `totalPages <= 1`.
        - Detects books with `status === 'pending'` where `currentPage > 0`.
        - **1-Click Auto-Fix:** Synchronizes `currentPage = totalPages` for completed books (or transitions `pending` books with `currentPage > 0` to `reading`).
     3. **Probable Duplicate Books (`duplicate-book`):**
        - Groups books by normalized ISBN-13/10 (`normalizeIsbn`) and by normalized `title + author` key.
        - **1-Click Guided Fix:** Allows keeping the most complete record (with cover, higher `currentPage`, or more fields) and removing the redundant duplicate after confirming via `ConfirmDialogService`.
     4. **Fragmented or Near-Duplicate Sagas (`fragmented-saga`):**
        - Detects series names that normalize to the same `normalizeSeriesKey()` but have inconsistent raw display strings across books (e.g., `"El Archivo de las Tormentas"` vs `"el archivo de las tormentas "`), or saga volumes missing `volumeNumber`.
        - **1-Click Auto-Fix:** Unifies the raw `book.series.name` across all volumes of the saga to the canonical display name.
   - Provide `applyIssueFix(issueId: string): Promise<boolean>` and `applyAllAutoFixes(): Promise<number>` (protected by `ConfirmDialogService` when applying bulk fixes).

3. **Data Health Auditor Section Component (`src/app/features/settings/components/data-health-section/`):**
   - Standalone `OnPush` component `<app-data-health-section>` mounted in `SettingsPage` (`settings-page.html`).
   - Displays:
     - **Health Score Badge & Executive Summary:** Shows `100% Healthy` emerald state when `totalIssuesCount === 0`, or the detected issue count broken down by the 4 categories when anomalies exist.
     - **"Fix All Auto-Fixable Issues (N)" Button:** Runs `applyAllAutoFixes()` after confirming via `<app-confirm-dialog>`.
     - **Expandable Issue List:** Shows each detected `DataHealthIssue` with affected book title/author, current vs. suggested value badge (e.g., `2925 → 2025`), and a 1-click **"Fix"** button.

4. **Bilingual i18n (`src/app/core/i18n/domains/settings.i18n.ts`):**
   - Add `dataHealth` section to `SettingsTranslations`, `ES_SETTINGS`, and `EN_SETTINGS` covering category titles, issue descriptions, suggested fix badges, health score states, and success feedback messages.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/settings/services/data-health.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/settings/components/data-health-section/data-health-section.spec.ts`
- [ ] `npm run test:file -- src/app/features/settings/pages/settings-page/settings-page.spec.ts`
- [ ] `npm run verify:quiet`
