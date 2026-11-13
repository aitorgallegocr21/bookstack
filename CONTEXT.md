# CONTEXT.md - BookStack (Single Source of Truth)

## 1. Project Overview & Long-Term Vision

- **Name:** BookStack
- **Purpose:** Minimalist, visual, private, high-performance **Local-First** web application for personal reading tracking, session logging, habit analytics, and private library management.
- **Current Stage (Local-First Priority):** 100% client-side browser execution with local persistence (`IndexedDB` primary store + safe `LocalStorage` fallback) and zero mandatory backend.
- **Long-Term Future Roadmap:** Native **Android client (Kotlin + Jetpack Compose)** and optional **cloud backend for multi-device sync**. Keep domain contracts (`Book`, `ReadingLog`, `ReadingStats`, `ReadingGoals`) purely serializable, UUID-identified, and UTC ISO-8601 timestamped, treating `StorageAdapterService` as the repository boundary.
- **Branching & CI/CD Model:**
  - `develop`: Primary integration branch for daily feature, fix, and refactoring work.
  - `main`: Production branch. Pre-merge quality checks (`ci.yml`) run on `pull_request` to `main`; merging into `main` triggers `deploy.yml` (GitHub Pages deploy) without duplicating test runs.

---

## 2. Technology Stack & Architectural Decision Records (ADR)

1. **Signal-First State (`Angular 22+`):** Standalone `OnPush` components, native `@if`/`@for`/`@defer`, lazy routes (`loadComponent`), and Signals (`signal`, `computed`, `effect`). RxJS subscriptions are forbidden for local state.
2. **Asymmetric Responsive Shell (`Tailwind CSS v4`):**
   - Tablet & Desktop ($\ge 768\text{px}$): Collapsible `SidebarComponent` (`hidden md:flex`, `68px` $\leftrightarrow$ `240px`) persisted via `UiStateService`.
   - Mobile ($< 768\text{px}$): Compact `HeaderComponent` + fixed `BottomNavComponent` (`env(safe-area-inset-bottom)`).
3. **Rendering & Bundle Efficiency:** Discrete CSS transitions (`transition-colors`, `transition-[width]`, `transition-[grid-template-rows]`); `transition-all` is banned. Global `BookCreateModalComponent` loads via `@defer`. Cover images use `decoding="async" loading="lazy"`. Shared modal/form primitives reside in `src/styles.css`.
4. **Client-Side Canvas Cover Optimization:** `ImageOptimizerService` scales and compresses uploaded covers ($\le 400\text{px}$, quality `0.75`, WebP/JPEG fallback) before persistence.
5. **Bidirectional Reading Delta Sync:** Logging, updating, or deleting a `ReadingLog` automatically adjusts `Book.currentPage` and status transitions (`pending` / `reading` / `completed`).
6. **Accessible Modal & Scroll-Lock Discipline:** Modals implement `host: { '(document:keydown.escape)': ... }`, programmatic initial focus via `viewChild()`, and reference-counted scroll locks via `UiStateService.acquireScrollLock()` / `releaseScrollLock()`.
7. **Storage Resilience & Zod Security:** `StorageAdapterService` avoids redundant `localStorage` mirroring on normal IndexedDB writes, traps `QuotaExceededError` safely, persists catalog view/sort preferences in `localStorage`, and pairs with Zod parsers (`isSafeCoverUrl` blocks `javascript:` / `data:text/html`).
8. **Bilingual Signal i18n (`es` default, `en` full mirror):** Resolved via `I18nService` + `Intl.DateTimeFormat` (`date-formatter.ts`).

---

## 3. Semantic Source Map & JIT Line Pointers

Read targeted line ranges (`StartLine`/`EndLine`) using this map; never scan `node_modules`, `dist`, or `playwright-report`:

