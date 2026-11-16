# Task 10.4: Inline Accordion Metadata Lookup Panel & Edition Selector Component

**Phase:** Phase 10: ISBN Barcode Scanner & Public Metadata Auto-Fill  
**Status:** Pending  
**Estimated Impact:** High (Reusable `BookMetadataLookupComponent` integrating the `@defer`-loaded `IsbnScannerComponent`, on-demand ISBN/Title/Author search, edition selector cards, local duplicate warning banner, and smart `fill-empty` vs. `overwrite-public` application modes).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/models/book-metadata.model.ts` (`L1-45`): `BookMetadataCandidate`, `BookMetadataApplyMode`, `DuplicateLibraryMatch` contracts.
- `src/app/features/books/services/book-metadata.service.ts` (`L1-190`): `lookupByIsbn`, `searchByQuery`, `resolveLocalCover`, and `findDuplicateInLibrary`.
- `src/app/features/books/components/isbn-scanner/isbn-scanner.ts` (`L1-160`): `IsbnScannerComponent` created in Task 10.3.
- `src/app/core/i18n/i18n.types.ts` (`L215-265`): `bookForm.lookup` translation contract.

**Files to Create / Update:**

- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.ts`
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.html`
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.spec.ts`

---

## 2. Technical Objectives

1. **Component API & Reactive State (`BookMetadataLookupComponent`):**
   - Standalone `ChangeDetectionStrategy.OnPush` component (`selector: 'app-book-metadata-lookup'`).
   - Inputs & Outputs:
     - `readonly mode = input<'create' | 'edit'>('create');`
     - `readonly currentBookId = input<string | undefined>(undefined);`
     - `readonly currentIsbn = input<string>('');`
     - `readonly currentTitle = input<string>('');`
     - `readonly currentAuthor = input<string>('');`
     - `readonly candidateApplied = output<{ candidate: BookMetadataCandidate; applyMode: BookMetadataApplyMode }>();`
   - Public method `triggerIsbnLookup(rawIsbn: string): Promise<void>` so the parent modal's inline ISBN field button can trigger a direct lookup and expand the panel automatically.
2. **Collapsible Accordion UX (`transition-[grid-template-rows]`):**
   - Header bar displaying quick-action buttons:
     - **Scan ISBN (`Escanear ISBN`)**: Expands the accordion in `'scan'` tab and renders `<app-isbn-scanner>` inside a `@defer (when activeTab() === 'scan')` block.
     - **Search Database (`Buscar libro / ISBN`)**: Expands the accordion in `'search'` tab with a single unified search input accepting either an ISBN-10/13 or Title/Author text query, triggered strictly on form submit / button click (never on input typing).
3. **Edition Results List & Automatic Single-ISBN Resolution:**
   - When a barcode is scanned via `IsbnScannerComponent` (`onIsbnScanned(isbn)`):
     - Collapses the camera stream immediately, calls `bookMetadataService.lookupByIsbn(isbn)`, optimizes the cover locally via `bookMetadataService.resolveLocalCover()`, and in `'create'` mode automatically emits `candidateApplied` (`applyMode: 'overwrite-public'`) while showing a confirmation banner with the source badge (`Open Library` / `Google Books` / `Combinado`).
   - When searching via text query (`onSearchSubmit()`):
     - Displays up to 5 `BookMetadataCandidate` cards showing cover thumbnail (with fallback book icon), title, author, publisher, publication year, page count badge, ISBN badge, and provider source badge.
     - In `'create'` mode, each card has a 1-click **"Aplicar edición"** button (`overwrite-public`).
     - In `'edit'` mode, each card provides **"Rellenar vacíos"** (`fill-empty`, primary default action) and **"Sobrescribir datos públicos"** (`overwrite-public`, secondary action) so existing book fields are never overwritten by accident.
4. **Non-Blocking Local Library Duplicate Warning Banner:**
   - Computes `duplicateMatch = computed<DuplicateLibraryMatch | null>(...)` using `bookMetadataService.findDuplicateInLibrary()` against either the selected/applied candidate or the current `currentIsbn()` / `currentTitle() + currentAuthor()` inputs (excluding `currentBookId()`).
   - When a duplicate exists in the local library, renders an accessible `role="status"` amber banner indicating the matched book title and its current localized reading status (`Por leer`, `Leyendo`, `Completado`, `Abandonado`).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.spec.ts`
- [ ] `npm run verify:quiet`
