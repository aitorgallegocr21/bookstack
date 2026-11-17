# Task 11.4: Saga Bento Gallery Page (`/series`), Variable-Scale Bento Cards & Filter Toolbar

**Phase:** Phase 11: Sagas, Series & Collections Management (`/series`)  
**Status:** Completed  
**Estimated Impact:** High (New `/series` page, `SeriesToolbarComponent`, variable-scale `SagaBentoCardComponent` (`compact` 1×1, `medium` 2×1, `showcase` 2×2), empty states, 1-click "Continue / Next Volume" CTA, and `320px` responsive overflow safety).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/series/models/series.model.ts`: `SagaAggregation`, `SagaBentoScale`, `SagaFilterStatus`, `SagaSortOption`, `SagaStatusCounts`.
- `src/app/features/series/services/series.service.ts`: Reactive `sagas`, `filteredSagas`, `statusCounts`, `searchQuery`, `statusFilter`, `sortOption`, `resetFilters()`.
- `src/app/features/books/components/catalog-toolbar/catalog-toolbar.component.html` (`L1-150`): Reference Tailwind v4 search bar, wrapping status chips, and sort select styling.
- `src/app/features/books/pages/books-page/books-page.html` (`L1-141`): Reference empty-library / zero-match filter empty states and modal coordination.
- `src/app/features/books/pages/books-page/books-page.ts` (`L121-225`): Reference `openDetailModal`, `openEditModal`, `openReadingLogEditorForId`, `deleteBook`.
- `docs/DESIGN_SYSTEM.md` (`L15-61`): Surface tokens, `320px` overflow rules, and banned `transition-all` rule.

**Files to Create / Update:**

- `src/app/features/series/components/series-toolbar/series-toolbar.component.ts`
- `src/app/features/series/components/series-toolbar/series-toolbar.component.html`
- `src/app/features/series/components/series-toolbar/series-toolbar.component.spec.ts`
- `src/app/features/series/components/saga-bento-card/saga-bento-card.component.ts`
- `src/app/features/series/components/saga-bento-card/saga-bento-card.component.html`
- `src/app/features/series/components/saga-bento-card/saga-bento-card.component.spec.ts`
- `src/app/features/series/pages/series-page/series-page.ts`
- `src/app/features/series/pages/series-page/series-page.html`
- `src/app/features/series/pages/series-page/series-page.spec.ts`

---

## 2. Technical Objectives

1. **Series Filter & Sort Toolbar (`SeriesToolbarComponent`):**
   - Live search input querying saga name, author, and member book titles (with clear button `min-h-[44px]`/`min-w-[44px]`).
   - Wrapping horizontal filter chips with live counters: `all`, `reading`, `completed`, `pending`, and `has-gaps`.
   - Sort dropdown (`recent`, `progress-desc`, `volumes-desc`, `rating-desc`, `title-asc`) and contextual active-filter reset button.
   - Fully responsive down to `320px` (`flex-wrap`, `min-w-0`, zero horizontal page overflow).
2. **Variable-Scale Bento Saga Card (`SagaBentoCardComponent`):**
   - `ChangeDetectionStrategy.OnPush`, `host` classes applying responsive Bento Grid spans derived from `saga().bentoScale`:
     - `'compact'` (1–2 vols): `md:col-span-6 lg:col-span-4` — layered/stacked dual covers (`loading="lazy" decoding="async"`), saga title & author, owned/expected volume pill, completion progress bar, missing-gap pill if any, and smart CTA.
     - `'medium'` (3–5 vols): `md:col-span-6 lg:col-span-8` — panoramic horizontal cover strip (`overflow-x-auto` contained inside the card with `min-w-0`) showing each volume cover (or crisp fallback spine), `Vol. X` badge, status dot, and dashed ghost slots for missing volumes (`Vol. Y`), plus saga progress bar & smart CTA.
     - `'showcase'` (6+ vols): `md:col-span-12 lg:col-span-8 md:row-span-2` — modern showcase card with rich cover mosaic / scrollable shelf, aggregated metrics strip (pages read / total pages, average rating, hours logged), missing-volume counter, and a highlighted mini-card for `nextBookToRead` (`Continuar Vol. X · XX%` or `Empezar Vol. X`).
   - Emits `openSaga = output<SagaAggregation>()`, `openBook = output<string>()`, `continueBook = output<Book>()`, and `addMissingVolume = output<{ seriesName: string; volumeNumber: number }>()`.
   - Clicking a book thumbnail stops event propagation and opens that book directly; clicking the card opens the Saga Detail Modal (Task 11.5); clicking `+ Vol. X` pre-opens `BookCreateModalComponent`.
   - Uses discrete CSS transitions only (`transition-colors`, `transition-transform`, `transition-opacity`).
3. **Series Page Coordinator (`SeriesPage`):**
   - Header with title, subtitle, and `md:hidden` segmented switcher (`Libros` `routerLink="/books"` | `Sagas` active) mirroring `BooksPage`.
   - Renders `SeriesToolbarComponent` + responsive 12-column Bento Grid (`grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[minmax(200px,auto)]`).
   - Dual empty states:
     - **No sagas in library yet:** Explains how to assign a saga when creating/editing a book, with a primary button calling `booksService.openCreateModal()` and a secondary link to `/books`.
     - **Zero-match filter state:** Displays search/filter empty state with 1-click `seriesService.resetFilters()`.
   - Hosts `BookDetailModalComponent`, `BookEditModalComponent`, and `ReadingLogEditorComponent` (plus `SagaDetailModalComponent` wired in Task 11.5) so clicking any book or `"Continue reading"` action works seamlessly right from `/series`.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/series/components/series-toolbar/series-toolbar.component.spec.ts`
- [x] `npm run test:file -- src/app/features/series/components/saga-bento-card/saga-bento-card.component.spec.ts`
- [x] `npm run test:file -- src/app/features/series/pages/series-page/series-page.spec.ts`
- [x] `npm run verify:quiet`
