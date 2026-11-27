# Task 20.5: Adaptive Executive KPI Grid, Goal Pace Forecast & Upgraded Velocity Chart

## Objective

Upgrade BookStack's core headline analytics widgets so they adapt intelligently to timed vs. non-timed reading workflows, surface period-over-period comparison deltas, project year-end Annual Goal completion, and support Cumulative Area + Annual Target overlay on the Velocity Chart.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/analytics/components/goal-projection-card/goal-projection-card.ts`
  - `src/app/features/analytics/components/goal-projection-card/goal-projection-card.html`
  - `src/app/features/analytics/components/goal-projection-card/goal-projection-card.spec.ts`
- **Read & Edit:**
  - `src/app/features/analytics/components/analytics-kpi-grid/` — implement adaptive card promotion (hide `totalTime` / `pp/h` card when `!analytics.showTimeMetrics()`, promote **Average Rating** or **Avg Pages / Book** card instead), add semantic emerald/rose/neutral period-over-period delta pills (`+18% vs 2025`), and maintain `tabular-nums` alignment.
  - `src/app/features/analytics/components/reading-velocity-chart/` — hide `"Time"` metric tab when `!analytics.showTimeMetrics()`, add **Monthly Bars vs. Cumulative Area** view toggle, render a dashed Annual Goal pacing reference line when viewing the active year in Cumulative mode, and add subtle moving-average indicator.
  - `src/app/features/analytics/pages/stats-page/stats-page.ts` & `stats-page.html` — wire `<app-goal-projection-card />` into the `goal-projection` widget slot.

---

## Functional & Technical Requirements

1. **Adaptive Executive KPI Grid (`AnalyticsKpiGridComponent`):**
   - Displays 4 executive cards in a `@container`-responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
   - Card 1: **Books Completed** (with completion rate & period delta pill).
   - Card 2: **Pages Read** (with avg pages/day & period delta pill).
   - Card 3 (Adaptive):
     - If `analytics.showTimeMetrics()` is `true`: **Reading Time & Speed** (`Xh Ym` + `pp/h`).
     - If `analytics.showTimeMetrics()` is `false`: **Average Rating & Book Length** (mean `X.X / 10` rating + average pages per completed book, with rating delta pill).
   - Card 4: **Active Reading Days & Streak** (active days count, period delta pill, current & longest streak badge).
2. **Annual Goal Pace & Year-End Forecast (`GoalProjectionCardComponent`):**
   - Dual editorial progress gauges for **Books Goal** and **Pages Goal** showing:
     - Actual progress bar + subtle vertical "Today's expected pace" marker (`elapsedYearPercent`).
     - Status pill: **"Ahead by X books"** (emerald) / **"On track"** (accent) / **"Behind by X books"** (amber).
     - **Year-End Forecast:** _"At your current pace: ~28 books & ~9,400 pages by Dec 31"_.
     - **Required Daily Pace:** _"Read X pages/day to reach your annual target"_ (when target not yet reached).
   - Graceful prompt/CTA to configure goals if `targetBooks === 0 && targetPages === 0`.
3. **Upgraded Velocity Chart (`ReadingVelocityChartComponent`):**
   - Pure SVG + Tailwind CSS v4 (zero charting libraries).
   - Mode toggle: **Bars** (discrete monthly/yearly pace) vs. **Cumulative** (smooth SVG area path showing cumulative growth across the period + dashed Annual Goal target line when applicable).
   - Interactive focusable bars/points with accessible `aria-label` tooltips.
   - Honors `reducedMotion` (instant height/path updates without spring/ease transitions).

---

## Verification & Acceptance Criteria

- [ ] `npm run test:file -- src/app/features/analytics/components/goal-projection-card/goal-projection-card.spec.ts` passes (ahead, behind, completed target, and empty-pace states).
- [ ] Updated `analytics-kpi-grid.spec.ts` verifies that `pp/h` and Time are hidden when `showTimeMetrics()` is `false` and restored when timed logs exist.
- [ ] Updated `reading-velocity-chart.spec.ts` verifies `"Time"` tab visibility toggle and Bar vs. Cumulative mode switching.
- [ ] `npm run verify:quiet` passes with zero errors.
