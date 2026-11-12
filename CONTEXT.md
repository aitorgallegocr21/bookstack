# CONTEXT.md - BookStack (Single Source of Truth)

## 1. Project Overview

- **Name:** BookStack
- **Purpose:** Minimalist, visual, private, high-performance **Local-First** web application for personal reading tracking, session logging, habit analytics, and private library management.
- **Strategy:** 100% client-side execution with local browser persistence (`IndexedDB` primary store + safe `LocalStorage` fallback) and zero mandatory backend.
- **Branching Model:** `main` (production releases deployed to GitHub Pages via verified GitHub PRs) $\leftarrow$ `develop` (primary integration branch for feature/refactor branches).

---

## 2. Technology Stack & Tooling

- **Framework:** Angular 22+ (`@angular/core`, Standalone Components, Signals, `@if` / `@for` Control Flow, `OnPush`, Lazy Routes via `loadComponent`).
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`, `@custom-variant dark`), class-based light/dark theme persistence.
- **Icons:** `@lucide/angular` and inline semantic SVGs.
- **Schema Validation:** `zod` runtime validation (`BookSchema`, `ReadingLogSchema`) for persisted browser records.
- **Internationalization:** Signal-based `I18nService` (`es` active user-facing default, `en` dictionary structure ready for expansion) + `Intl.DateTimeFormat`.
- **Quality & Testing Gates:** Strict TypeScript (`tsconfig.app.json` + `tsconfig.spec.json`), ESLint + `angular-eslint` (including template accessibility), Prettier + `prettier-plugin-tailwindcss`, Vitest 5 (`jsdom` + `fake-indexeddb`), and Playwright E2E tests.
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml` quality gates on `main`, `.github/workflows/deploy.yml` GitHub Pages deployment with SPA `404.html` fallback).

---

## 3. Architectural Decision Records (ADR)

1. **Signal-First State Management:** Reactive state relies exclusively on Angular Signals (`signal`, `computed`, `effect`). RxJS subscriptions are forbidden for local UI or service state.
2. **Asymmetric Responsive Shell:**
   - Tablet & Desktop ($\ge 768\text{px}$): Collapsible `SidebarComponent` (`hidden md:flex`, `68px` $\leftrightarrow$ `240px`) persisted via `UiStateService`.
   - Mobile ($< 768\text{px}$): Compact `HeaderComponent` + fixed `BottomNavComponent` with safe-area padding (`env(safe-area-inset-bottom)`).
3. **Rendering & Motion Performance:** Discrete CSS transitions (`transition-colors`, `transition-[width]`, `transition-transform`, `transition-shadow`); `transition-all` is banned. Cover images use `decoding="async"` and `loading="lazy"`.
4. **Client-Side Canvas Cover Optimization:** `ImageOptimizerService` scales and compresses uploaded covers ($\le 400\text{px}$, quality `0.75`, WebP/JPEG fallback) before persistence.
5. **Bidirectional Reading Delta Sync:** Logging, updating, or deleting a `ReadingLog` automatically adjusts `Book.currentPage` and status transitions (`pending` / `reading` / `completed`).
6. **Accessible Modal & Scroll-Lock Discipline:** Modals implement `host: { '(document:keydown.escape)': ... }`, programmatic initial focus via `viewChild()`, and reference-counted body scroll locks via `UiStateService.acquireScrollLock()` / `releaseScrollLock()`.
7. **Storage Resilience & Clean Layering:** `StorageAdapterService` lives in `src/app/core/services/`, avoids redundant `localStorage` mirroring on normal IndexedDB writes, traps `QuotaExceededError` / malformed JSON safely, and pairs with Zod parsers in `src/app/features/books/schemas/book.schema.ts`.

---

## 4. Semantic Source Map (JIT Pointers)

Inspect and edit only real workspace paths listed below:

```text
src/
├── test-setup.ts                              # Global Vitest setup (fake-indexeddb + matchMedia mock)
├── styles.css                                 # Tailwind CSS v4 entry (@import 'tailwindcss') & dark variant
└── app/
    ├── app.config.ts                          # Root ApplicationConfig (routing, ChangeDetection)
    ├── app.routes.ts                          # Lazy routes (/, /books, /stats, /settings, /about)
    ├── app.ts / app.html / app.spec.ts        # Root shell (<app-sidebar>, <app-header>, <main>, <app-bottom-nav>)
    │
    ├── core/                                  # Cross-cutting infrastructure & navigation shell
    │   ├── components/
    │   │   ├── sidebar/                       # Collapsible desktop/tablet sidebar (68px / 240px)
    │   │   ├── header/                        # Mobile compact header (<768px)
    │   │   └── bottom-nav/                    # Mobile fixed bottom bar (<768px)
    │   ├── i18n/                              # Signal-based dictionaries (es, en) & I18nService
    │   ├── services/
    │   │   ├── storage-adapter.service.ts     # IndexedDB + LocalStorage fallback adapter
    │   │   ├── theme.service.ts               # Light/dark theme signal & persistence
    │   │   └── ui-state.service.ts            # Sidebar collapse & reference-counted scroll lock
    │   └── utils/
    │       └── date-formatter.ts              # Locale-aware Intl date & month formatters
    │
    └── features/                              # Decoupled domain modules
        ├── dashboard/pages/dashboard-page/    # Home overview & KPIs (/)
        ├── books/                             # Books catalog & reading logs domain (/books)
        │   ├── models/book.model.ts           # Contracts: Book, BookSeries, ReadingLog, ReadingStats
        │   ├── schemas/book.schema.ts         # Zod runtime parsers (BookSchema, ReadingLogSchema)
        │   ├── services/                      # BooksService, ReadingLogService, ReadingStatsService, ImageOptimizerService
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
