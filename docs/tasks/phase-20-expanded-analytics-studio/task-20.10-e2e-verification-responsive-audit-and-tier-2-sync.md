# Task 20.10: Playwright E2E Suite, Responsive Audit (`320px`–`1280px`) & Tier 2 Docs Sync (`v2.6.0`)

## Objective

Verify the entire Phase 20 Analytics Studio & Genres/Tags ecosystem end-to-end across desktop and mobile viewports, enforce zero horizontal overflow and `reducedMotion` compliance, bump the semantic release version to `v2.6.0`, execute Tier 2 Per-Phase Documentation Synchronization, and integrate into `develop`.

---

## Target Files & Line Pointers

- **Read & Edit:**
  - `tests/e2e/stats-flow.spec.ts` (or create/expand existing analytics E2E spec) — add end-to-end coverage for:
    1. Creating/editing a book with multiple genres (`<app-tag-chips-input>`) and filtering by `?genre=` in `/books`.
    2. Adaptive Time hiding: verifying `pp/h` and the `"Time"` velocity tab are hidden when no timed logs exist, and appear once a timed reading session is logged.
    3. `/stats` Edit Layout mode: reordering widgets via accessible Move Up/Down buttons, hiding and restoring a widget, switching presets (`Minimalist` $\to$ `Editorial`), reloading the page, and verifying layout persistence in `localStorage`.
    4. Interactive 365-day Activity Heatmap day inspection & Analytics Drill-Down modal open/close via Escape.
    5. Zero horizontal overflow (`scrollWidth <= clientWidth`) at `320px`, `375px`, and `1280px` in both normal and Edit Layout modes.
    6. Reduced motion (`reducedMotion: 'reduce'`) & `adaptiveCoverTint: false` visual compliance check.
  - `package.json` & `package-lock.json` — bump semantic version from `2.5.1` to `2.6.0` via `npm version minor --no-git-tag-version` (Rule 10).
  - `docs/TASKS.md` — move Phase 20 to `Completed Phases` and mark `Active Phase` as ready for Phase 21.
  - `docs/tasks/phase-20-expanded-analytics-studio/index.md` — mark `Status: Completed` and verify all `[x]` checkboxes.
  - `docs/ROADMAP.md` — update Phase 20 status to `Completed (v2.6.0)`.
  - `CONTEXT.md` — add new analytics widgets, `tag-normalization.utils.ts`, `analytics-layout.model.ts`, and `reading-card-export.utils.ts` pointers.
  - `docs/DESIGN_SYSTEM.md` — document the Modular Analytics Studio Bento grid, Customize Mode frame tokens, and Heatmap accent intensity ramp.
  - `README.md` & `README.es.md` — update feature highlights with the customizable Analytics Studio, 365-day Activity Heatmap, Genres/Tags taxonomy, and local Reading Card export.

---

## Verification & Acceptance Criteria

- [ ] `npm run verify:quiet` passes with 0 errors.
- [ ] `npm run test:e2e` passes all existing + new Phase 20 Playwright specs across desktop and mobile viewports.
- [ ] `/about` displays `v2.6.0` matching `package.json` and `package-lock.json`.
- [ ] Tier 2 Documentation Sync completed across all required files (`docs/TASKS.md`, `index.md`, `docs/ROADMAP.md`, `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, `README.es.md`).
- [ ] Branch merged cleanly into `develop`, pushed to `origin/develop`, and Autonomous Branch Hygiene cleanup executed (Rule 5).
