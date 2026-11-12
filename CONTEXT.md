# CONTEXT.md - BookStack (Single Source of Truth)

## 1. Project Overview & Long-Term Vision

- **Name:** BookStack
- **Purpose:** Minimalist, visual, private, high-performance **Local-First** web application for personal reading tracking, session logging, habit analytics, and private library management.
- **Current Stage (Local-First Priority):** 100% client-side browser execution with local persistence (`IndexedDB` primary store + safe `LocalStorage` fallback) and zero mandatory backend.
- **Long-Term Future Roadmap:** Once the local-first web platform matures through its planned milestones, BookStack is intended to expand with a native **Android client (Kotlin + Jetpack Compose)** and an optional **cloud backend for user accounts and multi-device synchronization**.
  - _Architectural implication:_ Keep domain contracts (`Book`, `ReadingLog`, `ReadingStats`) purely serializable, UUID-identified, and UTC ISO-8601 timestamped, and treat `StorageAdapterService` as the repository boundary that can later back a cross-device `SyncRepository`.
- **Branching & CI/CD Model:**
  - `develop`: Primary integration branch for daily feature, fix, and refactoring work.
  - `main`: Production branch. Pre-merge quality checks (`ci.yml`: ESLint, Prettier, `tsc`, Vitest, build, Playwright E2E) run on `pull_request` to `main`; merging into `main` triggers `deploy.yml` (production build + `404.html` SPA fallback + GitHub Pages deploy) without duplicating test runs.

---

## 2. Technology Stack & Tooling

- **Framework:** Angular 22+ (`@angular/core`, Standalone Components, Signals, `@if` / `@for` Control Flow, `@defer`, `OnPush`, Lazy Routes via `loadComponent`).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@custom-variant dark`), shared modal/form primitives in `src/styles.css`, class-based light/dark theme persistence.
- **Icons:** `@lucide/angular` and inline semantic SVGs.
- **Schema Validation & Privacy:** `zod` runtime validation (`BookSchema` with `isSafeCoverUrl`, `ReadingLogSchema`) + strict `<meta name="referrer" content="no-referrer" />`.
- **Internationalization:** Signal-based `I18nService` (`es` active default, `en` full coverage across all routes, modals, and form components; live switcher in `/settings`) + `Intl.DateTimeFormat`.
- **Quality & Testing Gates:** Strict TypeScript (`tsconfig.app.json` + `tsconfig.spec.json`), ESLint + `angular-eslint` (including template accessibility), Prettier + `prettier-plugin-tailwindcss` (`.prettierrc.mjs`), Vitest 5 (`jsdom` + `fake-indexeddb`), and Playwright E2E tests.

---

## 3. Architectural Decision Records (ADR)

1. **Signal-First State Management:** Reactive state relies exclusively on Angular Signals (`signal`, `computed`, `effect`). RxJS subscriptions are forbidden for local UI or service state.
2. **Asymmetric Responsive Shell:**
   - Tablet & Desktop ($\ge 768\text{px}$): Collapsible `SidebarComponent` (`hidden md:flex`, `68px` $\leftrightarrow$ `240px`) persisted via `UiStateService`.
   - Mobile ($< 768\text{px}$): Compact `HeaderComponent` + fixed `BottomNavComponent` with safe-area padding (`env(safe-area-inset-bottom)`).
3. **Rendering & Bundle Efficiency:** Discrete CSS transitions (`transition-colors`, `transition-[width]`, `transition-transform`, `transition-shadow`); `transition-all` is banned. Global `BookCreateModalComponent` loads lazily via `@defer`. Cover images use `decoding="async"` and `loading="lazy"`. Shared modal/form styles live centrally in `src/styles.css`.
4. **Client-Side Canvas Cover Optimization:** `ImageOptimizerService` scales and compresses uploaded covers ($\le 400\text{px}$, quality `0.75`, WebP/JPEG fallback) before persistence.
5. **Bidirectional Reading Delta Sync:** Logging, updating, or deleting a `ReadingLog` automatically adjusts `Book.currentPage` and status transitions (`pending` / `reading` / `completed`).
6. **Accessible Modal & Scroll-Lock Discipline:** Modals implement `host: { '(document:keydown.escape)': ... }`, programmatic initial focus via `viewChild()`, and reference-counted body scroll locks via `UiStateService.acquireScrollLock()` / `releaseScrollLock()`.
7. **Storage Resilience, Security & Clean Layering:** `StorageAdapterService` lives in `src/app/core/services/`, avoids redundant `localStorage` mirroring on normal IndexedDB writes, traps `QuotaExceededError` / malformed JSON safely, and pairs with Zod parsers (`isSafeCoverUrl` blocks `javascript:` / `data:text/html`). Shared form helpers (`BOOK_STATUS_VALUES`, `translateBookFormat`, autofill) reside in `book-form.utils.ts`, and reusable cover selection/drag-drop/preview lives in `CoverPickerComponent`.
8. **Token & Agent Context Efficiency:** Always consult this JIT map first, read targeted line ranges (`StartLine`/`EndLine`), never scan `node_modules`, `dist`, or `playwright-report`, and keep `AGENTS.md` + `docs/tasks/` synchronized on every change.

---

## 4. Semantic Source Map (JIT Pointers)

Inspect and edit only real workspace paths listed below:

```text
src/
├── index.html                                 # Document root (<meta name="referrer" content="no-referrer" />)
├── test-setup.ts                              # Global Vitest setup (fake-indexeddb + matchMedia mock)
├── styles.css                                 # Tailwind CSS v4 entry, dark variant & shared modal/form styles
└── app/
    ├── app.config.ts                          # Root ApplicationConfig (routing, ChangeDetection)
    ├── app.routes.ts                          # Lazy routes (/, /books, /stats, /settings, /about)
    ├── app.ts / app.html / app.spec.ts        # Root shell (<app-sidebar>, <app-header>, <main>, <app-bottom-nav>, @defer modal)
    │
    ├── core/                                  # Cross-cutting infrastructure & navigation shell
    │   ├── components/
    │   │   ├── sidebar/                       # Collapsible desktop/tablet sidebar (68px / 240px)
    │   │   ├── header/                        # Mobile compact header (<768px)
    │   │   └── bottom-nav/                    # Mobile fixed bottom bar (<768px)
    │   ├── i18n/                              # Signal-based dictionaries (es, en) & I18nService
    │   ├── services/
    │   │   ├── storage-adapter.service.ts     # IndexedDB + LocalStorage fallback adapter (future Sync boundary)
    │   │   ├── theme.service.ts               # Light/dark theme signal & persistence
    │   │   └── ui-state.service.ts            # Sidebar collapse & reference-counted scroll lock
    │   └── utils/
    │       └── date-formatter.ts              # Locale-aware Intl date & month formatters
    │
    └── features/                              # Decoupled domain modules
        ├── dashboard/                             # Home dashboard domain (/)
        │   ├── pages/dashboard-page/              # Main dashboard overview & layout coordinator
        │   └── components/
        │       ├── currently-reading-hero/        # Currently reading hero showcase & fast page updater
        │       ├── reading-streak-widget/         # Reading streak with flame and weekly activity indicators
        │       ├── annual-goal-card/              # Books and pages annual progress with lightweight modal editor
        │       └── recent-activity-feed/          # Recent reading logs list with quick book & log navigation
        ├── books/                             # Books catalog & reading logs domain (/books)
        │   ├── models/                        # Contracts: book.model.ts, catalog-filter.model.ts
        │   ├── schemas/                       # Zod runtime parsers (book.schema.ts, reading-goals.schema.ts)
        │   ├── services/                      # BooksService, ReadingLogService, ReadingStatsService, ImageOptimizerService, CatalogFilterService
        │   ├── utils/book-form.utils.ts       # Shared status/autofill/format/rating/series helpers
        │   ├── pages/books-page/              # Catalog coordinator, 3 view modes & zero-match empty state
        │   └── components/                    # cover-picker, book-create-modal, book-edit-modal, book-detail-modal, reading-log-editor, catalog-toolbar, book-grid-card, book-detailed-card, book-compact-row
        ├── analytics/pages/stats-page/        # Analytics view (/stats)
        ├── settings/pages/settings-page/      # Language switcher, settings & future backup hub (/settings)
        └── about/pages/about-page/            # Project info & Local-First manifesto (/about)

