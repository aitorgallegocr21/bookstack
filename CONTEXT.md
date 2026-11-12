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
- **Internationalization:** Signal-based `I18nService` (`es` active user-facing default, `en` dictionary structure ready for expansion) + `Intl.DateTimeFormat`.
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
7. **Storage Resilience, Security & Clean Layering:** `StorageAdapterService` lives in `src/app/core/services/`, avoids redundant `localStorage` mirroring on normal IndexedDB writes, traps `QuotaExceededError` / malformed JSON safely, and pairs with Zod parsers (`isSafeCoverUrl` blocks `javascript:` / `data:text/html`). Shared form helpers reside in `book-form.utils.ts`.
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
        ├── dashboard/pages/dashboard-page/    # Home overview & KPIs (/)
        ├── books/                             # Books catalog & reading logs domain (/books)
        │   ├── models/book.model.ts           # Contracts: Book, BookSeries, ReadingLog, ReadingStats
        │   ├── schemas/book.schema.ts         # Zod runtime parsers (BookSchema, isSafeCoverUrl, ReadingLogSchema)
        │   ├── services/                      # BooksService, ReadingLogService, ReadingStatsService, ImageOptimizerService
        │   ├── utils/book-form.utils.ts       # Shared status/autofill/format/rating/series normalization helpers
        │   ├── pages/books-page/              # Catalog grid & modal coordination
        │   └── components/                    # book-create-modal, book-edit-modal, book-detail-modal, reading-log-editor
        ├── analytics/pages/stats-page/        # Analytics view (/stats)
        ├── settings/pages/settings-page/      # Settings & backup hub (/settings)
        └── about/pages/about-page/            # Project info & Local-First manifesto (/about)

tests/
└── e2e/                                       # Playwright End-to-End browser specs
    ├── overflow.spec.ts                       # Horizontal overflow & single-<main> check (375..1280px)
    ├── navigation-and-theme.spec.ts           # Sidebar, mobile bottom nav & dark theme persistence
    └── books-flow.spec.ts                     # End-to-end Book & ReadingLog CRUD lifecycle
```
