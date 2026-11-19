# Phase 15: Multi-Source Metadata Engine (5 Providers), Integral Auto-Enrichment & Offline `.ZIP` Bundles

**Status:** Planned  
**Target Branch:** `feature/15-multi-source-metadata-and-offline-bundles` $\to$ `develop`  
**Core Mission:** Upgrade BookStack's public metadata discovery and data portability engines into a **5-Source Browser-Native Metadata Waterfall & Fusion Engine** (`Open Library [Search + Editions + Direct ISBN Covers]` + `Google Books [Structured intitle/inauthor]` + `Wikidata SPARQL/REST` + `Apple Books ES` + `Internet Archive / Crossref`), transform the cover enrichment queue into an **Integral Metadata & Cover Auto-Enrichment Engine** (automatically backfilling missing covers, `totalPages`, `publicationYear`, `publisher`, `isbn`, and `series` with automatic ISBN $\to$ Title+Author fallback), support **Flexible External/AI JSON & CSV Imports** (never discarding books with missing or zero `totalPages`, `id`, or timestamps), and deliver a **100% Local Offline Export/Import Suite** featuring Lightweight Text-Only JSON/CSV, Full Base64 JSON, and self-contained **`.ZIP` Portable Archives** (`backup.json` + `catalog.csv` + `covers/*.webp`).

---

## 1. Architectural Summary & Resolved Decisions

1. **5-Source Legal, Free & Browser-Compatible Metadata Waterfall:**
   - **Open Library (Enhanced 3-Endpoint Integration):**
     - Standard Bibkey (`/api/books`) and structured Search (`/search.json?title=...&author=...`).
     - **Work Editions Fallback (`/works/{OLID}/editions.json?limit=15`):** Rescues missing `number_of_pages`, Spanish `publishers`, `publish_date`, and edition `covers` when the top-level Work record lacks median page counts.
     - **Direct ISBN Cover Probe (`https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg?default=false`):** Resolves covers directly by ISBN even when the JSON Bibkey payload lacks a `cover` object.
   - **Google Books API (Structured Queries & CORS-Resilient Covers):**
     - Uses structured operators (`intitle:"..."+inauthor:"..."` with fallback to broad query) and `maxResults=10` to aggregate `pageCount`, `publisher`, `publishedDate`, `industryIdentifiers`, and `imageLinks` across sibling editions.
   - **Wikidata REST / SPARQL API (`query.wikidata.org/sparql` — CC0 Public Domain, `origin=*`):**
     - Queries bibliographic items by ISBN-13 (`P212`), ISBN-10 (`P957`), or Title + Author to extract exact page counts (`P1104`), publication year (`P577`), publisher (`P123`), series name (`P179`), volume ordinal (`P1545`), and Wikimedia Commons cover images (`P18`).
   - **Apple Books / iTunes Search API (`itunes.apple.com/search?media=ebook&entity=ebook&country=ES`):**
     - Provides high-resolution Spanish & international edition covers (upgrading `artworkUrl100` to `600x600bb.jpg`), exact publication years (`releaseDate`), and genres (`genres`).
   - **Internet Archive Advanced Search & Crossref REST API (`archive.org/advancedsearch.php` & `api.crossref.org/works`):**
     - Provides reliable fallback coverage for non-fiction, academic, technical, and digitized books (`number_of_pages` / `imagecount`, `publisher`, `year`, and `archive.org/services/img/{id}`).

2. **Cross-Source & Cross-Edition Fusion + Balanced Source Quota (Up to 8 Results):**
   - Equivalent candidates across all 5 sources (matching by normalized ISBN-13/10 or normalized Primary Title + Author tokens) are merged into a synthetic **`merged`** master candidate that combines the highest-resolution valid cover with the best available `totalPages`, `publicationYear`, `publisher`, `isbn`, `seriesName`/`seriesOrder`, and `genre`.
   - `searchByQuery()` returns up to **8 balanced results** (`MAX_SEARCH_RESULTS = 8`): the top fused (`merged`) candidate(s) first, followed by a round-robin quota ensuring diversity across Google Books, Open Library, Apple Books, Wikidata, and Internet Archive/Crossref so no single provider monopolizes the list.

3. **Integral Metadata & Cover Auto-Enrichment (`CoverEnrichmentService` Evolution):**
   - **Incomplete Book Detection:** Detects any library book missing a cover (`!coverUrl`) **OR** missing key metadata (`totalPages <= 1`, missing `publicationYear`, missing `publisher`, or missing `isbn`).
   - **Automatic ISBN $\to$ Title+Author Cascade:** When a book has a valid ISBN, the engine queries ISBN sources first; if the ISBN lookup returns no cover or still leaves missing fields (`totalPages`, `publicationYear`, `publisher`), it **automatically cascades** to strict verified `Title + Author` lookup across the 5 sources and merges all found fields.
   - **Non-Destructive Backfill Invariant:** Never overwrites existing user-populated fields. Only populates empty/missing fields (`!book.coverUrl`, `book.totalPages <= 1`, `!book.publicationYear`, `!book.publisher?.trim()`, `!book.isbn?.trim()`, `!book.series?.name`).
   - **Enhanced Step-by-Step Visual Assistant:** Displays candidate metadata badges (`totalPages`, `publicationYear`, `publisher`, `isbn`, `source`) beneath each candidate cover and backfills all missing book fields in one click when selected.

