# Task 20.6: 365-Day Reading Activity Heatmap & Upgraded Habits/Session Rhythm

## Objective

Build the signature GitHub-style **365-Day Reading Activity Heatmap** widget using BookStack's active brand accent palette and upgrade `ReadingHabitsSectionComponent` with Weekday vs. Weekend reading split and session depth metrics.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/analytics/components/activity-heatmap-widget/activity-heatmap-widget.ts`
  - `src/app/features/analytics/components/activity-heatmap-widget/activity-heatmap-widget.html`
  - `src/app/features/analytics/components/activity-heatmap-widget/activity-heatmap-widget.spec.ts`
- **Read & Edit:**
  - `src/app/features/analytics/components/reading-habits-section/` — upgrade with Weekend vs. Weekday ratio bar (`%`), average pages per session, longest single session callout, and total sessions count; remove duplicate period highlights now elevated into `PersonalRecordsWidgetComponent` (Task 20.9) so each widget has a focused, non-redundant identity.
  - `src/app/features/analytics/pages/stats-page/stats-page.ts` & `stats-page.html` — wire `<app-activity-heatmap-widget />` into the `activity-heatmap` slot and emit drill-down event when a user taps/clicks an active heatmap day.

---

## Functional & Technical Requirements

1. **365-Day Activity Heatmap (`ActivityHeatmapWidgetComponent`):**
   - Renders a 52–53 week × 7-day grid (Monday–Sunday rows) inside an internally scrollable container (`overflow-x-auto no-scrollbar`) with zero page-level horizontal overflow on `320px` mobile.
   - 5 discrete intensity levels (`0` = neutral surface tint, `1`..`4` = progressive `color-mix(in srgb, var(--accent) ...)` opacity steps) adapting automatically to all 5 brand accent palettes and Light/Dark modes.
   - Month labels along the top axis and abbreviated weekday labels (`L / M / X` or `M / W / F`) on the left axis.
   - Interactive active-day detail bar / floating tooltip on hover, keyboard focus, or tap: shows formatted date, pages read, books touched, and reading minutes (only when `showTimeMetrics()` is `true` and `timeMinutes > 0`), plus clicking an active day triggers the Analytics Drill-Down sheet (Task 20.9).
   - Footer strip displaying: **Active Days**, **Consistency (`%` of elapsed days)**, **Longest Streak in Period**, and a 5-swatch `Less → More` intensity legend.
2. **Upgraded Reading Habits & Session Rhythm (`ReadingHabitsSectionComponent`):**
   - Preserves the 7-day Monday–Sunday intensity bar chart with peak-day crown/badge.
   - Adds a sleek **Weekday vs. Weekend Split** dual bar (e.g., `64% Weekdays` vs `36% Weekend`).
   - Adds a 3-stat mini strip for **Avg Pages / Session**, **Longest Single Session**, and **Total Sessions Logged**.
3. **Reduced Motion & Accessibility:**
   - All heatmap cells with activity are keyboard-focusable (`<button>` or accessible grid cells with `aria-label="15 Nov 2026: 42 pages"`).
   - Hover scale/highlight animations respect `html[data-reduced-motion='reduce']`.

---

## Verification & Acceptance Criteria

- [ ] `npm run test:file -- src/app/features/analytics/components/activity-heatmap-widget/activity-heatmap-widget.spec.ts` passes (renders intensity levels, tooltip selection on click/focus, empty state handling).
- [ ] Updated `reading-habits-section.spec.ts` passes (weekday vs. weekend split, session depth stats).
- [ ] `npm run verify:quiet` passes with zero errors.
