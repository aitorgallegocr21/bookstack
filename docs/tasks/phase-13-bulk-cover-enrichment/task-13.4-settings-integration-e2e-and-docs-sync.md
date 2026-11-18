# Task 13.4: Settings Integration, Playwright E2E Verification & Tier 2 Per-Phase Sync

**Phase:** Phase 13: Post-Import Bulk Cover Enrichment & Library Cover Assistant  
**Status:** Completed  
**Estimated Impact:** Medium (`SettingsPage` wiring, Playwright E2E coverage for post-import ISBN enrichment + verification report + visual cover assistant, and Tier 2 Per-Phase documentation sync).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/pages/settings-page/settings-page.ts` (`L1-63`): Component imports and `refreshStorageBreakdown()`.
- `src/app/features/settings/pages/settings-page/settings-page.html` (`L1-45`): Settings sections layout.
- `tests/e2e/settings-flow.spec.ts` (`L1-220`): Existing `/settings` Playwright E2E suite.
- `docs/TASKS.md` (`L1-39`): Phase registry.
- `CONTEXT.md` (`L1-123`): Semantic source map.
- `docs/DESIGN_SYSTEM.md` (`L1-160`): UI component inventory.
- `README.md` & `README.es.md`: Feature list & architecture summary.

**Files to Create / Update:**

- `src/app/features/settings/pages/settings-page/settings-page.ts`
- `src/app/features/settings/pages/settings-page/settings-page.html`
- `src/app/features/settings/pages/settings-page/settings-page.spec.ts`
- `tests/e2e/settings-flow.spec.ts`
- `docs/tasks/phase-13-bulk-cover-enrichment/index.md`
- `docs/TASKS.md`
- `CONTEXT.md`
- `docs/DESIGN_SYSTEM.md`
- `README.md`
- `README.es.md`

---

## 2. Technical Objectives

1. **Settings Page Integration (`src/app/features/settings/pages/settings-page/`):**
   - Import and render `<app-cover-enrichment-section id="cover-enrichment-section" (coversUpdated)="refreshStorageBreakdown()" />` right below `<app-data-portability-section>` in `settings-page.html`.
   - Connect `(requestCoverEnrichment)` from `<app-data-portability-section>` to smoothly scroll/focus `#cover-enrichment-section`.
   - Update `settings-page.spec.ts` to verify that `CoverEnrichmentSectionComponent` renders and triggers storage breakdown refresh when covers are enriched.
2. **Playwright End-to-End Tests (`tests/e2e/settings-flow.spec.ts`):**
   - Add E2E scenario verifying:
     - Importing a JSON backup containing books without covers (1 with valid ISBN, 1 without ISBN).
     - Seeing the post-import missing-cover notification and triggering **Strict ISBN Cover Enrichment** (with intercepted Open Library bibkey + cover image routes).
     - Verifying the verification report for unmatched/missing-ISBN books and resolving the remaining book via the **Step-by-Step Visual Cover Assistant** (and verifying zero horizontal overflow at `320px`).
3. **Tier 2 Per-Phase Documentation Synchronization & Branch Hygiene:**
   - Mark all Phase 13 tasks `[x]` (`Status: Completed`) in `docs/tasks/phase-13-bulk-cover-enrichment/index.md` and move Phase 13 to `Completed Phases` in `docs/TASKS.md`.
   - Update `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md`.
   - Integrate `feature/13-bulk-cover-enrichment` into `develop`, push `origin/develop`, and clean up the feature branch per `AGENTS.md` Rule 2.5.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/settings/pages/settings-page/settings-page.spec.ts`
- [x] `npm run verify:quiet`
- [x] `npm run test:e2e`
