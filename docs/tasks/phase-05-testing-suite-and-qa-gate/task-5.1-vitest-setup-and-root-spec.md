# Task 5.1: Vitest Environment Setup & Root Shell Spec

**Status:** Completed  
**Phase:** `phase-05-testing-suite-and-qa-gate`

## Objective

Configure deterministic browser API mocks in Vitest (`jsdom`) and replace the broken Angular starter test in `src/app/app.spec.ts`.

## Checklist

- [x] Add `src/test-setup.ts` (configured via `angular.json` `test` builder `setupFiles` if supported, or Vitest config) with `fake-indexeddb/auto` and `window.matchMedia` mock.
- [x] Update `src/app/app.spec.ts` with `provideRouter([])` and assertions verifying `<app-sidebar>`, `<app-header>`, `<router-outlet>`, `<app-bottom-nav>`, and conditional `<app-book-create-modal>`.
- [x] Confirm `npm test` executes cleanly and passes.
