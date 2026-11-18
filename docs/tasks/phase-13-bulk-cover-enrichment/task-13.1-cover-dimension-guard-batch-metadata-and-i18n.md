# Task 13.1: Cover Dimension Guard, Multi-ISBN Batch Metadata Lookup & Bilingual i18n

**Phase:** Phase 13: Post-Import Bulk Cover Enrichment & Library Cover Assistant  
**Status:** Completed  
**Estimated Impact:** Medium (Anti-placeholder image dimension validation, Open Library multi-ISBN batch parser & service method, strict Title+Author candidate verifier, and bilingual `es`/`en` settings dictionary keys).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/services/image-optimizer.service.ts` (`L1-147`): `optimize()`, `optimizeRemoteUrl()`, and `loadImage()`.
- `src/app/features/books/schemas/book-metadata.schema.ts` (`L87-215`): `OpenLibraryBibkeyResponseSchema` and `parseOpenLibraryBibkeyResponse()`.
- `src/app/features/books/services/book-metadata.service.ts` (`L28-329`): `normalizeTextForComparison()`, `lookupByIsbn()`, `searchByQuery()`, and `resolveLocalCover()`.
- `src/app/core/i18n/domains/settings.i18n.ts` (`L1-354`): `SettingsI18n`, `ES_SETTINGS`, and `EN_SETTINGS`.

**Files to Create / Update:**

- `src/app/features/books/services/image-optimizer.service.ts`
- `src/app/features/books/services/image-optimizer.service.spec.ts`
- `src/app/features/books/schemas/book-metadata.schema.ts`
- `src/app/features/books/schemas/book-metadata.schema.spec.ts`
- `src/app/features/books/services/book-metadata.service.ts`
- `src/app/features/books/services/book-metadata.service.spec.ts`
- `src/app/core/i18n/domains/settings.i18n.ts`

---

## 2. Technical Objectives

1. **Anti-Placeholder Dimension Guard (`src/app/features/books/services/image-optimizer.service.ts`):**
   - Define `export interface RemoteCoverOptimizationOptions { timeoutMs?: number; minWidth?: number; minHeight?: number; }`.
   - Update `optimizeRemoteUrl(remoteUrl: string, optionsOrTimeout?: number | RemoteCoverOptimizationOptions): Promise<string>` (preserving backward compatibility when a numeric `timeoutMs` is passed).
   - When `minWidth` (e.g., `80`) or `minHeight` (e.g., `120`) is provided, check `naturalWidth = image.naturalWidth || image.width` and `naturalHeight = image.naturalHeight || image.height` before drawing to canvas; if the loaded image is smaller than `minWidth` or `minHeight`, reject/return `''` so 1×1 transparent pixels or broken placeholder thumbnails are never persisted.
2. **Multi-ISBN Open Library Batch Parser (`src/app/features/books/schemas/book-metadata.schema.ts`):**
   - Export `parseOpenLibraryBibkeyBatchResponse(payload: unknown, requestedIsbns: readonly string[]): Map<string, BookMetadataCandidate>`:
     - Validates `payload` once with `OpenLibraryBibkeyResponseSchema`.
     - Maps each requested normalized ISBN-13 to its parsed `BookMetadataCandidate` when present in `payload` (`ISBN:${isbn}`), avoiding N separate HTTP calls for batch Open Library lookups.
3. **Batch ISBN Lookup & Strict Title+Author Matcher (`src/app/features/books/services/book-metadata.service.ts`):**
   - Add `lookupBatchByIsbns(rawIsbns: readonly string[]): Promise<Map<string, BookMetadataCandidate>>`:
     - Normalizes and deduplicates valid ISBNs via `normalizeIsbn()`.
     - Resolves cached entries from `this.isbnCache` first.
     - Queries Open Library `/api/books?bibkeys=ISBN:1,ISBN:2,...&format=json&jscmd=data` in chunks of up to `20` ISBNs per request and parses via `parseOpenLibraryBibkeyBatchResponse()`.
     - Populates `this.isbnCache` for all resolved candidates and returns a `Map<string, BookMetadataCandidate>` keyed by normalized ISBN-13.
   - Add `verifyStrictTitleAuthorCandidate(book: { title: string; author: string; publisher?: string; publicationYear?: number }, candidates: readonly BookMetadataCandidate[]): BookMetadataCandidate | null`:
     - Requires a candidate with a non-empty `coverUrl`.
     - Requires normalized title match (exact normalized title equality OR one normalized title containing the other when the shorter title has $\ge 4$ characters and matches the primary title before `:` / `-` subtitle separators) AND normalized author match (primary author surname/tokens present in candidate author).
     - Ranks matching candidates by completeness + bonus points when `publicationYear` or normalized `publisher` matches the local book.
4. **Bilingual i18n Extension (`src/app/core/i18n/domains/settings.i18n.ts`):**
   - Extend `SettingsI18n['settings']` with a `coverEnrichment` section containing full Spanish (`ES_SETTINGS`) and English (`EN_SETTINGS`) strings for:
     - Section title, description, and missing-covers counter badges (`withIsbn`, `withoutIsbn`, `allCoversComplete`).
     - Post-import banner prompt (`postImportBannerTitle`, `postImportBannerDescription`, `postImportBannerAction`).
     - Primary strict ISBN action (`startIsbnEnrichmentAction`), progress status (`progressRunning`, `progressPaused`, `progressCompleted`, `progressCancelled`, `pauseAction`, `resumeAction`, `cancelAction`).
     - Post-ISBN remaining books options:
       - Visual Step-by-Step Assistant (`visualAssistantTitle`, `visualAssistantDescription`, `visualAssistantStartAction`, `visualAssistantStepCounter`, `visualAssistantSelectAction`, `visualAssistantSkipAction`, `visualAssistantCloseAction`, `visualAssistantNoSuggestions`).
       - Strict Title+Author Automated Search (`strictSearchTitle`, `strictSearchWarning`, `strictSearchConfirmAction`).
     - Verification & Skipped Books Report (`reportTitle`, `reportDownloadedCount`, `reportSkippedCount`, `reasonMissingIsbn`, `reasonNoMetadata`, `reasonNoCover`, `reasonMismatch`, `reasonInvalidImage`, `reasonNetworkError`).

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/books/services/image-optimizer.service.spec.ts`
- [x] `npm run test:file -- src/app/features/books/schemas/book-metadata.schema.spec.ts`
- [x] `npm run test:file -- src/app/features/books/services/book-metadata.service.spec.ts`
- [x] `npm run verify:quiet`
