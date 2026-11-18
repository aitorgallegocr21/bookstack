# Task 12.4: IndexedDB Lifecycle Resilience, Batch Transactions & Storage Portability Sync

**Phase:** Phase 12: Performance, Caching, Architecture & Legal Hardening  
**Status:** Pending  
**Estimated Impact:** High (Hardens `StorageAdapterService` connection lifecycle and transaction completion, adds single-transaction `putMany` / `BooksService.updateMany`, eliminates $N$-transaction loops in `SeriesService`, fixes `DataPortabilityService` $\leftrightarrow$ `SeriesService` live signal desync, optimizes byte breakdown calculation, and adds LRU bounds to `BookMetadataService`).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/core/services/storage-adapter.service.ts` (`L14-225`, `L325-361`): `getDB()`, `initDB()`, `set()`, `remove()`, `replaceStore()`, and `localStorage` fallback helpers.
- `src/app/features/books/services/books.service.ts` (`L50-115`): `add()`, `update()`, `delete()`, `replaceAll()`, `clearAll()`.
- `src/app/features/series/services/series.service.ts` (`L400-544`): `upsertSeriesMetadata()`, `linkBooksToSeries()`, `unlinkBookFromSeries()`, `replaceAllMetadata()`, `clearAllMetadata()`.
- `src/app/features/settings/services/data-portability.service.ts` (`L220-415`, `L795-805`): `executeImport()`, `factoryResetAllData()`, `computeStorageBreakdown()`, `readStoredSeriesMetadata()`, `replaceStoredSeriesMetadata()`, `getUtf8ByteLength()`.
- `src/app/features/books/services/book-metadata.service.ts` (`L75-160`): `isbnCache`, `queryCache`, `clearSessionCache()`, `lookupByIsbn()`, `searchByTitleOrAuthor()`.

**Files to Create / Update:**

- `src/app/core/services/storage-adapter.service.ts`
- `src/app/core/services/storage-adapter.service.spec.ts`
- `src/app/features/books/services/books.service.ts`
- `src/app/features/books/services/books.service.spec.ts`
- `src/app/features/series/services/series.service.ts`
- `src/app/features/series/services/series.service.spec.ts`
- `src/app/features/settings/services/data-portability.service.ts`
- `src/app/features/settings/services/data-portability.service.spec.ts`
- `src/app/features/books/services/book-metadata.service.ts`
- `src/app/features/books/services/book-metadata.service.spec.ts`

---

## 2. Technical Objectives

1. **IndexedDB Connection Lifecycle & ACID Transaction Completion (`storage-adapter.service.ts`):**
   - In `initDB()` (`L46-55`), attach `db.onclose = () => { this.dbPromise = null; }` and `db.onversionchange = () => { db.close(); this.dbPromise = null; }` so idle browser closures or multi-tab schema upgrades never leave `this.dbPromise` pointing to a closed `IDBDatabase`.
   - In `set()` (`L115-137`) and `remove()` (`L139-160`), resolve the promise on `transaction.oncomplete` (and handle `transaction.onerror` / `transaction.onabort` including `QuotaExceededError` notification) rather than resolving prematurely on `request.onsuccess`.
   - Add `async putMany<T extends { id: string }>(storeName: StoreName, items: T[]): Promise<boolean>`:
     - If `items.length === 0`, return `true` immediately.
     - Open a single `readwrite` transaction on `storeName`, call `store.put(item)` for every item, and resolve on `transaction.oncomplete`.
     - If IndexedDB is unavailable, update all matching items in the `localStorage` fallback array in a single `JSON.parse` / `JSON.stringify` pass.
2. **Batch Book Updates & Single-Signal Emission (`books.service.ts`, `series.service.ts`):**
   - Add `async updateMany(updatedBooks: Book[]): Promise<boolean>` in `BooksService`:
     - Persist all updated books in a single transaction via `await this.storage.putMany('books', updatedBooks)`.
     - Update `this.booksSignal` in **one** `.update()` call using a `Map<string, Book>` lookup (`updatedById.get(b.id) ?? b`).
   - Refactor `SeriesService.upsertSeriesMetadata()` (`L425-438`) and `SeriesService.linkBooksToSeries()` (`L470-488`) to collect all modified `Book` instances into an array and invoke `await this.booksService.updateMany(modifiedBooks)` once instead of awaiting `this.booksService.update(...)` inside a `for` loop.
3. **Fix `DataPortabilityService` $\leftrightarrow$ `SeriesService` Live Signal Synchronization (`data-portability.service.ts`):**
   - Inject `SeriesService` into `DataPortabilityService` (verify zero circular dependency: `SeriesService` injects `BooksService`, `ReadingLogService`, `StorageAdapterService`—it does NOT inject `DataPortabilityService`).
   - Read current series metadata from `this.seriesService.metadata()` (or `replaceAllMetadata` / `clearAllMetadata`) during `buildJsonBackupEnvelope()`, `executeImport()`, `restoreSnapshot()`, `factoryResetAllData()`, and `computeStorageBreakdown()`, ensuring `SeriesService.sagas()` updates reactively without a browser reload.
4. **Allocation-Free Storage Byte Breakdown (`data-portability.service.ts`):**
   - Optimize `computeStorageBreakdown()` (`L316-370`): instead of cloning every `Book` with `{ ...book, coverUrl: undefined }` and running `JSON.stringify()` + `new TextEncoder().encode()` across full collections, compute UTF-8 byte lengths using a reusable module-level `TextEncoder` instance (`const UTF8_ENCODER = new TextEncoder()`) and subtract `coverDataBytes` directly from total serialized `books` bytes (avoiding array/object cloning and double serialization).
5. **Bounded LRU Cache in `BookMetadataService` (`book-metadata.service.ts`):**
   - Add a `MAX_CACHE_ENTRIES = 50` bound to `isbnCache` and `queryCache` using `Map` insertion-order eviction (when `cache.size >= MAX_CACHE_ENTRIES`, delete `cache.keys().next().value`; on cache hit, refresh key order).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/core/services/storage-adapter.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/services/books.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/series/services/series.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/settings/services/data-portability.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/services/book-metadata.service.spec.ts`
- [ ] `npm run verify:quiet`
