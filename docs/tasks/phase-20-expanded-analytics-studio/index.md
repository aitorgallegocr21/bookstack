# Phase 20: Expanded Analytics Studio (`/stats`), Customizable Widget Layout, Adaptive Time/Velocity Engine & Genres/Tags Taxonomy

- **Status:** Active (`2026-11`)
- **Target Release:** `v2.6.0` (Minor Feature Release — Expanded Analytics Studio, Modular Drag-and-Drop Dashboard & Genres/Tags Taxonomy)
- **Target Branch:** `feat/phase-20-expanded-analytics-studio` $\to$ `develop`
- **Core Mission:** Elevate BookStack's `/stats` view into a flagship, editorial-grade **Analytics Studio** offering maximum meaningful reading insights with zero external charting dependencies, a **fully customizable modular Bento layout** (drag-and-drop + accessible button reordering, show/hide toggles, widget span sizing, and 1-click presets persisted in `AppPreferencesService`), an **Adaptive Time & Velocity Engine** with period-over-period delta comparisons, full end-to-end **Genres & Custom Tags (`Book.genre`)** support across modals and catalog filters, interactive drill-down exploration, and a 100% local client-side **Editorial Reading Card PNG export**.

---

## 1. Architectural Summary & Resolved Product Decisions

1. **Modular Customizable Analytics Studio (`/stats` Layout Engine):**
   - **14 Independent Registered Widgets (`AnalyticsWidgetId`):** Every visualization is an isolated `OnPush` standalone component registered in a typed `ANALYTICS_WIDGET_REGISTRY` with default order, default visibility, and allowed Bento width spans (`compact` [1 col on 2-col desktop grid], `wide` / `full` [spans full width]).
   - **Customize Mode (`Edit Layout`):** Toggled from `<app-analytics-header>`. Users can:
     - **Reorder** widgets via smooth Pointer/Drag-and-Drop on desktop **and** accessible Move Up / Move Down buttons (keyboard + touch-friendly on `320px` mobile without fighting vertical scroll).
     - **Show / Hide** any widget; hidden widgets collect in a compact restore tray inside Edit Mode.
     - **Resize Span** (`compact` vs `full`) on widgets that support dual widths.
     - **Switch Layout Presets** in 1 click: **Editorial Balanced** (default), **Minimalist Focus** (KPIs + Heatmap + Velocity), and **Deep Library & Data** (Composition, Genres, Eras, Length, Sagas, TBR).
     - **Reset to Default Layout** at any time.
   - **Persistence & Settings Governance (Rule 11):** Persisted as `analyticsLayout` inside `AppPreferences` (`AppPreferencesSchema` Zod validation), synced automatically in JSON/ZIP backups when `includePreferencesInBackup` is enabled, and manageable/resettable from `/settings?tab=catalog` (plus registered in `SETTINGS_SEARCH_ENTRIES`).

2. **Adaptive Time/Velocity Disclosure & Period-over-Period Deltas:**
   - When `totalTimeMinutes === 0` in the active period **or** `AppPreferencesService.trackReadingTime()` is `false`, reading speed (`pp/h`) and the `"Time"` velocity tab are hidden automatically; the Executive KPI strip dynamically promotes non-timed high-value KPIs (**Average Book Rating**, **Average Pages per Completed Book**, **Active Reading Days**, **Projected Annual Pace**).
   - Period-over-period delta pills (`+18%`, `-4%`, neutral `0%`) compare `current-year` against the equivalent YTD window of `currentYear - 1`, `specific-year` against `year - 1`, and `last-12-months` against the preceding 12-month window (gracefully omitted on `all-time` or when baseline is `0`).

3. **Full End-to-End Genres & Custom Tags Taxonomy (`Book.genre` SSOT):**
   - Reuses the existing `Book.genre?: string[]` field already validated by `BookSchema`, enriched by the 5-provider `BookMetadataService`, and exported/imported by `DataPortabilityService` — guaranteeing 100% backward compatibility with existing IndexedDB stores and backups.
   - Adds `tag-normalization.utils.ts`, a reusable `<app-tag-chips-input>` with library autocomplete + curated bilingual presets, Create/Edit/Detail modal integration, `/books` genre filter (`CatalogFilterService` + `?genre=` deep link), and `/stats` thematic analytics.

