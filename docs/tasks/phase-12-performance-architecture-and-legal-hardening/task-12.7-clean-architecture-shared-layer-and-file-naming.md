# Task 12.7: Clean Architecture Boundaries, Shared UI Primitives (`src/app/shared/`) & File Naming Unification

**Phase:** Phase 12: Performance, Caching, Architecture & Legal Hardening  
**Status:** Pending  
**Estimated Impact:** High (Eliminates `core/` $\to$ `features/` dependency inversion, consolidates duplicate `isCreateModalOpen` state, extracts `src/app/shared/utils/book-display.utils.ts`, and standardizes all 10 legacy `.component.*` files to Angular 22+ suffixless naming).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/core/services/ui-state.service.ts` (`L1-55`): `isCreateModalOpen` signal (`L15`, `L32-38`).
- `src/app/features/books/services/books.service.ts` (`L1-25`, `L120-133`): `CreateBookPrefill`, `isCreateModalOpen`, `createModalPrefill`, `openCreateModal()`, `closeCreateModal()`.
- `src/app/core/components/sidebar/sidebar.component.ts` (`L1-95`): Imports `BooksService` (`L18`) to call `openCreateModal()`.
- `src/app/core/components/header/header.component.ts` (`L1-45`): Imports `BooksService` (`L12`) to call `openCreateModal()`.
- `src/app/features/analytics/pages/stats-page/stats-page.ts` (`L25-36`): Calls both `uiState.openCreateModal()` and `booksService.openCreateModal()`.
- `src/app/core/services/storage-adapter.service.ts` (`L1-15`, `L280-305`): Imports `CatalogSortOption`, `CatalogViewMode` from `features/books/models/catalog-filter.model`.
- Duplicated status badge / rating helpers across:
  - `src/app/features/books/pages/books-page/books-page.ts` (`L205-222`)
  - `src/app/features/books/components/book-grid-card/book-grid-card.component.ts` (`L55-60`)
  - `src/app/features/books/components/book-detailed-card/book-detailed-card.component.ts` (`L55-68`)
  - `src/app/features/books/components/book-compact-row/book-compact-row.component.ts` (`L52-57`)
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.ts` (`L117-129`, `L159-165`)
  - `src/app/features/series/components/saga-detail-modal/saga-detail-modal.component.ts` (`L232-242`)
- Legacy `.component.*` files to rename to suffixless Angular 22+ standard (`*.ts`, `*.html`, `*.spec.ts`):
  - `src/app/core/components/sidebar/sidebar.component.{ts,spec.ts}` $\to$ `sidebar.{ts,spec.ts}`
  - `src/app/core/components/header/header.component.{ts,html,spec.ts}` $\to$ `header.{ts,html,spec.ts}`
  - `src/app/core/components/bottom-nav/bottom-nav.component.{ts,html,spec.ts}` $\to$ `bottom-nav.{ts,html,spec.ts}`
  - `src/app/features/books/components/book-grid-card/book-grid-card.component.{ts,html,spec.ts}` $\to$ `book-grid-card.{ts,html,spec.ts}`
  - `src/app/features/books/components/book-detailed-card/book-detailed-card.component.{ts,html,spec.ts}` $\to$ `book-detailed-card.{ts,html,spec.ts}`
  - `src/app/features/books/components/book-compact-row/book-compact-row.component.{ts,html,spec.ts}` $\to$ `book-compact-row.{ts,html,spec.ts}`
  - `src/app/features/books/components/catalog-toolbar/catalog-toolbar.component.{ts,html,spec.ts}` $\to$ `catalog-toolbar.{ts,html,spec.ts}`
  - `src/app/features/series/components/saga-bento-card/saga-bento-card.component.{ts,html,spec.ts}` $\to$ `saga-bento-card.{ts,html,spec.ts}`
  - `src/app/features/series/components/saga-detail-modal/saga-detail-modal.component.{ts,html,spec.ts}` $\to$ `saga-detail-modal.{ts,html,spec.ts}`
  - `src/app/features/series/components/series-toolbar/series-toolbar.component.{ts,html,spec.ts}` $\to$ `series-toolbar.{ts,html,spec.ts}`

**Files to Create / Update:**

- `src/app/shared/utils/book-display.utils.ts`
- `src/app/shared/utils/book-display.utils.spec.ts`
- `src/app/core/services/ui-state.service.ts`
- `src/app/core/services/storage-adapter.service.ts`
- `src/app/features/books/services/books.service.ts`
- All 10 renamed component directories and their importing parent files (`app.ts`, `books-page.ts`, `series-page.ts`).

---

## 2. Technical Objectives

1. **Zero `core/` $\to$ `features/` Dependency Inversion:**
   - Move `CreateBookPrefill` into `UiStateService` (`src/app/core/services/ui-state.service.ts`) so `UiStateService` is the single canonical owner of `isCreateModalOpen` and `createModalPrefill`.
   - Have `BooksService.isCreateModalOpen`, `createModalPrefill`, `openCreateModal(prefill?)`, and `closeCreateModal()` delegate directly to `UiStateService` (preserving 100% compatibility for existing feature callers and tests).
   - Update `SidebarComponent` and `HeaderComponent` in `core/components/` to trigger `this.uiState.openCreateModal()` instead of importing `BooksService`, and remove the redundant double call in `StatsPage.openCreateModal()`.
   - Remove the `features/books/models/catalog-filter.model` import from `StorageAdapterService` by defining the persisted preference string union/guards in `core/` (or re-exporting from `catalog-filter.model.ts`) so `src/app/core/` has **zero** imports pointing to `src/app/features/`.
2. **Shared UI Display Helpers (`src/app/shared/utils/book-display.utils.ts`):**
   - Extract `getStatusBadgeClass(status: ReadingStatus): string` and `formatRatingBadge(score?: number): string` into `src/app/shared/utils/book-display.utils.ts`.
   - Replace the 6 duplicated implementations in `BooksPage`, `BookGridCardComponent`, `BookDetailedCardComponent`, `BookCompactRowComponent`, `BookDetailModalComponent`, and `SagaDetailModalComponent` with imports from `src/app/shared/utils/book-display.utils`.
3. **100% Unified Component File Naming (`*.ts`, `*.html`, `*.spec.ts`):**
   - Rename (`git mv`) the 10 legacy `.component.*` component sets to the modern suffixless convention used by the rest of the codebase (`sidebar.ts`, `header.ts`, `bottom-nav.ts`, `book-grid-card.ts`, `book-detailed-card.ts`, `book-compact-row.ts`, `catalog-toolbar.ts`, `saga-bento-card.ts`, `saga-detail-modal.ts`, `series-toolbar.ts`).
   - Update `templateUrl` references inside those components and update their import paths in `app.ts`, `app.spec.ts`, `books-page.ts`, `books-page.spec.ts`, `series-page.ts`, and `series-page.spec.ts`.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/shared/utils/book-display.utils.spec.ts`
- [ ] `npm run test:file -- src/app/core/components/sidebar/sidebar.spec.ts`
- [ ] `npm run test:file -- src/app/core/components/header/header.spec.ts`
- [ ] `npm run verify:quiet`
