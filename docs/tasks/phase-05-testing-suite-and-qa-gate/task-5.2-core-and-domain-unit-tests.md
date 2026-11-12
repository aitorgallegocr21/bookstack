# Task 5.2: Unit Tests for Core, Schemas & Domain Services

**Status:** Completed  
**Phase:** `phase-05-testing-suite-and-qa-gate`

## Objective

Achieve thorough unit test coverage for all utilities, Zod validation schemas, core services, and book domain services.

## Checklist

- [x] Write `src/app/core/services/theme.service.spec.ts` (including missing `matchMedia` regression test).
- [x] Write `src/app/core/services/ui-state.service.spec.ts` (including corrupted `localStorage` JSON regression test).
- [x] Write `src/app/core/services/storage-adapter.service.spec.ts` (IndexedDB CRUD, LocalStorage fallback, `QuotaExceededError` handling).
- [x] Write `src/app/core/i18n/i18n.service.spec.ts` and `src/app/core/utils/date-formatter.spec.ts`.
- [x] Write `src/app/features/books/schemas/book.schema.spec.ts` (valid/invalid Book and ReadingLog payloads).
- [x] Write `src/app/features/books/services/books.service.spec.ts`, `reading-log.service.spec.ts`, `reading-stats.service.spec.ts` (including chronological month sorting regression), and `image-optimizer.service.spec.ts`.
