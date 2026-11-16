# Task 11.5: Interactive Saga Detail Modal, Bulk Book Linker, Playwright E2E Suite & Tier 2 Doc Sync

**Phase:** Phase 11: Sagas, Series & Collections Management (`/series`)  
**Status:** Pending  
**Estimated Impact:** High (`SagaDetailModalComponent` with chronological volume timeline, ghost missing-volume slots, inline metadata/rename editor, and standalone book bulk linker; `SeriesPage` modal wiring; Playwright E2E suite `tests/e2e/series-flow.spec.ts`; full verification + Tier 2 Per-Phase documentation sync).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/series/models/series.model.ts`: `SagaAggregation`, `SagaVolumeSlot`, `SeriesPublicationStatus`.
- `src/app/features/series/services/series.service.ts`: `upsertSeriesMetadata()`, `linkBooksToSeries()`, `unlinkBookFromSeries()`, `updateBookVolumeNumber()`.
- `src/app/features/series/pages/series-page/series-page.ts` & `series-page.html`: `SeriesPage` modal host where `SagaDetailModalComponent` will be wired.
- `src/app/core/services/ui-state.service.ts` (`L1-55`): `acquireScrollLock()` / `releaseScrollLock()`.
- `src/styles.css` (`L35-110`): Shared `.modal-backdrop`, `.modal-panel`, `.field-label`, `.field-input`, `.field-select` utilities.
- `tests/e2e/books-flow.spec.ts` (`L1-120`): Reference Playwright E2E fixture/IndexedDB helpers.

**Files to Create / Update:**

- `src/app/features/series/components/saga-detail-modal/saga-detail-modal.component.ts`
- `src/app/features/series/components/saga-detail-modal/saga-detail-modal.component.html`
- `src/app/features/series/components/saga-detail-modal/saga-detail-modal.component.spec.ts`
- `src/app/features/series/pages/series-page/series-page.ts`
- `src/app/features/series/pages/series-page/series-page.html`
- `src/app/features/series/pages/series-page/series-page.spec.ts`
- `tests/e2e/series-flow.spec.ts`
- `docs/TASKS.md`, `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md`, `CONTEXT.md`, `README.md`, `README.es.md`

---

## 2. Technical Objectives

1. **Interactive Saga Detail Modal (`SagaDetailModalComponent`):**
   - Strictly implements ADR #6: `UiStateService.acquireScrollLock()` on init / `releaseScrollLock()` in `ngOnDestroy()`, `host: { '(document:keydown.escape)': 'handleEscape()' }`, `event.target === event.currentTarget` backdrop closure, and `viewChild()` programmatic initial focus (`queueMicrotask`).
   - **Header & Saga Metadata Editor:** Displays saga title, authors, publication status badge (`ongoing` / `completed` / `hiatus`), and a collapsible inline edit panel allowing the user to rename the saga (propagating to all member books), set `expectedVolumes`, choose `publicationStatus`, and save saga `notes`.
   - **Aggregated Metrics Strip:** Owned vs. expected volumes, completion percentage bar, pages read / total pages, average rating, and total logged reading hours.
   - **Chronological Volume Timeline (`timelineSlots`):**
     - Owned book rows: Volume `#` pill with quick inline volume-number editor (`blur`/Save updates `SeriesService.updateBookVolumeNumber()`), cover thumbnail (`loading="lazy" decoding="async"`), title, status badge, page progress, click-to-open `BookDetailModalComponent`, and `Unlink` action (`SeriesService.unlinkBookFromSeries()`).
     - **Ghost Missing-Volume Slots:** Dashed cards (`Vol. X · Faltante`) with a `+ Añadir Vol. X` button (`min-h-[44px]`) that closes or preserves context and invokes `booksService.openCreateModal({ seriesName, seriesVolumeNumber })`.
   - **Link Existing Standalone Books Picker:** Collapsible search list showing library books not currently in this saga so users can attach one or multiple books in 1 click (`SeriesService.linkBooksToSeries()`).
2. **Wire `SagaDetailModalComponent` into `SeriesPage`:**
   - Track `selectedSagaNormalizedKey = signal<string | null>(null)` and compute `selectedSaga` reactively from `seriesService.sagas()` so live edits (volume renumbering, book linking, metadata saves, or adding a missing volume) refresh the open modal automatically.
3. **Playwright E2E Verification (`tests/e2e/series-flow.spec.ts`):**
   - **Scenario 1 (Create with Series Autocomplete & Navigation):** Create two books in the same saga using autocomplete on the second book, navigate to `/series` via desktop sidebar, and verify the saga card renders with aggregated progress.
   - **Scenario 2 (Variable-Scale Bento Gallery & Mobile `375px` Overflow Safety):** Seed sagas across `compact` (2 vols), `medium` (4 vols), and `showcase` (6 vols) scales; verify distinct Bento span classes on desktop (`1280px`), test the mobile `Libros | Sagas` segmented switcher on `375px`, and assert `scrollWidth <= innerWidth`.
   - **Scenario 3 (Search, Status Chips & Sort):** Filter by `Con volúmenes faltantes`, search by saga/book title, change sort order, and verify reset button restores all sagas.
   - **Scenario 4 (Saga Detail Modal, Ghost Slot Prefill & Bulk Linker):** Open a saga, set `expectedVolumes`, verify the ghost `Vol. X` slot appears, click `+ Añadir Vol. X` and confirm `BookCreateModalComponent` opens pre-filled with the saga name and volume number, save it, and verify the gap resolves; also attach a standalone book via the Link Existing Books picker.
   - **Scenario 5 (JSON Backup Round-Trip):** Export JSON backup from `/settings`, run factory reset, re-import the backup, and confirm `seriesMetadata` (`expectedVolumes`, `notes`, `publicationStatus`) restores intact in `/series`.
4. **Tier 2 Per-Phase Documentation Sync & Autonomous Branch Hygiene:**
   - Mark all Phase 11 tasks `[x]` and `Status: Completed` in `docs/tasks/phase-11-sagas-series-management/index.md`.
   - Move Phase 11 to `Completed Phases` in `docs/TASKS.md` and update `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md`, `CONTEXT.md`, `README.md`, and `README.es.md`.
   - Merge into `develop`, push to `origin/develop`, and execute Autonomous Completed-Branch Cleanup (`git branch -d` + `git push origin --delete`).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/series/components/saga-detail-modal/saga-detail-modal.component.spec.ts`
- [ ] `npm run test:file -- src/app/features/series/pages/series-page/series-page.spec.ts`
- [ ] `npm run verify:quiet`
- [ ] `npm run test:e2e`
