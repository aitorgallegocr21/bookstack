# Task 13.2: Bulk Cover Enrichment Service, Rate-Limited Queue, Incremental IndexedDB Sync & Verification Report

**Phase:** Phase 13: Post-Import Bulk Cover Enrichment & Library Cover Assistant  
**Status:** Completed  
**Estimated Impact:** High (`CoverEnrichmentService` Signal state machine, rate-limited batch ISBN & strict Title+Author queues, incremental `BooksService.updateMany()` persistence, and `DataPortabilityService` missing-cover summary integration).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/services/books.service.ts` (`L16-74`): `books` signal, `update()`, and `updateMany()` batch transaction persistence.
- `src/app/features/books/services/book-metadata.service.ts` (`L90-240`): `lookupByIsbn()`, `lookupBatchByIsbns()`, `searchByQuery()`, and `verifyStrictTitleAuthorCandidate()`.
- `src/app/features/books/services/image-optimizer.service.ts` (`L47-88`): `optimizeRemoteUrl()` with `{ minWidth: 80, minHeight: 120 }`.
- `src/app/features/books/utils/isbn.utils.ts` (`L55-100`): `isValidIsbn()` and `normalizeIsbn()`.
- `src/app/features/settings/models/data-portability.model.ts` (`L44-54`): `ImportExecutionResult`.
- `src/app/features/settings/services/data-portability.service.ts` (`L241-294`): `executeImport()`.

**Files to Create / Update:**

- `src/app/features/settings/models/cover-enrichment.model.ts`
- `src/app/features/settings/services/cover-enrichment.service.ts`
- `src/app/features/settings/services/cover-enrichment.service.spec.ts`
- `src/app/features/settings/models/data-portability.model.ts`
- `src/app/features/settings/services/data-portability.service.ts`
- `src/app/features/settings/services/data-portability.service.spec.ts`

---

## 2. Technical Objectives

1. **Cover Enrichment Domain Contracts (`src/app/features/settings/models/cover-enrichment.model.ts`):**
   - `export type CoverEnrichmentMode = 'isbn-strict' | 'title-author-strict';`
   - `export type CoverEnrichmentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';`
   - `export type CoverEnrichmentFailureReason = 'missing_isbn' | 'no_metadata_found' | 'no_cover_in_provider' | 'mismatch_verification' | 'invalid_cover_dimensions' | 'network_error';`
   - `export interface CoverEnrichmentSkippedItem { bookId: string; title: string; author: string; isbn?: string; reason: CoverEnrichmentFailureReason; }`
   - `export interface MissingCoverSummary { totalMissing: number; withValidIsbnCount: number; withoutValidIsbnCount: number; booksWithIsbn: Book[]; booksWithoutIsbn: Book[]; }`
   - `export interface CoverEnrichmentState { status: CoverEnrichmentStatus; mode: CoverEnrichmentMode | null; processedCount: number; totalCount: number; downloadedCount: number; skippedItems: CoverEnrichmentSkippedItem[]; }`
2. **`CoverEnrichmentService` (`src/app/features/settings/services/cover-enrichment.service.ts`):**
   - `providedIn: 'root'`, injecting `BooksService`, `BookMetadataService`, and `ImageOptimizerService`.
   - Exposes `readonly missingCoverSummary = computed<MissingCoverSummary>(...)` reactive to `BooksService.books()`, partitioning books without `book.coverUrl?.trim()` into `booksWithIsbn` (`Boolean(book.isbn && isValidIsbn(book.isbn))`) and `booksWithoutIsbn`.
   - Exposes `readonly state = signal<CoverEnrichmentState>(...)` and visual assistant state signals (`assistantActive`, `assistantQueue`, `assistantCurrentIndex`, `assistantCandidates`, `assistantLoading`).
   - **`runStrictIsbnEnrichment(): Promise<void>`:**
     - Snapshots current `missingCoverSummary().booksWithIsbn`.
     - Processes in chunks of `20` books: calls `bookMetadataService.lookupBatchByIsbns()`, falls back to `bookMetadataService.lookupByIsbn()` when an ISBN had no cover in the Open Library batch, and downloads/compresses candidate covers with `imageOptimizer.optimizeRemoteUrl(coverUrl, { minWidth: 80, minHeight: 120 })` (max concurrency `2` downloads at a time).
     - Flushes resolved book updates incrementally via `BooksService.updateMany()` after every `5` downloaded covers (and on completion/pause/cancel) so user progress is immediately persisted in IndexedDB.
     - Appends accurate `CoverEnrichmentSkippedItem` entries (`no_metadata_found`, `no_cover_in_provider`, `invalid_cover_dimensions`, `network_error`) for any book that could not be enriched.
   - **`runStrictTitleAuthorEnrichment(): Promise<void>`:**
     - Runs on all books currently missing a cover (`missingCoverSummary().booksWithoutIsbn` + any books from the ISBN pass that still lack a cover).
     - Queries `bookMetadataService.searchByQuery(`${book.title} ${book.author}`)` with controlled pacing (`250ms` delay between queries to respect provider rate limits), validates candidates via `verifyStrictTitleAuthorCandidate()`, and verifies image dimensions ($\ge 80\times120\text{px}$).
     - Records `mismatch_verification` when candidates are returned by the search provider but fail strict title+author verification.
   - **Queue Controls (`pause()`, `resume()`, `cancel()`, `resetReport()`):**
     - Allows pausing, resuming, or cancelling the active loop cleanly between items without losing already-persisted covers.
   - **Step-by-Step Visual Cover Assistant Methods:**
     - `startVisualAssistant(books?: readonly Book[]): Promise<void>`: Initializes the interactive review queue for books missing covers and loads suggestions (`searchByQuery`) with non-empty `coverUrl` for the first book.
     - `selectAssistantCover(candidate: BookMetadataCandidate): Promise<boolean>`: Downloads and optimizes `candidate.coverUrl` ($\ge 80\times120\text{px}$), persists `coverUrl` (and backfills `isbn` if the book lacked one and the selected candidate has a valid ISBN) via `BooksService.update()`, and advances to the next book.
     - `skipAssistantBook(): Promise<void>` and `closeVisualAssistant(): void`.
3. **Post-Import Missing Cover Counter (`src/app/features/settings/models/data-portability.model.ts` & `data-portability.service.ts`):**
   - Add `missingCoversCount: number` and `missingCoversWithIsbnCount: number` to `ImportExecutionResult`, computed from `this.booksService.books()` right after `executeImport()` completes.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/settings/services/cover-enrichment.service.spec.ts`
- [x] `npm run test:file -- src/app/features/settings/services/data-portability.service.spec.ts`
- [x] `npm run verify:quiet`
