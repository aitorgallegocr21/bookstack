# Task 14.5: Unified Symmetric Filter & Control Toolbars (`/books`, `/series`, `/stats`)

**Phase:** [Phase 14: Visual Polish, Responsive Layout & UX Refinements](index.md)  
**Status:** Pending  
**Recommended Model:** Gemini 4 Neon (Medium)

---

## 1. Objective

Establish a unified, symmetric, and clipping-free filter/control toolbar architecture across all three primary data views:

1. **`/books` (`CatalogToolbarComponent`):** Prevent the contextual "Reset filters" button from squeezing or cutting off status filter chips on tablet widths. Use `@container` so status chips render in a full symmetric row only when every chip fits without horizontal scrolling, falling back to a clean accessible `<select>` on narrow/tablet widths, and place the Reset button in a dedicated non-shifting slot.
2. **`/series` (`SeriesToolbarComponent`):** Apply the exact same `@container` symmetric pattern (status chips on wide containers $\leftrightarrow$ accessible `<select>` on narrow/tablet containers + non-shifting Reset slot) so filter buttons never wrap asymmetrically as screen width shrinks.
3. **`/stats` (`AnalyticsHeaderComponent`):** Upgrade the period buttons into a modern unified segmented control bar matching the clean toolbar geometry of `/books` and `/series`, with the optional specific-year selector cleanly integrated.

---

## 2. Target Files & Line Pointers

- `src/app/features/books/components/catalog-toolbar/catalog-toolbar.html` — L1-L216 (wrap `<section>` in `@container`, update status select/chips breakpoints from `sm:` to `@[720px]:`, move contextual Reset button to a non-shifting slot).
- `src/app/features/books/components/catalog-toolbar/catalog-toolbar.spec.ts` — Update/add unit assertions for non-clipping status row and Reset button behavior.
- `src/app/features/series/components/series-toolbar/series-toolbar.html` — L1-L108 (wrap `<section>` in `@container`, add mobile/tablet accessible status `<select>`, show symmetric status chips at `@[680px]:flex`, place Reset button in a dedicated non-shifting slot).
- `src/app/features/series/components/series-toolbar/series-toolbar.ts` — Add `onStatusSelectChange(event: Event)` handler for the `<select>` control.
- `src/app/features/series/components/series-toolbar/series-toolbar.spec.ts` — Add unit tests for both `<select>` and chip status filtering + Reset button.
- `src/app/features/analytics/components/analytics-header/analytics-header.html` — L1-L89 (refactor period buttons into a unified rounded segmented control bar with clean responsive stacking/grid on mobile).
- `src/app/features/analytics/components/analytics-header/analytics-header.spec.ts` — Verify existing `data-testid` hooks (`period-btn-current-year`, `period-btn-last-12-months`, `period-btn-all-time`, `period-year-select`) remain intact and functional.

---

## 3. Implementation Checklist

- [ ] **Catalog Toolbar (`/books` — `catalog-toolbar.html`):**
  - Add `@container` to the root `<section>`.
  - Switch the mobile/tablet status `<select>` visibility from `sm:hidden` to `@[760px]:hidden`, and the full status chips strip from `hidden ... overflow-x-auto ... sm:flex` to `hidden ... @[760px]:flex` (no `overflow-x-auto` clipping!).
  - Place the contextual Reset button cleanly in a dedicated slot (e.g., alongside the Filter drawer toggle when `<select>` is shown, or in a subtle active-filters footer/action group that reserves space cleanly without squeezing the status chips).
- [ ] **Series Toolbar (`/series` — `series-toolbar.html` & `.ts`):**
  - Add `@container` to the root `<section>`.
  - Mirror `CatalogToolbarComponent`'s symmetric pattern:
    - Below `@[680px]`: render a clean accessible `<select>` showing all statuses with live counts (`{{ getStatusLabel(status) }} ({{ getStatusCount(status) }})`) alongside the Reset button when active.
    - At `@[680px]` and above: render all 4 status chips cleanly in one symmetric non-wrapping row with the Reset button neatly aligned at the trailing edge without displacing chips onto uneven lines.
  - Add `onStatusSelectChange(event: Event)` in `series-toolbar.ts` emitting `statusChange`.
- [ ] **Analytics Header (`/stats` — `analytics-header.html`):**
  - Wrap the 3 main period buttons (`current-year`, `last-12-months`, `all-time`) in a cohesive segmented control container (`inline-flex rounded-2xl border border-slate-200/90 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-800/80`) where the active option elevates as a crisp pill (`bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white` or brand blue pill), and stack/wrap cleanly on small mobile viewports with zero overflow.
  - Keep all `data-testid` attributes and `aria-pressed` states intact for Playwright E2E compatibility.
- [ ] **Unit & Regression Tests:**
  - Verify `catalog-toolbar.spec.ts`, `series-toolbar.spec.ts`, and `analytics-header.spec.ts` cover status selection (chips & `<select>`), Reset visibility/emission, and period switching.

---

## 4. Verification Gate

1. `npm run test:file -- src/app/features/books/components/catalog-toolbar/catalog-toolbar.spec.ts`
2. `npm run test:file -- src/app/features/series/components/series-toolbar/series-toolbar.spec.ts`
3. `npm run test:file -- src/app/features/analytics/components/analytics-header/analytics-header.spec.ts`
4. `npm run verify:quiet`
5. Tier 1 Doc Sync: Mark Task 14.5 `[x]` in `docs/tasks/phase-14-visual-polish-and-responsive-ux/index.md`.
