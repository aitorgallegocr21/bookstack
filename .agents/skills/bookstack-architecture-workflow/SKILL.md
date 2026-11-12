---
name: bookstack-architecture-workflow
description: Enforce Angular 22+ Signals architecture, Local-First IndexedDB persistence, Zod runtime validation, i18n readiness, and continuous English documentation sync across BookStack.
---

# BookStack Architecture & Workflow Skill

This skill guides AI agents and engineers working on BookStack to preserve architectural consistency, strict TypeScript/Angular standards, Local-First data integrity, and synchronized English documentation.

---

## 1. Golden Architectural Principles

### A. Domain Single Source of Truth (SSOT)

- **Contracts:** All book, reading log, series, and analytics models live in `src/app/features/books/models/book.model.ts`.
- **Runtime Validation:** Persistent records loaded from `IndexedDB`/`LocalStorage` or external JSON imports must be validated with **Zod** schemas (`src/app/features/books/schemas/`) before entering signal state.
- **Strict Typing:** Zero `any`, zero non-null assertions without guards, and zero `// TODO` placeholders.

### B. i18n-Ready Copy Separation

- **Default Active Locale:** Spanish (`es`).
- **Centralized Dictionaries:** UI labels, navigation items, status labels, validation messages, and confirmation prompts must be resolved via `I18nService` (`src/app/core/i18n/`) instead of scattering inline strings across templates and services.
- **Locale Formatting:** All dates and numbers displayed to users must pass through `src/app/core/utils/date-formatter.ts` using the active locale (`es-ES` by default).
- **Engineering Language:** All code identifiers, comments, JSDoc, error logs, tests, commit messages, and documentation must remain strictly in **English**.

### C. Angular 22+ Signal-First Standards

- **Components:** Standalone + `ChangeDetectionStrategy.OnPush`.
- **State:** `signal()`, `computed()`, and `effect()` only. Never introduce RxJS `BehaviorSubject` or `from(...).subscribe(...)` for local state management.
- **Signals API:** Use `input()`, `output()`, `model()`, and `viewChild()` instead of legacy `@Input`, `@Output`, and `@ViewChild` decorators.
- **DI & Host Bindings:** Use `inject()` instead of constructor parameters, and `host: { ... }` instead of `@HostBinding`/`@HostListener`.
- **Control Flow & Bindings:** Always use `@if`, `@for (track ...)`, `@switch`, `[class]`, and `[style]`. Never use `*ngIf`, `*ngFor`, `ngClass`, or `ngStyle`.

### D. Local-First Persistence & Image Pipeline

- **Storage Strategy:** `StorageAdapterService` (`src/app/core/services/storage-adapter.service.ts`) uses `IndexedDB` (`bookstackDB`) as primary storage and falls back to `LocalStorage` only when `IndexedDB` is unavailable or fails—never blindly duplicating base64 payloads into `LocalStorage` on every write.
- **Quota Resilience:** Catch `QuotaExceededError` cleanly and surface boolean/typed failures without crashing the UI.
- **Bidirectional Reading Deltas:** Adding, editing, or deleting a `ReadingLog` automatically recalculates `Book.currentPage` and transitions `Book.status` (`pending` $\to$ `reading` $\to$ `completed`).
- **Cover Compression:** All uploaded covers pass through `ImageOptimizerService` (max `400px`, WebP/JPEG at `0.75` quality) before storage.

---

## 2. Verification & Documentation Synchronization

Before finishing any task or committing:

1. Run `npm run verify` (`check` + `lint` + `format` + `test` + `build`).
2. Run `npm run test:e2e` whenever routes, shell layout, modals, or multi-step flows change.
3. **Continuous Zero-Loss Rule:**
   - Update the active task checklist (`[x]`) in `docs/tasks/<phase>/`.
   - Update `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md` whenever architecture, routes, design tokens, dependencies, or commands change.
   - Upon finishing a phase, move it to `Completed Phases` in `docs/TASKS.md` and update the phase `index.md`.
4. **Git Discipline:** Work on feature/fix branches created from `develop`; merge locally into `develop` after verification; open GitHub Pull Requests from `develop` into `main`.
