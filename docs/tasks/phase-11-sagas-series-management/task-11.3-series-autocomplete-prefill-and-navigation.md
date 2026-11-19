# Task 11.3: Series Autocomplete, Create-Modal Prefill & Desktop/Mobile Navigation Shell

**Phase:** Phase 11: Sagas, Series & Collections Management (`/series`)  
**Status:** Completed  
**Estimated Impact:** Medium (Global create-modal prefill in `BooksService`, series autocomplete & canonical ID reuse in `BookCreateModalComponent` and `BookEditModalComponent`, lazy `/series` route, Desktop `SidebarComponent` link, and mobile `Libros | Sagas` segmented switcher on `BooksPage`).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/services/books.service.ts` (`L12-14`, `L118-125`): `isCreateModalOpen` signal and `openCreateModal()` / `closeCreateModal()`.
- `src/app/features/books/utils/book-form.utils.ts` (`L85-101`): `buildBookSeriesPayload()`.
- `src/app/features/books/components/book-create-modal/book-create-modal.ts` (`L40-90`, `L178-190`): `createForm`, `save()` series payload construction.
- `src/app/features/books/components/book-create-modal/book-create-modal.html` (`L352-386`): Series name & volume form inputs.
- `src/app/features/books/components/book-edit-modal/book-edit-modal.ts` (`L44-137`, `L225-236`): `editForm`, `effect()` patch, `save()` series payload construction.
- `src/app/features/books/components/book-edit-modal/book-edit-modal.html` (`L352-386`): Series name & volume form inputs.
- `src/app/app.routes.ts` (`L1-35`): Lazy-loaded routes registry.
- `src/app/core/components/sidebar/sidebar.component.ts` (`L39-57`): Icons and `navItems` computed array.
- `src/app/features/books/pages/books-page/books-page.ts` (`L1-64`): `BooksPage` imports and signals.
- `src/app/features/books/pages/books-page/books-page.html` (`L1-10`): `BooksPage` header.

**Files to Create / Update:**

- `src/app/features/books/services/books.service.ts`
- `src/app/features/books/services/books.service.spec.ts`
- `src/app/features/books/components/book-create-modal/book-create-modal.ts`
- `src/app/features/books/components/book-create-modal/book-create-modal.html`
- `src/app/features/books/components/book-create-modal/book-create-modal.spec.ts`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.spec.ts`
- `src/app/app.routes.ts`
- `src/app/core/components/sidebar/sidebar.component.ts`
- `src/app/core/components/sidebar/sidebar.component.spec.ts`
- `src/app/features/books/pages/books-page/books-page.ts`
- `src/app/features/books/pages/books-page/books-page.html`

---

## 2. Technical Objectives

1. **Create-Modal Prefill Support (`BooksService` + `BookCreateModalComponent`):**
   - Define `export interface CreateBookPrefill { seriesName?: string; seriesVolumeNumber?: number; }` in `books.service.ts`.
   - Add `readonly createModalPrefill = signal<CreateBookPrefill | null>(null);`.
   - Update `openCreateModal(prefill?: CreateBookPrefill): void` to set `createModalPrefill` (`prefill ?? null`) and open the modal; `closeCreateModal()` clears `createModalPrefill.set(null)`.
   - In `BookCreateModalComponent`, read `booksService.createModalPrefill()` on init (via `effect()` or constructor) and, when present, patch `seriesEnabled: true`, `seriesName`, and `seriesVolumeNumber` cleanly without affecting standard blank modal opens.
2. **Existing-Series Autocomplete & Canonical ID Reuse (`BookCreateModalComponent` & `BookEditModalComponent`):**
   - Inject `SeriesService` into both modals and expose `existingSeriesOptions = this.seriesService.existingSeriesOptions`.
   - Attach an accessible `<datalist>` (`#create-series-suggestions` / `#edit-series-suggestions`) to the `seriesName` input, plus optional quick-pick chips for the top recent sagas when `seriesName` is empty, and suggest the next available `volumeNumber` if the user picks an existing saga while `seriesVolumeNumber` is empty.
   - On `save()`, resolve any matching existing `SeriesOption` by `normalizeSeriesKey(val.seriesName)` and pass its canonical `id` as `existingSeriesId` to `buildBookSeriesPayload()`, ensuring books added to the same saga always share a unified `series.id`.
3. **Routing & Asymmetric Navigation (`app.routes.ts`, `SidebarComponent`, `BooksPage`):**
   - Register `{ path: 'series', loadComponent: () => import('./features/series/pages/series-page/series-page').then((m) => m.SeriesPage) }` in `app.routes.ts` (note: Task 11.4 creates `SeriesPage`; keep or scaffold a minimal placeholder component ONLY if needed so `check`/`build` stays green, or create the initial `SeriesPage` skeleton here if verifying before 11.4).
   - Add `{ path: '/series', label: nav.series, icon: this.Series }` (`LucideLayers` from `@lucide/angular`) to `SidebarComponent.navItems` right after `/books`.
   - Keep `BottomNavComponent` unchanged (`5` items).
   - In `BooksPage` header (`books-page.html`), add a compact `md:hidden` segmented navigation pill (`Libros` active | `Sagas` `routerLink="/series"`, `min-h-[44px]` touch targets, `focus-visible:ring-2`) so mobile users can switch between Catalog and Sagas in 1 tap.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/books/services/books.service.spec.ts`
- [x] `npm run test:file -- src/app/features/books/components/book-create-modal/book-create-modal.spec.ts`
- [x] `npm run test:file -- src/app/features/books/components/book-edit-modal/book-edit-modal.spec.ts`
- [x] `npm run test:file -- src/app/core/components/sidebar/sidebar.component.spec.ts`
- [x] `npm run verify:quiet`
