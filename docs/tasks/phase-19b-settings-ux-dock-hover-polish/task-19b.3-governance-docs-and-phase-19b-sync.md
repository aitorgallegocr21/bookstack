# Task 19B.3: Feature Governance Rules (`AGENTS.md` & `DESIGN_SYSTEM.md`), Full QA Gate & `v2.5.1` Tier 2 Sync

- **Phase:** [Phase 19B (`v2.5.1`)](index.md)
- **Status:** Completed
- **Target Files:**
  - `AGENTS.md` (add Rule 11: Settings Integration & Reduced-Motion Governance for New Features)
  - `docs/DESIGN_SYSTEM.md` (document Reduced-Motion Hover/Effect Gate & `.catalog-card-contain` paint margin + Settings Governance checklist)
  - `package.json` & `package-lock.json` (semantic version bump `2.5.0` → `2.5.1`)
  - `docs/TASKS.md`, `docs/tasks/phase-19b-settings-ux-dock-hover-polish/index.md`, `CONTEXT.md`, `README.md`, `README.es.md`

---

## 1. Requirements

### 1.1 Permanent Feature Governance Rule (`AGENTS.md` Rule 11)

Add **Rule 11 — Settings Integration & Reduced-Motion Governance (Mandatory for Every New Feature)** to `AGENTS.md`:

1. **Settings Relevance Gate:** Before implementing any new user-facing feature, interaction, visual effect, or background capability, explicitly evaluate whether it warrants a user-facing toggle/control in `/settings`. If yes, persist it via `AppPreferencesService` + Zod schema, expose it in the appropriate category tab (`general`, `catalog`, `data`, `privacy`, or `advanced`), register it in `SETTINGS_SEARCH_ENTRIES`, and translate it in `es`/`en` i18n dictionaries.
2. **Reduced-Motion & Preference Compliance Gate:** Every new animation, transition, hover lift/scale transform, color-intensification hover effect, or visual micro-interaction MUST explicitly honor:
   - `html[data-reduced-motion='reduce']` and `@media (prefers-reduced-motion: reduce)` (neutralizing both `animation`/`transition` durations AND jarring `transform` / intense visual hover effects).
   - `adaptiveCoverTint` (falling back to a clean neutral surface when disabled) and `offlineMode` (blocking external network calls when enabled), whenever applicable.

### 1.2 Design System Sync (`docs/DESIGN_SYSTEM.md`)

- Document the updated mobile/tablet `/settings` zero-scroll Adaptive Bento category grid and semantic rose treatment for `Avanzado y sistema`.
- Document the `.catalog-card-contain` paint-margin technique (`padding: 6px 4px 10px; margin: -6px -4px -10px;`) and the `data-book-tint-active` + `reducedMotion` hover contract.
- Include the **New Feature Checklist** referencing Settings integration and Reduced-Motion compliance.

### 1.3 Verification Gate & Tier 2 Release Sync (`v2.5.1`)

- Run `npm version 2.5.1 --no-git-tag-version` to update `package.json` and `package-lock.json`.
- Run `npm run verify:quiet` (must pass all 5 gates: `check`, `lint`, `format`, `test`, `build`).
- Run `npm run test:e2e` (must pass 100% of Playwright E2E specs).
- Complete Tier 2 documentation sync (`docs/TASKS.md`, `index.md`, `CONTEXT.md`, `README.md`, `README.es.md`).

---

## 2. Acceptance Criteria

- [x] `AGENTS.md` contains Rule 11 with clear Settings & Reduced-Motion governance requirements.
- [x] `docs/DESIGN_SYSTEM.md` documents the new hover/containment/Bento patterns and New Feature Checklist.
- [x] `package.json` & `package-lock.json` bumped to `2.5.1`.
- [x] `npm run verify:quiet` and `npm run test:e2e` pass with zero errors.
- [x] Phase 19B marked `Completed` in `docs/TASKS.md` and `index.md`.
