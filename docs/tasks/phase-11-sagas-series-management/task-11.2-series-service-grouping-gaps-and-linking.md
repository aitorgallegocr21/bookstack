# Task 11.2: `SeriesService` Signal Store, Normalized Grouping Engine, Missing-Volume Radar & Bulk Linking

**Phase:** Phase 11: Sagas, Series & Collections Management (`/series`)  
**Status:** Pending  
**Estimated Impact:** High (Core `SeriesService` Signal engine, pure normalization/gap helpers, reactive Bento filtering & sorting, and batch book-series mutations).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/series/models/series.model.ts`: Domain contracts created in Task 11.1.
- `src/app/features/series/schemas/series.schema.ts`: Zod parser created in Task 11.1.
- `src/app/features/books/services/books.service.ts` (`L1-116`): `BooksService.books()` signal, `update()`, `replaceAll()`, `ensureInitialized()`.
- `src/app/features/books/services/reading-log.service.ts` (`L1-83`): `ReadingLogService.readingLogs()` signal for aggregating time spent per saga.
- `src/app/features/books/services/catalog-filter.service.ts` (`L1-160`): Reference signal pattern for omni-search, status chips, counts, and sorting.
- `src/app/features/books/utils/book-form.utils.ts` (`L85-101`): Existing `buildBookSeriesPayload()`.

**Files to Create / Update:**

- `src/app/features/series/utils/series.utils.ts`
- `src/app/features/series/utils/series.utils.spec.ts`
- `src/app/features/series/services/series.service.ts`
- `src/app/features/series/services/series.service.spec.ts`

---

## 2. Technical Objectives

1. **Pure Series Utilities (`src/app/features/series/utils/series.utils.ts`):**
   - `normalizeSeriesKey(name: string): string`: Trims, collapses repeated spaces, removes Unicode diacritics (`NFD`), and lowercases so `"El Archivo de las Tormentas"` and `"el  archivo de las tormentas"` resolve to the same canonical key.
   - `computeMissingVolumes(ownedVolumes: readonly number[], expectedVolumes?: number): number[]`: Given integer volume numbers $> 0$ and optional `expectedVolumes`, determines `maxVolume = Math.max(highestOwned, expectedVolumes ?? 0)` and returns sorted missing integers in `1..maxVolume`.
   - `resolveSagaBentoScale(totalTargetVolumes: number): SagaBentoScale`: Maps `<= 2` $\to$ `'compact'`, `3..5` $\to$ `'medium'`, `>= 6` $\to$ `'showcase'`.
   - `sortSagaBooksChronologically(books: readonly Book[]): Book[]`: Sorts by `series.volumeNumber ?? Number.MAX_SAFE_INTEGER`, breaking ties by `publicationYear ?? Number.MAX_SAFE_INTEGER`, then `createdAt` ascending, then `title`.
   - `buildTimelineSlots(sortedBooks: readonly Book[], missingVolumes: readonly number[]): SagaVolumeSlot[]`: Interleaves owned books (preserving unnumbered books cleanly at the end) and missing integer slots in ascending volume order.
2. **`SeriesService` Signal Store (`src/app/features/series/services/series.service.ts`):**
   - `providedIn: 'root'`, injecting `BooksService`, `ReadingLogService`, and `StorageAdapterService` (`storeName = 'seriesMetadata'`).
   - Loads `seriesMetadata` lazily via `ensureInitialized()` validated with `parseStoredSeriesMetadata()`.
   - Exposes `readonly existingSeriesOptions = computed<{ id: string; normalizedKey: string; name: string; count: number; nextVolumeNumber: number }[]>(...)` for Create/Edit autocomplete and canonical `series.id` lookup.
   - Exposes `readonly sagas = computed<SagaAggregation[]>(...)`:
     - Groups all `booksService.books()` entries with a non-empty `book.series?.name` by `normalizeSeriesKey(book.series.name)`.
     - Attaches matching `SeriesMetadata` (by `normalizedKey` or canonical `id`).
     - Computes `authors` (unique ordered list), `completedCount`/`readingCount`/`pendingCount`/`abandonedCount`, `totalPages`, `readPages`, `progressPercent`, `averageRating` (across rated books $> 0$), `totalReadingMinutes` (summed from `ReadingLogService.readingLogs()` for member `bookId`s), `missingVolumes`, `timelineSlots`, `nextBookToRead` (first `reading` book in volume order, else first `pending` book in volume order, else `null`), `statusCategory` (`'reading'` if any `reading` or mixed progress, `'completed'` if `ownedCount > 0 && completedCount === ownedCount && missingVolumes.length === 0`, else `'pending'`), `bentoScale`, and `lastActivityAt`.
   - Filter & sort signals (`searchQuery`, `statusFilter`, `sortOption`) with `filteredSagas`, `statusCounts`, `hasActiveFilters`, `setSearchQuery()`, `setStatusFilter()`, `setSortOption()`, and `resetFilters()`.
   - Mutation methods:
     - `upsertSeriesMetadata(payload: { normalizedKey?: string; id?: string; name: string; expectedVolumes?: number | null; publicationStatus?: SeriesPublicationStatus | null; notes?: string | null }): Promise<SeriesMetadata>`: Persists metadata and, if `name` changed, renames `book.series.name` & unifies `book.series.id` across all member books in `BooksService`.
     - `linkBooksToSeries(seriesName: string, bookIds: readonly string[], startingVolume?: number): Promise<void>`: Assigns canonical `series.id`, `name`, and sequential `volumeNumber` onto existing standalone books.
     - `unlinkBookFromSeries(bookId: string): Promise<void>`: Clears `book.series` via `BooksService.update()`.
     - `updateBookVolumeNumber(bookId: string, volumeNumber?: number | null): Promise<void>`: Updates `book.series.volumeNumber` cleanly.
     - `replaceAllMetadata(items: SeriesMetadata[]): Promise<void>` and `clearAllMetadata(): Promise<void>` for `DataPortabilityService`.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/series/utils/series.utils.spec.ts`
- [ ] `npm run test:file -- src/app/features/series/services/series.service.spec.ts`
- [ ] `npm run verify:quiet`
