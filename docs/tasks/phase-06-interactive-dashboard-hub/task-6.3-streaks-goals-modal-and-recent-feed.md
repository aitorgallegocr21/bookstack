# Task 6.3: Streaks Widget, Goals Edit Modal & Recent Activity Feed

**Phase:** Phase 06: Interactive Dashboard Hub  
**Status:** Pending  
**Estimated Impact:** Medium (widgets, modal dialog, recent feed integration, responsive layout assembly).

---

## 1. Technical Objectives

1. **`ReadingStreakWidgetComponent`:**
   - Standalone widget in `src/app/features/dashboard/components/reading-streak-widget/`.
   - Displays flame icon with subtle animation (pulse or flame glow) and streak count.
   - Renders 7 weekly indicator pills (`L M X J V S D` in Spanish / `M T W T F S S` in English) highlighting days with recorded reading activity.
2. **`AnnualGoalCardComponent` & Lightweight Edit Modal:**
   - Standalone widget in `src/app/features/dashboard/components/annual-goal-card/`.
   - Dual progress bars/meters:
     - Books progress: `currentYearBooksCompleted` / `targetBooks` with percentage.
     - Pages progress: `currentYearPagesRead` / `targetPages` with percentage.
   - Edit button (pencil icon) opens a lightweight accessible modal to modify `targetBooks` and `targetPages`.
   - Modal supports Escape key dismissal, scroll-lock via `UiStateService`, and persists changes through `StorageAdapterService`.
3. **`RecentActivityFeedComponent`:**
   - Standalone component in `src/app/features/dashboard/components/recent-activity-feed/`.
   - Displays the last 3–5 reading sessions ordered by date descending.
   - Each item includes formatted date, book title, pages read (`+X págs`), duration in minutes (if recorded), and reading notes (if present).
   - Clickable row opens `BookDetailModalComponent` or `ReadingLogEditorComponent` for that book.
4. **Asymmetric 2-Column Responsive Layout Assembly:**
   - Redesign `DashboardPageComponent`:
     - Desktop ($\ge 1024\text{px}$): 2 columns (`lg:grid-cols-[1fr_380px]`). Left column: Hero + parallel active reads + Recent Activity. Right column: Reading Streak + Annual Goals + mini quick metrics.
     - Mobile / Tablet ($< 1024\text{px}$): Single-column stack ordered for optimal mobile ergonomics.

---

## 2. Verification Gate

- `npm run check`
- `npm run lint`
- `npm run format`
- `npm test`
