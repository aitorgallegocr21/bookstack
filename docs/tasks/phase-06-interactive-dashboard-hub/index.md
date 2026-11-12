# Phase 06: Interactive Dashboard Hub

**Status:** Completed  
**Target Branch:** `feature/06-interactive-dashboard-hub` $\to$ `develop`  
**Core Mission:** Redesign and elevate the BookStack home page (`/`) into an interactive, motivating personal reading launchpad. Features a "Currently Reading" Hero card with inline fast-page update, parallel active reads strip, smart dual empty states, daily reading streak with animated flame and weekly activity indicators, combined annual reading goals (books + pages) with a lightweight edit modal, recent activity feed, and responsive 2-column desktop layout.

---

## 1. Architectural Summary & Decisions

1. **"Currently Reading" Hero Showcase:**
   - Highlights the book with the most recent reading session (or last updated `reading` status).
   - Displays cover art, title, author, reading progress percentage, current page vs. total pages, and status pill.
   - If multiple books are in `reading` status, secondary books appear in a compact horizontal strip allowing instant switching.
2. **Inline Fast Progress Updater:**
   - Direct numerical input for "Current page" with Enter key and "Update" button confirmation.
   - Automatically computes page delta, registers a `ReadingLog` entry for today, advances `currentPage`, and automatically marks the book as `completed` if the last page is reached.
   - Includes a secondary action to open the full `ReadingLogEditorComponent` for logging minutes and notes.
3. **Gamification & Habit Engine (Streaks & Goals):**
   - **Daily Reading Streak:** Calculates consecutive days with reading activity ending today or yesterday (grace period: today not broken until tomorrow). Includes flame animation and weekly pills (L M X J V S D / M T W T F S S) showing active days.
   - **Combined Annual Reading Goal:** Tracks both completed books and total pages read in the current calendar year. Includes an edit modal/popover to adjust goals, persisted in `StorageAdapterService` via Zod schema (`reading-goals.schema.ts`).
4. **Recent Activity Feed:**
   - Lists the 3–5 most recent reading sessions with formatted date, book title, delta pages (`+X`), duration, and optional notes, linking directly to the book or session.
5. **Smart Dual Empty States:**
   - If total library has 0 books: Displays an encouraging welcome card with a prominent "Add my first book" action.
   - If library has books but 0 books currently in `reading`: Displays a "Pick your next read" carousel of `pending` books with a 1-click "Start reading" action.
6. **Responsive Layout:**
   - **Desktop ($\ge 1024\text{px}$):** Asymmetric 2-column grid. Main column (~65%) with Hero, other active reads, and Recent Activity. Sidebar column (~35%) with Streak widget, Combined Annual Goal, and mini quick stats.
   - **Mobile / Tablet ($< 1024\text{px}$):** Ergonomic vertical stack respecting safe-area insets, touch targets $\ge 44\times44\text{px}$, and zero horizontal overflow.
7. **Strict i18n & Quality:**
   - 100% centralized translation keys in `src/app/core/i18n/es.ts` and `en.ts`.
   - Comprehensive Vitest unit tests for streak and goal calculations, component tests, and Playwright E2E coverage.

---

## 2. Task Breakdown

- [x] **[Task 6.1: Reading Goals & Daily Streaks Engine](task-6.1-goals-and-streaks-engine.md)** — Create `ReadingGoals` domain model & Zod schema, extend `ReadingStatsService` with consecutive day streak calculation (with grace period) and current-year goal tracking, and add unit tests with `fake-indexeddb`.
- [x] **[Task 6.2: Hero "Currently Reading", Fast Updater & Smart Empty States](task-6.2-hero-currently-reading-and-fast-updater.md)** — Implement `CurrentlyReadingHeroComponent` with inline page numerical input, quick delta logging, parallel active books selector, and dual smart empty states (first book vs. pick from pending).
- [x] **[Task 6.3: Streaks Widget, Goals Edit Modal & Recent Activity Feed](task-6.3-streaks-goals-modal-and-recent-feed.md)** — Implement `ReadingStreakWidgetComponent` with flame icon and weekly pills, `AnnualGoalCardComponent` with lightweight edit modal, `RecentActivityFeedComponent`, and wire the asymmetric 2-column responsive layout in `DashboardPageComponent`.
- [x] **[Task 6.4: Full i18n Sync, Component Specs & Playwright E2E Suite](task-6.4-dashboard-qa-and-e2e-suite.md)** — Synchronize `es.ts` and `en.ts` dictionaries, write component unit tests for dashboard elements, create `tests/e2e/dashboard-flow.spec.ts`, and run `npm run verify` + `npm run test:e2e`.
