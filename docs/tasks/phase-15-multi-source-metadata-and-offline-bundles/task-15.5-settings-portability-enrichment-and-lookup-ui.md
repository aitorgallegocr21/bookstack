# Task 15.5: Settings Portability Suite, Auto-Enrichment Trigger & Lookup UI Enhancements

**Phase:** Phase 15: Multi-Source Metadata Engine (5 Providers), Integral Auto-Enrichment & Offline `.ZIP` Bundles  
**Status:** Completed  
**Estimated Impact:** Medium-High (Updates Settings Portability UI with the 4 export modes, `.ZIP` file import, and default-checked auto-enrichment toggle; updates the Enrichment panel with integral metadata badges and rich assistant cards; updates `BookMetadataLookupComponent` for 5-source badges and series/genre patching).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/components/data-portability-section/data-portability-section.ts` (`L1-179`) & `.html` (`L1-350`).
- `src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.ts` (`L1-129`) & `.html` (`L1-452`).
- `src/app/features/settings/pages/settings-page/settings-page.ts` (`L1-95`) & `.html` (`L1-60`).
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.ts` (`L1-249`) & `.html` (`L254-354`).
- `src/app/features/books/components/book-create-modal/book-create-modal.ts` (`L150-210`) & `src/app/features/books/components/book-edit-modal/book-edit-modal.ts` (`L150-220`).

**Files to Create / Update:**

- `src/app/features/settings/components/data-portability-section/data-portability-section.ts`
- `src/app/features/settings/components/data-portability-section/data-portability-section.html`
- `src/app/features/settings/components/data-portability-section/data-portability-section.spec.ts`
- `src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.ts`
- `src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.html`
- `src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.spec.ts`
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.ts`
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.html`
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.spec.ts`

---

## 2. Technical Objectives

1. **4-Card Export Suite & `.ZIP` / Auto-Enrichment Import Workflow (`data-portability-section.ts` & `.html`):**
   - Expand the Export grid in `data-portability-section.html` to offer 4 clearly differentiated local export options:
     1. **Portable `.ZIP` Package (`data-testid="export-zip-btn"`):** `backup.json` + `catalog.csv` + `covers/` image files (100% offline bundle).
     2. **Full JSON Backup (`data-testid="export-json-btn"`):** Single `.json` file with embedded Base64 covers.
     3. **Lightweight Text-Only JSON (`data-testid="export-json-light-btn"`):** Clean `.json` without Base64 image blobs (ideal for AI tools & text editing).
     4. **Complete CSV Catalog (`data-testid="export-csv-btn"`):** Full table with `publisher`, `publicationYear`, and `genre`.
   - Update `<input #fileInput type="file">` `accept` attribute to `".zip,.json,.csv,application/zip,application/json,text/csv"`.
   - When a `.zip` file is selected in `onFileSelected()`, read its binary `ArrayBuffer` (`Uint8Array`) and call `dataPortabilityService.analyzeImportZipFile(file.name, bytes)`.
   - Add signal `readonly autoEnrichOnImport = signal<boolean>(true);` and display a checkbox (`data-testid="import-auto-enrich-checkbox"`) inside the import preview panel whenever any book in `preview.validBooks` is missing a cover or has incomplete metadata (`totalPages <= 1`, `!publicationYear`, `!publisher`, or `!isbn`).
   - When `confirmImport()` finishes and `autoEnrichOnImport()` is `true` (and `result.incompleteMetadataCount > 0` or `result.missingCoversCount > 0`), emit `requestCoverEnrichment` and automatically trigger `coverEnrichmentService.runIntegralEnrichment()`.
2. **Integral Metadata Enrichment Panel & Rich Visual Assistant (`cover-enrichment-section.ts` & `.html`):**
   - Display reactive badges for incomplete metadata alongside missing covers (`missingCoverCount`, `missingPagesCount`, `missingYearCount`, `missingPublisherCount`).
   - Connect the primary enrichment button (`data-testid="start-isbn-enrichment-btn"`) to `coverEnrichmentService.runIntegralEnrichment()` so a single click runs the ISBN $\to$ Title+Author 5-source waterfall and fills covers, pages, years, publishers, ISBNs, and series.
   - In the **Step-by-Step Visual Assistant** (`data-testid="visual-assistant-card"`), render metadata badges on each candidate card (`totalPages`, `publicationYear`, `publisher`, `isbn`, and provider `source` badge) so the user can see which edition brings full page count and publication metadata before clicking `"Usar edición / portada"`.
3. **5-Source Lookup Panel (`book-metadata-lookup.ts` & `.html`):**
   - Increase displayed results limit in `onSearchSubmit()` from `candidates.slice(0, 5)` to `candidates.slice(0, 8)`.
   - Display contributing sources when a candidate has `source === 'merged'` and `candidate.sources?.length` (e.g. `Fusionado (Open Library + Google Books + Wikidata)`).
   - Ensure `BookCreateModalComponent` and `BookEditModalComponent` apply `seriesName` / `seriesOrder` when returned by `buildMetadataFormPatch()`.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/settings/components/data-portability-section/data-portability-section.spec.ts`
- [x] `npm run test:file -- src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.spec.ts`
- [x] `npm run test:file -- src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.spec.ts`
- [x] `npm run verify:quiet`