tests/
└── e2e/                                       # Playwright End-to-End browser specs
    ├── overflow.spec.ts                       # Horizontal overflow & single-<main> check (375..1280px)
    ├── navigation-and-theme.spec.ts           # Sidebar, mobile bottom nav & dark theme persistence
    ├── books-flow.spec.ts                     # End-to-end Book & ReadingLog CRUD lifecycle
    ├── dashboard-flow.spec.ts                 # Full dashboard interactive flow & streak/goal lifecycle
    └── catalog-flow.spec.ts                   # Omni-search, status/format/rating filters, sort, 3 view modes & reset
```

---

## 5. Phase Documentation & Major Changes Protocol (Interactive Discovery)

Whenever the user requests documenting a new phase or planning major features:

1. **Interactive Interview (`/grill-me` in Spanish):**
   - Conduct a step-by-step interview walking through the decision tree.
   - Formulate questions **one at a time** using the `ask_question` tool.
   - Maintain creative, high-standard UX/UI and architecture focus aligned with BookStack's vision (Minimalist, Local-First, Angular 22 Signals, Tailwind v4, Mobile-first $\ge 350\text{px}$, WCAG 2.1 AA).
   - Provide concrete, opinionated recommendations prefixed with `(Recommended)` for every choice.
2. **Phase Artifacts Synthesis:**
   - Translate resolved decisions into the phase directory `docs/tasks/phase-XX-<name>/`.
   - Structure atomic task files (`task-X.1-*.md`, etc.) with technical objectives and verification criteria.
   - Synchronize `docs/TASKS.md`, `README.md`, `README.es.md`, and this `CONTEXT.md`.