```text
src/
├── index.html                                 # Document root (<meta name="referrer" content="no-referrer" />)
├── test-setup.ts                              # Global Vitest setup (fake-indexeddb + matchMedia mock)
├── styles.css                                 # Tailwind CSS v4 entry, dark variant & shared modal/form styles
└── app/
    ├── app.config.ts / app.routes.ts          # Root config & lazy routes (/, /books, /stats, /settings, /about)
    ├── app.ts / app.html / app.spec.ts        # Root shell (<app-sidebar>, <app-header>, <main>, <app-bottom-nav>, @defer modal)
    ├── core/
    │   ├── components/{sidebar,header,bottom-nav}/  # Asymmetric shell components
    │   ├── i18n/                              # i18n.types.ts (L1-320), es.ts (L1-328), en.ts (L1-324), i18n.service.ts (L1-49)
    │   ├── services/
    │   │   ├── storage-adapter.service.ts     # L1-246: IndexedDB + LocalStorage fallback + catalog view/sort prefs
    │   │   ├── theme.service.ts               # L1-83: Light/dark theme signal & persistence
    │   │   └── ui-state.service.ts            # L1-46: Sidebar collapse & reference-counted scroll lock
    │   └── utils/date-formatter.ts            # Locale-aware Intl date & month formatters
    └── features/
        ├── dashboard/                         # Home launchpad (/)
        │   ├── pages/dashboard-page/          # Dashboard layout coordinator
        │   └── components/{currently-reading-hero,reading-streak-widget,annual-goal-card,recent-activity-feed}/
        ├── books/                             # Books catalog & reading logs domain (/books)
        │   ├── models/
        │   │   ├── book.model.ts              # L1-185: Book, BookSeries, ReadingLog, ReadingStats, ReadingGoals, StreakInfo
        │   │   └── catalog-filter.model.ts    # L1-51: CatalogViewMode, CatalogSortOption, CatalogFilterState, StatusCounts
        │   ├── schemas/
        │   │   ├── book.schema.ts             # L1-119: BookSchema, ReadingLogSchema, isSafeCoverUrl
        │   │   └── reading-goals.schema.ts    # L1-28: ReadingGoalsSchema
        │   ├── services/
        │   │   ├── books.service.ts           # L1-110: CRUD + persistence orchestration
        │   │   ├── reading-log.service.ts     # L1-83: Session logs + bidirectional page delta sync
        │   │   ├── reading-stats.service.ts   # L1-324: Computed stats, streaks & annual goals progress
        │   │   ├── catalog-filter.service.ts  # L1-377: Omni-search, status/format/rating filters, 7 sorts & view mode state
        │   │   └── image-optimizer.service.ts # L1-100: Canvas WebP/JPEG compression
        │   ├── utils/book-form.utils.ts       # Shared status/autofill/format/rating/series helpers
        │   ├── pages/books-page/              # Catalog coordinator, 3 view modes & zero-match empty state
        │   └── components/{cover-picker,book-create-modal,book-edit-modal,book-detail-modal,reading-log-editor,catalog-toolbar,book-grid-card,book-detailed-card,book-compact-row}/
        ├── analytics/pages/stats-page/        # Analytics view (/stats)
        ├── settings/pages/settings-page/      # Language switcher, settings & future backup hub (/settings)
        └── about/pages/about-page/            # Project info & Local-First manifesto (/about)

tests/e2e/                                     # Playwright specs: overflow, navigation-and-theme, books-flow, dashboard-flow, catalog-flow
scripts/verify-quiet.mjs                       # Token-optimized auto-fix + quiet verification gate
```

---

## 4. Antigravity Token, Quota & Dynamic Model Routing Strategy

To maximize engineering intelligence while minimizing token and credit usage in Antigravity:

| Workflow Scenario                                       | Target Model / Execution Mode                                                            | Why It Saves Quota & Tokens                                                                                   |
| :------------------------------------------------------ | :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Phase Discovery (`/grill-me`) & Architecture Design** | High-Reasoning Primary Model (`pro` / Gemini 4 Argon / Deep Thinking)                    | Resolves edge cases and UX contracts upfront in 1 pass, eliminating expensive code rewrites later.            |
| **Atomic Task Implementation (`task-X.Y.md`)**          | Balanced/Medium Primary Model (`inherit`) + `npm run test:file` + `npm run verify:quiet` | Specs already contain exact file/line pointers; quiet verification saves ~3,000+ console tokens per run.      |
| **Multi-File Codebase Search / Audit**                  | `invoke_subagent(TypeName: "research", Model: "flash" \| "flash_lite")`                  | Isolates bulky file reads in a lightweight subagent context; returns only a compact summary to the main chat. |
| **Boilerplate / i18n Dictionary / Unit Spec Batches**   | `invoke_subagent(TypeName: "self", Model: "flash")` (or `swarm` model switch)            | Offloads deterministic, pattern-following generation to a fast, low-cost model tier.                          |
| **Browser UI / Viewport Inspection**                    | `invoke_subagent(TypeName: "browser", Model: "flash")`                                   | Uses the lightweight `flash` tier by default for DOM/screenshot checks.                                       |
| **Between Tasks (`Task X.1` $\to$ `Task X.2`)**         | Fresh Chat Session or `/compact`                                                         | Resets quadratic multi-turn history accumulation (cuts session token spend by 50–70%).                        |

---

## 5. Phase Documentation & Major Changes Protocol (Interactive Discovery)

Whenever the user requests documenting a new phase or planning major features:

1. **Interactive Interview (`/grill-me` in Spanish):**
   - Conduct a step-by-step interview walking through the decision tree one question at a time via `ask_question`.
   - Maintain high-standard UX/UI and architecture focus aligned with BookStack's vision and provide opinionated recommendations prefixed with `(Recommended)`.
2. **Zero-Ambiguity Phase Artifacts Synthesis:**
   - Translate resolved decisions into `docs/tasks/phase-XX-<name>/index.md` and atomic `task-X.Y-*.md` files.
   - **Mandatory JIT Requirement:** Every `task-X.Y-*.md` MUST include a `## Target Files & Line Pointers` section listing the exact files and line ranges to read/edit so the implementing agent requires zero exploratory searches.
   - Synchronize `docs/TASKS.md`, `README.md`, `README.es.md`, and `CONTEXT.md` (Tier 2 Per-Phase Sync).
