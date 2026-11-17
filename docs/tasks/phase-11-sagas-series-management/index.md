# Phase 11: Sagas, Series & Collections Management (`/series`)

**Status:** Ready for Implementation  
**Target Branch:** `feature/11-sagas-series-management` $\to$ `develop`  
**Core Mission:** Deliver a modern, visual **Saga Bento Gallery (`/series`)** where each saga card scales dynamically across responsive grid spans according to its volume count (`1–2` $\to$ `1×1`, `3–5` $\to$ `2×1`, `6+` $\to$ `2×2`), powered by a **Hybrid Series Model** (intelligent normalized grouping from `Book.series` + optional persisted `SeriesMetadata` in IndexedDB and JSON backups), a **Missing-Volume Radar** detecting numbering or expected-total gaps, a **1-click "Continue / Next Volume"** action, an interactive **Saga Detail Modal** (chronological volume timeline, inline renumbering, `+ Add Vol. X` prefill, and standalone book bulk linker), series autocomplete in book create/edit modals, and mobile/desktop navigation parity.

---

## 1. Architectural Summary & Decisions

1. **Responsive Bento Grid Scaling (`SagaBentoCardComponent`):**
   - Desktop/tablet (`md:`/`lg:` 12-column grid) sizes each saga card into three deliberate tiers based on its total volume footprint (`Math.max(ownedCount, expectedVolumes ?? 0)`):
     - **Compact (`1–2` volumes):** `md:col-span-6 lg:col-span-4` — stacked/overlapping dual covers, progress pill, missing-gap indicator, and smart next-book CTA.
     - **Medium (`3–5` volumes):** `md:col-span-6 lg:col-span-8` — panoramic cover shelf with volume numbers & status rings, missing-volume ghost slots, global progress bar, and smart next-book CTA.
     - **Showcase (`6+` volumes):** `md:col-span-12 lg:col-span-8 md:row-span-2` — featured cover mosaic / scrollable shelf, aggregated saga stats (pages read, average rating, hours logged from `ReadingLogService`), missing-volume summary, and highlighted active/next book card.
   - Mobile (`320px–767px`) collapses cleanly to 1 column with contained horizontal cover shelves (`min-w-0`, zero horizontal viewport overflow) and discrete CSS transitions (`transition-colors`, `transition-transform`, `transition-opacity`; never `transition-all`).
2. **Hybrid Series Data Model & Backup Portability:**
   - **Smart Normalization:** `SeriesService` groups books with `book.series?.name` using a diacritic- and case-insensitive normalized key (`normalizeSeriesKey`), automatically unifying legacy books whose `series.id` values diverged while reusing canonical IDs on subsequent edits.
   - **Persisted `SeriesMetadata` (`IndexedDB v2` + Zod):** Optional per-saga metadata (`id`, `normalizedKey`, `name`, `expectedVolumes`, `publicationStatus: 'ongoing' | 'completed' | 'hiatus'`, `notes`, `updatedAt`) lives in a new `seriesMetadata` object store (`StorageAdapterService.dbVersion = 2`, safe `localStorage` fallback).
   - **Full Backup Compatibility:** `BackupEnvelopeSchema` (`schemaVersion: 1`) accepts an optional `seriesMetadata` array defaulting to `[]`, preserving full backward compatibility with Phase 09 backups while supporting `Merge`, `Overwrite`, rollback snapshots, `factoryResetAllData()`, and `computeStorageBreakdown()`.
3. **Asymmetric Navigation Integration (`Desktop Sidebar` + `Mobile Segmented Switcher`):**
   - Desktop (`md:`/`>= 768px`) adds `/series` (`nav.series`) directly to `SidebarComponent.navItems` right after `/books`.
   - Mobile (`< 768px`) preserves the 5-tab `BottomNavComponent` untouched and introduces a compact `md:hidden` segmented switcher (`Libros` | `Sagas`, `min-h-[44px]` touch targets) in the headers of `BooksPage` and `SeriesPage`.
