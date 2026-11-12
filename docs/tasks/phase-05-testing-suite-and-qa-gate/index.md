# Phase 05: Comprehensive Test Suite (Vitest + Playwright E2E)

**Status:** Completed  
**Target Branch:** `refactor/engineering-baseline` $\to$ `develop`  
**Core Mission:** Establish deterministic unit, component, regression, and browser E2E test coverage across all existing BookStack features so every future phase ships with automated quality verification.

---

## 1. Task Breakdown

- [x] **[Task 5.1: Vitest Environment Setup & Root Shell Spec](task-5.1-vitest-setup-and-root-spec.md)** — Configure `src/test-setup.ts` (`matchMedia` mock, `fake-indexeddb/auto`, storage reset) and replace the broken starter `app.spec.ts` with real `App` shell verification.
- [x] **[Task 5.2: Unit Tests for Core, Schemas & Domain Services](task-5.2-core-and-domain-unit-tests.md)** — Write unit tests for `ThemeService`, `UiStateService`, `I18nService`, `date-formatter`, `StorageAdapterService`, `ImageOptimizerService`, `BooksService`, `ReadingLogService`, `ReadingStatsService`, and Zod schemas.
- [x] **[Task 5.3: Component & Modal Regression Tests](task-5.3-component-and-modal-tests.md)** — Test `SidebarComponent` (tablet `md:flex` regression), `HeaderComponent`, `BottomNavComponent`, `DashboardPage`, `BooksPage`, and the 4 modals (`Escape` close + `overflow-hidden` scroll-lock regression).
- [x] **[Task 5.4: Playwright E2E Suite & Full Verification Gate](task-5.4-playwright-e2e-and-final-verify.md)** — Create `playwright.config.ts` and E2E specs (`overflow.spec.ts` across 375/390/768/1280px, navigation/theme persistence, and books + reading log flows), then pass `npm run verify` and `npm run test:e2e`.
