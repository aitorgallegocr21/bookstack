# Task 16.5: Phase 16 Verification, Regression Specs & Playwright E2E Suite

**Phase:** Phase 16: Data Health, Temporal Bounds Fix (`2925`) & Native Confirmation Dialog Engine  
**Status:** Completed  
**Estimated Impact:** Medium-High (Adds end-to-end Playwright coverage for custom confirmation dialogs, `/stats` anomalous year immunity, source-aware antique year warnings, and the `/settings` Data Health Auditor, followed by Tier 2 documentation and branch hygiene synchronization).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `tests/e2e/books-flow.spec.ts` (`L1-150`): Existing book creation, editing, and deletion E2E flows ( check any `page.on('dialog')` handlers that previously accepted native `window.confirm()`).
- `tests/e2e/analytics-flow.spec.ts` (`L1-140`): Existing `/stats` period and year selector E2E tests.
- `tests/e2e/settings-flow.spec.ts` (`L1-150`): Existing `/settings` backup export/import and danger zone E2E tests.
- `tests/e2e/series-flow.spec.ts` (`L1-140`): Existing `/series` saga detail modal and volume unlinking E2E tests.
- `docs/TASKS.md`, `docs/ROADMAP.md`, `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, `README.es.md`.

**Files to Create / Update:**

- `tests/e2e/books-flow.spec.ts`
- `tests/e2e/analytics-flow.spec.ts`
- `tests/e2e/settings-flow.spec.ts`
- `tests/e2e/series-flow.spec.ts`
- `docs/tasks/phase-16-data-health-and-confirm-dialogs/index.md`
- `docs/TASKS.md`
- `docs/ROADMAP.md`
- `CONTEXT.md`
- `docs/DESIGN_SYSTEM.md`
- `README.md`
- `README.es.md`

---

## 2. Technical Objectives

1. **Playwright E2E Updates & New Scenarios (`tests/e2e/`):**
   - **Update Existing `page.on('dialog')` Tests (`books-flow.spec.ts`):**
     - Update any existing E2E book/log deletion tests that previously relied on browser `page.on('dialog', ...)` to interact directly with the in-app `<app-confirm-dialog>` modal (`[role="alertdialog"]`), verifying the contextual entity preview card, Cancel dismissal, and Confirm deletion.
   - **Manual Antique Year Warning vs. Future Year Block (`books-flow.spec.ts`):**
     - Verify that manually entering an antique `publicationYear` (e.g., `1605`) in the book create modal opens the `<app-confirm-dialog>` warning prompt and saves the book once confirmed.
     - Verify that entering an impossible future year (`2925`) is blocked by form validation.
   - **`/stats` Anomalous Year (`2925`) Immunity (`analytics-flow.spec.ts`):**
     - Seed IndexedDB with a book/session containing an anomalous `2925` date and verify that `/stats` never renders `2925` in the year filter selector and renders `all-time` charts cleanly without empty future buckets.
   - **Library Data Health Auditor (`settings-flow.spec.ts`):**
     - Seed an anomalous book record (year `2925` and completed book with `currentPage: 0`), navigate to `/settings`, verify that `<app-data-health-section>` detects the anomalies, and trigger the 1-click auto-fix to reach `100%` health score.

2. **Full Quality Gate Verification:**
   - Run `npm run verify:quiet` (format, lint, check, unit tests, production build).
   - Run `npm run test:e2e` across all Playwright specs (`320px` mobile and `1280px` desktop viewports).

3. **Tier 2 Per-Phase Documentation & Autonomous Branch Hygiene Sync:**
   - Mark all tasks `[x]` and `Status: Completed` in `docs/tasks/phase-16-data-health-and-confirm-dialogs/index.md`.
   - Move Phase 16 to `Completed Phases` in `docs/TASKS.md` and update its status in `docs/ROADMAP.md`.
   - Update `CONTEXT.md`, `docs/DESIGN_SYSTEM.md` (documenting `<app-confirm-dialog>` and `<app-data-health-section>`), `README.md`, and `README.es.md`.
   - Merge `feat/phase-16-data-health-and-confirm-dialogs` into `develop`, push `origin/develop`, and autonomously delete `feat/phase-16-data-health-and-confirm-dialogs` locally and on GitHub per `AGENTS.md` Rule 5.

---

## 3. Verification Gate

- [x] `npm run verify:quiet`
- [x] `npm run test:e2e`
