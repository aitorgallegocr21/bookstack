# Task 10.2: Privacy-First Book Metadata Service (Open Library + Google Books Waterfall, Session Cache & Duplicate Detector)

**Phase:** Phase 10: ISBN Barcode Scanner & Public Metadata Auto-Fill  
**Status:** Completed  
**Estimated Impact:** High (Core `BookMetadataService` orchestrating Open Library + Google Books waterfall queries, candidate deduplication, session caching, local cover compression, and library duplicate detection).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/models/book-metadata.model.ts` (`L1-45`): Metadata candidate and duplicate match contracts created in Task 10.1.
- `src/app/features/books/schemas/book-metadata.schema.ts` (`L1-160`): Zod parsers for Open Library and Google Books created in Task 10.1.
- `src/app/features/books/utils/isbn.utils.ts` (`L1-110`): ISBN checksum, normalization, and equivalence utilities created in Task 10.1.
- `src/app/features/books/services/books.service.ts` (`L1-55`): `books` signal exposing the current local library.
- `src/app/features/books/services/image-optimizer.service.ts` (`L1-125`): `optimizeRemoteUrl()` method added in Task 10.1.

**Files to Create / Update:**

- `src/app/features/books/services/book-metadata.service.ts`
- `src/app/features/books/services/book-metadata.service.spec.ts`

---

## 2. Technical Objectives

1. **Privacy-First HTTP Fetch Helper (`BookMetadataService`):**
   - All external HTTP requests must use a private `fetchJsonWithTimeout(url: string, timeoutMs = 6500): Promise<unknown>` helper configured with:
     - `method: 'GET'`
     - `credentials: 'omit'`
     - `referrerPolicy: 'no-referrer'`
     - `headers: { Accept: 'application/json' }`
     - `AbortController` timeout so slow external APIs never hang the UI.
2. **Smart Hybrid ISBN Lookup (`lookupByIsbn(rawIsbn: string): Promise<BookMetadataCandidate | null>`):**
   - Validates and normalizes `rawIsbn` via `normalizeIsbn(rawIsbn)` (throwing a typed `INVALID_ISBN` error or returning `null` if invalid).
   - Checks the in-memory `isbnCache = new Map<string, BookMetadataCandidate>()` first.
   - **Step 1 (Open Library Primary):** Queries `https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=data` and parses with `parseOpenLibraryBibkeyResponse()`.
   - **Step 2 (Google Books Waterfall / Enrichment):** If Open Library returns `null` OR is missing any key catalog field (`!candidate.totalPages || !candidate.coverUrl || !candidate.publisher || !candidate.publicationYear`), queries `https://www.googleapis.com/books/v1/volumes?q=isbn:${normalizedIsbn}&maxResults=3` and parses with `parseGoogleBooksVolumesResponse()`.
   - **Step 3 (Field Merge):** Merges the Open Library and Google Books candidates, preferring non-empty fields (`title`, `author`, `isbn`, `publisher`, `publicationYear`, `totalPages`, `coverUrl`) and setting `source: 'merged'` when both contributed data. Stores the final candidate in `isbnCache`.
3. **Dual-Provider Title/Author Search (`searchByQuery(rawQuery: string): Promise<BookMetadataCandidate[]>`):**
   - Trims and normalizes `rawQuery` (minimum 2 characters). If the query itself is a valid ISBN (`isValidIsbn(rawQuery)`), delegates directly to `lookupByIsbn(rawQuery)` and wraps the result in a single-item array.
   - Checks `queryCache = new Map<string, BookMetadataCandidate[]>()`.
   - Executes `Promise.allSettled` against:
     - Open Library Search (`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=key,title,author_name,isbn,publisher,first_publish_year,number_of_pages_median,cover_i`)
     - Google Books Volumes (`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books`)
   - Deduplicates candidates by canonical ISBN (`areIsbnsEquivalent`) or normalized `title + author`, merges complementary fields when two providers return the same edition, ranks candidates with complete metadata (cover + page count + ISBN) higher, and returns at most `5` candidates.
4. **Local Cover Optimization & Local Library Duplicate Detection:**
   - `resolveLocalCover(coverUrl?: string): Promise<string | undefined>`: If `coverUrl` is non-empty, delegates to `imageOptimizer.optimizeRemoteUrl(coverUrl)`.
   - `findDuplicateInLibrary(input: { isbn?: string | null; title?: string | null; author?: string | null }, excludeBookId?: string): DuplicateLibraryMatch | null`:
     - Inspects `booksService.books()` (excluding `excludeBookId` when editing an existing book).
     - Checks ISBN equivalence (`areIsbnsEquivalent(book.isbn, input.isbn)`) first (`matchReason: 'isbn'`).
     - If no ISBN match, checks case-insensitive, diacritic-insensitive normalized `title + author` equality (`matchReason: 'title-author'`).
     - Returns `{ bookId, title, author, isbn, status, matchReason }` or `null`.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/books/services/book-metadata.service.spec.ts`
- [x] `npm run verify:quiet`
