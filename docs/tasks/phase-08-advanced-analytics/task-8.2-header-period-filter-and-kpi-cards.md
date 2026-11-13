# Task 8.2: Analytics Header, Period Filter Toolbar & Executive KPI Cards

**Phase:** Phase 08: Advanced Analytics (`/stats`)  
**Status:** Pending  
**Estimated Impact:** Medium (new standalone `OnPush` components for period selection and 4 executive KPI cards, plus empty library state in `StatsPage`).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/analytics/models/analytics.model.ts` (`L1-120`): Analytics contracts from Task 8.1.
- `src/app/features/analytics/services/analytics.service.ts` (`L1-120`): Signals and period setters from Task 8.1.
- `src/app/features/analytics/pages/stats-page/stats-page.ts` (`L1-12`): Current placeholder page component.
- `src/app/features/analytics/pages/stats-page/stats-page.html` (`L1-17`): Current placeholder template.
- `src/app/core/services/ui-state.service.ts` (`L1-46`): `openCreateModal()` for the empty library CTA.
- `src/app/core/i18n/i18n.types.ts` (`L257-320`): `stats` translation keys.

**Files to Create / Update:**

- `src/app/features/analytics/components/analytics-header/analytics-header.ts`
- `src/app/features/analytics/components/analytics-header/analytics-header.html`
- `src/app/features/analytics/components/analytics-header/analytics-header.spec.ts`
- `src/app/features/analytics/components/analytics-kpi-grid/analytics-kpi-grid.ts`
- `src/app/features/analytics/components/analytics-kpi-grid/analytics-kpi-grid.html`
- `src/app/features/analytics/components/analytics-kpi-grid/analytics-kpi-grid.spec.ts`
- `src/app/features/analytics/pages/stats-page/stats-page.ts`
- `src/app/features/analytics/pages/stats-page/stats-page.html`

---

## 2. Technical Objectives

1. **`AnalyticsHeaderComponent` (`analytics-header`):**
   - Displays page title, subtitle, and the responsive period control bar:
     - Pill buttons for `Este año (YYYY)`, `Últimos 12 meses`, and `Todo el historial` (`min-h-11` touch targets, `aria-pressed`).
     - Accessible year selector `<select>` when historical years (`availableYears().length > 1`) exist, switching `periodMode` to `'specific-year'` when a past year is chosen.
2. **`AnalyticsKpiGridComponent` (`analytics-kpi-grid`):**
   - Responsive 4-column grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`):
     1. **Libros completados:** Primary value `completedBooks` + secondary badge with `completionRatePercent%` completion rate.
     2. **Páginas leídas:** Primary value `pagesRead` formatted + secondary micro-indicator with `averagePagesPerDay` pages/day.
     3. **Tiempo de lectura:** Formatted hours and minutes (`Xh Ym`) from `totalTimeMinutes` + secondary micro-indicator with `averageSpeedPagesPerHour` pages/h.
     4. **Racha y constancia:** Primary value `activeDaysCount` active days in period + secondary micro-indicator with `longestStreak` record streak (and current streak badge).
3. **`StatsPage` Integration & Empty Library State:**
   - When `booksService.books().length === 0`, render a polished, centered empty state card explaining the analytics suite with a primary CTA button (`Añadir primer libro`) that invokes `uiState.openCreateModal()`.
   - When books exist, render `<app-analytics-header>` and `<app-analytics-kpi-grid>`.
4. **Component Unit Tests:**
   - Verify period switching interactions, year dropdown visibility, KPI formatting (including 0-state fallbacks), and empty state CTA trigger.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/analytics/components/analytics-header/analytics-header.spec.ts`
- [ ] `npm run test:file -- src/app/features/analytics/components/analytics-kpi-grid/analytics-kpi-grid.spec.ts`
- [ ] `npm run verify:quiet`
