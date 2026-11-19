# Task 8.6: Analytics QA, Responsive Polish & Playwright E2E Suite

**Phase:** Phase 08: Advanced Analytics (`/stats`)  
**Status:** Completed  
**Estimated Impact:** Medium (full `StatsPage` spec coverage, Playwright E2E suite `analytics-flow.spec.ts`, viewport overflow verification down to `320px`, and Tier 2 Per-Phase documentation sync).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/analytics/pages/stats-page/stats-page.ts` (`L1-60`)
- `src/app/features/analytics/pages/stats-page/stats-page.html` (`L1-60`)
- `tests/e2e/catalog-flow.spec.ts` (`L1-80`): Reference E2E seeding and viewport assertion patterns.
- `docs/TASKS.md` (`L1-30`): Active vs Completed phases registry.
- `CONTEXT.md` (`L30-77`): Semantic Source Map & JIT Line Pointers.

**Files to Create / Update:**

- `src/app/features/analytics/pages/stats-page/stats-page.spec.ts`
- `tests/e2e/analytics-flow.spec.ts`
- `docs/tasks/phase-08-advanced-analytics/index.md`
- `docs/TASKS.md`
- `CONTEXT.md`
- `docs/DESIGN_SYSTEM.md`
- `README.md`
- `README.es.md`

---

## 2. Technical Objectives

1. **`StatsPage` Integration Unit Tests (`stats-page.spec.ts`):**
   - Verify coordination between `AnalyticsService`, `AnalyticsHeaderComponent`, `AnalyticsKpiGridComponent`, `ReadingVelocityChartComponent`, `LibraryCompositionSectionComponent`, and `ReadingHabitsSectionComponent`.
   - Verify empty state rendering and `UiStateService.openCreateModal()` invocation when library is empty.
2. **Playwright E2E Suite (`tests/e2e/analytics-flow.spec.ts`):**
   - **Empty State Flow:** Navigate to `/stats` with an empty store, verify empty state card, click CTA button, and verify the global create book modal opens.
   - **Hybrid Analytics & Period Filter Flow:** Seed books (both with `ReadingLog` sessions and directly completed without logs), verify KPI cards, toggle period filters (`Este año`, `Últimos 12 meses`, `Todo el historial`), and verify reactive updates.
   - **Interactive Velocity Chart Flow:** Switch chart metrics (`Páginas` $\to$ `Libros completados` $\to$ `Tiempo`), click/focus a bar, and verify the inspection detail callout updates.
   - **Composition & Habits Panels:** Verify format donut legend, status breakdown, ratings/top authors, weekday pace, and period highlights.
   - **Responsive & Theme Parity:** Assert zero horizontal overflow (`scrollWidth <= clientWidth`) at `320px`, `375px`, `768px`, and `1280px` in both light and dark modes.
3. **Tier 2 Per-Phase Documentation Sync:**
   - Mark all tasks `[x]` and set `Status: Completed` in `docs/tasks/phase-08-advanced-analytics/index.md`.
   - Move Phase 08 to `Completed Phases` and promote Phase 09 to `Active Phase` in `docs/TASKS.md`.
   - Update `CONTEXT.md` source map with the new `src/app/features/analytics/` structure and `tests/e2e/analytics-flow.spec.ts`.
   - Sync `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md`.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/analytics/pages/stats-page/stats-page.spec.ts`
- [x] `npm run verify:quiet`
- [x] `npm run test:e2e`
