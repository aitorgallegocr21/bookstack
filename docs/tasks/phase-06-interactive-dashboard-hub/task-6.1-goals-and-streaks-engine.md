# Task 6.1: Reading Goals & Daily Streaks Engine

**Phase:** Phase 06: Interactive Dashboard Hub  
**Status:** Pending  
**Estimated Impact:** Medium (core domain models, Zod validation schema, streak & annual stats computation, unit tests).

---

## 1. Technical Objectives

1. **Domain Models & Zod Schemas:**
   - Define `ReadingGoals` interface in `src/app/features/books/models/book.model.ts`:
     ```typescript
     export interface ReadingGoals {
       year: number;
       targetBooks: number;
       targetPages: number;
     }
     ```
   - Create `ReadingGoalsSchema` with runtime Zod parsing in `src/app/features/books/schemas/reading-goals.schema.ts` (bounds: `targetBooks >= 1`, `targetPages >= 100`).
   - Add storage methods in `StorageAdapterService` to retrieve and persist `ReadingGoals` under key `'bookstack_reading_goals'` with default fallback (e.g. 12 books, 3,000 pages for the current calendar year).
2. **Streak Computation Logic in `ReadingStatsService`:**
   - Compute `currentStreak`: Consecutive days with at least 1 `ReadingLog` entry. If no log exists for today (`currentDate`), but a log exists for yesterday, streak is maintained (grace period). If no log exists for today or yesterday, streak resets to 0.
   - Compute `weeklyActivity`: An array of 7 booleans/objects representing Monday through Sunday of the current week indicating whether at least 1 reading session took place on each day.
3. **Annual Progress Computation:**
   - Compute `currentYearBooksCompleted`: Number of books with `status === 'completed'` and `completedAt` falling within the current calendar year.
   - Compute `currentYearPagesRead`: Sum of `pagesRead` from all `ReadingLog` entries dated within the current calendar year.
4. **Unit Tests:**
   - Write comprehensive unit tests in `src/app/features/books/services/reading-stats.service.spec.ts` and `reading-goals.schema.spec.ts` covering streak progression, broken streaks, grace periods, weekly activity flags, and annual aggregations.

---

## 2. Verification Gate

- `npm run check`
- `npm run lint`
- `npm run format`
- `npm test`
