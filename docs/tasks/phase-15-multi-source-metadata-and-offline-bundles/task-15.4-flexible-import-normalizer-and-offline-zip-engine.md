# Task 15.4: Flexible External/AI Import Normalizer, Expanded CSV & Browser-Native `.ZIP` Archive Engine

**Phase:** Phase 15: Multi-Source Metadata Engine (5 Providers), Integral Auto-Enrichment & Offline `.ZIP` Bundles  
**Status:** Completed  
**Estimated Impact:** High (Prevents external/AI JSON & CSV books with missing `totalPages`, `id`, or timestamps from being discarded on import, expands CSV with `publisher`/`publicationYear`/`genre`, and adds a 100% browser-native `.ZIP` packager/unpacker for offline backups with `/covers` images).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/models/data-portability.model.ts` (`L1-70`): `ImportFormat`, `ImportPreviewSummary`, and `ImportExecutionResult`.
- `src/app/features/settings/schemas/backup.schema.ts` (`L1-160`): `filterBooks()` and `parseBackupJson()`.
- `src/app/features/settings/services/data-portability.service.ts` (`L35-298`, `L582-786`): `CSV_COLUMNS`, `buildJsonBackupEnvelope()`, `exportCsvCatalog()`, `parseCsvCatalog()`, `analyzeImportFile()`, `executeImport()`, `extractCsvField()`, and `mapCsvRowToBookCandidate()`.

**Files to Create / Update:**

- `src/app/features/settings/utils/zip-archive.utils.ts` _(new)_
- `src/app/features/settings/utils/zip-archive.utils.spec.ts` _(new)_
- `src/app/features/settings/models/data-portability.model.ts`
- `src/app/features/settings/schemas/backup.schema.ts`
- `src/app/features/settings/schemas/backup.schema.spec.ts`
- `src/app/features/settings/services/data-portability.service.ts`
- `src/app/features/settings/services/data-portability.service.spec.ts`

---

## 2. Technical Objectives

1. **Flexible External / AI Book Record Normalizer (`src/app/features/settings/schemas/backup.schema.ts` & `data-portability.service.ts`):**
   - Add `normalizeImportedBookCandidate(raw: unknown): unknown` in `backup.schema.ts` and invoke it inside `filterBooks()` before `BookSchema.safeParse()`:
     - If `raw` is a plain object with non-empty `title` and `author`:
       - **Auto-ID & Timestamps:** If `id` is missing/empty, generate a deterministic or UUID string (`crypto.randomUUID()`). If `createdAt` or `updatedAt` is missing/empty, default to `new Date().toISOString()`.
       - **Status Default:** If `status` is missing or uppercase/Spanish alias (e.g., `'leído'`, `'read'`, `'pendiente'`, `'leyendo'`, `'abandonado'`), normalize to `'pending' | 'reading' | 'completed' | 'abandoned'` (default `'pending'`).
       - **Flexible `totalPages` & `currentPage`:** If `totalPages` is missing, `null`, `0`, `NaN`, or $< 1$ (common in AI-generated JSON or unfinished CSV rows), normalize `currentPage` to a non-negative integer (default `0`) and set `totalPages = Math.max(1, currentPage)` so `BookSchema` accepts the book and `CoverEnrichmentService` automatically detects `totalPages <= 1` as needing real page-count enrichment!
       - If `currentPage > totalPages` and `totalPages > 1`, clamp `currentPage = totalPages`.
       - Coerce numeric strings for `totalPages`, `currentPage`, `publicationYear`, and `rating` (`"350"` $\to$ `350`).
   - Apply the same `totalPages` tolerance in `DataPortabilityService.parseCsvCatalog()` and `mapCsvRowToBookCandidate()`:
     - Do not reject a CSV file if the `totalPages` column header is omitted or if individual rows have an empty/`0` `totalPages` cell; default empty/`0` `totalPages` to `Math.max(1, currentPage)`.
2. **Expanded CSV Schema (`src/app/features/settings/services/data-portability.service.ts`):**
   - Add `'publisher'`, `'publicationYear'`, and `'genre'` (serialized as `; `-joined string) to `CSV_COLUMNS` (`L40-57`), `extractCsvField()`, and `mapCsvRowToBookCandidate()`.
   - Maintain 100% backward compatibility when importing older CSVs that do not have `publisher`, `publicationYear`, or `genre` columns.
3. **Zero-Dependency Browser-Native `.ZIP` Archive Utility (`src/app/features/settings/utils/zip-archive.utils.ts`):**
   - Implement a pure TypeScript PKZIP creator and reader (`createZipArchive(entries: readonly ZipEntryInput[]): Uint8Array` and `readZipArchive(zipBytes: Uint8Array): Map<string, Uint8Array>`):
     - Supports standard ZIP local file headers, central directory, and CRC-32 calculation in pure TypeScript (Store method `0` for already-compressed `.webp`/`.jpg` images and UTF-8 `.json`/`.csv` files, plus optional native `DecompressionStream('deflate-raw')` support when reading external deflate-compressed `.zip` archives).
     - Provide helpers `dataUrlToBinary(dataUrl: string): { bytes: Uint8Array; extension: 'webp' | 'jpg' | 'png'; mimeType: string } | null` and `binaryToDataUrl(bytes: Uint8Array, mimeType: string): string`.
4. **4-Mode Offline Export & `.ZIP` Import (`src/app/features/settings/services/data-portability.service.ts`):**
   - Update `ImportFormat` in `data-portability.model.ts` to `'json' | 'csv' | 'zip'`, and add `incompleteMetadataCount: number` to `ImportExecutionResult`.
   - **Lightweight JSON Export (`exportJsonBackup({ includeCovers: false })` / `downloadLightweightJsonBackup()`):**
     - Exports `bookstack-backup-light-YYYY-MM-DD.json` where `data:image/...` Base64 strings are omitted from `book.coverUrl` (preserving external `https://` URLs if any), producing a tiny text-only JSON file.
   - **Full JSON Export (`exportJsonBackup({ includeCovers: true })` / `downloadJsonBackup()`):**
     - Exports `bookstack-backup-full-YYYY-MM-DD.json` with all embedded Base64 covers.
   - **Complete CSV Export (`downloadCsvCatalog()`):**
     - Exports `bookstack-catalog-YYYY-MM-DD.csv` including `publisher`, `publicationYear`, and `genre`.
   - **Portable `.ZIP` Bundle Export (`exportZipBundle(): Promise<Uint8Array>` / `downloadZipBundle(): Promise<void>`):**
     - Builds `bookstack-bundle-YYYY-MM-DD.zip` containing:
       - `backup.json` (full envelope where each book with a local Base64 cover has `coverUrl` set to its relative archive path `covers/<book.id>.<ext>`)
       - `catalog.csv` (complete RFC 4180 CSV table)
       - `covers/<book.id>.<ext>` (binary `.webp`/`.jpg` cover image files for every book)
   - **Portable `.ZIP` Import (`analyzeImportZipFile(fileName: string, zipBytes: Uint8Array): Promise<ImportPreviewSummary>`):**
     - Reads `backup.json` (or `catalog.csv` if no `backup.json` is inside the `.zip`) and re-attaches every `covers/<book.id>.<ext>` binary entry back into `book.coverUrl` as a valid `data:image/...;base64,...` string before returning the `ImportPreviewSummary`.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/settings/utils/zip-archive.utils.spec.ts`
- [x] `npm run test:file -- src/app/features/settings/schemas/backup.schema.spec.ts`
- [x] `npm run test:file -- src/app/features/settings/services/data-portability.service.spec.ts`
- [x] `npm run verify:quiet`
