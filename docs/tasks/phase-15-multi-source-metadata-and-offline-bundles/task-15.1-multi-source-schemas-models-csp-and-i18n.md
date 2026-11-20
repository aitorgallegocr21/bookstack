# Task 15.1: Multi-Source Zod Schemas, Domain Contracts, CSP & Bilingual i18n

**Phase:** Phase 15: Multi-Source Metadata Engine (5 Providers), Integral Auto-Enrichment & Offline `.ZIP` Bundles  
**Status:** Completed  
**Estimated Impact:** Medium-High (Extends metadata contracts to 5 providers, adds Zod runtime parsers for Open Library Editions, Wikidata, Apple Books ES, Internet Archive, and Crossref, updates browser CSP `connect-src`, and extends `books` + `settings` bilingual i18n dictionaries).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/index.html` (`L1-20`): `<meta http-equiv="Content-Security-Policy" ...>` directive.
- `src/app/features/books/models/book-metadata.model.ts` (`L1-28`): `MetadataProviderSource` and `BookMetadataCandidate`.
- `src/app/features/books/schemas/book-metadata.schema.ts` (`L1-432`): Existing Open Library & Google Books Zod schemas and helper functions (`sanitizeExternalCoverUrl`, `extractPublicationYear`, `pickBestNormalizedIsbn`).
- `src/app/core/i18n/domains/books.i18n.ts` (`L133-177`, `L350-415`, `L590-662`): `bookForm.lookup.sources` interface and `ES_BOOKS` / `EN_BOOKS` dictionaries.
- `src/app/core/i18n/domains/settings.i18n.ts` (`L44-126`, `L197-291`, `L365-459`): `portability` and `coverEnrichment` interfaces and `ES_SETTINGS` / `EN_SETTINGS` dictionaries.

**Files to Create / Update:**

- `src/index.html`
- `src/app/features/books/models/book-metadata.model.ts`
- `src/app/features/books/schemas/book-metadata.schema.ts`
- `src/app/features/books/schemas/book-metadata.schema.spec.ts`
- `src/app/core/i18n/domains/books.i18n.ts`
- `src/app/core/i18n/domains/settings.i18n.ts`

---

## 2. Technical Objectives

1. **Content Security Policy Update (`src/index.html`):**
   - Extend `connect-src` in the CSP `<meta>` tag (`L11-14`) to allow HTTPS requests to the new legal public metadata endpoints:
     - `https://www.wikidata.org`
     - `https://query.wikidata.org`
     - `https://itunes.apple.com`
     - `https://*.mzstatic.com`
     - `https://api.crossref.org`
     - `https://commons.wikimedia.org`
     - `https://upload.wikimedia.org`
2. **Metadata Provider & Candidate Domain Contract (`src/app/features/books/models/book-metadata.model.ts`):**
   - Expand `MetadataProviderSource`:
     ```ts
     export type MetadataProviderSource =
       | 'openlibrary'
       | 'googlebooks'
       | 'wikidata'
       | 'applebooks'
       | 'archive'
       | 'crossref'
       | 'merged';
     ```
   - Extend `BookMetadataCandidate` with optional rich metadata fields discovered across providers:
     - `workKey?: string;` (e.g., Open Library `/works/OL...W` key for editions fallback)
     - `seriesName?: string;`
     - `seriesOrder?: number;`
     - `genre?: string[];`
     - `sources?: MetadataProviderSource[];` (tracks contributing providers when `source === 'merged'`)
3. **Multi-Source Zod Schemas & Mappers (`src/app/features/books/schemas/book-metadata.schema.ts`):**
   - **Open Library Enhancements:**
     - Preserve `doc.key` (when starting with `/works/`) as `workKey` in `parseOpenLibrarySearchResponse()`.
     - Add `parseOpenLibraryWorkEditionsResponse(payload: unknown, fallbackWorkInfo?: { title?: string; author?: string }): BookMetadataCandidate[]` for `/works/{OLID}/editions.json`: extracts `number_of_pages`, `publishers`, `publish_date`, `isbn_13`/`isbn_10`, and `covers` (mapping `covers[0]` $\to$ `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`).
   - **Google Books Enhancements:**
     - Support `subtitle` concatenation (when `subtitle` is present and not already in `title`), `categories` $\to$ `genre`, and normalize `books.google.com/books/content` cover URLs (preserving `zoom=1`, stripping `&edge=curl`, upgrading `http://` to `https://`).
   - **Wikidata SPARQL Response Parser (`parseWikidataSparqlResponse(payload: unknown): BookMetadataCandidate[]`):**
     - Validates standard `results.bindings` JSON from `query.wikidata.org/sparql`.
     - Maps `itemLabel`, `authorLabel`, `isbn13` / `isbn10`, `pages` (`P1104`), `pubDate` (`P577`), `publisherLabel` (`P123`), `seriesLabel` (`P179`), `seriesOrdinal` (`P1545`), and `image` (`P18`, upgrading Wikimedia Commons URLs to HTTPS thumbnail width `400px`) into `BookMetadataCandidate` with `source: 'wikidata'`.
   - **Apple Books / iTunes Search Response Parser (`parseAppleBooksSearchResponse(payload: unknown): BookMetadataCandidate[]`):**
     - Validates `results` array from `itunes.apple.com/search?media=ebook&entity=ebook`.
     - Maps `trackId`, `trackName` (`title`), `artistName` (`author`), `releaseDate` $\to$ `publicationYear`, `genres` $\to$ `genre`, and upgrades `artworkUrl100` / `artworkUrl60` to high-resolution `600x600bb.jpg` HTTPS `coverUrl` with `source: 'applebooks'`.
   - **Internet Archive & Crossref Parsers:**
     - `parseInternetArchiveSearchResponse(payload: unknown): BookMetadataCandidate[]`: validates `response.docs` from `archive.org/advancedsearch.php`, mapping `identifier`, `title`, `creator`, `publisher`, `year` / `date`, `imagecount` / `number_of_pages`, `isbn`, and cover URL `https://archive.org/services/img/${identifier}` (`source: 'archive'`).
     - `parseCrossrefWorksResponse(payload: unknown): BookMetadataCandidate[]`: validates `message.items` from `api.crossref.org/works`, mapping `title[0]`, `author` (`given` + `family`), `publisher`, `published-print` / `published-online` date-parts year, `ISBN`, and `page` count (`source: 'crossref'`).
4. **Bilingual i18n Dictionary Extensions (`src/app/core/i18n/domains/books.i18n.ts` & `settings.i18n.ts`):**
   - In `books.i18n.ts`, add `wikidata`, `applebooks`, `archive`, and `crossref` labels under `bookForm.lookup.sources` in both `ES_BOOKS` and `EN_BOOKS`.
   - In `settings.i18n.ts`, add bilingual strings under `portability` and `coverEnrichment` for:
     - 4 export modes: Full JSON (with covers), Lightweight JSON (text-only), Complete CSV (text-only), and Portable `.ZIP` Bundle (JSON + CSV + `/covers` folder).
     - Auto-enrichment checkbox in the import preview panel (`autoEnrichAfterImportLabel`, `autoEnrichAfterImportDescription`).
     - Integral enrichment counters & labels (`incompleteMetadataBadge`, `missingPagesLabel`, `missingYearLabel`, `missingPublisherLabel`, `StartIntegralEnrichmentAction`, `fieldsUpdatedCountLabel`).

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/books/schemas/book-metadata.schema.spec.ts`
- [x] `npm run verify:quiet`
