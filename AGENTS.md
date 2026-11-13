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
   - Domain models, status metadata, and rating bounds live in `src/app/features/books/models/book.model.ts` and `catalog-filter.model.ts`.
   - Persistent data structures (IndexedDB / LocalStorage / backups) must be validated at runtime with **Zod** schemas (`src/app/features/books/schemas/`).
   - Strictly **FORBIDDEN** to use `any` (use explicit types, generics, or `unknown`) or leave `// TODO` / mocked implementations.
3. **Two-Tier Documentation Synchronization (Zero Loss + Low Token Overhead):**
   - **Tier 1 — Per-Task Sync (Lightweight):** On completing an atomic task (`Task X.Y`), update ONLY the task checkbox `[x]` in `docs/tasks/phase-XX-<name>/index.md` (and `CONTEXT.md` ONLY if new directories/services were created). Do NOT touch `README*.md`, `docs/TASKS.md`, or `docs/DESIGN_SYSTEM.md` on intermediate subtasks.
   - **Tier 2 — Per-Phase Sync (Milestone Completion):** On completing the final task of a phase, perform the full sync in one batch: move the phase to `Completed Phases` in `docs/TASKS.md`, mark `docs/tasks/phase-XX-<name>/index.md` as `Completed`, and update `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md`.
4. **Mandatory Test-Per-Feature & Regression-Per-Bug Policy:**
   - Every new feature, service method, pipe, or component MUST include unit/component tests (Vitest + Angular TestBed).
   - Every bug fixed MUST include a dedicated **regression test** reproducing the exact defect scenario.
   - UI, navigation, responsive layout, and multi-step user flow changes MUST include or update Playwright E2E tests (`tests/e2e/`).
5. **Dual-Branch Strategy (`main` & `develop`):**
   - `main`: Production release branch deployed to GitHub Pages via verified Pull Requests from `develop`.
   - `develop`: Primary integration branch for daily feature (`feat/*`), fix (`fix/*`), refactor (`refactor/*`), and docs (`docs/*`) work.
6. **Token-Optimized Pre-Delivery Verification Gate:**
   - During single-spec iteration, run `npm run test:file -- <path-to-spec.ts>` instead of the full test suite.
   - Before committing any task, run `npm run verify:quiet` (auto-fixes formatting/lint silently and runs `check` + `lint` + `format` + `test` + `build` with minimal console output, saving ~3,000+ tokens per run).
   - UI/layout/flow changes must also pass `npm run test:e2e`.
7. **Mobile-First Parity & WCAG 2.1 AA:**
   - Preserve zero horizontal overflow down to `320px–375px`, touch targets $\ge 44\times44\text{px}$, `100dvh` viewport safety, and full keyboard/a11y compliance. Activate `.agents/skills/responsive-mobile-design/SKILL.md` only when building complex responsive layouts or modals.
8. **JIT Context & Token Hygiene:**
   - Consult `CONTEXT.md` once for exact file and line pointers (`StartLine`/`EndLine`). Do NOT load `.agents/skills/*/SKILL.md` unless you need their specific boilerplate templates.

---

## 3. Dynamic Model Routing, Subagent Delegation & Quota Optimization

Agents operating in Antigravity MUST actively optimize token consumption and model quota by matching intelligence tiers to task complexity:

1. **Automatic Subagent & Swarm Model Selection:**
   - **Codebase Audits & Multi-File Lookups (`research` subagent):** When a task requires scanning $>4$ files (e.g., auditing i18n keys or tracing usages), delegate via `invoke_subagent(TypeName: "research", Model: "flash" | "flash_lite")` so raw file reads stay isolated from the main conversation context.
   - **Live UI & Viewport Inspection (`browser` subagent):** Always pass `Model: "flash"` when invoking the `browser` subagent.
   - **Isolated Mechanical Subtasks (`self` subagent):** For self-contained mechanical work (e.g., writing bilingual dictionary blocks or repetitive unit test suites from a closed spec), delegate via `invoke_subagent(TypeName: "self", Model: "flash")` or switch worker models via `swarm({ action: "model", model: "..." })` when running in swarm mode.
   - **Architectural & Complex Debugging (`pro` / `inherit`):** Reserve high-reasoning frontier models (`pro` / Gemini 4 Argon / Claude Opus) for `/grill-me` phase design, complex Signal/IndexedDB state coordination, and root-cause debugging.
2. **Proactive Session & Model Guidance:**
   - In standard single-agent chat where the UI selector controls the primary thread model, proactively advise the user in 1 line at phase/task transitions when switching the UI model (e.g., High-Reasoning for `/grill-me` planning $\to$ Fast/Medium for atomic task coding) or running `/compact` will save credits.
   - Recommend starting a fresh chat or running `/compact` after completing each atomic `Task X.Y` to avoid quadratic multi-turn token accumulation.

---

## 4. Mandatory 5-Step Iteration Loop

```text
[Targeted Spec] ➔ [Minimal Code Edit + Tests] ➔ [Validation: npm run verify:quiet] ➔ [Two-Tier Doc Sync] ➔ [Semantic Git Commit]
```

1. **Step 1 (Targeted Spec):** Read only the active `docs/tasks/phase-XX/task-X.Y-*.md` and its targeted source line ranges.
2. **Step 2 (Code + Tests):** Implement modular Angular 22+ Signal changes and test with `npm run test:file -- <spec>`.
3. **Step 3 (Validation):** Run `npm run verify:quiet` (+ `npm run test:e2e` for UI/routing changes).
4. **Step 4 (Two-Tier Doc Sync):** Apply Tier 1 (checkbox only) for intermediate tasks or Tier 2 (full sync) on phase completion.
5. **Step 5 (Git Commit):** Commit using Conventional Commits (`feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`).

---

## 5. Angular 22+ Architecture Invariants

- **Components:** Standalone (`ChangeDetectionStrategy.OnPush`). Native Control Flow (`@if`, `@for (track ...)`, `@switch`); never `*ngIf`/`*ngFor`.
- **Reactivity:** `signal()`, `computed()`, `effect()`, `input()`, `output()`, `model()`, `viewChild()`. No RxJS `BehaviorSubject` for UI/service state; never mutate signals in place.
- **DI & Host:** Always use `inject()` and `host: { ... }` metadata; never `@HostBinding`/`@HostListener`.
- **Styling & Media:** Tailwind CSS v4 utilities with `[class]`/`[style]`; never `ngClass`/`ngStyle` or `transition-all`. Use `loading="lazy" decoding="async"` on dynamic/base64 `<img>` covers.
- **Persistence:** Client `IndexedDB` primary store with safe `LocalStorage` fallback and `QuotaExceededError` handling via `StorageAdapterService`.

---

## 6. Reference Scripts

- `npm run verify:quiet`: **Default agent gate** — auto-fixes format/lint, runs `check` + `lint` + `format` + `test` + `build` with compact 6-line output.
- `npm run verify:fast:quiet`: Fast agent gate without production build.
- `npm run test:file -- <spec-path>`: Run Vitest on a single spec file with zero progress noise.
- `npm run verify` / `npm run verify:fast`: Verbose quality gates used by CI (`ci.yml`).
- `npm run test:e2e`: Run Playwright End-to-End browser tests.
