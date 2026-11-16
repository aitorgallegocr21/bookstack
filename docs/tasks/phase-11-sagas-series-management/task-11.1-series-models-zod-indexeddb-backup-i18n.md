# Task 11.1: Series Domain Contracts, Zod Schemas, IndexedDB v2 Store, Backup Portability & i18n

**Phase:** Phase 11: Sagas, Series & Collections Management (`/series`)  
**Status:** Completed  
**Estimated Impact:** High (Domain models & filter types in `src/app/features/series/`, Zod validation schemas, `StorageAdapterService` IndexedDB v2 store upgrade, `DataPortabilityService` backup/restore/quota integration, and bilingual `es`/`en` i18n extensions).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/models/book.model.ts` (`L12-25`): Existing `BookSeries` and `SeriesInfo` interfaces.
- `src/app/core/services/storage-adapter.service.ts` (`L14-68`): `StorageAdapterService` `dbVersion`, `initDB()`, and `onupgradeneeded` object stores.
- `src/app/features/settings/models/data-portability.model.ts` (`L17-63`): `BookstackBackupEnvelope`, `ImportPreviewSummary`, `ImportExecutionResult`, `StorageBreakdownSummary`.
- `src/app/features/settings/schemas/backup.schema.ts` (`L24-124`): `BackupEnvelopeSchema`, `ParsedBackupPayload`, `parseBackupJson()`.
- `src/app/features/settings/services/data-portability.service.ts` (`L57-103`, `L176-379`): `DataSnapshot`, `buildJsonBackupEnvelope()`, `analyzeImportFile()`, `executeImport()`, `factoryResetAllData()`, `computeStorageBreakdown()`, `captureSnapshot()`, `restoreSnapshot()`.
- `src/app/core/i18n/i18n.types.ts` (`L4-22`, `L90-105`, `L186-191`, `L534-540`): `nav`, `books`, `bookForm`, and `common` translation keys.
- `src/app/core/i18n/es.ts` and `src/app/core/i18n/en.ts`: Matching dictionary blocks to extend symmetrically.

**Files to Create / Update:**

- `src/app/features/series/models/series.model.ts`
- `src/app/features/series/schemas/series.schema.ts`
- `src/app/features/series/schemas/series.schema.spec.ts`
- `src/app/core/services/storage-adapter.service.ts`
- `src/app/core/services/storage-adapter.service.spec.ts`
- `src/app/features/settings/models/data-portability.model.ts`
- `src/app/features/settings/schemas/backup.schema.ts`
- `src/app/features/settings/services/data-portability.service.ts`
- `src/app/features/settings/services/data-portability.service.spec.ts`
- `src/app/core/i18n/i18n.types.ts`
- `src/app/core/i18n/es.ts`
- `src/app/core/i18n/en.ts`

---

## 2. Technical Objectives

1. **Series Domain Contracts (`src/app/features/series/models/series.model.ts`):**
   - `export type SeriesPublicationStatus = 'ongoing' | 'completed' | 'hiatus';`
   - `export type SagaBentoScale = 'compact' | 'medium' | 'showcase';`
   - `export type SagaFilterStatus = 'all' | 'reading' | 'completed' | 'pending' | 'has-gaps';`
   - `export type SagaSortOption = 'recent' | 'progress-desc' | 'volumes-desc' | 'rating-desc' | 'title-asc';`
   - `export interface SeriesMetadata { id: string; normalizedKey: string; name: string; expectedVolumes?: number; publicationStatus?: SeriesPublicationStatus; notes?: string; createdAt: string; updatedAt: string; }`
   - `export interface SagaVolumeSlot { volumeNumber: number | null; kind: 'owned' | 'missing'; book?: Book; }`
   - `export interface SagaAggregation { id: string; normalizedKey: string; name: string; authors: string[]; books: Book[]; timelineSlots: SagaVolumeSlot[]; metadata?: SeriesMetadata; ownedCount: number; expectedVolumes?: number; totalTargetVolumes: number; completedCount: number; readingCount: number; pendingCount: number; abandonedCount: number; missingVolumes: number[]; totalPages: number; readPages: number; progressPercent: number; averageRating?: number; totalReadingMinutes: number; nextBookToRead: Book | null; statusCategory: 'reading' | 'completed' | 'pending'; bentoScale: SagaBentoScale; lastActivityAt: string; }`
   - `export interface SagaStatusCounts { all: number; reading: number; completed: number; pending: number; hasGaps: number; }`
   - `export interface SagaFilterState { searchQuery: string; status: SagaFilterStatus; sort: SagaSortOption; }`
2. **Zod Persistence Schema (`src/app/features/series/schemas/series.schema.ts`):**
   - Define `SeriesPublicationStatusSchema` and `SeriesMetadataSchema` (`expectedVolumes` integer $\ge 1$, max `500`, optional; `normalizedKey` and `name` non-empty strings).
   - Export `parseStoredSeriesMetadata(records: unknown[]): SeriesMetadata[]` discarding corrupted items safely without breaking initialization.
3. **IndexedDB v2 Store Upgrade (`src/app/core/services/storage-adapter.service.ts`):**
   - Bump `dbVersion` from `1` to `2`.
   - In `onupgradeneeded`, preserve `'books'` and `'readingLogs'` and create `'seriesMetadata'` (`{ keyPath: 'id' }`) if `!db.objectStoreNames.contains('seriesMetadata')`.
4. **Backup Portability & Storage Breakdown Integration:**
   - Extend `BookstackBackupEnvelope` and `BackupEnvelopeSchema` (`schemaVersion: 1` preserved for backward compatibility) with optional `seriesMetadata?: SeriesMetadata[]` / `z.array(z.unknown()).default([])`.
   - Extend `ImportPreviewSummary`, `ImportExecutionResult`, `DataSnapshot`, and `DataPortabilityService` to:
     - Include `seriesMetadata` in `buildJsonBackupEnvelope()`.
     - Validate `seriesMetadata` in `analyzeImportFile()` (`validSeriesMetadata`, `invalidSeriesMetadataCount`).
     - Persist, merge (by `normalizedKey` or `id`, keeping newest `updatedAt`), overwrite, and snapshot-rollback `seriesMetadata` in `executeImport()` via `StorageAdapterService` (or `SeriesService` / direct store coordination cleanly without circular DI).
     - Clear `'seriesMetadata'` in `factoryResetAllData()` and include its UTF-8 bytes in `booksMetadataBytes` inside `computeStorageBreakdown()`.
5. **Bilingual i18n Dictionaries (`i18n.types.ts`, `es.ts`, `en.ts`):**
   - Add `nav.series` (`Sagas` / `Series`), `books.viewCatalog` (`Catálogo` / `Catalog`), `books.viewSeries` (`Sagas` / `Series`), `bookForm.seriesAutocompleteHint` & `seriesSuggestionsAria`, and a comprehensive `series` dictionary section covering page title/subtitle, toolbar search/chips/sort, Bento card labels (`vol.`, `faltante(s)`, `Continuar lectura`, `Empezar Vol. X`, `Saga al día`), Saga Detail Modal labels (timeline, metadata form, bulk linker), and empty states.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/series/schemas/series.schema.spec.ts`
- [x] `npm run test:file -- src/app/core/services/storage-adapter.service.spec.ts`
- [x] `npm run test:file -- src/app/features/settings/services/data-portability.service.spec.ts`
- [x] `npm run verify:quiet`
