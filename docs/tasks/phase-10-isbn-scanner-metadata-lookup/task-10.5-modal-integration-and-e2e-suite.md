# Task 10.5: Modal Integration (Create & Edit), Direct ISBN Field Lookup & Playwright E2E Suite

**Phase:** Phase 10: ISBN Barcode Scanner & Public Metadata Auto-Fill  
**Status:** Completed  
**Estimated Impact:** High (Integration of `<app-book-metadata-lookup>` and direct ISBN lookup button in `BookCreateModalComponent` and `BookEditModalComponent`, pure form-patching helper in `book-form.utils.ts`, unit/component tests, Playwright E2E suite `tests/e2e/isbn-lookup-flow.spec.ts`, and Tier 2 Per-Phase documentation sync).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/utils/book-form.utils.ts` (`L1-100`): Existing form helper functions.
- `src/app/features/books/components/book-create-modal/book-create-modal.ts` (`L26-125`): `BookCreateModalComponent` imports, `createForm`, and methods.
- `src/app/features/books/components/book-create-modal/book-create-modal.html` (`L44-116`): Modal form body top section and `isbn` input field (`L89-101`).
- `src/app/features/books/components/book-edit-modal/book-edit-modal.ts` (`L30-166`): `BookEditModalComponent` imports, `editForm`, and methods.
- `src/app/features/books/components/book-edit-modal/book-edit-modal.html` (`L44-116`): Modal form body top section and `isbn` input field (`L90-102`).
- `tests/e2e/books-flow.spec.ts` (`L1-120`): Existing E2E patterns for book creation and editing.

**Files to Create / Update:**

- `src/app/features/books/utils/book-form.utils.ts`
- `src/app/features/books/utils/book-form.utils.spec.ts`
- `src/app/features/books/components/book-create-modal/book-create-modal.ts`
- `src/app/features/books/components/book-create-modal/book-create-modal.html`
- `src/app/features/books/components/book-create-modal/book-create-modal.spec.ts`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.spec.ts`
- `tests/e2e/isbn-lookup-flow.spec.ts`
- `docs/TASKS.md`, `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md`, `CONTEXT.md`, `README.md`, `README.es.md`

---

## 2. Technical Objectives

1. **Pure Form Auto-Fill Helper (`src/app/features/books/utils/book-form.utils.ts`):**
   - Add `buildMetadataFormPatch(currentFormValues: { title?: string | null; author?: string | null; isbn?: string | null; publisher?: string | null; publicationYear?: number | null; totalPages?: number | null; coverUrl?: string | null }, candidate: BookMetadataCandidate, applyMode: BookMetadataApplyMode): Partial<{ title: string; author: string; isbn: string; publisher: string; publicationYear: number | null; totalPages: number | null; coverUrl: string }>`:
     - When `applyMode === 'overwrite-public'`, overwrites every non-empty public field present on `candidate` (`title`, `author`, `isbn`, `publisher`, `publicationYear`, `totalPages`, `coverUrl`).
     - When `applyMode === 'fill-empty'`, only patches fields that are currently empty/falsy (or `totalPages === null || totalPages === 0`) in `currentFormValues`, preserving all existing user-entered values.
     - Never touches personal tracking fields (`status`, `currentPage`, `rating`, `startDate`, `endDate`, `notes`, `seriesEnabled`, `seriesName`, `seriesVolumeNumber`).
2. **Integrate `<app-book-metadata-lookup>` & Inline ISBN Button in `BookCreateModalComponent` & `BookEditModalComponent`:**
   - Place `<app-book-metadata-lookup>` at the top of the scrollable form container (`p-6`) right above the `basicInfoSection` in both `book-create-modal.html` and `book-edit-modal.html`.
   - Next to the `isbn` input field (`#create-book-isbn` / `#edit-book-isbn`), add a compact button (`type="button"`, minimum touch target `44x44px` on mobile) that calls `metadataLookup()?.triggerIsbnLookup(form.controls.isbn.value || '')` so users who type or paste an ISBN directly into the ISBN field can fetch its public metadata in 1 click.
   - Wire `(candidateApplied)="onMetadataCandidateApplied($event)"` in both modals using `buildMetadataFormPatch()`, marking patched controls as dirty/touched and syncing `coverUrl` with `<app-cover-picker>`.
3. **Playwright End-to-End Verification (`tests/e2e/isbn-lookup-flow.spec.ts`):**
   - Mock `https://openlibrary.org/**` and `https://www.googleapis.com/books/v1/volumes**` using Playwright `page.route()` for fast, 100% deterministic E2E execution:
     - **Scenario 1 (Direct ISBN Lookup & Auto-Fill on Create):** Open "Nuevo libro", enter ISBN `9780141036144` (or trigger lookup from the lookup panel), verify Open Library + Google Books waterfall auto-fills title, author, publisher, year, total pages, and cover, save the book, and verify it renders in `/books`.
     - **Scenario 2 (Title/Author Search & Edition Selection):** Search by title/author query, verify edition candidate cards render with source badges, click "Aplicar edición", and verify form fields populate.
     - **Scenario 3 (Duplicate ISBN Warning Banner):** Open "Nuevo libro" and look up an ISBN that already exists in the local library; verify the non-blocking duplicate warning banner appears with the existing book's title and status.
     - **Scenario 4 (Edit Modal Smart Field Protection):** Open "Editar libro" on an existing book with personal notes/progress and missing publisher/ISBN, apply metadata in `fill-empty` mode, and verify missing fields are populated while existing title, notes, rating, and progress remain intact.
     - **Scenario 5 (Mobile `375px` Viewport Ergonomics):** Verify zero horizontal overflow (`scrollWidth <= innerWidth`) on mobile when the lookup accordion and edition list are expanded.
4. **Tier 2 Per-Phase Documentation Sync & Autonomous Branch Hygiene:**
   - Mark all Phase 10 tasks `[x]` and `Status: Completed` in `docs/tasks/phase-10-isbn-scanner-metadata-lookup/index.md`.
   - Move Phase 10 to `Completed Phases` in `docs/TASKS.md` (activating Phase 11: Sagas & Series Management `/series`).
   - Synchronize `CONTEXT.md`, `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md`.
   - Merge into `develop`, push to `origin/develop`, and execute Autonomous Completed-Branch Cleanup (`git branch -d` + `git push origin --delete`).

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/books/utils/book-form.utils.spec.ts`
- [x] `npm run test:file -- src/app/features/books/components/book-create-modal/book-create-modal.spec.ts`
- [x] `npm run test:file -- src/app/features/books/components/book-edit-modal/book-edit-modal.spec.ts`
- [x] `npm run verify:quiet`
- [x] `npm run test:e2e`
