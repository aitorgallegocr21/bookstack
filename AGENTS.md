# AGENTS.md - Project Protocols & Agent Operating System

> 🌐 **Language:** English | [Leer en Español](README.es.md)

## 1. Project Mission

Build and maintain **BookStack**, a minimalist, visual, private, high-performance **Local-First** web application for personal reading tracking, series/saga management, reading session logging, and habit analytics using **Angular 22+**, **TypeScript (strict)**, **Tailwind CSS v4**, **Vitest**, and **Playwright**.

---

## 2. Inviolable Core Rules

1. **English-Only Engineering & Documentation (Strict):**
   - All source code identifiers, comments, JSDoc, error logs, commit messages, PR descriptions, skills, and `docs/` files MUST be written strictly in **English**.
   - End-user UI strings default to **Spanish (`es`)** through the centralized i18n dictionary (`src/app/core/i18n/`), never hardcoded inconsistently across components. `README.es.md` is the sole Spanish documentation mirror.
2. **Single Source of Truth (SSOT) & Strict Typing:**
   - Domain models, status metadata, and rating bounds live in `src/app/features/books/models/book.model.ts`.
   - Persistent data structures (IndexedDB / LocalStorage / future backups) must be validated at runtime with **Zod** schemas (`src/app/features/books/schemas/`).
   - Strictly **FORBIDDEN** to use `any` (use explicit types, generics, or `unknown`) or leave `// TODO` / mocked implementations.
3. **Continuous Documentation & Context Synchronization (Zero Loss of Context):**
   - It is strictly mandatory to update documentation on **EVERY** change made to the codebase.
   - If a change affects architecture, components, inputs/outputs, routes, design tokens, schemas, or npm scripts, immediately update the corresponding docs (`docs/TASKS.md`, `docs/tasks/`, `docs/DESIGN_SYSTEM.md`, `CONTEXT.md`, `README.md`, and `README.es.md`).
   - Never postpone documentation updates. No task or PR is complete without synchronized documentation.
4. **Mandatory Test-Per-Feature & Regression-Per-Bug Policy:**
   - Every new feature, service method, pipe, or component MUST include unit/component tests (Vitest + Angular TestBed).
   - Every bug discovered and fixed MUST include a dedicated **regression test** that verifies the defect does not recur.
   - UI, navigation, responsive layout, and multi-step user flow changes MUST include or update Playwright E2E tests (`tests/e2e/`).
5. **Dual-Branch Strategy (`main` & `develop`):**
   - `main`: Production release branch. Clean, stable, and automatically deployed to GitHub Pages.
   - `develop`: Primary integration and active development branch. All `feat/*`, `fix/*`, `refactor/*`, and `docs/*` branches originate from and merge into `develop`.
   - Merging `develop` into `main` MUST happen via a **GitHub Pull Request** once milestones are fully verified, minimizing redundant CI workflow runs during daily development.
6. **Pre-Delivery Verification Gate:**
   - No task is complete without passing `npm run verify` (`check` + `lint` + `format` + `test` + `build`) with **0 errors and 0 warnings**.
   - UI/layout/flow changes must also pass `npm run test:e2e`.
7. **Mobile-First Parity & WCAG 2.1 AA:**
   - Every visual or interactive change must preserve zero horizontal overflow down to `320px–375px`, touch targets $\ge 44\times44\text{px}$, `100dvh` viewport safety, and full keyboard/a11y compliance. Follow `.agents/skills/responsive-mobile-design/SKILL.md`.
8. **Token & Context Optimization:**
   - Consult `CONTEXT.md` first for Just-In-Time (JIT) file pointers. Read only affected interfaces or targeted line ranges.
   - Keep agent outputs concise and factual, reporting only verified changes and command results.

---

## 3. Mandatory Iteration Workflow

On EVERY task or change executed by an agent, strictly follow this 5-step loop:

```text
[Targeted Spec] ➔ [Minimal Code Edit + Tests] ➔ [Validation: npm run verify] ➔ [Update Docs/Tasks] ➔ [Semantic Git Commit]
```

