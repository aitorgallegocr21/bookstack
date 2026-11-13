# Task 8.3: Interactive Temporal Velocity & Trend Chart

**Phase:** Phase 08: Advanced Analytics (`/stats`)  
**Status:** Completed  
**Estimated Impact:** Medium-High (native SVG/CSS interactive bar chart component with 3-metric toggle, average reference line, keyboard/touch bar selection, and mobile-safe layout).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/analytics/models/analytics.model.ts` (`L1-90`): `AnalyticsTrendMetric` and `AnalyticsTrendPoint` contracts.
- `src/app/features/analytics/services/analytics.service.ts` (`L1-160`): Trend series and metric signals.
- `src/app/features/analytics/pages/stats-page/stats-page.ts` (`L1-40`): Host page integration.
- `src/app/core/i18n/i18n.types.ts` (`L257-310`): `stats` translation keys.

**Files to Create / Update:**

- `src/app/features/analytics/components/reading-velocity-chart/reading-velocity-chart.ts`
- `src/app/features/analytics/components/reading-velocity-chart/reading-velocity-chart.html`
- `src/app/features/analytics/components/reading-velocity-chart/reading-velocity-chart.spec.ts`
- `src/app/features/analytics/pages/stats-page/stats-page.ts`
- `src/app/features/analytics/pages/stats-page/stats-page.html`

---

## 2. Technical Objectives

1. **Metric Switcher Header:**
   - Segmented control inside the chart card header allowing the user to switch `AnalyticsTrendMetric` between:
     - **Páginas (`pages`)**
     - **Libros completados (`books`)**
     - **Tiempo (`time`)**
   - Displays total and period average summary pills alongside the switcher.
2. **Accessible Native SVG / CSS Bar Visualization:**
   - Renders 12 monthly bars for `current-year`, `specific-year`, and `last-12-months` (or yearly/monthly bars for `all-time`).
   - Uses proportional bar heights (`0%` to `100%` of max value in series, with a subtle baseline track for `0` months).
   - **Dashed Period Average Reference Line:** Horizontal dashed line positioned at the computed mean percentage across the displayed buckets, with a non-overlapping badge showing the average value.
   - **Interactive Inspection (Hover / Tap / Keyboard Focus):**
     - Each bar is focusable/clickable (`button` or `role="button"` with descriptive `aria-label` containing month/year and all 3 metrics).
     - Selecting or hovering a bar highlights it and updates an inline detail strip / callout header showing the exact pages, books completed, and reading time for that bucket (preventing floating tooltip overflow on `320px` screens).
3. **Zero-Activity Period Handling:**
   - If all buckets in the selected period have `0` activity for the chosen metric, display the baseline chart grid with a subtle contextual notice explaining no activity was recorded for that metric in the selected timeframe.
4. **Component Unit Tests (`reading-velocity-chart.spec.ts`):**
   - Test metric toggling (`pages` $\to$ `books` $\to$ `time`), bar height percentage scaling, dashed average calculation, and keyboard/click selection of individual bars.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/analytics/components/reading-velocity-chart/reading-velocity-chart.spec.ts`
- [x] `npm run verify:quiet`
