# Task 13.3: Interactive Cover Enrichment Panel, Post-Import Prompt, Strict Title+Author Flow & Step-by-Step Visual Assistant

**Phase:** Phase 13: Post-Import Bulk Cover Enrichment & Library Cover Assistant  
**Status:** Pending  
**Estimated Impact:** High (`CoverEnrichmentSectionComponent` UI in `/settings`, post-import banner CTA in `DataPortabilitySectionComponent`, warning-gated strict Title+Author runner, 1-click Step-by-Step Visual Cover Picker, and expandable verification report).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/services/cover-enrichment.service.ts`: Signals and methods created in Task 13.2.
- `src/app/features/settings/components/data-portability-section/data-portability-section.ts` (`L30-155`): `lastImportResult` signal and `confirmImport()`.
- `src/app/features/settings/components/data-portability-section/data-portability-section.html` (`L14-40`): Post-import status banner.
- `src/app/core/i18n/domains/settings.i18n.ts`: `settings.coverEnrichment` keys added in Task 13.1.

**Files to Create / Update:**

- `src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.ts`
- `src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.html`
- `src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.spec.ts`
- `src/app/features/settings/components/data-portability-section/data-portability-section.ts`
- `src/app/features/settings/components/data-portability-section/data-portability-section.html`
- `src/app/features/settings/components/data-portability-section/data-portability-section.spec.ts`

---

## 2. Technical Objectives

1. **Post-Import Missing Cover Prompt (`DataPortabilitySectionComponent`):**
   - Add `readonly requestCoverEnrichment = output<void>()` to `DataPortabilitySectionComponent`.
   - When `lastImportResult()` has `missingCoversCount > 0`, render an inline amber/blue callout inside the import status banner showing how many books lack covers (`X con ISBN válido`) and a button (`data-testid="post-import-enrich-covers-btn"`, `min-h-[44px]`) that emits `requestCoverEnrichment` to scroll/focus and optionally start the enrichment panel.
2. **`CoverEnrichmentSectionComponent` (`src/app/features/settings/components/cover-enrichment-section/`):**
   - Standalone `OnPush` component injecting `CoverEnrichmentService` and `I18nService`.
   - **Audit Summary Header & KPI Badges:**
     - Displays total books without cover, split into **Con ISBN válido (`withValidIsbnCount`)** and **Sin ISBN (`withoutValidIsbnCount`)** (or an emerald "All books have covers" state when `totalMissing === 0`).
   - **Primary Action — Strict ISBN Batch Enrichment:**
     - Button `data-testid="start-isbn-enrichment-btn"` (`disabled` when `withValidIsbnCount === 0` or queue is running) triggers `coverEnrichmentService.runStrictIsbnEnrichment()`.
   - **Live Progress Bar & Queue Controls (`status === 'running' | 'paused'`):**
     - Displays `processedCount / totalCount` progress bar, `downloadedCount` badge, `skippedItems().length` badge, and accessible `min-h-[44px]` buttons for **Pausar / Reanudar** (`data-testid="enrichment-pause-resume-btn"`) and **Cancelar** (`data-testid="enrichment-cancel-btn"`).
   - **Dual Resolution Options for Remaining Books Without Covers:**
     - Whenever `missingCoverSummary().totalMissing > 0` (either books without ISBN or books whose ISBN returned no cover):
       1. **Option 1 — Step-by-Step Visual Cover Assistant (`data-testid="start-visual-assistant-btn"`):**
          - Opens an inline interactive card showing the current book (`title`, `author`, `publisher`, `publicationYear`, progress `X / Y`) and up to 3 candidate covers with `loading="lazy" decoding="async"`.
          - Clicking a candidate (`data-testid="visual-assistant-select-btn"`) compresses and saves that cover and moves to the next book; clicking **Saltar** (`data-testid="visual-assistant-skip-btn"`) leaves the typographic cover untouched and advances.
       2. **Option 2 — Strict Automated Title + Author Search (`data-testid="open-strict-title-search-btn"`):**
          - Toggles an explicit warning confirmation box (`data-testid="strict-title-search-warning"`) explaining that non-ISBN search only accepts exact normalized Title + Author matches ($\ge 80\times120\text{px}$) and may still match a different edition.
          - Clicking **Confirmar búsqueda estricta** (`data-testid="confirm-strict-title-search-btn"`) runs `coverEnrichmentService.runStrictTitleAuthorEnrichment()`.
   - **Expandable Verification & Skipped Books Report (`state().skippedItems.length > 0`):**
     - Renders a summary banner with `downloadedCount` and `skippedItems.length`, plus an expandable list (`data-testid="enrichment-skipped-report"`) showing each skipped book (`title`, `author`, `isbn` if any) and its localized verification reason badge.
   - **Responsive & Accessibility Compliance:**
     - Zero horizontal overflow down to `320px`, `min-h-[44px]` touch targets on all buttons, discrete CSS transitions (`transition-colors`), and `aria-live="polite"` progress updates.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.spec.ts`
- [ ] `npm run test:file -- src/app/features/settings/components/data-portability-section/data-portability-section.spec.ts`
- [ ] `npm run verify:quiet`
