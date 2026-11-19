# Task 15.2: Cross-Source Fusion Engine, Edition Fallback & Balanced Quota in `BookMetadataService`

**Phase:** Phase 15: Multi-Source Metadata Engine (5 Providers), Integral Auto-Enrichment & Offline `.ZIP` Bundles  
**Status:** Pending  
**Estimated Impact:** High (Fixes Google Books visibility, implements 5-source parallel/cascade search, Open Library Work Editions & direct ISBN cover probing, cross-edition metadata fusion, and balanced 8-result ranking).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/services/book-metadata.service.ts` (`L1-478`): `mergeCandidates()`, `scoreCandidateCompleteness()`, `lookupByIsbn()`, `lookupBatchByIsbns()`, `verifyStrictTitleAuthorCandidate()`, `searchByQuery()`, and `resolveLocalCover()`.
- `src/app/features/books/services/image-optimizer.service.ts` (`L63-118`): `optimizeRemoteUrl()`.
- `src/app/features/books/utils/book-form.utils.ts` (`L103-184`): `buildMetadataFormPatch()`.

**Files to Create / Update:**

- `src/app/features/books/services/book-metadata.service.ts`
- `src/app/features/books/services/book-metadata.service.spec.ts`
- `src/app/features/books/utils/book-form.utils.ts`
- `src/app/features/books/utils/book-form.utils.spec.ts`

---

## 2. Technical Objectives

1. **Structured Query Builder & 5-Source Search (`src/app/features/books/services/book-metadata.service.ts`):**
   - Increase `MAX_SEARCH_RESULTS` from `5` to `8`.
   - Add an internal query parser `parseStructuredSearchHint(rawQuery: string, explicit?: { title?: string; author?: string })` that extracts `title` and `author` hints when available.
   - Update `searchByQuery(rawQuery: string, hints?: { title?: string; author?: string }): Promise<BookMetadataCandidate[]>` to query all 5 providers concurrently via `Promise.allSettled`:
     1. **Open Library Search:** Uses `title=...&author=...` when structured hints exist (with fallback to `q=...`), `limit=8`. If the top Open Library candidate is missing `totalPages` or `coverUrl` and has a `workKey` (`/works/OL...W`), automatically fetches `/works/{OLID}/editions.json?limit=10` to enrich `totalPages`, `publisher`, `publicationYear`, `isbn`, and `coverUrl`.
     2. **Google Books Volumes:** Uses `intitle:"..."+inauthor:"..."` when structured hints exist (falling back to broad `q=...` if 0 items returned), `maxResults=8&printType=books`.
     3. **Apple Books ES:** Queries `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=ebook&entity=ebook&country=ES&limit=5`.
     4. **Wikidata SPARQL:** Queries `https://query.wikidata.org/sparql?format=json&query=...` for matching bibliographic items with `P1104` (pages), `P577` (publication date), `P123` (publisher), `P212` (ISBN-13), `P179` (series), and `P18` (image).
     5. **Internet Archive / Crossref:** Queries `archive.org/advancedsearch.php` and `api.crossref.org/works?query.bibliographic=...&rows=5`.
2. **Enhanced Multi-Source ISBN & Batch ISBN Lookup:**
   - In `lookupByIsbn(rawIsbn: string)`:
     - Query Open Library Bibkey and Google Books `isbn:${normalizedIsbn}` in parallel first.
     - If the merged result still lacks any key field (`!hasAllKeyFields(merged)`), query Wikidata (`P212` / `P957`) and Crossref (`filter=isbn:${normalizedIsbn}`) + Open Library Editions if a `workKey` is available.
     - If `coverUrl` is still missing after metadata queries, probe `https://covers.openlibrary.org/b/isbn/${normalizedIsbn}-L.jpg?default=false`.
   - In `lookupBatchByIsbns(rawIsbns: readonly string[])`:
     - Query Open Library multi-bibkey chunks (`20` ISBNs per request).
     - For any ISBN in the chunk that returned no record or is missing `coverUrl` / `totalPages`, automatically run the multi-source `lookupByIsbn()` fallback so batch callers receive complete merged records.
3. **Cross-Edition & Cross-Source Metadata Fusion (`mergeCandidates` & `fuseEquivalentCandidates`):**
   - Enhance `mergeCandidates(primary, secondary)`:
     - Combines `title`, `author`, `isbn`, `publisher`, `publicationYear`, `totalPages` (preferring realistic page counts $> 1$), `coverUrl`, `seriesName`, `seriesOrder`, and `genre`.
     - Tracks all contributing provider names in `sources: MetadataProviderSource[]` and sets `source: 'merged'` when $\ge 2$ distinct providers contributed.
   - When multiple editions of the same work (matching normalized primary title + author tokens) exist across the candidate pool, synthesize a top **`merged`** candidate that backfills missing `totalPages`, `publicationYear`, `publisher`, `isbn`, and `coverUrl` from sibling editions.
4. **Balanced Provider Quota Ranking (Fixes Google Books Exclusion):**
   - Replace the naive `.sort().slice(0, 5)` truncation with a balanced selector returning up to `8` candidates:
     - Slot 1: Best `merged` candidate (if available).
     - Remaining slots: Round-robin selection across the top-scoring candidates from each distinct provider (`googlebooks`, `openlibrary`, `applebooks`, `wikidata`, `archive`/`crossref`) before filling any remaining slots by raw completeness score.
5. **Series & Genre Form Patching (`src/app/features/books/utils/book-form.utils.ts`):**
   - Extend `MetadataFormValuesSnapshot`, `MetadataFormPatch`, and `buildMetadataFormPatch()` so `seriesName`, `seriesOrder`, and `genre` from a `BookMetadataCandidate` are also patched when empty (or in `overwrite-public` mode).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/books/services/book-metadata.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/utils/book-form.utils.spec.ts`
- [ ] `npm run verify:quiet`
