# Task 9.2: Data Portability Service (JSON Backup, RFC 4180 CSV w/ Formula Guard & Storage Inspector Engine)

**Phase:** Phase 09: Settings, Data Portability & Backup Engine (`/settings`)  
**Status:** Pending  
**Estimated Impact:** High (core `DataPortabilityService` orchestrating JSON/CSV serialization, formula-injection sanitization, Zod import preview, `merge`/`overwrite` restoration with rollback, and 4-category storage footprint calculation).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/models/data-portability.model.ts` (`L1-80`): Portability and storage breakdown interfaces created in Task 9.1.
- `src/app/features/settings/schemas/backup.schema.ts` (`L1-90`): Zod backup envelope parser created in Task 9.1.
- `src/app/features/books/models/book.model.ts` (`L1-150`): `Book`, `ReadingLog`, and `ReadingGoals` contracts.
- `src/app/features/books/services/books.service.ts` (`L1-130`): `books` signal and `replaceAll`/`clearAll` methods.
- `src/app/features/books/services/reading-log.service.ts` (`L1-100`): `readingLogs` signal and `replaceAll`/`clearAll` methods.
- `src/app/features/books/services/reading-stats.service.ts` (`L40-90`): `readingGoals` signal and `updateReadingGoals()` method.
- `src/app/features/books/services/catalog-filter.service.ts` (`L70-130`): `viewMode` and `sortOption` signals and setter methods.
- `src/app/core/services/theme.service.ts` (`L1-83`): `theme` signal and `setTheme()`.
- `src/app/core/i18n/i18n.service.ts` (`L1-49`): `locale` signal and `setLocale()`.

**Files to Create:**

- `src/app/features/settings/services/data-portability.service.ts`
- `src/app/features/settings/services/data-portability.service.spec.ts`

---

## 2. Technical Objectives

1. **JSON Full Backup Export & Parsing (`DataPortabilityService`):**
   - `buildJsonBackupEnvelope(): BookstackBackupEnvelope`: Snapshots current `books()`, `readingLogs()`, `readingGoals()`, and active `preferences` (`locale`, `theme`, `catalogViewMode`, `catalogSort`) with `schemaVersion: 1`, `app: 'BookStack'`, and UTC ISO `exportedAt`.
   - `exportJsonBackup(): string` & `downloadJsonBackup(): void`: Serializes formatted JSON (`2`-space indent) and triggers a browser file download named `bookstack-backup-YYYY-MM-DD.json`.
2. **RFC 4180 CSV Catalog Export & Parsing with Formula Guard:**
   - Columns: `id,title,author,status,totalPages,currentPage,format,rating,startDate,endDate,seriesName,seriesOrder,isbn,notes,createdAt,updatedAt`.
   - **UTF-8 BOM & Formula Injection Guard:** Prefix exported CSV content with `\uFEFF` so Excel opens Spanish characters cleanly. Sanitize any string cell whose trimmed value starts with `=`, `+`, `-`, `@`, `\t`, or `\r` by prefixing a single quote `'` before RFC 4180 quote escaping.
   - **CSV Parser (`parseCsvCatalog`):** Strip optional leading `\uFEFF` and leading formula-guard `'`, parse RFC 4180 quoted fields (including embedded commas and escaped `""` quotes), map columns to `Book` candidates (generating UUIDs and timestamps when omitted in external spreadsheets), and validate each row with `BookSchema.safeParse`.
3. **Two-Step Import Preview & Conflict Resolution (`merge` vs. `overwrite`):**
   - `analyzeImportFile(fileName: string, rawContent: string): ImportPreviewSummary`:
     - Detects `.json` vs `.csv`, validates records via Zod, and calculates `newBooksCount` vs `duplicateBooksCount` by matching incoming books against existing `books()` by `id` OR normalized `title.trim().toLowerCase() + '|' + author.trim().toLowerCase()`.
   - `executeImport(preview: ImportPreviewSummary, mode: ImportConflictMode): Promise<ImportExecutionResult>`:
     - Captures an in-memory snapshot of `books()`, `readingLogs()`, `readingGoals()`, and `preferences` before writing.
     - **`merge` mode:** Upserts books (preserving existing `id` when matched by normalized `title + author`, updating fields from the imported record), upserts `readingLogs` by `id` (remapping `bookId` if a book was matched by title+author), and restores `readingGoals`/`preferences` if present.
     - **`overwrite` mode:** Replaces all `books` and `readingLogs` with `preview.validBooks` and `preview.validReadingLogs`, and applies `readingGoals`/`preferences` if present.
     - **Rollback Safety:** If `replaceAll` throws or fails, restores the pre-import snapshot so user data is never left half-written.
4. **Destructive Reset Operations:**
   - `clearReadingSessionsOnly(): Promise<void>`: Clears `readingLogs` store via `ReadingLogService.clearAll()` while keeping all `books` intact.
   - `factoryResetAllData(): Promise<void>`: Clears `books`, `readingLogs`, resets `readingGoals` to defaults, and resets `localStorage` preferences (`locale` $\to$ `'es'`, catalog view/sort $\to$ defaults).
5. **Reactive Storage Footprint & Quota Inspector Calculation:**
   - `computeStorageBreakdown(): Promise<StorageBreakdownSummary>`:
     - Measures UTF-8 byte lengths (`new TextEncoder().encode(...).byteLength`) separating `coversBase64Bytes` (`book.coverUrl` starting with `data:image/`) from `booksMetadataBytes`, `readingLogsBytes`, and `preferencesBytes`.
     - Queries `StorageAdapterService.isUsingIndexedDb()` and `estimateBrowserQuota()` to compute `healthStatus` (`'healthy'` $< 60\%$, `'moderate'` $60\text{--}85\%$, `'near-limit'` $> 85\%$ of quota or $> 4\text{MB}$ when running on `localStorage` fallback).
6. **Comprehensive Unit Tests (`data-portability.service.spec.ts`):**
   - Test JSON export envelope structure and round-trip import (`merge` and `overwrite`).
   - Test CSV export with UTF-8 BOM, formula-injection sanitization (`=cmd|...`, `+SUM(...)`), embedded commas/quotes, and CSV import matching by `title + author`.
   - Test partial invalid records handling (`invalidBooksCount`, `invalidLogsCount`).
   - Test `clearReadingSessionsOnly()`, `factoryResetAllData()`, and `computeStorageBreakdown()` byte separation (metadata vs. Base64 covers).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/settings/services/data-portability.service.spec.ts`
- [ ] `npm run verify:quiet`