4. **14 Meaningful, Editorial-Grade Analytics Widgets (Zero Charting Dependencies):**
   1. `kpi-grid` — Adaptive Executive KPI Strip with period deltas & micro-indicators.
   2. `activity-heatmap` — GitHub-style 365-day / 52-week SVG/CSS reading intensity calendar with interactive day tooltips.
   3. `reading-velocity` — Interactive Bar / Cumulative Area chart with Annual Goal target line, moving average, and adaptive `Pages` / `Books` / `Time` tabs.
   4. `goal-projection` — Annual Goal Pace Gauge & Year-End Forecast (ahead/behind status, projected totals, required daily pages).
   5. `genre-distribution` — Genres & Thematic DNA (ranked bars by books, pages, and average rating per genre).
   6. `top-authors` — Top Authors Leaderboard (toggleable by Books, Pages, or Average Rating).
   7. `length-longevity` — Book Length Buckets (`<250p`, `250–499p`, `500–749p`, `750p+` + avg rating per tier) & Time-to-Finish Longevity (average/median days, fastest/longest read).
   8. `publication-eras` — Publication Decades & Eras Histogram (`<1950` through `2020s`), oldest/newest book read, and average publication year.
   9. `library-composition` — Format Donut (Physical / eBook / Audiobook with books & pages split) + Status Stacked Bar (completion & abandonment rates).
   10. `rating-profile` — Rating Histogram (`0–10`), mean/median rating, and editorial **Reader Critic Profile** classification.
   11. `reading-habits` — Weekday Rhythm (`Mon–Sun`), Weekend vs Weekday split (`%`), average pages per session, and longest single session.
   12. `saga-analytics` — Sagas & Series Progress (`SeriesService` integration: active vs completed sagas, overall completion `%`, remaining volumes, top sagas by pages).
   13. `backlog-publishers` — TBR / Backlog Reality Check (unread books, unread pages, estimated months to clear at current pace) & Top Publishers ranking.
   14. `personal-records` — All-Time Hall of Fame Milestone Cards (with cover thumbnails + `--book-tint` ambient wash) + 100% Local Canvas **Editorial Reading Card PNG Export**.

5. **Interactive Drill-Down & Strict Governance (Rule 11):**
   - Clicking a genre, author, format, rating bucket, or heatmap day opens an inline/modal **Analytics Drill-Down Sheet** listing matching books/sessions with 1-click navigation to `/books` (filtered) or `BookDetailModal`.
   - Every new hover effect, chart transition, drag feedback, and `--book-tint` surface strictly honors `html[data-reduced-motion='reduce']`, `@media (prefers-reduced-motion: reduce)`, and `adaptiveCoverTint === false`.

---

## 2. Atomic Task Breakdown

