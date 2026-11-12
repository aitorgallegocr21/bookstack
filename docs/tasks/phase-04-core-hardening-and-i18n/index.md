# Phase 04: Core Hardening, Bug Fixes & i18n Foundation

**Status:** Completed  
**Target Branch:** `refactor/engineering-baseline` $\to$ `develop`  
**Core Mission:** Remediate all static analysis, accessibility, responsive breakpoint, storage, and reactivity defects discovered during the engineering audit, introduce Zod runtime validation for persistent data, and establish an extensible Signal-based `I18nService` foundation keeping Spanish (`es`) active.

---

## 1. Task Breakdown

- [x] **[Task 4.1: Responsive Shell, ESLint A11y & CSS Cleanup](task-4.1-shell-a11y-and-css-cleanup.md)** — Fix `SidebarComponent` tablet breakpoint (`hidden md:flex`), resolve all 10 ESLint/a11y errors (`viewChild()`, `inject()`, label associations, focusable dialog handling, remove `autofocus`), replace `transition-all` with discrete transitions, and remove orphaned `series` placeholder.
- [x] **[Task 4.2: Core Services, Storage Optimization & Zod Schemas](task-4.2-services-storage-and-zod.md)** — Move `StorageAdapterService` to `core/services/`, eliminate duplicate `localStorage` mirroring on IndexedDB writes, add Zod validation schemas (`book.schema.ts`), guard `window.matchMedia` in `ThemeService` and `JSON.parse` in `UiStateService`, remove RxJS `from().subscribe()` init races in `BooksService`/`ReadingLogService`, and sort `ReadingStatsService.monthlyPages` chronologically.
- [x] **[Task 4.3: Signal-Based i18n Architecture & English Codebase Sync](task-4.3-i18n-foundation-and-english-code.md)** — Create `src/app/core/i18n/` (`I18nService`, `es.ts`, `en.ts` dictionary contracts), keep `es` active by default, route UI/confirmation/error copy cleanly, and convert all internal code comments, JSDoc, and developer error logs to English.
