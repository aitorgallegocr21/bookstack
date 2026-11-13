# Task 8.5: Reading Habits (Weekday Pace) & Period Highlights

**Phase:** Phase 08: Advanced Analytics (`/stats`)  
**Status:** Pending  
**Estimated Impact:** Medium (Weekday reading pace visualization `Mon`–`Sun` with peak day callout + 4 Period Highlights milestone cards).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/analytics/models/analytics.model.ts` (`L75-130`): `WeekdayPaceItem` and `AnalyticsHighlights` contracts.
- `src/app/features/analytics/services/analytics.service.ts` (`L180-310`): Weekday pace and highlights computed signals.
- `src/app/features/analytics/pages/stats-page/stats-page.ts` (`L1-60`): Host page integration.
- `src/app/core/utils/date-formatter.ts` (`L1-60`): Locale-aware date formatting helpers.
- `src/app/core/i18n/i18n.types.ts` (`L257-320`): `stats` translation keys.

**Files to Create / Update:**

- `src/app/features/analytics/components/reading-habits-section/reading-habits-section.ts`
- `src/app/features/analytics/components/reading-habits-section/reading-habits-section.html`
- `src/app/features/analytics/components/reading-habits-section/reading-habits-section.spec.ts`
- `src/app/features/analytics/pages/stats-page/stats-page.ts`
- `src/app/features/analytics/pages/stats-page/stats-page.html`

---

## 2. Technical Objectives

1. **Block 1 — Weekday Reading Pace (`Ritmo por Día de la Semana`):**
   - Displays 7 vertical or horizontal comparative bars from **Monday (`Lun`) to Sunday (`Dom`)** based on logged reading sessions in the selected period.
   - Highlights the peak day (`isPeakDay: true`) with an accent badge (**"Día estrella"** / **"Peak day"**) and displays total pages and session count per weekday.
   - Provides a clean contextual message if the user has books in the library but has not logged dated reading sessions yet.
2. **Block 2 — Period Highlights (`Hitos del Período`):**
   - 2x2 responsive card grid showcasing personal records for the active timeframe:
     1. **Día de mayor lectura:** Date formatted via `Intl.DateTimeFormat` + maximum pages read in a single day.
     2. **Libro más largo completado:** Book title, author, and page count (`totalPages`).
     3. **Tiempo medio por libro:** Average days from `startDate` to `endDate` for books completed in the period (with graceful fallback when dates are omitted).
     4. **Libro mejor valorado:** Book title, author, and rating badge (`X.X / 10`).
3. **Component Unit Tests (`reading-habits-section.spec.ts`):**
   - Verify peak day badge rendering, weekday bar scaling, and all 4 highlight cards with both complete and partial/empty metadata.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/analytics/components/reading-habits-section/reading-habits-section.spec.ts`
- [ ] `npm run verify:quiet`
