# Task 9.1: CSP Hardening, Storage Batch Primitives, Portability Models & Zod Backup Schema

**Phase:** Phase 09: Settings, Data Portability & Backup Engine (`/settings`)  
**Status:** Pending  
**Estimated Impact:** High (CSP security header in `src/index.html`, batch store operations in `StorageAdapterService`/`BooksService`/`ReadingLogService`, portability domain contracts, Zod backup schema, and bilingual i18n keys).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/index.html` (`L1-23`): Document `<head>` metadata where the CSP `<meta>` tag will be added.
- `src/app/core/services/storage-adapter.service.ts` (`L14-246`): Existing IndexedDB + LocalStorage fallback methods and preference keys.
- `src/app/features/books/services/books.service.ts` (`L1-110`): Existing `books` signal and CRUD persistence methods.
- `src/app/features/books/services/reading-log.service.ts` (`L1-83`): Existing `readingLogs` signal and CRUD persistence methods.
- `src/app/features/books/schemas/book.schema.ts` (`L1-119`): Existing `BookSchema`, `ReadingLogSchema`, `parseStoredBooks`, and `parseStoredReadingLogs`.
- `src/app/features/books/schemas/reading-goals.schema.ts` (`L1-28`): Existing `ReadingGoalsSchema`.
- `src/app/core/i18n/i18n.types.ts` (`L345-355`): Existing `settings` translation contract.
- `src/app/core/i18n/es.ts` (`L352-363`): Existing Spanish `settings` dictionary entries.
- `src/app/core/i18n/en.ts` (`L349-359`): Existing English `settings` dictionary entries.

**Files to Create / Update:**

- `src/index.html`
- `src/app/core/services/storage-adapter.service.ts`
- `src/app/core/services/storage-adapter.service.spec.ts`
- `src/app/features/books/services/books.service.ts`
- `src/app/features/books/services/reading-log.service.ts`
- `src/app/features/settings/models/data-portability.model.ts`
- `src/app/features/settings/schemas/backup.schema.ts`
- `src/app/features/settings/schemas/backup.schema.spec.ts`
- `src/app/core/i18n/i18n.types.ts`
- `src/app/core/i18n/es.ts`
- `src/app/core/i18n/en.ts`

---

## 2. Technical Objectives

1. **CSP Meta Hardening (`src/index.html`):**
   - Insert `<meta http-equiv="Content-Security-Policy" ... />` in `<head>` with valid meta-level directives (omitting `frame-ancestors`, which triggers browser console warnings in `<meta>` tags):
     `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://openlibrary.org https://*.openlibrary.org https://www.googleapis.com; media-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';`
2. **Storage Batch & Quota Primitives (`StorageAdapterService`, `BooksService`, `ReadingLogService`):**
   - In `StorageAdapterService`:
     - Add `clearStore(storeName: string): Promise<void>` clearing both the IndexedDB object store (`store.clear()`) and matching `${storeName}_*` keys in `localStorage`.
     - Add `replaceStore<T extends { id: string }>(storeName: string, items: T[]): Promise<boolean>` executing a single readwrite transaction (`store.clear()` followed by `store.put(item)` for each entry) with `localStorage` fallback.
     - Add `isUsingIndexedDb(): Promise<boolean>` returning `true` when `getDB()` resolves and `false` on fallback.
     - Add `estimateBrowserQuota(): Promise<{ usageBytes: number | null; quotaBytes: number | null }>` wrapping `navigator.storage?.estimate()` safely.
   - In `BooksService`:
     - Add `replaceAll(books: Book[]): Promise<void>` and `clearAll(): Promise<void>` updating both `StorageAdapterService` and the `books` signal.
   - In `ReadingLogService`:
     - Add `replaceAll(logs: ReadingLog[]): Promise<void>` and `clearAll(): Promise<void>` updating both `StorageAdapterService` and the `readingLogs` signal.
3. **Portability Domain Contracts (`src/app/features/settings/models/data-portability.model.ts`):**
   - `BackupPreferences`: `{ locale?: SupportedLocale; theme?: 'light' | 'dark'; catalogViewMode?: CatalogViewMode; catalogSort?: CatalogSortOption }`.
   - `BookstackBackupEnvelope`: `{ schemaVersion: 1; app: 'BookStack'; exportedAt: string; books: Book[]; readingLogs: ReadingLog[]; readingGoals?: ReadingGoals | null; preferences?: BackupPreferences }`.
   - `ImportFormat = 'json' | 'csv'`, `ImportConflictMode = 'merge' | 'overwrite'`.
   - `ImportPreviewSummary`: `{ format: ImportFormat; fileName: string; validBooks: Book[]; validReadingLogs: ReadingLog[]; readingGoals: ReadingGoals | null; preferences: BackupPreferences | null; invalidBooksCount: number; invalidLogsCount: number; duplicateBooksCount: number; newBooksCount: number }`.
   - `ImportExecutionResult`: `{ mode: ImportConflictMode; format: ImportFormat; booksImported: number; logsImported: number; skippedRecords: number; goalsRestored: boolean; preferencesRestored: boolean }`.
   - `StorageBreakdownSummary`: `{ engine: 'indexeddb' | 'localstorage'; totalBookstackBytes: number; booksMetadataBytes: number; coversBase64Bytes: number; readingLogsBytes: number; preferencesBytes: number; booksCount: number; coversCount: number; readingLogsCount: number; browserUsageBytes: number | null; browserQuotaBytes: number | null; healthStatus: 'healthy' | 'moderate' | 'near-limit' }`.
4. **Zod Backup Schema (`src/app/features/settings/schemas/backup.schema.ts`):**
   - Define `BackupPreferencesSchema` and `BackupEnvelopeSchema` validating both the full `BookstackBackupEnvelope` and graceful legacy/raw `Book[]` JSON arrays, filtering individual `books` and `readingLogs` with `BookSchema.safeParse` and `ReadingLogSchema.safeParse` so a single malformed item is counted as `invalidBooksCount`/`invalidLogsCount` rather than rejecting the entire file.
5. **Bilingual i18n Extension (`i18n.types.ts`, `es.ts`, `en.ts`):**
   - Expand `settings` dictionary keys for:
     - Preferences section (language, theme light/dark, default catalog view mode).
     - Storage Quota Inspector (title, engine badge, health badges, 4 category labels, record count labels).
     - Data Portability section (JSON/CSV export cards, import dropzone/picker, preview summary labels, `Merge` vs. `Overwrite` radio options and warnings, success/error alerts).
     - Danger Zone section (`Clear reading sessions` vs. `Factory reset`, confirmation modal copy, 1-click pre-reset backup CTA).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/settings/schemas/backup.schema.spec.ts`
- [ ] `npm run test:file -- src/app/core/services/storage-adapter.service.spec.ts`
- [ ] `npm run verify:quiet`
