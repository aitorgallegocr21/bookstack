# Phase 08: Advanced Analytics (`/stats`)

**Status:** Active (In Progress)  
**Target Branch:** `feature/08-advanced-analytics` $\to$ `develop`  
**Core Mission:** Transform `/stats` from a static placeholder into a rich, visual, 100% client-side reading analytics suite powered by Angular Signals and accessible native SVG/CSS visualizations. Deliver reactive period filtering, executive KPI summaries, an interactive reading velocity bar chart with metric toggling, library composition breakdowns (format donut, status stacked bar, rating histogram & top authors), weekday habit patterns, period record highlights, and intelligent hybrid aggregation that seamlessly combines `ReadingLog` sessions with directly completed/updated books.

---

## 1. Architectural Summary & Decisions

1. **Reactive Time-Horizon Filter Engine:**
   - Header period selector offering **"This Year (YYYY)"** (default), **"Last 12 Months"**, **"All Time"**, plus a dynamic **Specific Year selector** whenever historical data from previous years exists.
   - Changing the period reactively recalculates KPIs, trend bars, format/rating breakdowns, and period highlights via pure Angular `computed()` signals.
2. **Intelligent Hybrid Data Aggregation (`ReadingLog` + Direct Book Progress):**
   - Session-specific metrics (reading speed in `pp/h`, logged time, weekday pace) derive from `ReadingLog` entries.
   - Volume and temporal trend metrics (pages read, books completed, monthly/annual velocity chart) use a **hybrid model**: they aggregate `ReadingLog` entries in the period AND incorporate unlogged residual `currentPage` progress from books completed or updated in the period (using `endDate || updatedAt || createdAt` as fallback date). This guarantees charts and page totals never show `0` when a user marks books as read without logging individual sessions.
3. **Executive KPI Grid (4 Headline Cards with Secondary Micro-Indicators):**
   - **Completed Books:** Total completed in period + completion rate `%` (`completed / (completed + abandoned)` or active library share).
   - **Pages Read:** Total hybrid pages in period + average `pages/day` across the active period span.
   - **Reading Time:** Total hours & minutes logged + average reading velocity (`pages/hour`).
   - **Streak & Consistency:** Active reading days in period + longest streak record (`days`).
4. **Interactive Temporal Velocity Chart (Zero External Chart Libraries):**
   - Native, accessible SVG/CSS bar chart with a 3-way metric switcher: **Pages Read** | **Completed Books** | **Reading Time**.
   - Displays all 12 calendar months in annual / 12-month views (and annual or monthly buckets in All-Time view).
   - Includes a horizontal dashed reference line for the period average and interactive hover/tap/keyboard focus detail callouts.
5. **Three Library Composition & Distribution Panels:**
   - **Format Distribution:** SVG donut chart + percentage breakdown across `Físico`, `Ebook`, and `Audiolibro`.
   - **Catalog Status Breakdown:** Segmented horizontal stacked bar (`Completado`, `Leyendo`, `Por leer`, `Abandonado`) with completion vs. abandonment ratio.
   - **Ratings Histogram & Top Authors:** Score distribution histogram (`1–10` scale with average rating badge) paired with the Top Authors ranking.
6. **Reading Habits & Period Highlights:**
   - **Weekday Reading Pace (`Mon`–`Sun`):** 7-bar activity distribution identifying the user's peak reading day ("Star Day").
   - **Period Highlights:** 4 milestone cards — Peak Reading Day (max pages in a single day), Longest Completed Book, Average Days to Finish a Book (`startDate` $\to$ `endDate`), and Highest-Rated Book.
7. **Empty States, Mobile Ergonomics & Bilingual i18n:**
   - Dedicated empty library state in `/stats` with a primary CTA opening the global book creation modal (`UiStateService.openCreateModal()`).
   - Zero horizontal overflow down to `320px`, touch targets $\ge 44\times44\text{px}$, discrete transitions (no `transition-all`), and full `es`/`en` translation coverage.

---

## 2. Atomic Task Breakdown

- [x] **[Task 8.1: Analytics Period Models, Hybrid Aggregation Engine & Bilingual i18n](task-8.1-analytics-engine-and-models.md)** — Define analytics domain contracts, implement `AnalyticsService` with period filtering and hybrid `ReadingLog` + `Book` aggregation, and extend `es`/`en` i18n dictionaries.
- [x] **[Task 8.2: Analytics Header, Period Filter Toolbar & Executive KPI Cards](task-8.2-header-period-filter-and-kpi-cards.md)** — Build `AnalyticsHeaderComponent` (period pills + year selector), `AnalyticsKpiGridComponent` (4 KPI cards with secondary metrics), and empty library state in `StatsPage`.
- [x] **[Task 8.3: Interactive Temporal Velocity & Trend Chart](task-8.3-velocity-trend-chart.md)** — Build `ReadingVelocityChartComponent` with metric switcher (`Pages` | `Books` | `Time`), 12-month / all-time SVG/CSS bars, dashed average line, and accessible bar inspection.
- [x] **[Task 8.4: Library Composition & Distribution Panels](task-8.4-composition-distribution-panels.md)** — Build `LibraryCompositionSectionComponent` featuring the SVG format donut chart, segmented status bar with completion rate, ratings histogram, and top authors list.
- [x] **[Task 8.5: Reading Habits (Weekday Pace) & Period Highlights](task-8.5-habits-weekday-and-highlights.md)** — Build `ReadingHabitsSectionComponent` with the Monday–Sunday reading pace chart ("Star Day" badge) and the 4 Period Highlights milestone cards.
- [ ] **[Task 8.6: Analytics QA, Responsive Polish & Playwright E2E Suite](task-8.6-analytics-qa-and-e2e-suite.md)** — Complete `StatsPage` integration tests, responsive `320px–1280px` audit, and Playwright E2E suite (`tests/e2e/analytics-flow.spec.ts`) + Tier 2 Per-Phase documentation sync.