4. **Interactive Saga Detail Modal & Smart Creation Prefill:**
   - Clicking a saga card opens `SagaDetailModalComponent` (adhering to `UiStateService` scroll lock, `(document:keydown.escape)`, backdrop check, and `viewChild()` focus) displaying:
     - Editable saga metadata (`name` rename across member books, `expectedVolumes`, `publicationStatus`, `notes`).
     - Chronological volume timeline combining owned `Book` entries (with inline volume renumbering, unlink action, and click-to-open `BookDetailModalComponent`) and **ghost missing-volume slots** (`Vol. X · Faltante` with `+ Add Vol. X` prefilling `BookCreateModalComponent` via `BooksService.openCreateModal(prefill)`).
     - Searchable **Link Existing Books** picker to attach standalone library books in 1 click.
   - `BookCreateModalComponent` and `BookEditModalComponent` provide existing-series autocomplete suggestions that reuse the canonical `series.id` in `buildBookSeriesPayload()`.
5. **Filters, Search & Sorting (`SeriesService`):**
   - Live omni-search across saga name, member book titles, and authors.
   - Status chips with real-time counts (`Todas`, `En curso`, `Completadas`, `Por empezar`, `Con volúmenes faltantes`).
   - Five sort modes (`recent`, `progress-desc`, `volumes-desc`, `rating-desc`, `title-asc`) plus a contextual zero-match reset state.

---

## 2. Atomic Task Breakdown

- [x] **[Task 11.1: Series Domain Contracts, Zod Schemas, IndexedDB v2 Store, Backup Portability & i18n](task-11.1-series-models-zod-indexeddb-backup-i18n.md)** — Define `series.model.ts`, `series.schema.ts`, upgrade `StorageAdapterService` (`dbVersion = 2`, `'seriesMetadata'` store), extend `BackupEnvelopeSchema` & `DataPortabilityService` (`Merge`/`Overwrite`/rollback/reset/quota), and add bilingual `es`/`en` translations.
- [x] **[Task 11.2: `SeriesService` Signal Store, Normalized Grouping Engine, Missing-Volume Radar & Bulk Linking](task-11.2-series-service-grouping-gaps-and-linking.md)** — Build `SeriesService` aggregating books + `ReadingLogService` + `SeriesMetadata` with normalized grouping, chronological sorting, gap detection (`missingVolumes`), `bentoScale` calculation, `nextBookToRead` resolution, filters/sorts, and batch link/unlink/rename/renumber mutations.
- [x] **[Task 11.3: Series Autocomplete, Create-Modal Prefill & Desktop/Mobile Navigation Shell](task-11.3-series-autocomplete-prefill-and-navigation.md)** — Add `CreateBookPrefill` support in `BooksService` & `BookCreateModalComponent`, existing-series autocomplete & ID reuse in Create/Edit modals, lazy `/series` route in `app.routes.ts`, `/series` link in `SidebarComponent`, and `md:hidden` `Libros | Sagas` segmented switcher in `BooksPage`.
- [x] **[Task 11.4: Saga Bento Gallery Page (`/series`), Variable-Scale Bento Cards & Filter Toolbar](task-11.4-saga-bento-gallery-page-cards-and-filters.md)** — Build `SeriesToolbarComponent`, `SagaBentoCardComponent` (`compact` 1×1, `medium` 2×1, `showcase` 2×2), and `SeriesPage` with mobile `Libros | Sagas` switcher, empty states, 1-click "Continue / Next Volume" actions, and strict `320px` overflow safety.
- [ ] **[Task 11.5: Interactive Saga Detail Modal, Bulk Book Linker, Playwright E2E Suite & Tier 2 Doc Sync](task-11.5-saga-detail-modal-bulk-linker-and-e2e-suite.md)** — Build `SagaDetailModalComponent` (chronological volume timeline, ghost missing-volume slots with `+ Add Vol. X`, metadata editor, and standalone book linker), wire full modal flows into `SeriesPage`, write `tests/e2e/series-flow.spec.ts`, verify `npm run verify:quiet` + `npm run test:e2e`, and perform Tier 2 Per-Phase documentation sync.
