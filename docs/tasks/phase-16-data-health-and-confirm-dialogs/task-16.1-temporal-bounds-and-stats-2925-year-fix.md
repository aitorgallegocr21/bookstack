# Task 16.1: Temporal Bounds Hardening, Manual Antique Year Warning Rule & `/stats` Anomalous Year (`2925`) Fix

**Phase:** Phase 16: Data Health, Temporal Bounds Fix (`2925`) & Native Confirmation Dialog Engine  
**Status:** Pending  
**Estimated Impact:** High (Eliminates the `2925` anomalous year bug in `/stats`, defines strict reading date bounds `[1900..currentYear + 1]`, and implements source-aware validation allowing historical `publicationYear` values from external metadata providers while flagging manual antique years $< 1900$ for user confirmation).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/schemas/book.schema.ts` (`L41-122`): `BookSchema`, `ReadingLogSchema`, `parseStoredBooks`, and `parseStoredReadingLogs`.
- `src/app/features/analytics/services/analytics.service.ts` (`L60-86`, `L149-288`, `L348-395`, `L773-794`): `availableYears`, `hybridDataset`, `trendPoints` (`all-time` bucket loop), and `extractIsoDate` / `extractYearFromIso`.
- `src/app/features/settings/services/data-portability.service.ts` (`L190-350`): Flexible JSON and CSV record normalization (`normalizeRawBookRecord`, `parseCsvCatalog`).
- `src/app/features/books/utils/book-form.utils.ts` (`L1-165`): Form patch and metadata helper utilities (`buildMetadataFormPatch`).

**Files to Create / Update:**

- `src/app/features/books/utils/temporal-bounds.utils.ts` _(new)_
- `src/app/features/books/utils/temporal-bounds.utils.spec.ts` _(new)_
- `src/app/features/books/schemas/book.schema.ts`
- `src/app/features/books/schemas/book.schema.spec.ts`
- `src/app/features/analytics/services/analytics.service.ts`
- `src/app/features/analytics/services/analytics.service.spec.ts`
- `src/app/features/settings/services/data-portability.service.ts`
- `src/app/features/settings/services/data-portability.service.spec.ts`

---

## 2. Technical Objectives

1. **Centralized Temporal Bounds Utility (`src/app/features/books/utils/temporal-bounds.utils.ts`):**
   - Define domain constants and pure functions:
     - `MIN_READING_ACTIVITY_YEAR = 1900` (minimum standard year for personal reading activity dates `startDate`, `endDate`, `ReadingLog.date`, and `/stats` year selector).
     - `MIN_HISTORICAL_PUBLICATION_YEAR = 1` (allows classic/antique books that are hundreds of years old).
     - `MANUAL_ANTIQUE_YEAR_WARN_THRESHOLD = 1900` (threshold below which a **manually** entered `publicationYear` or date prompts the user to confirm it is not a typo).
     - `getMaxAllowedYear(referenceDate = new Date()): number` $\to$ returns `referenceDate.getFullYear() + 1`.
     - `getMaxAllowedIsoDate(referenceDate = new Date()): string` $\to$ returns `${getMaxAllowedYear(referenceDate)}-12-31`.
     - `isValidReadingActivityYear(year: number, referenceDate = new Date()): boolean` $\to$ `Number.isInteger(year) && year >= MIN_READING_ACTIVITY_YEAR && year <= getMaxAllowedYear(referenceDate)`.
     - `isValidPublicationYear(year: number, referenceDate = new Date()): boolean` $\to$ `Number.isInteger(year) && year >= MIN_HISTORICAL_PUBLICATION_YEAR && year <= getMaxAllowedYear(referenceDate)`.
     - `requiresManualAntiqueYearConfirmation(params: { publicationYear?: number | null; startDate?: string | null; endDate?: string | null; isFromExternalProvider: boolean }): { required: boolean; anomalousYears: number[] }`:
       - If `isFromExternalProvider === true` (value came from Open Library, Google Books, Wikidata, Apple Books, or Internet Archive / Crossref), historical publication years (`1 <= year < 1900`) do **NOT** require confirmation (`required: false`).
       - If `isFromExternalProvider === false` (manual user entry) and `publicationYear < 1900` (or `startDate`/`endDate` has a year $< 1900$), returns `required: true` with the detected old year(s) so the UI can ask the user to confirm it is not a typo.
     - `suggestCorrectedYear(anomalousYear: number, referenceDate = new Date()): number`:
       - Heuristic for typos like `2925` $\to$ `2025` (e.g., replacing a leading `29xx` or `30xx` digit error with `20xx` when the resulting year is $\le \text{getMaxAllowedYear}()$, otherwise clamping to `referenceDate.getFullYear()`).

2. **`AnalyticsService` Hardening Against `2925` & Out-of-Range Years (`src/app/features/analytics/services/analytics.service.ts`):**
   - In `availableYears` (`L65-85`):
     - Filter every extracted year from `book.startDate`, `book.endDate`, `book.createdAt`, `book.updatedAt`, and `log.date` through `isValidReadingActivityYear(year, this.referenceDate())`.
     - Ensure typo years like `2925` or `0025` never appear in the `/stats` year selector dropdown.
   - In `hybridDataset` (`L149-288`) and `trendPoints` (`L348-395`):
     - Ignore out-of-range years (`!isValidReadingActivityYear(year, refDate)`) when computing `earliestDate` for `all-time` `effectiveSpanDays` and when generating the `minYear..maxYear` bucket loop in `trendPoints()`, preventing a single corrupted record (`2925`) from creating $900+$ empty annual buckets or distorting daily page velocity (`averagePagesPerDay`).

3. **Zod Schema & Import Normalizer Safeguards (`book.schema.ts` & `data-portability.service.ts`):**
   - In `BookSchema` (`src/app/features/books/schemas/book.schema.ts`):
     - Update `publicationYear` validation to reject impossible future years (`> getMaxAllowedYear()`), while keeping historical publication years (`1..getMaxAllowedYear()`) valid so antique books from Open Library or manual confirmed entries pass validation.
   - In `DataPortabilityService` (`src/app/features/settings/services/data-portability.service.ts`):
     - When normalizing external/AI JSON or CSV imports, if `publicationYear > getMaxAllowedYear()` (e.g., `2925`), strip or sanitize it using `suggestCorrectedYear()` so future-year typos do not enter the database silently.
     - If `startDate`, `endDate`, or `ReadingLog.date` in an external import has a year $> \text{getMaxAllowedYear}()$ (e.g., `2925-05-10`), automatically rewrite the year prefix using `suggestCorrectedYear()` so the reading record is preserved under the intended year (`2025-05-10`).

4. **Unit & Regression Tests:**
   - Add dedicated regression tests in `analytics.service.spec.ts` verifying that a book or reading log with year `2925` does **not** add `2925` to `availableYears()` and does **not** expand `all-time` trend buckets beyond `currentYear + 1`.
   - Add unit specs in `temporal-bounds.utils.spec.ts` covering antique `publicationYear` (`1605` from Open Library $\to$ no warning; `1605` entered manually $\to$ warning required; `2925` $\to$ invalid future year with `2025` correction suggestion).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/books/utils/temporal-bounds.utils.spec.ts`
- [ ] `npm run test:file -- src/app/features/analytics/services/analytics.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/schemas/book.schema.spec.ts`
- [ ] `npm run test:file -- src/app/features/settings/services/data-portability.service.spec.ts`
- [ ] `npm run verify:quiet`
