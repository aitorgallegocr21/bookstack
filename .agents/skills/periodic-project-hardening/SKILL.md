---
name: periodic-project-hardening
description: On-demand 8-pillar project health audit, token-efficiency remediation, performance/IndexedDB/PWA/security hardening, and Clean Architecture consolidation protocol. Activate whenever the user requests a periodic project hardening phase, post-milestone stabilization sweep, or general codebase audit after completing several feature phases.
---

# Periodic Project Hardening & Consolidation Protocol (On-Demand Reference)

> **Mission:** After developing several feature phases (e.g., every 4–6 phases, or whenever explicitly requested by the user), execute a deterministic, token-efficient **Project Hardening & Consolidation Sweep** (modeled after `Phase 12` and its post-phase security/asset hardening commits). This protocol scales dynamically to any codebase size, any number of routes/domains, and any project maturity stage.

---

## 1. Low-Token Static Diagnostic Sweep (Run First — Never Read Files Blindly)

Before reading full source files or proposing tasks, run **one consolidated, low-token shell diagnostic command** via `run_command` to map the exact state of the codebase across all 8 pillars:

```bash
# 1. File size & token monolith radar (flag TS/HTML/MD files > 350 lines)
find src docs -type f \( -name "*.ts" -o -name "*.html" -o -name "*.md" \) ! -name "*.spec.ts" | xargs wc -l | sort -nr | head -n 25

# 2. Clean Architecture boundary & convention radar
grep -rn "from '.*features/" src/app/core/ src/app/shared/ || true
find src/app -name "*.component.ts" -o -name "*.component.html" -o -name "*.component.spec.ts"

# 3. Runtime performance & anti-pattern radar
grep -rn "new Intl\." src/app/ || true
grep -rn "transition-all" src/ || true
grep -rn "BehaviorSubject\|@HostBinding\|@HostListener\|\*ngIf\|\*ngFor\|ngClass\|ngStyle" src/app/ || true
grep -rn "any" src/app/ --include="*.ts" | grep -v "spec.ts" || true

# 4. Security, Zod schema bounds & CSP radar
grep -rn "z\.string()\|z\.array(" src/app/ --include="*.schema.ts" || true
npm audit --audit-level=moderate || true
```

Use the output of this 1-turn diagnostic to read **only** the specific line ranges (`StartLine`/`EndLine`) that require attention.

---

## 2. The 8 Mandatory Audit & Hardening Pillars

Every Periodic Hardening Sweep MUST evaluate the entire application (especially domains added since the last hardening phase) against these 8 pillars:

### Pillar 1: AI Token Hygiene, Monolith Splitting & Tooling Speed (Always Task X.1)

- **Rule of Token-First Ordering:** If the diagnostic flags any source file, i18n dictionary, or documentation file exceeding **350–450 lines** that agents frequently inspect, **Task X.1 MUST split it into domain modules first** so every subsequent task in the phase consumes 70–85% fewer read/edit tokens.
- **Verification Gate Caching:** Verify `scripts/verify-quiet.mjs` covers all new directories, uses `--cache` for ESLint/Prettier, type-checks unit + E2E specs, and emits minimal console output.
- **Context Map Precision:** Audit `CONTEXT.md` Section 3 line pointers (`L1-XX`) against actual `wc -l` counts and remove stale or duplicated prose between `AGENTS.md`, `CONTEXT.md`, and `.agents/skills/`.

### Pillar 2: Legal, Privacy, Security, CSP & Zod Bounds Hardening

