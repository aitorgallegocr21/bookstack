# Task 12.5: Runtime Performance — Cached `Intl.*` Formatters & Single-Pass $O(N)$ Domain Engines

**Phase:** Phase 12: Performance, Caching, Architecture & Legal Hardening  
**Status:** Pending  
**Estimated Impact:** High (Memoizes `Intl.DateTimeFormat`, `Intl.NumberFormat`, and `Intl.Collator`; refactors `ReadingStatsService`, `CatalogFilterService`, `AnalyticsService`, and `SeriesService` to single-pass $O(N)$ algorithms; adds `equal` comparators to derived signals).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/core/utils/date-formatter.ts` (`L1-71`): `formatLocalizedDate()` (`L21-26`) and `formatLocalizedMonth()` (`L62-69`).
- `src/app/features/books/services/reading-stats.service.ts` (`L20-95`, `L150-290`): `stats` computed signal (`L27-75`), `calculateDaySpan()` (`L241-250`), `calculateStatusDistribution()` (`L279-286`).
- `src/app/features/books/services/catalog-filter.service.ts` (`L15-95`, `L125-255`, `L300-325`): `normalizeSearchText()`, `matchesFormat()` (`L54-91`), `filterBooks()` (`L129-148`), `sortBooks()` (`L150-220`), `computeStatusCounts()` (`L234-252`), `filteredBooks` & `statusCounts` signals (`L305-320`).
- `src/app/features/analytics/services/analytics.service.ts` (`L240-345`, `L385-410`, `L490-545`, `L760-775`): `hybridDataset()` (`L260-275`), `kpiSummary()` (`L331`), `trendPoints()` (`L394-402`), `ratingDistribution()` (`L491-542`), `formatShortMonth()` (`L762-770`).
- `src/app/features/analytics/components/reading-velocity-chart/reading-velocity-chart.ts` (`L85-110`, `L140-190`): `bars` `.map()` loop (`L90-106`), `formatInteger()` (`L141-145`), `formatMetricValue()` (`L184-186`).
- `src/app/features/analytics/components/analytics-kpi-grid/analytics-kpi-grid.ts` (`L15-30`): `Intl.NumberFormat` inside `computed()`.
- `src/app/features/series/services/series.service.ts` (`L285-325`): `statusCounts` and `filteredSagas` signals.
- `src/app/features/series/utils/series.utils.ts` (`L110-125`, `L160-185`): `buildTimelineSlots()` and `matchesSagaSearch()`.

**Files to Create / Update:**

- `src/app/core/utils/date-formatter.ts`
- `src/app/core/utils/date-formatter.spec.ts`
- `src/app/features/books/services/reading-stats.service.ts`
- `src/app/features/books/services/reading-stats.service.spec.ts`
- `src/app/features/books/services/catalog-filter.service.ts`
- `src/app/features/books/services/catalog-filter.service.spec.ts`
- `src/app/features/analytics/services/analytics.service.ts`
- `src/app/features/analytics/services/analytics.service.spec.ts`
- `src/app/features/analytics/components/reading-velocity-chart/reading-velocity-chart.ts`
- `src/app/features/analytics/components/analytics-kpi-grid/analytics-kpi-grid.ts`
- `src/app/features/series/services/series.service.ts`
- `src/app/features/series/utils/series.utils.ts`

---

## 2. Technical Objectives

1. **Memoized `Intl.*` Formatter Registry (`src/app/core/utils/date-formatter.ts`):**
   - Create module-level caches (`Map<string, Intl.DateTimeFormat>`, `Map<string, Intl.NumberFormat>`, `Map<string, Intl.Collator>`) and export lightweight helpers:
     - `getDateTimeFormatter(locale: SupportedLocale, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat`
     - `getNumberFormatter(locale: SupportedLocale, options?: Intl.NumberFormatOptions): Intl.NumberFormat`
     - `getLocaleCollator(locale: SupportedLocale): Intl.Collator`
     - `formatLocalizedNumber(value: number, locale: SupportedLocale, options?: Intl.NumberFormatOptions): string`
     - `formatShortMonth(date: Date, locale: SupportedLocale): string`
   - Refactor `formatLocalizedDate()`, `formatLocalizedMonth()`, `AnalyticsService.formatShortMonth()`, `ReadingVelocityChartComponent`, and `AnalyticsKpiGridComponent` to use these cached formatters instead of calling `new Intl.*` inside loops or computed getters.
2. **Single-Pass $O(N)$ `ReadingStatsService` (`reading-stats.service.ts`):**
   - In `stats = computed(...)` (`L27-75`):
     - Replace the 9 separate passes over `books` (`filter` x3, `reduce`, `map().filter()`, `calculateStatusDistribution` x4) with a **single `for (const book of books)` pass** accumulating `completedCount`, `readingCount`, `pendingCount`, `abandonedCount`, `totalPagesRead`, `ratingSum`, and `ratedCount`.
     - Replace the duplicate `logs.reduce` calls (`L37` and `L52` compute the exact same `minutesSpent` sum!) with a **single `for (const log of logs)` pass** accumulating `totalMinutesLogged` and `totalPagesLogged`.
     - In `calculateDaySpan()` (`L241-250`), replace `logs.map(...).filter(...).map(...)` and `Math.min(...parsedDates.map(...))` with a single allocation-free loop tracking `minTimestamp`.
3. **Single-Pass & Pre-Normalized `CatalogFilterService` (`catalog-filter.service.ts`):**
   - Hoist the static `FORMAT_ALIASES` dictionary (`L70-82`) to module-level `const FORMAT_ALIASES: Readonly<Record<BookFormat, readonly string[]>>` so it is never re-allocated per book.
   - Normalize `criteria.searchQuery` **once** before iterating over `books` in `filterBooks()` and `computeStatusCounts()`, passing `normalizedQuery` directly into `matchesNormalizedSearch(book, normalizedQuery)`.
   - In `sortBooks()` (`L150-220`), use `getLocaleCollator('es')` (or active locale) for string comparisons and pre-parse `updatedAt || createdAt` timestamps (`Date.parse(...) || 0`) before sorting when sorting by `recent` / `oldest`.
   - Add a structural `equal` comparator to `statusCounts` (`(a, b) => a.all === b.all && a.reading === b.reading && a.completed === b.completed && a.pending === b.pending && a.abandoned === b.abandoned`) so downstream toolbar chips do not re-render when counts are unchanged.
4. **Algorithmic Polish in `AnalyticsService` & `SeriesService`:**
   - In `AnalyticsService.hybridDataset()` (`L260-275`), replace `candidateDates.sort()` (`O(K log K)`) with a linear min-string comparison (`if (!earliestDate || candidate < earliestDate) earliestDate = candidate`).
   - In `AnalyticsService.ratingDistribution()` (`L491-542`), accumulate the 4 bucket counts (`bucket1To2`, `bucket3`, `bucket4`, `bucket45To5`), `sum`, and `count` in a single `for (const book of books)` loop instead of 4 separate `.filter()` passes.
   - In `SeriesService` (`series.service.ts#L290-322`) and `series.utils.ts` (`L117-119`, `L160-183`), normalize `searchQuery` once before filtering sagas, remove the redundant `.filter().sort()` on `missingVolumes` in `buildTimelineSlots()` (since `computeMissingVolumes` already returns strictly sorted positive integers), and add a structural `equal` comparator to `SeriesService.statusCounts`.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/core/utils/date-formatter.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/services/reading-stats.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/services/catalog-filter.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/analytics/services/analytics.service.spec.ts`
- [ ] `npm run test:file -- src/app/features/series/services/series.service.spec.ts`
- [ ] `npm run verify:quiet`
