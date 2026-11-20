# Task 15.3: Integral Metadata & Cover Auto-Enrichment Engine & Visual Assistant Upgrade

**Phase:** Phase 15: Multi-Source Metadata Engine (5 Providers), Integral Auto-Enrichment & Offline `.ZIP` Bundles  
**Status:** Completed  
**Estimated Impact:** High (Upgrades `CoverEnrichmentService` into a full metadata & cover enrichment engine that backfills `coverUrl`, `totalPages`, `publicationYear`, `publisher`, `isbn`, and `series`, cascades automatically from ISBN to strict Title+Author lookup, and enriches the Step-by-Step Visual Assistant).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/models/cover-enrichment.model.ts` (`L1-56`): `CoverEnrichmentMode`, `MissingCoverSummary`, and `CoverEnrichmentState`.
- `src/app/features/settings/services/cover-enrichment.service.ts` (`L1-595`): `missingCoverSummary`, `runStrictIsbnEnrichment()`, `runStrictTitleAuthorEnrichment()`, `enrichBookFromIsbnCandidate()`, `enrichBookByStrictTitleAuthor()`, `applyAssistantCandidateToBook()`, and `loadAssistantCandidatesForCurrentBook()`.

**Files to Create / Update:**

- `src/app/features/settings/models/cover-enrichment.model.ts`
- `src/app/features/settings/services/cover-enrichment.service.ts`
- `src/app/features/settings/services/cover-enrichment.service.spec.ts`

---

## 2. Technical Objectives

1. **Integral Incomplete-Book Audit Model (`src/app/features/settings/models/cover-enrichment.model.ts`):**
   - Extend `CoverEnrichmentMode` to include `'integral-auto'` alongside `'isbn-strict'` and `'title-author-strict'`.
   - Extend `MissingCoverSummary` (while keeping existing fields for backward compatibility):
     - `totalIncomplete: number;` (books missing cover OR `totalPages <= 1` OR `!publicationYear` OR `!publisher` OR `!isbn`)
     - `missingCoverCount: number;`
     - `missingPagesCount: number;` (`book.totalPages <= 1`)
     - `missingYearCount: number;` (`!book.publicationYear`)
     - `missingPublisherCount: number;` (`!book.publisher?.trim()`)
     - `missingIsbnCount: number;` (`!book.isbn || !isValidIsbn(book.isbn)`)
     - `incompleteBooks: Book[];`
   - Extend `CoverEnrichmentState`:
     - `metadataUpdatedCount: number;` (count of books where `totalPages`, `publicationYear`, `publisher`, `isbn`, or `series` were backfilled).
2. **Non-Destructive Multi-Field Book Merger (`src/app/features/settings/services/cover-enrichment.service.ts`):**
   - Create helper `mergeCandidateIntoBook(book: Book, candidate: BookMetadataCandidate, optimizedCover?: string): { updatedBook: Book; coverChanged: boolean; metadataChanged: boolean }`:
     - **Cover:** Sets `coverUrl: optimizedCover` only if `!book.coverUrl?.trim()` and `optimizedCover` is non-empty.
     - **Total Pages:** Sets `totalPages: candidate.totalPages` only if `book.totalPages <= 1` and `candidate.totalPages && candidate.totalPages > 1` (ensuring `totalPages >= book.currentPage`).
     - **Publication Year:** Sets `publicationYear: candidate.publicationYear` only if `!book.publicationYear` and `candidate.publicationYear`.
     - **Publisher:** Sets `publisher: candidate.publisher` only if `!book.publisher?.trim()` and `candidate.publisher?.trim()`.
     - **ISBN:** Sets `isbn: normalizeIsbn(candidate.isbn) ?? candidate.isbn` only if `(!book.isbn?.trim() || !isValidIsbn(book.isbn))` and `candidate.isbn && isValidIsbn(candidate.isbn)`.
     - **Series:** Sets `series` only if `!book.series?.name?.trim()` and `candidate.seriesName?.trim()`.
3. **Automatic ISBN $\to$ Strict Title+Author Cascade (`runIntegralEnrichment` & `enrichBookFromIsbnCandidate`):**
   - Add `runIntegralEnrichment(targetBooks?: readonly Book[]): Promise<void>` (and upgrade `runStrictIsbnEnrichment()` / `runStrictTitleAuthorEnrichment()` to use `mergeCandidateIntoBook()` so metadata fields are never discarded!):
     - For every incomplete book:
       1. If the book has a valid ISBN, look up by ISBN across the 5-source batch/single pipeline.
       2. If the book has no valid ISBN, **OR** if the ISBN candidate is missing a cover (`!candidate?.coverUrl`) or still leaves missing fields on the book (`bookNeedsMoreFields(book, candidate)`), automatically execute a structured 5-source `searchByQuery(book.title + ' ' + book.author, { title: book.title, author: book.author })` and verify via `verifyStrictTitleAuthorCandidate()`.
       3. Merge the ISBN candidate and the verified Title+Author candidate together (`mergeCandidates`) so if the ISBN hit had the publisher/year and the Title+Author hit had the cover and page count, the book receives **both**!
       4. Optimize the cover via `ImageOptimizerService.optimizeRemoteUrl(coverUrl, { minWidth: 80, minHeight: 120 })` if the book still needs a cover; even if no cover is available (or the book already had a cover), persist any newly discovered `totalPages`, `publicationYear`, `publisher`, `isbn`, or `series` in batches via `BooksService.updateMany()`.
4. **Upgraded Step-by-Step Visual Assistant (`applyAssistantCandidateToBook`):**
   - Update `applyAssistantCandidateToBook(book: Book, candidate: BookMetadataCandidate)` to use `mergeCandidateIntoBook()` so selecting an edition card in the Visual Assistant backfills not only `coverUrl` and `isbn`, but also `totalPages` (when $\le 1$), `publicationYear`, `publisher`, and `series`.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/settings/services/cover-enrichment.service.spec.ts`
- [x] `npm run verify:quiet`
