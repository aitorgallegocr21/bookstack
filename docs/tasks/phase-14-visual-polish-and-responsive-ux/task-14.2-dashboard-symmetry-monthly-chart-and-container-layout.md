# Task 14.2: Dashboard Symmetry, Compact 6-Month Activity Widget & Container-Aware Layout

**Phase:** [Phase 14: Visual Polish, Responsive Layout & UX Refinements](index.md)  
**Status:** Pending  
**Recommended Model:** Gemini 4 Neon (Medium)

---

## 1. Objective

Resolve dashboard layout asymmetry and ~1000px tablet/small-desktop squishing:

1. Replace the unbounded vertical "Monthly Activity" bar list in `DashboardPage` (which stretches the right column excessively when users have many months of reading history) with a **fixed-height (~140px) compact 6-month vertical bar chart** + a direct router link to `/stats` ("Ver historial completo →" / "View full history →").
2. Wrap the dashboard grid in a CSS Container Query (`@container`) so the 2-column `8 / 4` split only activates when the actual content container width is wide enough (e.g., `@[960px]:grid-cols-12`, accounting for the expanded `240px` sidebar), preventing the right sidebar (`ReadingStreakWidget`, `StatusDistribution`, and `MonthlyActivity`) from getting crushed at ~1000px viewports.

---

## 2. Target Files & Line Pointers

- `src/app/features/dashboard/pages/dashboard-page/dashboard-page.ts` — L1-L93 (imports `RouterLink`, add `recentSixMonths` computed signal & short month label helper).
- `src/app/features/dashboard/pages/dashboard-page/dashboard-page.html` — L1-L163 (wrap grid in `@container`, switch `lg:grid-cols-12` $\to$ `@[960px]:grid-cols-12` and columns to `@[960px]:col-span-8` / `@[960px]:col-span-4`, polish status distribution grid, replace Monthly Activity lines L131-L160 with compact 6-month vertical bar chart + `/stats` link).
- `src/app/features/dashboard/components/reading-streak-widget/reading-streak-widget.html` — L1-L118 (ensure header badge wraps gracefully on narrow widths and 7-day pill grid uses fluid `aspect-square w-full max-w-8` instead of rigid `w-8` so pills never collide).
- `src/app/core/i18n/domains/dashboard.i18n.ts` — Add bilingual `es`/`en` keys for `monthlyActivityLast6Months` and `viewFullAnalytics`.
- `src/app/features/dashboard/pages/dashboard-page/dashboard-page.spec.ts` — Add unit/regression tests for 6-month capping, `/stats` link, and empty state.

---

## 3. Implementation Checklist

- [ ] **i18n Keys (`dashboard.i18n.ts`):**
  - Add `monthlyActivitySubtitle` (`"Últimos 6 meses"` / `"Last 6 months"`) and `viewFullAnalytics` (`"Ver historial"` / `"View full history"`) to `DashboardI18n`, `ES_DASHBOARD`, and `EN_DASHBOARD`.
- [ ] **Compact 6-Month Vertical Chart Signal (`dashboard-page.ts`):**
  - Import `RouterLink` from `@angular/router`.
  - Add `recentMonthlyPages = computed(() => this.stats().monthlyPages.slice(-6))` (ordered chronologically left-to-right, showing at most 6 months so vertical height is strictly bounded).
  - Compute `maxRecentMonthlyPages` from `recentMonthlyPages()`.
  - Add a compact month abbreviation formatter (`formatShortMonth(month: string)`) using `Intl.DateTimeFormat` (e.g., `ene`, `feb`, `mar` / `Jan`, `Feb`, `Mar`) so column labels never truncate or collide.
- [ ] **Compact 6-Month Bar Chart UI (`dashboard-page.html` L131-L160):**
  - Header row with title + subtle subtitle (`Últimos 6 meses`) and a clean `routerLink="/stats"` link (`Ver historial →`).
  - Render a 6-column vertical bar chart inside a fixed-height container (`h-32` / `~128-140px`) displaying page count label above or on hover/tooltip, rounded vertical bar (`bg-blue-600 dark:bg-blue-500`) scaled proportionally with a sensible minimum bar height (`min-h-[4px]` when `pages > 0`), and short month label underneath.
  - Keep existing `@empty` fallback when no monthly logs exist.
- [ ] **Container-Aware Dashboard Split & Squish Prevention (`dashboard-page.html` & `reading-streak-widget.html`):**
  - Add `@container` to the main dashboard wrapper in `dashboard-page.html`.
  - Change the 2-column grid from `lg:grid-cols-12` to `@[960px]:grid-cols-12` (and `lg:col-span-8`/`4` $\to$ `@[960px]:col-span-8`/`4`). At ~1000px viewport with the 240px sidebar open, container width is ~760px, so the right sidebar widgets stack cleanly below in a balanced 2-column subgrid (`@[560px]:grid-cols-2 @[960px]:grid-cols-1`) instead of getting crushed into a ~220px strip!
  - In `reading-streak-widget.html`, allow the header flex row to wrap gracefully (`flex-wrap gap-2`) and change day pills from fixed `h-8 w-8` to `aspect-square w-full max-w-8` inside `grid-cols-7 gap-1 sm:gap-1.5` so days and ticks never overlap.
  - In `dashboard-page.html` Status Distribution (L111), ensure `grid-cols-[minmax(4.5rem,auto)_1fr_2rem]` with `min-w-0` so bars always have comfortable width.
- [ ] **Unit & Regression Tests (`dashboard-page.spec.ts`):**
  - Verify that when `stats().monthlyPages` has 12+ months, only the last 6 months are rendered in the dashboard widget.
  - Verify the `/stats` navigation link is rendered and accessible.

---

## 4. Verification Gate

1. `npm run test:file -- src/app/features/dashboard/pages/dashboard-page/dashboard-page.spec.ts`
2. `npm run verify:quiet`
3. Tier 1 Doc Sync: Mark Task 14.2 `[x]` in `docs/tasks/phase-14-visual-polish-and-responsive-ux/index.md`.
