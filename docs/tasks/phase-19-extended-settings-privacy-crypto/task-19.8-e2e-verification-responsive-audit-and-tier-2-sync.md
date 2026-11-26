# Task 19.8: Playwright E2E Suite, Responsive Audit (`320px`–`1280px`) & Tier 2 Docs Sync (`v2.5.0`)

## Objective

Validate the entire Phase 19 Settings Control Center end-to-end across desktop and mobile viewports (`320px`, `375px`, `1280px`), confirm zero regressions across all existing suites, bump the semantic version to `2.5.0`, and execute the mandatory Tier 2 Per-Phase Documentation Sync and branch integration.

---

## Target Files & Line Pointers

- **Read & Edit:**
  - `tests/e2e/settings-flow.spec.ts` (`L1-L1015` — update existing `/settings` selectors for the new 5-tab layout and add comprehensive E2E scenarios for Phase 19)
  - `tests/e2e/overflow.spec.ts` (verify zero horizontal overflow across all 5 `/settings?tab=...` views at `320px` and `375px`)
  - `package.json` & `package-lock.json` (bump version `2.4.0` $\to$ `2.5.0` via `npm version 2.5.0 --no-git-tag-version`)
  - `docs/tasks/phase-19-extended-settings-privacy-crypto/index.md` (mark all tasks `[x]` and `Status: Completed`)
  - `docs/TASKS.md` (move Phase 19 to `Completed Phases (Archive & Changelog)` with `v2.5.0`)
  - `docs/ROADMAP.md` (mark Phase 19 as `Completed`)
  - `CONTEXT.md` (update Semantic Source Map with new `AppPreferencesService`, settings section components, and `backup-crypto.utils.ts`)
  - `docs/DESIGN_SYSTEM.md` (document Master-Detail Settings shell & `data-reduced-motion` tokens)
  - `README.md` & `README.es.md` (add Phase 19 features: 5-category Settings hub, 100% Offline Mode, AES-GCM-256 encrypted backups, persistent storage safeguard, and advanced diagnostics)

---

## Functional & Technical Requirements

1. **Playwright E2E Scenarios (`tests/e2e/settings-flow.spec.ts`):**
   - **Master-Detail Navigation & URL Sync:** Switch across all 5 tabs on desktop (`1280×800`) and mobile (`375×812`), verify `?tab=` query param updates, reload `/settings?tab=privacy` and confirm direct deep-link hydration.
   - **Instant Settings Search:** Type `"offline"` / `"cifrado"` in the search bar, click result, verify tab switches and target control scrolls into view.
   - **Appearance & Catalog Defaults Persistence:** Toggle Adaptive Cover Tinting & Reduced Motion (`data-reduced-motion="reduce"`), change Default Format/Status in `?tab=catalog`, open Create Book modal and assert defaults are pre-selected.
   - **100% Offline Mode Enforcement:** Enable 100% Offline Mode in `?tab=privacy`, open Book Metadata Lookup, verify offline banner appears and zero external network requests are fired.
   - **Encrypted Backup Round-Trip:** Export an encrypted JSON backup with a password, clear/reset library, import the encrypted file, verify wrong password shows an error, then enter the correct password and confirm full restoration.
   - **Selective Resets & Diagnostics:** Trigger "Reset Preferences Only" while a book exists and confirm the book survives while preferences reset; trigger anonymous Diagnostic JSON export.
   - **Zero Horizontal Overflow:** Assert `scrollWidth <= clientWidth` across all 5 tabs at `320px` and `375px`.
2. **Verification Gate:**
   - Run `npm run verify:quiet` (must pass `check` + `lint` + `format` + `test` + `build`).
   - Run `npm run test:e2e` (all Playwright specs passing).
3. **Version Bump & Tier 2 Sync:**
   - Bump to `2.5.0` (`npm version 2.5.0 --no-git-tag-version`).
   - Sync all Tier 2 docs (`index.md`, `TASKS.md`, `ROADMAP.md`, `CONTEXT.md`, `DESIGN_SYSTEM.md`, `README.md`, `README.es.md`).
   - Integrate branch into `develop`, push to `origin/develop`, and execute Autonomous Branch Hygiene cleanup (AGENTS.md Rule 5).

---

## Verification & Acceptance Criteria

- [x] `npm run verify:quiet` passes with 0 errors and 0 warnings.
- [x] `npm run test:e2e` passes 100% of specs including new Phase 19 tests and `320px` overflow checks.
- [x] `package.json` and `package-lock.json` report version `2.5.0`.
- [x] All Tier 2 documentation files are synchronized and clean.