- **`/about` & Transparency Parity:** Ensure `/about` accurately reflects every new feature added in recent phases, strictly distinguishing 100% local `IndexedDB`/`LocalStorage` storage from any opt-in external network calls (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`), hardware permissions (camera/file inputs gated behind explicit user consent), MIT license, warranty/backup disclaimers, and third-party API attributions.
- **Strict Zod Schema Bounds (`*.schema.ts`):**
  - Every `z.string()` MUST enforce explicit `.max(...)` character bounds (e.g., IDs $\le 128$, titles/names $\le 300\text{–}500$, notes $\le 5,000\text{–}20,000$, base64 covers $\le 500,000$).
  - Every `z.number()` MUST enforce realistic `.min(...)` and `.max(...)` bounds (e.g., pages $\le 100,000$, years $\le 2100$).
  - Every `z.array()` in persistence/backup schemas MUST enforce `.max(...)` collection caps (e.g., `MAX_BACKUP_RECORDS = 25_000`) to prevent memory exhaustion / DoS on malformed imports.
- **Input, File & Media Pipeline Guards:**
  - Verify `isSafeCoverUrl` rejects `http://`, `javascript:`, `data:text/html`, and `data:image/svg+xml` (allowing only `https://` and raster `data:image/(webp|jpeg|jpg|png|gif|avif);base64,`).
  - Verify remote/local image pipelines (`ImageOptimizerService`) enforce `AbortController` timeouts (`6000ms`), byte-length limits (`MAX_REMOTE_IMAGE_BYTES`), MIME whitelist verification, and graceful fallback when CORS blocks canvas re-encoding.
  - Verify file import flows (`DataPortabilitySection` / `DataPortabilityService`) enforce file size caps (`MAX_BACKUP_FILE_BYTES`), explicit `.json`/`.csv` extension checks, and mandatory CSV header validation before parsing rows.
  - Verify Content Security Policy (`CSP`) in `src/index.html` and dependency health (`npm audit`).

### Pillar 3: Local-First PWA, Offline App Shell & Brand Asset Parity

- **Service Worker & Manifest (`ngsw-config.json` & `public/manifest.webmanifest`):** Verify all lazy route chunks, fonts, and static assets are covered by the offline app shell cache while external API URLs remain uncached.
- **Brand Assets & Cache Busting:** Verify `public/favicon.svg`, `public/favicon.ico`, manifest icons, and `src/index.html` links (`?v=...`) match BookStack's visual identity (zero residual default framework placeholders).

### Pillar 4: IndexedDB ACID Resilience, Batch Writes & Cross-Service Portability Sync

- **Connection Lifecycle & ACID Durability:** Ensure `StorageAdapterService` handles `db.onclose` / `db.onversionchange`, resolves writes on `transaction.oncomplete`, and provides single-transaction batch operations (`putMany<T>`).
- **Batch Mutations (1 Transaction + 1 Signal Emission):** Audit all bulk operations across feature services (e.g., bulk linking, batch status updates, multi-record imports). Never loop sequential `await storage.set()` or trigger $N$ intermediate Signal updates; use batch methods (`updateMany`, `putMany`) so bulk changes execute in **1 IndexedDB transaction and 1 Signal emission**.
- **Cross-Domain Portability & Reset Sync (`DataPortabilityService`):**
  - Check **every stateful domain service** created in recent phases (e.g., `BooksService`, `ReadingLogService`, `SeriesService`, and any future domain stores).
  - Verify that JSON Backup Export, JSON/CSV Import (`Merge` & `Overwrite`), Storage Quota Byte Breakdown (`computeStorageBreakdown()`), and Danger Zone Factory Reset synchronize **both** IndexedDB stores **and** all in-memory service Signals live without requiring a page reload.
- **Bounded In-Memory Caches:** Ensure any service holding session caches (e.g., lookup/search caches) enforces an explicit LRU or max-entry eviction policy (e.g., 50 entries).

### Pillar 5: Runtime Algorithmic Efficiency ($O(N)$ Single-Pass Engines & Memoization)

- **Memoized `Intl.*` Formatters:** Never instantiate `new Intl.DateTimeFormat`, `new Intl.NumberFormat`, or `new Intl.Collator` inside component methods, `computed()` signals, or array `.map()`/`.sort()` loops. Route all formatting/collation through memoized factory helpers in `src/app/core/utils/date-formatter.ts`.
- **Single-Pass $O(N)$ Domain Aggregations:** Audit all `computed()` signals in domain/analytics/filter services. Collapse chained `.filter().map().reduce()` multi-pass scans over books/logs/series into single-pass `for (const item of items)` loops, hoist string normalization (`.trim().toLowerCase()`) outside loops, and precompute sort keys (Schwartzian transform) when sorting large collections.
- **Structural Signal Equality (`equal`):** Add custom `equal` comparators to derived summary/counter `computed()` signals (e.g., status counts, KPI summaries) so reference rotations with identical values do not trigger downstream template re-renders.

### Pillar 6: Bundle Splitting (`@defer`), Budgets & Render Micro-Optimizations

- **`@defer` Secondary Modals & Heavy Overlays:** Audit every route page (`DashboardPage`, `BooksPage`, `SeriesPage`, `StatsPage`, `SettingsPage`, and new routes). Any secondary modal, editor, or heavy sub-tree not visible on first paint MUST be wrapped in `@defer (when ...)` so its dependencies split out of the initial route chunk.
- **Discrete CSS Transitions & Media Loading:** Eliminate any `transition-all` in favor of discrete properties (`transition-colors`, `transition-[width]`, `transition-[grid-template-rows]`, `transition-transform`). Ensure all dynamic/cover `<img>` tags include `loading="lazy" decoding="async"`.
- **Bundle Budget Tightening:** Inspect production build output (`npm run verify:quiet`) and keep `angular.json` bundle budgets aligned with actual optimized chunk sizes.

### Pillar 7: Clean Architecture Boundaries, Shared Layer & Modern Conventions

- **Zero Dependency Inversion:** `src/app/core/` and `src/app/shared/` MUST NEVER import from `src/app/features/`. Shared cross-feature UI contracts belong in `core/models/` or `shared/`.
- **DRY Extraction (`src/app/shared/`):** Extract duplicated display helpers, badge formatters, or pure utilities shared by 2+ features into `src/app/shared/utils/` or `src/app/shared/components/`.
- **Unified Angular 22+ Naming & Invariants:** Ensure 100% suffixless component filenames (`*.ts`, `*.html`, `*.spec.ts` — zero legacy `.component.*` files), `ChangeDetectionStrategy.OnPush`, native `@if`/`@for`/`@switch`, `inject()`, and `host: { ... }` metadata.

### Pillar 8: Regression Coverage & Documentation Parity (Tier-2 Sync)

- **Unit & Playwright E2E Regression Specs:** Every hardened edge case, batch transaction, security guard, consent gate, or cross-service sync fix MUST include a targeted unit spec (`*.spec.ts`) and/or Playwright E2E regression test (`tests/e2e/*.spec.ts`).
- **Full Tier-2 Sync:** Update `CONTEXT.md` (with exact new line numbers), `docs/TASKS.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md`.

---

## 3. Execution Modes (How to Apply This Protocol)

When the user asks to apply the periodic hardening process, determine whether they want a **Full Hardening Phase** or an **Immediate Post-Phase Hardening Pass**:

### Mode A: Full Hardening Phase (`Phase XX: Performance, Architecture & Security Hardening`)

Use when 3+ feature phases have accumulated since the last hardening phase:

1. Run the **Section 1 Low-Token Static Diagnostic Sweep** first.
2. Present a concise summary of findings grouped by the 8 Pillars (or conduct a brief `/grill-me` interview in Spanish via `ask_question` if architectural trade-offs need user alignment).
3. Generate `docs/tasks/phase-XX-<name>/index.md` and atomic `task-X.Y-*.md` specs ordered **Token-First** (Task X.1 = Token Hygiene & Monolith Splitting $\to$ Security/Legal/Schemas $\to$ PWA/Assets $\to$ IndexedDB/Portability $\to$ $O(N)$ Runtime $\to$ `@defer` Bundle Splitting $\to$ Clean Architecture $\to$ Regression E2E & Tier-2 Sync).
4. Include exact `## Target Files & Line Pointers` in every `task-X.Y-*.md` file.

### Mode B: Immediate Post-Phase Hardening Sweep (Direct Execution)

Use when the user asks to directly audit and fix remaining rough edges right after finishing a phase:

1. Run the **Section 1 Low-Token Static Diagnostic Sweep**.
2. Group fixes into logical, atomic commits (`refactor`, `perf`, `fix`, `chore(security)`, `test`) following the 5-Step Iteration Loop (`Targeted Edit + Unit/Regression Spec` $\to$ `npm run verify:quiet` / `npm run test:e2e:quiet` $\to$ `Semantic Commit`).
3. Keep `CONTEXT.md` line pointers and Tier-2 documentation synchronized.
