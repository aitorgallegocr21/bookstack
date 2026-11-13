---
name: bookstack-architecture-workflow
description: On-demand code recipes for Angular 22+ Signals, Zod runtime schemas, IndexedDB StorageAdapter patterns, i18n dictionary extension, and Two-Tier documentation sync. Activate only when implementing new services, schemas, or phase-end syncs.
---

# BookStack Architecture Recipes (On-Demand Reference)

> Core invariants are already loaded in `AGENTS.md`. Use this skill strictly for implementation patterns and checklists.

## 1. Signal Service & Zod Persistence Pattern

- **State Exposure:** Hold private mutable state (`private readonly _items = signal<T[]>([])`) and expose `readonly items = this._items.asReadonly()` plus `computed()` projections.
- **Zod Boundary:** Parse every `StorageAdapterService` read or external import with `safeParse()` before writing into signals. Filter or reject invalid records without throwing unhandled exceptions.
- **Cover URL Guard:** Always validate external/data cover URLs via `isSafeCoverUrl` (`src/app/features/books/schemas/book.schema.ts`) to block `javascript:` and `data:text/html` payloads.

## 2. Adding i18n Keys Checklist

When adding UI copy:

1. Add the typed key contract to `src/app/core/i18n/i18n.types.ts`.
2. Add the Spanish default string in `src/app/core/i18n/es.ts`.
3. Add the English mirror string in `src/app/core/i18n/en.ts`.
4. Format dates/months exclusively via `src/app/core/utils/date-formatter.ts`.

## 3. Two-Tier Documentation Sync Checklist

- **Intermediate Subtask (`Task X.Y`):**
  - [ ] Mark `[x]` on the task in `docs/tasks/phase-XX-<name>/index.md`.
  - [ ] Update `CONTEXT.md` Section 3 ONLY if a new file/directory or service contract was introduced.
- **Final Task of a Phase (`Phase XX Complete`):**
  - [ ] Set `**Status:** Completed` in `docs/tasks/phase-XX-<name>/index.md`.
  - [ ] Move the phase from `Active Phase` to `Completed Phases` in `docs/TASKS.md` and promote the next phase to `Active Phase`.
  - [ ] Synchronize feature summaries in `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md`.