1. **Step 1 (Targeted Spec):** Read the active task in `docs/tasks/` and define technical intent in 1–2 lines.
2. **Step 2 (Code + Tests):** Implement modular Angular changes and write/update unit, component, or E2E tests.
3. **Step 3 (Validation):** Run `npm run verify` (and `npm run test:e2e` for UI/routing changes) to guarantee zero type, lint, format, test, or build issues.
4. **Step 4 (Docs & Backlog Synchronization):**
   - **Post-Task Audit:** Update task checklist (`[x]`) in `docs/tasks/<phase>/`, and update `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, or `README*.md` if architecture, tokens, routes, or commands changed.
   - **Post-Phase Audit:** On completing a phase, move it to `Completed Phases` in `docs/TASKS.md`, summarize deliverables in the phase `index.md`, and synchronize feature summaries in `README.md` and `README.es.md`.
5. **Step 5 (Git Commit):** Commit following **Conventional Commits**:
   - `feat(scope): ...` — New feature or user-facing capability.
   - `fix(scope): ...` — Bug fix or layout/a11y correction (with regression test).
   - `refactor(scope): ...` — Code restructuring without changing behavior.
   - `test(scope): ...` — Adding or improving unit/component/E2E tests.
   - `docs(scope): ...` — Documentation, specs, or backlog updates.
   - `style(scope): ...` — Formatting or Tailwind/UI token polish.
   - `chore(scope): ...` — Tooling, dependencies, or CI/CD configuration.

---

## 4. Angular 22+ & Architecture Conventions

Follow `.agents/skills/bookstack-architecture-workflow/SKILL.md` for full details:

- **Components:** Standalone by default (`ChangeDetectionStrategy.OnPush`). Use native Control Flow (`@if`, `@for (track ...)`, `@switch`); never `*ngIf` or `*ngFor`.
- **Signals & Reactivity:** Use `signal()`, `computed()`, `effect()`, `input()`, `output()`, `model()`, and `viewChild()`. Never store component state in RxJS `BehaviorSubject` or mutate signals in place.
- **Dependency Injection:** Always use `inject()` instead of constructor parameter injection. Services use `@Injectable({ providedIn: 'root' })`.
- **Host Bindings:** Always use the `host: { ... }` metadata object; never `@HostBinding` or `@HostListener`.
- **Templates & Styling:** Tailwind CSS v4 utilities with native `[class]` and `[style]` bindings; never `ngClass` or `ngStyle`. Never use `transition-all` on layout containers or catalog cards.
- **Images:** Use `loading="lazy"` and `decoding="async"` on all dynamic/base64 `<img>` covers; `NgOptimizedImage` for static local image assets.
- **Local-First Persistence:** All data persists in client `IndexedDB` (with safe fallback to `LocalStorage` and `QuotaExceededError` handling) via `StorageAdapterService`.

---

## 5. Reference Scripts

- `npm run verify`: Full deterministic quality gate (`check` + `lint` + `format` + `test` + `build`).
- `npm run verify:fast`: Quick quality gate (`check` + `lint` + `format` + `test`).
- `npm run dev` / `npm start`: Start local Angular dev server (`ng serve`).
- `npm run check`: Run strict TypeScript checks across `tsconfig.app.json` and `tsconfig.spec.json`.
- `npm run lint` / `npm run lint:fix`: Run ESLint + `angular-eslint` (including template a11y rules).
- `npm run format` / `npm run format:fix`: Check/apply Prettier formatting and Tailwind v4 class sorting.
- `npm test` / `npm run test:watch`: Run Vitest unit & component test suite (`ng test --watch=false`).
- `npm run test:e2e`: Run Playwright End-to-End browser tests.
- `npm run build`: Compile production bundle to `dist/bookstack/browser`.

---

## 6. Autonomous Execution Protocol (Zero-Ambiguity Standard)

When an agent is asked to advance the project (e.g., _"next task"_ or _"execute Phase X"_):

1. **Zero-Ambiguity Principle:** Current state and next action are always determinable from `docs/TASKS.md` and the active phase folder in `docs/tasks/`.
2. **Strict Scope:** Execute the next unchecked task `[ ]` in the active phase without editing unrelated files.
3. **JIT Context:** Inspect `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, and only the specific source/test files touched by the task.
4. **Verify & Sync:** Run `npm run verify` (+ `npm run test:e2e` if UI/routing changed) and update the task file + `docs/TASKS.md` in the same iteration.
5. **Concise Reporting:** Report only modified/created files, observed verification outputs, and commit summary.
