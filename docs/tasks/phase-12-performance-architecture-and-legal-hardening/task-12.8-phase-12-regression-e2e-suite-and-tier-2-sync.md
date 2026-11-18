# Task 12.8: Phase 12 End-to-End Verification, Regression Suite & Tier-2 Documentation Sync

**Phase:** Phase 12: Performance, Caching, Architecture & Legal Hardening  
**Status:** Pending  
**Estimated Impact:** Medium (Adds Playwright E2E and unit regression tests for Phase 12 enhancements, executes full verification gates, and performs Tier-2 Per-Phase documentation synchronization).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `tests/e2e/isbn-lookup-flow.spec.ts` (`L1-150`): E2E tests for ISBN metadata lookup and scanner tab.
- `tests/e2e/navigation-and-theme.spec.ts` (`L1-120`): Navigation and `/about` page assertions.
- `tests/e2e/settings-flow.spec.ts` (`L1-160`): Settings import/export and reset flows.
- `CONTEXT.md` (`L1-115`): Semantic Source Map & ADR pointers.
- `docs/TASKS.md` (`L1-40`): Active vs Completed phases registry.
- `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md`: Project documentation mirrors.

**Files to Create / Update:**

- `tests/e2e/isbn-lookup-flow.spec.ts`
- `tests/e2e/navigation-and-theme.spec.ts`
- `docs/tasks/phase-12-performance-architecture-and-legal-hardening/index.md`
- `docs/TASKS.md`
- `CONTEXT.md`
- `docs/DESIGN_SYSTEM.md`
- `README.md`
- `README.es.md`

---

## 2. Technical Objectives

1. **End-to-End & Regression Test Coverage (`tests/e2e/`):**
   - Update `tests/e2e/navigation-and-theme.spec.ts` to verify that `/about` renders the Privacy & Device Permissions section, MIT License & Legal Notice section, and Open-Source / Third-Party API attributions in both Spanish (`es`) and English (`en`), with zero horizontal overflow at `320px`.
   - Update `tests/e2e/isbn-lookup-flow.spec.ts` to verify the inline external API privacy notice in `BookMetadataLookupComponent` and the pre-permission camera consent gate in `IsbnScannerComponent`.
   - Execute the full unit suite and Playwright E2E suite via `npm run verify:quiet` and `npm run test:e2e:quiet`.
2. **Tier 2 — Per-Phase Documentation Synchronization:**
   - Mark `docs/tasks/phase-12-performance-architecture-and-legal-hardening/index.md` as `Status: Completed` with all tasks `[x]`.
   - Move Phase 12 from `Active Phase` to `Completed Phases` in `docs/TASKS.md`.
   - Synchronize `CONTEXT.md` with the final file names, `src/app/shared/` utilities, `src/app/core/i18n/domains/` slices, and exact line ranges.
   - Update `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md` to reflect Phase 12 offline PWA support, legal/privacy transparency, batch IndexedDB engine, and modular architecture.

---

## 3. Verification Gate

- [ ] `npm run verify:quiet`
- [ ] `npm run test:e2e:quiet`
