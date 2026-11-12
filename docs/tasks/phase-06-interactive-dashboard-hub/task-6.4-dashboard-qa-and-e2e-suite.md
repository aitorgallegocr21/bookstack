# Task 6.4: Full i18n Sync, Component Specs & Playwright E2E Suite

**Phase:** Phase 06: Interactive Dashboard Hub  
**Status:** Pending  
**Estimated Impact:** Low-Medium (QA verification, internationalization dictionary completeness, automated testing).

---

## 1. Technical Objectives

1. **i18n Centralization:**
   - Expand `src/app/core/i18n/es.ts` and `src/app/core/i18n/en.ts` dictionaries with all dashboard keys:
     - Hero copy: `currentlyReading`, `updatePage`, `pageInputAria`, `openFullLog`, `startReading`, etc.
     - Empty states copy: `welcomeTitle`, `welcomeMessage`, `addFirstBook`, `noActiveReads`, `pickNextRead`, etc.
     - Streaks & Goals copy: `streakDays`, `streakActive`, `readingGoals`, `editGoalTitle`, `targetBooks`, `targetPages`, `saveGoals`, etc.
     - Recent feed copy: `recentActivity`, `noRecentActivity`, `pagesReadBadge`, etc.
2. **Component Unit Tests (Vitest):**
   - Write unit tests for:
     - `CurrentlyReadingHeroComponent` (inputs, progress calculation, fast update trigger, switch active read).
     - `ReadingStreakWidgetComponent` (streak rendering, weekly pills active classes).
     - `AnnualGoalCardComponent` (progress metrics, edit modal open/save).
     - `RecentActivityFeedComponent` (recent session formatting, empty state).
     - `DashboardPageComponent` (layout rendering, empty states switching).
3. **Playwright E2E Test Suite:**
   - Create `tests/e2e/dashboard-flow.spec.ts`:
     - Test empty state prompt for initial user.
     - Test starting a book and verifying it appears in the Hero card.
     - Test updating page progress directly from the Hero numerical input.
     - Test streak counter and reading goal display updates.
     - Test responsive mobile view without overflow.
4. **Final Gate Verification:**
   - Execute `npm run verify` (0 errors, 0 warnings).
   - Execute `npm run test:e2e`.

---

## 2. Verification Gate

- `npm run verify`
- `npm run test:e2e`
