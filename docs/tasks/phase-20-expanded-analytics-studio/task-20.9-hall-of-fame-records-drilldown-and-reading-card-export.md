# Task 20.9: All-Time Hall of Fame, Interactive Drill-Down Sheet & Local Reading Card PNG Export

## Objective

Complete the Analytics Studio experience with the **All-Time Personal Records Hall of Fame** (featuring miniature book covers with `--book-tint` ambient washes), the interactive **Analytics Drill-Down Modal/Sheet** allowing users to inspect the exact books behind any chart bar or heatmap day, and a 100% client-side **Editorial Reading Card PNG Exporter**.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/analytics/components/personal-records-widget/personal-records-widget.ts`
  - `src/app/features/analytics/components/personal-records-widget/personal-records-widget.html`
  - `src/app/features/analytics/components/personal-records-widget/personal-records-widget.spec.ts`
  - `src/app/features/analytics/components/analytics-drilldown-modal/analytics-drilldown-modal.ts`
  - `src/app/features/analytics/components/analytics-drilldown-modal/analytics-drilldown-modal.html`
  - `src/app/features/analytics/components/analytics-drilldown-modal/analytics-drilldown-modal.spec.ts`
  - `src/app/features/analytics/utils/reading-card-export.utils.ts`
  - `src/app/features/analytics/utils/reading-card-export.utils.spec.ts`
- **Read & Edit:**
  - `src/app/features/analytics/pages/stats-page/stats-page.ts` & `stats-page.html` — wire `<app-personal-records-widget />` into the `personal-records` slot, connect `@defer` `<app-analytics-drilldown-modal />` for all widget drill-down events, and wire the Reading Card PNG export action.

---

## Functional & Technical Requirements

1. **All-Time Hall of Fame (`PersonalRecordsWidgetComponent`):**
   - Responsive Bento grid of milestone trophy cards:
     - **Longest Book Completed** (cover thumbnail + `--book-tint` wash when `adaptiveCoverTint()` is `true`, clean neutral fallback when `false`).
     - **Highest-Rated Masterpiece** (cover thumbnail + rating badge).
     - **Best Single Reading Day** (date + pages read).
     - **Highest-Volume Month** (month + pages/books).
     - **All-Time Longest Streak** (days).
     - **Oldest Classic Read** (publication year + title).
     - **Most Prolific Year** (year + completed books).
     - **Shortest Completed Read** (pages + title).
   - Hover micro-interactions strictly respect `@media (hover: hover)` and `html[data-reduced-motion='reduce']`.
2. **Interactive Analytics Drill-Down Modal (`AnalyticsDrilldownModalComponent`):**
   - Loaded via `@defer` when any chart element (genre, author, format, rating bucket, length tier, publication era, or heatmap day) is clicked.
   - Implements full BookStack modal discipline: `host: { '(document:keydown.escape)': ... }`, programmatic initial focus via `viewChild()`, `UiStateService.acquireScrollLock()` / `releaseScrollLock()`, `.modal-scroll-area`, and `>= 44×44px` close button.
   - Displays the localized filter heading (e.g., _"Fantasy · 7 books"_) and a clean list of matching books (cover thumbnail, title, author, status badge, pages, rating).
   - Provides a 1-click **"Open in Catalog →"** link (`/books?genre=...` or `/books?q=...`) when applicable.
3. **100% Local Client-Side Reading Card PNG Export (`reading-card-export.utils.ts`):**
   - Pure HTML5 Canvas 2D renderer (`1080×1350` portrait editorial card, zero external dependencies, 100% offline/private) rendering:
     - BookStack editorial header + active period label (`2026 Reading Snapshot`).
     - Headline KPIs (Completed Books, Pages Read, Active Days, Longest Streak, Top Genre, Top Author).
     - Mini visual intensity strip / accent gradient matching the user's current theme & accent color.
   - Triggers safe local PNG download (`bookstack-stats-<period>.png`) with clean `URL.revokeObjectURL()` cleanup and graceful error toast/feedback if canvas export is unavailable.

---

## Verification & Acceptance Criteria

- [ ] `npm run test:file -- src/app/features/analytics/components/personal-records-widget/personal-records-widget.spec.ts` passes (including `adaptiveCoverTint === false` neutral fallback).
- [ ] `npm run test:file -- src/app/features/analytics/components/analytics-drilldown-modal/analytics-drilldown-modal.spec.ts` passes (Escape close, scroll lock acquire/release, matching books list).
- [ ] `npm run test:file -- src/app/features/analytics/utils/reading-card-export.utils.spec.ts` passes (cleanly builds card payload and invokes canvas rendering without throwing).
- [ ] `npm run verify:quiet` passes with zero errors.
