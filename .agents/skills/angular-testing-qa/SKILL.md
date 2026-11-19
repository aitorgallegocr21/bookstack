---
name: angular-testing-qa
description: On-demand Vitest + Angular TestBed recipes, fake-indexeddb isolation patterns, single-file test runner usage, and Playwright E2E viewport/flow checklists. Activate when writing or debugging complex unit, component, or E2E specs.
---

# Angular Testing & QA Recipes (On-Demand Reference)

> Core testing mandates are already loaded in `AGENTS.md`. Use this skill for test recipes and isolation patterns.

## 1. Fast Iterative Execution (Token-Saving Commands)

- **Single Spec Run:** `npm run test:file -- src/app/path/to/target.spec.ts` (runs in ~1s with `--no-progress`).
- **Pre-Commit Gate:** `npm run verify:quiet` (auto-fixes Prettier/ESLint, runs `check` + `lint` + `format` + `test` + `build` with 6-line output).
- **Single E2E Spec:** `npx playwright test tests/e2e/<spec>.spec.ts`.

## 2. Vitest + Angular TestBed Isolation Patterns

- **Storage & IndexedDB Reset:** `src/test-setup.ts` loads `fake-indexeddb/auto` and mocks `window.matchMedia`. In specs touching persistence, clear `localStorage.clear()` and reset service signals in `beforeEach`.
- **Router & Signals in Components:**
  - Provide `provideRouter([])` in `TestBed.configureTestingModule` when testing components with `RouterLink`/`RouterOutlet`.
  - Use `fixture.componentRef.setInput('propName', value)` for `input()` signals, followed by `fixture.detectChanges()` and `await fixture.whenStable()`.
- **Modal & A11y Assertions:** Verify `aria-label` / `aria-expanded`, `Escape` key dispatch (`new KeyboardEvent('keydown', { key: 'Escape' })`), and `document.body.classList.contains('overflow-hidden')`.

## 3. Playwright E2E Verification Matrix (`tests/e2e/`)

- **Zero-Overflow Check:** Assert `document.documentElement.scrollWidth <= window.innerWidth` across `375px`, `390px`, `768px`, and `1280px`.
- **Bilingual / Default Locale Awareness:** The app boots in Spanish (`es`) by default; prefer resilient `data-testid`, role, or structural selectors over brittle hardcoded text when possible.
