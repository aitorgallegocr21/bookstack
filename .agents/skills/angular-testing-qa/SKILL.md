---
name: angular-testing-qa
description: Vitest unit/component testing and Playwright E2E testing conventions, regression test mandates, and deterministic mocking patterns for BookStack.
---

# Angular Testing & QA Gate Skill

This skill enforces BookStack's mandatory testing standards: every new capability requires unit/component tests, every bug fix requires a regression test, and all UI/navigation flows require Playwright E2E coverage.

---

## 1. Mandatory Testing Rules

1. **Test-Per-Feature:** No feature or service method is complete without unit tests verifying happy paths, edge cases, and error states.
2. **Regression-Per-Bug:** Every defect fix must be accompanied by a unit, component, or E2E test that reproduces the exact bug scenario and prevents regressions.
3. **E2E UI Gate:** Changes to routes, shell navigation, responsive breakpoints, themes, or modal workflows must update and pass Playwright specs in `tests/e2e/`.
4. **Zero Relaxed Assertions:** Never weaken assertions, skip failing tests (`it.skip` / `describe.skip`), or bypass `npm run verify`.

---

## 2. Vitest + Angular TestBed Conventions

- **Test Runner:** `@angular/build:unit-test` backed by **Vitest** and **jsdom** (`npm test`).
- **Environment Safety (`src/test-setup.ts`):**
  - Ensure `window.matchMedia` is deterministically mocked in jsdom so `ThemeService` and responsive queries never fail unexpectedly.
  - Use `fake-indexeddb/auto` when testing `StorageAdapterService` or persistence flows, and reset `localStorage` and IndexedDB stores in `beforeEach` / `afterEach`.
- **Component Testing (`TestBed`):**
  - Provide `provideRouter([])` for components using `RouterLink` / `RouterOutlet`.
  - Test signal updates using `fixture.detectChanges()` and `await fixture.whenStable()`.
  - Verify ARIA attributes (`aria-label`, `aria-pressed`), keyboard events (`Escape`), and body class side effects (`overflow-hidden`).

---

## 3. Playwright E2E Conventions (`tests/e2e/`)

- **Resilient Browser Resolution:** `playwright.config.ts` resolves system Chrome/Chromium locally (`PLAYWRIGHT_CHROME_PATH`, `/usr/bin/google-chrome`, `/usr/bin/chromium`) and defaults to Playwright-managed Chromium in GitHub Actions CI.
- **Zero-Overflow Matrix:** Every route (`/`, `/books`, `/stats`, `/settings`, `/about`) must be tested at `375px`, `390px`, `768px`, and `1280px` ensuring `document.documentElement.scrollWidth <= window.innerWidth`.
- **Interactive Flows:** Verify create/edit/detail/delete book flows, reading log progress recalculation, dark/light theme persistence across reloads, and sidebar collapse persistence.
