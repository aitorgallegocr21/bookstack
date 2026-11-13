# Task 8.1: Analytics Period Models, Hybrid Aggregation Engine & Bilingual i18n

**Phase:** Phase 08: Advanced Analytics (`/stats`)  
**Status:** Pending  
**Estimated Impact:** High (analytics domain contracts, reactive `AnalyticsService` with hybrid `ReadingLog` + `Book` calculation pipeline, unit specs, and bilingual i18n keys).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/models/book.model.ts` (`L1-150`): Existing `Book`, `ReadingLog`, `ReadingStats`, and `StreakInfo` interfaces.
- `src/app/features/books/services/reading-stats.service.ts` (`L1-324`): Existing streak, monthly pages, and annual progress calculations to reuse or align with.
- `src/app/features/books/utils/book-form.utils.ts` (`L47-82`): `normalizeBookFormat`, `translateBookFormat`, and `normalizeBookRating` helpers.
- `src/app/core/i18n/i18n.types.ts` (`L257-262`): `stats` translation interface definition.
- `src/app/core/i18n/es.ts` (`L261-266`): Spanish `stats` dictionary entries.
- `src/app/core/i18n/en.ts` (`L260-264`): English `stats` dictionary entries.

**Files to Create:**

- `src/app/features/analytics/models/analytics.model.ts`
- `src/app/features/analytics/services/analytics.service.ts`
- `src/app/features/analytics/services/analytics.service.spec.ts`

---

## 2. Technical Objectives

1. **Analytics Domain Contracts (`src/app/features/analytics/models/analytics.model.ts`):**
   - `AnalyticsPeriodMode = 'current-year' | 'last-12-months' | 'all-time' | 'specific-year'`
   - `AnalyticsTrendMetric = 'pages' | 'books' | 'time'`
   - `AnalyticsKpiSummary`:
     - `completedBooks: number`
     - `completionRatePercent: number` (percentage of finished books vs finished + abandoned, or vs total started books)
     - `pagesRead: number` (hybrid total in period)
     - `averagePagesPerDay: number`
     - `totalTimeMinutes: number`
     - `averageSpeedPagesPerHour: number`
     - `activeDaysCount: number`
     - `currentStreak: number`
     - `longestStreak: number`
   - `AnalyticsTrendPoint`:
     - `key: string` (`YYYY-MM` or `YYYY`)
     - `label: string` (localized short month or year)
     - `pages: number`
     - `books: number`
     - `timeMinutes: number`
   - `FormatDistributionItem`: `formatKey: 'physical' | 'ebook' | 'audiobook'`, `count: number`, `percentage: number`, `pages: number`.
   - `StatusDistributionSummary`: `items: Array<{ status: BookStatus; count: number; percentage: number }>`, `completionRatePercent: number`, `abandonmentRatePercent: number`.
   - `RatingDistributionSummary`: `averageRating: number`, `ratedBooksCount: number`, `buckets: Array<{ label: string; min: number; max: number; count: number; percentage: number }>`.
   - `AuthorRankItem`: `author: string`, `booksCount: number`, `pagesRead: number`.
   - `WeekdayPaceItem`: `dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'`, `pages: number`, `sessionsCount: number`, `percentageOfPeak: number`, `isPeakDay: boolean`.
   - `AnalyticsHighlights`:
     - `bestDay: { date: string; pages: number } | null`
     - `longestBookCompleted: { title: string; author: string; pages: number } | null`
     - `averageDaysToFinishBook: number | null`
     - `topRatedBook: { title: string; author: string; rating: number } | null`
2. **Reactive `AnalyticsService` (`src/app/features/analytics/services/analytics.service.ts`):**
   - State signals: `periodMode = signal<AnalyticsPeriodMode>('current-year')`, `selectedYear = signal<number>(new Date().getFullYear())`, `trendMetric = signal<AnalyticsTrendMetric>('pages')`.
   - Computed `availableYears`: sorted descending list of distinct years present across `Book` dates (`startDate`, `endDate`, `createdAt`, `updatedAt`) and `ReadingLog.date`, always including the current year.
   - **Hybrid Page & Trend Calculation:**
     - Sum `ReadingLog.pagesRead` per book and date.
     - For any book with `currentPage > totalLoggedPagesForBook`, compute `unloggedPages = currentPage - totalLoggedPagesForBook` and attribute it to the book's fallback date (`endDate || updatedAt || createdAt`) so books added or completed directly without session logs contribute accurately to period KPIs and monthly/annual velocity bars.
   - Generate 12-month padded series for `'current-year'`, `'specific-year'`, and `'last-12-months'`, and chronological yearly (or monthly if single year) buckets for `'all-time'`.
3. **Bilingual i18n Dictionary (`es.ts`, `en.ts`, `i18n.types.ts`):**
   - Expand `stats` section with complete translations for period filter tabs, KPI titles and sub-labels, velocity chart tabs and average line label, format/status/rating/author panel headings, weekday pace labels, highlights cards, and empty states.
4. **Unit Testing (`analytics.service.spec.ts`):**
   - Test period switching (`current-year`, `last-12-months`, `all-time`, `specific-year`).
   - Test hybrid page aggregation (books with `ReadingLog` vs books marked `completed` without `ReadingLog` vs mixed).
   - Test format distribution, status ratios, rating buckets, top authors, weekday peak detection, and highlights edge cases (empty library, missing dates).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/analytics/services/analytics.service.spec.ts`
- [ ] `npm run verify:quiet`
