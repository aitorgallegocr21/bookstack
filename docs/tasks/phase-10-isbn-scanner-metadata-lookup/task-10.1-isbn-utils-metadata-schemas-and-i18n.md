# Task 10.1: ISBN-10/13 Checksum Utilities, Metadata Contracts, Zod External Schemas, Remote Cover Optimizer & i18n

**Phase:** Phase 10: ISBN Barcode Scanner & Public Metadata Auto-Fill  
**Status:** Completed  
**Estimated Impact:** Medium-High (Pure ISBN validation/conversion utilities, external metadata contracts & Zod schemas, remote cover optimization in `ImageOptimizerService`, CSP `connect-src` update, and bilingual i18n keys).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/index.html` (`L11-15`): Existing Content-Security-Policy `<meta>` tag where Google Books cover domains (`https://books.google.com https://*.googleusercontent.com`) will be added to `connect-src` for local Canvas cover optimization.
- `src/app/features/books/schemas/book.schema.ts` (`L25-37`): Existing `isSafeCoverUrl` helper.
- `src/app/features/books/services/image-optimizer.service.ts` (`L1-100`): Existing `ImageOptimizerService.optimize(file: File)` pipeline.
- `src/app/core/i18n/i18n.types.ts` (`L160-220`): Existing `bookForm` translation contract.
- `src/app/core/i18n/es.ts` (`L160-221`): Existing Spanish `bookForm` dictionary entries.
- `src/app/core/i18n/en.ts` (`L160-220`): Existing English `bookForm` dictionary entries.

**Files to Create / Update:**

- `src/index.html`
- `src/app/features/books/utils/isbn.utils.ts`
- `src/app/features/books/utils/isbn.utils.spec.ts`
- `src/app/features/books/models/book-metadata.model.ts`
- `src/app/features/books/schemas/book-metadata.schema.ts`
- `src/app/features/books/schemas/book-metadata.schema.spec.ts`
- `src/app/features/books/services/image-optimizer.service.ts`
- `src/app/features/books/services/image-optimizer.service.spec.ts`
- `src/app/core/i18n/i18n.types.ts`
- `src/app/core/i18n/es.ts`
- `src/app/core/i18n/en.ts`

---

## 2. Technical Objectives

1. **Pure ISBN-10 / ISBN-13 Utilities (`src/app/features/books/utils/isbn.utils.ts`):**
   - `cleanIsbnInput(raw: string): string`: Strips hyphens, spaces, and non-ISBN prefixes, uppercasing trailing `'x'` to `'X'`.
   - `isValidIsbn10(raw: string): boolean`: Validates 10-character ISBNs (`9 digits + [0-9X]`) using the standard Modulo-11 positional checksum ($\sum_{i=1}^{10} (11 - i) \cdot d_i \equiv 0 \pmod{11}$).
   - `isValidIsbn13(raw: string): boolean`: Validates 13-digit EAN/ISBN-13 codes starting with Bookland prefixes `978` or `979` using the Modulo-10 alternating weights ($1, 3$) checksum.
   - `isValidIsbn(raw: string): boolean`: Returns `true` if `isValidIsbn13(raw)` or `isValidIsbn10(raw)`.
   - `convertIsbn10To13(isbn10: string): string | null`: Prepends `978` to the first 9 digits of a valid `ISBN-10` and computes the Modulo-10 check digit.
   - `normalizeIsbn(raw: string): string | null`: Returns the canonical 13-digit ISBN (converting valid `ISBN-10` to `ISBN-13` automatically) or `null` if invalid.
   - `areIsbnsEquivalent(a?: string | null, b?: string | null): boolean`: Compares two raw ISBN strings by comparing their canonical `normalizeIsbn()` values (with cleaned string fallback if either is a non-standard identifier).
2. **Metadata Lookup Domain Contracts (`src/app/features/books/models/book-metadata.model.ts`):**
   - `export type MetadataProviderSource = 'openlibrary' | 'googlebooks' | 'merged';`
   - `export type MetadataLookupMode = 'scan' | 'search';`
   - `export type BookMetadataApplyMode = 'fill-empty' | 'overwrite-public';`
   - `export interface BookMetadataCandidate { id: string; title: string; author: string; isbn?: string; publisher?: string; publicationYear?: number; totalPages?: number; coverUrl?: string; source: MetadataProviderSource; }`
   - `export interface DuplicateLibraryMatch { bookId: string; title: string; author: string; isbn?: string; status: BookStatus; matchReason: 'isbn' | 'title-author'; }`
3. **Zod External API Schemas & Cover URL Sanitizer (`src/app/features/books/schemas/book-metadata.schema.ts`):**
   - `sanitizeExternalCoverUrl(rawUrl?: string | null): string | undefined`: Trims URL, upgrades `http://` to `https://` (fixing Google Books `http://books.google.com/books/content...` URLs), strips `&edge=curl`, and validates with `isSafeCoverUrl()`.
   - `extractPublicationYear(rawDate?: string | number | null): number | undefined`: Extracts a valid 4-digit year ($1000 \le \text{year} \le 2100$) from strings like `"2021-05-14"`, `"May 2019"`, or `"1998"`.
   - Define **Zod** schemas and parser functions:
     - `parseOpenLibraryBibkeyResponse(payload: unknown, requestedIsbn: string): BookMetadataCandidate | null` validating the `https://openlibrary.org/api/books?bibkeys=...&format=json&jscmd=data` response object.
     - `parseOpenLibrarySearchResponse(payload: unknown): BookMetadataCandidate[]` validating the `https://openlibrary.org/search.json` `docs` array.
     - `parseGoogleBooksVolumesResponse(payload: unknown): BookMetadataCandidate[]` validating the `https://www.googleapis.com/books/v1/volumes` `items` array (`volumeInfo.title`, `authors`, `publisher`, `publishedDate`, `pageCount`, `industryIdentifiers`, `imageLinks`).
4. **Remote Cover Optimizer (`src/app/features/books/services/image-optimizer.service.ts`):**
   - Add `async optimizeRemoteUrl(remoteUrl: string): Promise<string>` to `ImageOptimizerService`:
     - Validates `remoteUrl` starts with `https://`.
     - Calls `fetch(remoteUrl, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' })`.
     - Converts the response `Blob` into a `File` and runs `await this.optimize(file)` to produce a compressed local `data:image/webp;base64,...` (or JPEG) string.
     - If `fetch()` or canvas optimization fails (e.g., CORS restriction or offline), catches the error gracefully and returns the sanitized `remoteUrl` so the user never loses the cover reference.
5. **CSP Update (`src/index.html`) & Bilingual i18n (`i18n.types.ts`, `es.ts`, `en.ts`):**
   - In `src/index.html`, extend `connect-src` with `https://books.google.com https://*.googleusercontent.com`.
   - In `i18n.types.ts`, `es.ts`, and `en.ts`, add `lookup` inside `bookForm` covering: panel header/toggle, scan tab & search tab labels, search input placeholder, ISBN quick-lookup button aria/label, camera controls (start, stop, switch camera, upload barcode photo, scanning hint, permission error, invalid barcode error), loading states (searching metadata, optimizing cover locally), edition results list, source badges (`Open Library`, `Google Books`, `Combinado` / `Merged`), duplicate book warning banner, and edit apply modes (`Rellenar campos vacíos` / `Sobrescribir datos públicos` + applied confirmation feedback).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/books/utils/isbn.utils.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/schemas/book-metadata.schema.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/services/image-optimizer.service.spec.ts`
- [ ] `npm run verify:quiet`
