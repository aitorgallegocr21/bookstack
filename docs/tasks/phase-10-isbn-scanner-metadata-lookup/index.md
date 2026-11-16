# Phase 10: ISBN Barcode Scanner & Public Metadata Auto-Fill

**Status:** Active  
**Target Branch:** `feature/10-isbn-scanner-metadata-lookup` $\to$ `develop`  
**Core Mission:** Streamline book cataloging and library enrichment in `BookCreateModalComponent` and `BookEditModalComponent` with a **Privacy-First, On-Demand ISBN Barcode Scanner (`html5-qrcode`) and Hybrid Public Metadata Lookup Engine (`Open Library` + `Google Books`)**. Deliver strict ISBN-10/13 checksum validation, live camera & image-file barcode scanning with immediate hardware stream teardown, Zod-validated metadata merging, automatic local cover compression via `ImageOptimizerService` (for 100% offline Local-First persistence), non-blocking local duplicate detection, and smart field protection when editing existing books.

---

## 1. Architectural Summary & Decisions

1. **Focused Phase Scope (Phase 10 vs. Phase 11 Separation):**
   - **Phase 10** focuses exclusively on **ISBN Barcode Scanning, Dual Lookup (ISBN + Title/Author), Public Metadata Auto-Fill, and Local-First Cover Optimization** inside the Book Create and Book Edit workflows.
   - **Phase 11** (`Sagas, Series & Collections Management (/series)`) is queued as the dedicated subsequent phase in `docs/TASKS.md` and `docs/ROADMAP.md`.
2. **Privacy-First Hybrid Metadata Engine (`Open Library` Primary + `Google Books` Fallback/Merge):**
   - **Zero Background Tracking:** External requests execute **strictly on explicit user action** (scanning a valid barcode or clicking Search), never on keystroke typing. All `fetch()` calls enforce `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`, paired with an in-memory session cache (`Map`) to prevent redundant network calls.
   - **Smart Waterfall & Field Merging:** For ISBN lookups, `BookMetadataService` queries **Open Library** first (`https://openlibrary.org/api/books`). If no edition is found or if key public fields (`totalPages`, `coverUrl`, `publisher`, `publicationYear`) are missing, it automatically queries **Google Books** (`https://www.googleapis.com/books/v1/volumes`) and merges the most complete fields.
   - **Zod Runtime Validation & Sanitization:** Every external JSON payload is parsed through strict **Zod** schemas (`src/app/features/books/schemas/book-metadata.schema.ts`), stripping HTML tags and upgrading `http://` cover thumbnails to `https://`.
3. **Local-First Offline Cover Persistence (`ImageOptimizerService`):**
   - When an external edition includes a cover URL, `BookMetadataService` downloads the image via `fetch()` (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`) and passes it through `ImageOptimizerService.optimizeRemoteUrl()` to compress it into a local `data:image/webp;base64,...` (or JPEG) string ($\le 400\text{px}$, quality `0.75`).
   - This guarantees that auto-filled covers work **100% offline**, are included in JSON backups, and **never ping third-party servers** when browsing the library. If the remote image server blocks CORS canvas extraction, it falls back gracefully to the sanitized `https://` URL.
4. **Lazy-Loaded Camera & Photo Barcode Scanner (`html5-qrcode`):**
   - `IsbnScannerComponent` dynamically imports `html5-qrcode` (`await import('html5-qrcode')`) and renders inside a `@defer` block so the initial application bundle stays fast and lightweight.
   - Supports **Live Camera Scanning** (rear camera `environment` by default + camera selector) and **Image File / Photo Upload** (`scanFile`) for desktop users or denied camera permissions.
   - Validates mathematical **ISBN-10 (Mod-11)** and **ISBN-13 (Mod-10, `978`/`979` Bookland prefix)** checksums before accepting a scan, ignoring non-book barcodes. Immediately stops and releases the camera `MediaStream` upon detection, close, or component destruction.
5. **Inline Accordion UX, Smart Edit Protection & Local Duplicate Warning:**
   - Integrated at the top of `BookCreateModalComponent` and `BookEditModalComponent` via a collapsible accordion (`<app-book-metadata-lookup>`, `transition-[grid-template-rows]`) plus a direct lookup trigger next to the `isbn` input — avoiding nested overlapping modals.
   - **Duplicate Detection:** Checks `BooksService.books()` by normalized ISBN-10/13 equivalence or normalized `title + author` and displays a non-blocking warning banner with the existing book's title and reading status.
   - **Personal Data Protection:** In **Create** mode, populates all public metadata fields (`title`, `author`, `isbn`, `publisher`, `publicationYear`, `totalPages`, `coverUrl`). In **Edit** mode, defaults to filling **only empty/missing fields** (with a secondary button to overwrite all public catalog fields) and **never overwrites** personal tracking fields (`status`, `currentPage`, `rating`, `startDate`, `endDate`, `notes`, `series`).

---

## 2. Atomic Task Breakdown

- [x] **[Task 10.1: ISBN-10/13 Checksum Utilities, Metadata Contracts, Zod External Schemas, Remote Cover Optimizer & i18n](task-10.1-isbn-utils-metadata-schemas-and-i18n.md)** — Implement pure ISBN-10/13 checksum/normalization helpers (`isbn.utils.ts`), define metadata lookup models (`book-metadata.model.ts`), build Zod schemas for Open Library & Google Books (`book-metadata.schema.ts`), add `optimizeRemoteUrl()` to `ImageOptimizerService`, update CSP `connect-src` in `src/index.html`, and extend `es`/`en` i18n dictionaries.
- [x] **[Task 10.2: Privacy-First Book Metadata Service (Open Library + Google Books Waterfall, Session Cache & Duplicate Detector)](task-10.2-book-metadata-service.md)** — Implement `BookMetadataService` with on-demand `lookupByIsbn()`, `searchByQuery()`, Open Library + Google Books field merging, in-memory session cache, `resolveLocalCover()`, and `findDuplicateInLibrary()`.
- [ ] **[Task 10.3: Lazy-Loaded ISBN Barcode Scanner Component (`html5-qrcode` Camera Stream & Image File Upload)](task-10.3-isbn-scanner-component.md)** — Build `IsbnScannerComponent` using dynamic `import('html5-qrcode')`, supporting rear/multi-camera live scanning and image file upload, strict ISBN checksum filtering, and immediate `MediaStream` teardown.
- [ ] **[Task 10.4: Inline Accordion Metadata Lookup Panel & Edition Selector Component](task-10.4-book-metadata-lookup-component.md)** — Build `BookMetadataLookupComponent` featuring collapsible scanner/search tabs, up to 5 edition result cards with source badges, non-blocking local duplicate warning banner, and `fill-empty` vs. `overwrite-public` application modes.
- [ ] **[Task 10.5: Modal Integration (Create & Edit), Direct ISBN Field Lookup & Playwright E2E Suite](task-10.5-modal-integration-and-e2e-suite.md)** — Integrate `<app-book-metadata-lookup>` and inline ISBN field lookup into `BookCreateModalComponent` and `BookEditModalComponent`, add `applyMetadataCandidateToForm()` in `book-form.utils.ts`, add component & Playwright E2E tests (`tests/e2e/isbn-lookup-flow.spec.ts`), and execute Tier 2 Per-Phase documentation sync.
