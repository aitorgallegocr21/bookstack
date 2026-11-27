# Task 20.3: Adaptive Analytics Engine, Period Deltas & Deep Metrics (`AnalyticsService`)

## Objective

Expand `analytics.model.ts` and `AnalyticsService` with reactive, single-pass Angular 22+ `computed()` signals powering all 14 Analytics Studio widgets—including Adaptive Time/Velocity Disclosure, Period-over-Period comparison deltas, 365-day Activity Heatmap cells, Annual Goal Forecasting, Genres DNA, Triple-Mode Top Authors, Length/Longevity tiers, Publication Eras, Reader Critic Profile, Session Depth, Saga Analytics, TBR Clear-Time Forecast, Publishers, and All-Time Hall of Fame Records.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/analytics/utils/analytics-metrics.utils.ts` (pure, side-effect-free calculation helpers for deltas, median, critic profile classification, heatmap calendar grid generation, length buckets, publication eras, and TBR forecast—keeping `AnalyticsService` lean and modular).
  - `src/app/features/analytics/utils/analytics-metrics.utils.spec.ts`
- **Read & Edit:**
  - `src/app/features/analytics/models/analytics.model.ts` (`L1-L83` — extend contracts for all new computed models and drill-down queries).
  - `src/app/features/analytics/services/analytics.service.ts` (`L1-L811` — inject `AppPreferencesService` and `SeriesService`, add adaptive time signals, previous-period baseline calculation, and all new computed selectors).
  - `src/app/features/analytics/services/analytics.service.spec.ts` — comprehensive unit tests for every new computed signal and edge case.

---

## Functional & Technical Requirements

1. **Adaptive Time & Velocity Disclosure:**
   - `showTimeMetrics = computed<boolean>(() => this.appPreferences.trackReadingTime() && this.kpiSummary().totalTimeMinutes > 0)`.
   - `availableTrendMetrics = computed<AnalyticsTrendMetric[]>(() => this.showTimeMetrics() ? ['pages', 'books', 'time'] : ['pages', 'books'])`.
   - Automatically fall back `effectiveTrendMetric()` to `'pages'` if `trendMetric() === 'time'` while `showTimeMetrics()` is `false`.
2. **Period-over-Period Comparison Deltas (`AnalyticsDeltaBadge`):**
   - Compute previous equivalent window (`current-year` $\to$ same Jan 1–reference month/day in `year - 1`; `specific-year` $\to$ full `year - 1`; `last-12-months` $\to$ months `-23..-12`; `all-time` $\to$ `null`).
   - Return `{ current: number; previous: number; deltaPercent: number | null; direction: 'up' | 'down' | 'flat' }` for `completedBooks`, `pagesRead`, `activeDaysCount`, and `averageRating`.
3. **Deep Computed Selectors to Expose on `AnalyticsService`:**
   - `kpiSummary`: extended with `averageRating`, `averagePagesPerCompletedBook`, `totalSessionsCount`, and `deltas`.
   - `heatmapData`: 52–53 week grid for `current-year` / `specific-year` (or rolling 365 days for `last-12-months` / `all-time`), each cell carrying `{ date, pages, booksCount, timeMinutes, intensityLevel: 0 | 1 | 2 | 3 | 4 }` using quartile thresholds relative to max daily pages, plus summary (`activeDays`, `consistencyPercent`, `periodLongestStreak`, `maxPagesDay`).
   - `goalProjection`: compares active year progress against `ReadingStatsService.readingGoals()` (`targetBooks`, `targetPages`): `elapsedYearPercent`, `booksPercent`, `pagesPercent`, `projectedBooks`, `projectedPages`, `booksAheadOrBehind`, `pagesAheadOrBehind`, `requiredPagesPerDay`, `onTrackBooks`, `onTrackPages`.
   - `genreDistribution`: normalized genres ranked by books count, total pages, share `%`, and average rating per genre (`GenreStatItem[]`).
   - `topAuthors`: extended `AuthorRankItem` with `averageRating`, `ratedBooksCount`, and `completedBooksCount` to support sorting by Books, Pages, or Avg Rating.
   - `lengthAndLongevity`:
     - `lengthBuckets`: `short` (`<250`), `medium` (`250–499`), `long` (`500–749`), `epic` (`>=750`) with `count`, `percentage`, `averageRating`.
     - `longevity`: `averageDays`, `medianDays`, `fastestBook` (`{ bookId, title, author, days }`), `slowestBook` (`{ bookId, title, author, days }`), `sampleSize` (only valid `startDate <= endDate` completed books).
   - `publicationEras`: buckets `<1950`, `1950s`, `1960s`, `1970s`, `1980s`, `1990s`, `2000s`, `2010s`, `2020s+` with count & `%`, plus `oldestBook`, `newestBook`, `averagePublicationYear`.
   - `ratingDistribution`: extended with `medianRating`, `standardDeviation`, and `criticProfile: 'generous' | 'balanced' | 'selective' | 'insufficient'`.
   - `sessionDepth`: `weekendPagesPercent`, `weekdayPagesPercent`, `averagePagesPerSession`, `longestSession` (`{ date, pages, bookTitle }`), `totalSessions`.
   - `sagaAnalytics`: derived from `SeriesService.sagas()` (`totalSagas`, `completedSagas`, `activeSagas`, `overallCompletionPercent`, `volumesRead`, `volumesRemaining`, `topSagasByPages`).
   - `backlogAndPublishers`:
     - `backlog`: `pendingBooksCount`, `pendingPagesTotal`, `estimatedMonthsToClear` (derived from rolling 12-month or active-period pages/month pace; `null` if pace is `0`).
     - `topPublishers`: top 6 publishers by books & pages read.
   - `allTimeRecords`: `longestBook`, `shortestCompletedBook`, `highestVolumeMonth`, `bestSingleDay`, `longestStreakAllTime`, `oldestPublicationBook`, `mostProlificYear`, `highestRatedBook` (including `bookId` & `coverUrl` where applicable for miniature cover previews!).
   - `getDrilldownBooks(filter: AnalyticsDrilldownFilter): Book[]` — returns exact matching books for any clicked genre, author, format, rating bucket, length bucket, era, or date.

---

## Verification & Acceptance Criteria

- [ ] Zero `any` types; all calculations handle empty libraries, zero-page books, missing dates, and division-by-zero safely.
- [ ] `npm run test:file -- src/app/features/analytics/utils/analytics-metrics.utils.spec.ts` passes.
- [ ] `npm run test:file -- src/app/features/analytics/services/analytics.service.spec.ts` passes (including adaptive time hiding when `trackReadingTime` is off or `totalTimeMinutes === 0`, YTD delta math, heatmap intensity quartiles, TBR forecast, and drill-down filters).
- [ ] `npm run verify:quiet` passes with zero errors.