- [ ] **[Task 20.1: Genres & Custom Tags Taxonomy (`Book.genre`), `<app-tag-chips-input>` & Catalog Integration](task-20.1-tags-genres-taxonomy-and-catalog-integration.md)** — Pure tag normalization utilities, curated bilingual presets, reusable `<app-tag-chips-input>` component, Create/Edit/Detail modal wiring, `/books` genre filter + `?genre=` query sync, and external JSON/CSV `tags` alias normalization.
- [ ] **[Task 20.2: Analytics Layout Preferences, Widget Registry & Settings Integration](task-20.2-analytics-layout-preferences-and-studio-engine.md)** — Define `AnalyticsWidgetId`, `AnalyticsLayoutPreferences`, 3 layout presets, `ANALYTICS_WIDGET_REGISTRY`, Zod validation inside `AppPreferencesSchema`, `AppPreferencesService` layout actions, and `/settings?tab=catalog` integration + `SETTINGS_SEARCH_ENTRIES`.
- [ ] **[Task 20.3: Adaptive Analytics Engine, Period Deltas & Deep Metrics (`AnalyticsService`)](task-20.3-adaptive-analytics-engine-deltas-and-deep-metrics.md)** — Expand `analytics.model.ts` and `AnalyticsService` with single-pass computed signals for adaptive time disclosure, period-over-period deltas, 365-day heatmap cells, goal projections, genres DNA, dual/triple author rankings, length/longevity tiers, publication eras, critic profile, session depth, saga progress, TBR forecast, publishers, and all-time records.
- [ ] **[Task 20.4: Modular `/stats` Bento Shell, Customize Mode, Presets & Accessible Reordering](task-20.4-modular-stats-shell-header-presets-and-drag-reorder.md)** — Upgrade `AnalyticsHeaderComponent` and `StatsPage` into the dynamic `@for`-driven modular Bento grid with Edit Layout mode, desktop drag-and-drop + mobile/keyboard Up/Down controls, span toggle, visibility toggle + hidden tray, layout presets, and full bilingual `analytics` i18n dictionary expansion.
- [ ] **[Task 20.5: Adaptive Executive KPI Grid, Goal Pace Forecast & Upgraded Velocity Chart](task-20.5-adaptive-kpi-grid-goal-forecast-and-velocity-chart.md)** — Upgrade `AnalyticsKpiGridComponent` (adaptive timed/non-timed swap + period delta badges), create `GoalProjectionCardComponent`, and upgrade `ReadingVelocityChartComponent` (Bar vs Cumulative Area mode, annual target line, moving average, adaptive `Time` tab hiding).
- [ ] **[Task 20.6: 365-Day Reading Activity Heatmap & Upgraded Habits/Session Rhythm](task-20.6-365-day-activity-heatmap-and-habits-rhythm.md)** — Build `ActivityHeatmapWidgetComponent` (GitHub-style SVG/CSS 52-week grid with accent intensity scale, keyboard/hover tooltips, and zero mobile overflow) and upgrade `ReadingHabitsSectionComponent` with Weekday vs Weekend split and session depth metrics.
- [ ] **[Task 20.7: Genres Thematic DNA, Multi-Mode Top Authors & Library Composition](task-20.7-genres-dna-top-authors-and-library-composition.md)** — Build `GenreDistributionWidgetComponent` (books, pages, and avg rating per genre), `TopAuthorsWidgetComponent` (Books / Pages / Avg Rating toggle), and split/refine `LibraryCompositionSectionComponent` + `RatingProfileWidgetComponent` (with Reader Critic Profile badge).
- [ ] **[Task 20.8: Length & Longevity, Publication Eras, Saga Analytics & TBR/Publishers Insights](task-20.8-length-longevity-publication-eras-sagas-and-tbr-insights.md)** — Build `LengthLongevityWidgetComponent`, `PublicationErasWidgetComponent`, `SagaAnalyticsWidgetComponent` (wired to `SeriesService`), and `BacklogPublishersWidgetComponent` (TBR clear-time forecast + Top Publishers).
- [ ] **[Task 20.9: All-Time Hall of Fame, Interactive Drill-Down Sheet & Local Reading Card PNG Export](task-20.9-hall-of-fame-records-drilldown-and-reading-card-export.md)** — Build `PersonalRecordsWidgetComponent` (milestone cards with cover thumbnails & `--book-tint`), `AnalyticsDrilldownModalComponent` (click-to-inspect books/sessions for any chart bucket), and pure client-side `reading-card-export.utils.ts` Canvas PNG generator.
- [ ] **[Task 20.10: Playwright E2E Suite, Responsive Audit (`320px`–`1280px`) & Tier 2 Docs Sync (`v2.6.0`)](task-20.10-e2e-verification-responsive-audit-and-tier-2-sync.md)** — Expand Playwright E2E specs for `/stats` customization, drag/button reorder persistence, presets, adaptive time hiding, heatmap, genres filter, drill-down, and PNG export; verify `320px`/`375px`/`1280px` zero-overflow & `reducedMotion`; run `npm run verify:quiet` & `npm run test:e2e`; bump version to `2.6.0`; execute Tier 2 Per-Phase Documentation Sync.
