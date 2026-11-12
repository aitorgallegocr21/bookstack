# Task 4.2: Core Services, Storage Optimization & Zod Schemas

**Status:** Completed  
**Phase:** `phase-04-core-hardening-and-i18n`

## Objective

Fix Clean Architecture layering, storage quota overhead, async initialization race conditions, environment guards, and runtime schema validation.

## Checklist

- [x] Move `StorageAdapterService` from `features/books/services/` to `src/app/core/services/storage-adapter.service.ts` so `UiStateService` no longer depends on a feature module.
- [x] Stop duplicating every IndexedDB write into `localStorage`; use `localStorage` strictly as fallback when `indexedDB` is unavailable or fails.
- [x] Create `src/app/features/books/schemas/book.schema.ts` with Zod schemas for `Book` and `ReadingLog` to validate records loaded from browser storage.
- [x] Guard `window.matchMedia` availability in `ThemeService.initializeTheme()` and `JSON.parse` in `UiStateService.getInitialValue()`.
- [x] Refactor `BooksService` and `ReadingLogService` to use `inject()` and a single async `ensureInitialized()` flow without RxJS `from().subscribe()`.
- [x] Sort `ReadingStatsService.monthlyPages` chronologically by `YYYY-MM`.
