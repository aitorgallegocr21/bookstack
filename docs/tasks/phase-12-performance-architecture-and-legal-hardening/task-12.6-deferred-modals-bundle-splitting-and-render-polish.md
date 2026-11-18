# Task 12.6: Bundle Splitting (`@defer` Modals), Preloading Strategy & Render Micro-Optimizations

**Phase:** Phase 12: Performance, Caching, Architecture & Legal Hardening  
**Status:** Pending  
**Estimated Impact:** Medium (Splits secondary modals into lazy chunks via `@defer` across `BooksPage`, `SeriesPage`, `DashboardPage`, and `BookDetailModal`; removes residual `transition-all` violations; tightens `angular.json` bundle budgets).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/pages/books-page/books-page.html` (`L135-162`): Eager `<app-book-detail-modal>`, `<app-book-edit-modal>`, and `<app-reading-log-editor>` blocks.
- `src/app/features/series/pages/series-page/series-page.html` (`L125-153`): Eager `<app-saga-detail-modal>`, `<app-book-detail-modal>`, `<app-book-edit-modal>`, and `<app-reading-log-editor>` blocks.
- `src/app/features/dashboard/pages/dashboard-page/dashboard-page.html` (`L160-177`): Eager `<app-reading-log-editor>` and `<app-book-detail-modal>` blocks.
- `src/app/features/books/components/book-detail-modal/book-detail-modal.html` (`L350-362`): Nested `<app-reading-log-editor>` block.
- `src/app/features/dashboard/components/annual-goal-card/annual-goal-card.html` (`L68-98`): `transition-all` on progress bars (`L72`, `L92`).
- `src/app/features/dashboard/components/currently-reading-hero/currently-reading-hero.html` (`L240-255`): `transition-all` on progress bar (`L247`).
- `angular.json` (`L32-44`): Production build budgets.

**Files to Create / Update:**

- `src/app/features/books/pages/books-page/books-page.html`
- `src/app/features/series/pages/series-page/series-page.html`
- `src/app/features/dashboard/pages/dashboard-page/dashboard-page.html`
- `src/app/features/books/components/book-detail-modal/book-detail-modal.html`
- `src/app/features/dashboard/components/annual-goal-card/annual-goal-card.html`
- `src/app/features/dashboard/components/currently-reading-hero/currently-reading-hero.html`
- `angular.json`

---

## 2. Technical Objectives

1. **Lazy Chunk Splitting for Secondary Modals (`@defer`):**
   - Wrap modal invocations in `@defer (when ...)` (matching the pattern used in `src/app/app.html#L14-18`) so `BookEditModalComponent` (along with `BookMetadataLookupComponent`, `CoverPickerComponent`, `BookMetadataService`, and metadata Zod schemas), `BookDetailModalComponent`, `SagaDetailModalComponent`, and `ReadingLogEditorComponent` are emitted as on-demand lazy chunks instead of bloating the initial `/books`, `/series`, and `/` route chunks:
     - `books-page.html` (`L142-160`): wrap each `@if (selectedBookForDetail())`, `@if (selectedBookForEdit())`, and `@if (selectedBookForLog())` inside `@defer (when ...)`.
     - `series-page.html` (`L127-151`): wrap `@if (selectedSaga())`, `@if (selectedBookForDetail())`, `@if (selectedBookForEdit())`, and `@if (selectedBookForLog())` inside `@defer (when ...)`.
     - `dashboard-page.html` (`L165-176`): wrap `@if (selectedBookForLog())` and `@if (selectedBookForDetail())` inside `@defer (when ...)`.
     - `book-detail-modal.html` (`L355-361`): wrap `@if (isLogEditorOpen())` inside `@defer (when isLogEditorOpen())`.
2. **Eliminate Residual `transition-all` Classes (Core Rule 5 Compliance):**
   - Replace `transition-all duration-700 ease-out` with `transition-[width] duration-700 ease-out` in `annual-goal-card.html` (`L72`, `L92`).
   - Replace `transition-all duration-500 ease-out` with `transition-[width] duration-500 ease-out` in `currently-reading-hero.html` (`L247`).
3. **Tighten Production Build Budgets (`angular.json`):**
   - Tighten `initial` bundle budget in `angular.json` (`L35-36`) from `1MB`/`1.5MB` to `600kB` (`maximumWarning`) and `850kB` (`maximumError`) to guard against future bundle regressions.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/books/pages/books-page/books-page.spec.ts`
- [ ] `npm run test:file -- src/app/features/series/pages/series-page/series-page.spec.ts`
- [ ] `npm run test:file -- src/app/features/dashboard/pages/dashboard-page/dashboard-page.spec.ts`
- [ ] `npm run verify:quiet`