4. **Flexible External/AI Import Normalizer & Auto-Enrichment Trigger:**
   - `parseBackupJson()` and `parseCsvCatalog()` normalize external or AI-generated JSON/CSV payloads before Zod validation:
     - Auto-generates missing `id` (UUID), `createdAt`, and `updatedAt` (ISO-8601).
     - Normalizes missing, `null`, `0`, or non-positive `totalPages` to `Math.max(1, currentPage || 1)` while marking the book as requiring page-count enrichment (`totalPages <= 1` or via enrichment detection) so **zero books are discarded** due to unknown page counts.
     - Expands CSV export/import columns (`CSV_COLUMNS`) to include `publisher`, `publicationYear`, and `genre`.
   - Adds an opt-in checkbox (checked by default when incomplete books are detected in the import preview) to **automatically launch Integral Enrichment** immediately after confirming an import.

5. **100% Local Offline Export/Import Suite (Text-Only vs Full Base64 JSON vs Portable `.ZIP` Bundle):**
   - **Lightweight Text-Only Exports:**
     - **Lightweight JSON (`.json` without Base64 covers):** Ideal for sharing with AI tools, text editors, or fast lightweight backups (`stripLocalCovers: true`).
     - **Complete CSV (`.csv`):** Includes `publisher`, `publicationYear`, and `genre` in addition to all existing columns.
   - **Full Self-Contained Offline Exports & Restore:**
     - **Full JSON Backup (`.json` with Base64 covers):** Single-file JSON containing embedded `data:image/...` covers.
     - **Portable `.ZIP` Archive (`bookstack-backup-YYYY-MM-DD.zip`):** Built 100% client-side with zero external dependencies using native Web `CompressionStream` / `DecompressionStream` (`src/app/features/settings/utils/zip-archive.utils.ts`). Packages `backup.json` (clean JSON referencing relative `covers/<bookId>.<ext>` paths), `catalog.csv`, and the `covers/` folder containing binary `.webp`/`.jpg` cover files.
     - **Unified `.ZIP` / `.JSON` / `.CSV` Importer:** Selecting a `.zip` file in `DataPortabilitySectionComponent` unpacks `backup.json` and `covers/*` locally in memory, re-hydrates each book's `coverUrl` as a local `data:image/...;base64,...` string, shows the standard validation preview, and restores 100% offline with zero network calls.

---

## 2. Atomic Task Breakdown

- [x] **[Task 15.1: Multi-Source Zod Schemas, Domain Contracts, CSP & Bilingual i18n](task-15.1-multi-source-schemas-models-csp-and-i18n.md)** — Expand `MetadataProviderSource` & `BookMetadataCandidate`, add Zod parsers for Open Library Editions, Google Books structured queries, Wikidata, Apple Books ES, Internet Archive, and Crossref, update `index.html` CSP `connect-src`, and add `es`/`en` i18n keys.
- [x] **[Task 15.2: Cross-Source Fusion Engine, Edition Fallback & Balanced Quota in `BookMetadataService`](task-15.2-cross-source-fusion-and-balanced-metadata-service.md)** — Implement 5-source parallel/waterfall lookup, Open Library Work Editions & direct ISBN cover fallback, cross-edition metadata merging, CORS-resilient cover resolution, and balanced 8-result ranking.
- [x] **[Task 15.3: Integral Metadata & Cover Auto-Enrichment Engine & Visual Assistant Upgrade](task-15.3-integral-metadata-enrichment-service-and-assistant.md)** — Upgrade `CoverEnrichmentService` to detect missing covers OR missing `totalPages`/`publicationYear`/`publisher`/`isbn`, automatically cascade from ISBN $\to$ Title+Author, non-destructively backfill all missing fields, and enrich the Visual Assistant with full metadata application.
- [x] **[Task 15.4: Flexible External/AI Import Normalizer, Expanded CSV & Browser-Native `.ZIP` Archive Engine](task-15.4-flexible-import-normalizer-and-offline-zip-engine.md)** — Build zero-dependency `zip-archive.utils.ts`, add flexible AI/external JSON & CSV record normalization (auto-ID, timestamps, unknown `totalPages` tolerance), add `publisher`/`publicationYear`/`genre` to CSV, and implement Lightweight JSON, Full JSON, and `.ZIP` export/import in `DataPortabilityService`.
- [ ] **[Task 15.5: Settings Portability Suite, Auto-Enrichment Trigger & Lookup UI Enhancements](task-15.5-settings-portability-enrichment-and-lookup-ui.md)** — Update `DataPortabilitySectionComponent` (4 export actions, `.zip` import support, auto-enrich on import toggle), `CoverEnrichmentSectionComponent` (integral metadata counters & rich candidate cards), and `BookMetadataLookupComponent` (5-source badges & series/genre patch).
- [ ] **[Task 15.6: Playwright E2E Verification & Tier 2 Per-Phase Documentation Sync](task-15.6-e2e-verification-and-tier-2-docs-sync.md)** — Add Playwright E2E tests for 5-source lookup, flexible import + integral enrichment, and offline `.ZIP` export/import in `tests/e2e/`, run full verification gates, and execute Tier 2 documentation & branch hygiene sync.
