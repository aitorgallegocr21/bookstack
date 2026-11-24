# CONTEXT.md - BookStack (Single Source of Truth)

## 1. Project Overview & Long-Term Vision

- **Name:** BookStack
- **Purpose:** Minimalist, visual, private, high-performance **Local-First** web application for personal reading tracking, session logging, habit analytics, and private library management.
- **Current Stage (Local-First Priority):** 100% client-side browser execution with local persistence (`IndexedDB` primary store + safe `LocalStorage` fallback) and zero mandatory backend.
- **Long-Term Future Roadmap:** Native **Android client (Kotlin + Jetpack Compose)** and optional **cloud backend for multi-device sync**. Keep domain contracts (`Book`, `ReadingLog`, `ReadingStats`, `ReadingGoals`) purely serializable, UUID-identified, and UTC ISO-8601 timestamped, treating `StorageAdapterService` as the repository boundary.
- **Branching & CI/CD Model:** `develop` is the primary integration branch; `main` is the production release branch (CI runs on `pull_request` to `main`, deployment runs via `deploy.yml` on merge). For full branch hygiene and cleanup rules, see `AGENTS.md` Section 2.5.

---

## 2. Technology Stack & Architectural Decision Records (ADR)

1. **Signal-First State (`Angular 22+`):** Standalone `OnPush` components, native `@if`/`@for`/`@defer`, lazy routes (`loadComponent`), and Signals (`signal`, `computed`, `effect`). RxJS subscriptions are forbidden for local state.
2. **Asymmetric Responsive Shell (`Tailwind CSS v4`):**
   - Tablet & Desktop ($\ge 768\text{px}$): Collapsible `SidebarComponent` (`hidden md:flex`, `68px` $\leftrightarrow$ `240px`) persisted via `UiStateService`.
   - Mobile ($< 768\text{px}$): Compact `HeaderComponent` + fixed `BottomNavComponent` (`env(safe-area-inset-bottom)`).
   - **Container-Aware Grids & Toolbars (`@container`):** Dashboard split, catalog grids/card actions, and unified filter toolbars adapt to actual container width (accounting for sidebar expand/collapse at ~1000px), paired with `.no-scrollbar` + `.modal-scroll-area` scroll cues on modal bodies.
3. **Rendering & Bundle Efficiency:** Discrete CSS transitions (`transition-colors`, `transition-[width]`, `transition-[grid-template-rows]`); `transition-all` is banned. Global `BookCreateModalComponent` loads via `@defer`. Cover images use `decoding="async" loading="lazy"`. Shared modal/form primitives reside in `src/styles.css`.
4. **Client-Side Canvas Cover Optimization:** `ImageOptimizerService` scales and compresses uploaded covers ($\le 400\text{px}$, quality `0.75`, WebP/JPEG fallback) before persistence.
5. **Bidirectional Reading Delta Sync:** Logging, updating, or deleting a `ReadingLog` automatically adjusts `Book.currentPage` and status transitions (`pending` / `reading` / `completed`).
6. **Accessible Modal & Scroll-Lock Discipline:** Modals implement `host: { '(document:keydown.escape)': ... }`, programmatic initial focus via `viewChild()`, and reference-counted scroll locks via `UiStateService.acquireScrollLock()` / `releaseScrollLock()`.
7. **Storage Resilience & Zod Security:** `StorageAdapterService` avoids redundant `localStorage` mirroring on normal IndexedDB writes, traps `QuotaExceededError` safely, persists catalog view/sort preferences in `localStorage`, and pairs with Zod parsers (`isSafeCoverUrl` blocks `javascript:` / `data:text/html`).
8. **Bilingual Signal i18n (`es` default, `en` full mirror):** Resolved via `I18nService` + `Intl.DateTimeFormat` (`date-formatter.ts`).
9. **5-Source Metadata Waterfall & Browser-Native `.ZIP` Portability:** Public metadata lookup queries Open Library (Bibkey, Search, Work Editions, direct ISBN cover probe), Google Books, Wikidata SPARQL, Apple Books ES, and Internet Archive/Crossref with cross-source fusion (`merged` candidate) and balanced 8-result quota; `DataPortabilityService` supports Lightweight JSON, Full Base64 JSON, expanded RFC 4180 CSV, and zero-dependency `.ZIP` bundles (`zip-archive.utils.ts` via Web `CompressionStream`/`DecompressionStream`).

---

## 3. Semantic Source Map & JIT Line Pointers

Read targeted line ranges (`StartLine`/`EndLine`) using this map; never scan `node_modules`, `dist`, or `playwright-report`:

```text
src/
├── index.html                                 # Document root (<meta name="referrer" content="no-referrer" />)
├── test-setup.ts                              # Global Vitest setup (fake-indexeddb + matchMedia mock)
├── styles.css                                 # Tailwind CSS v4 entry, dark variant & shared modal/form styles
└── app/
    ├── app.config.ts / app.routes.ts          # Root config & lazy routes (/, /books, /series, /stats, /settings, /about)
    ├── app.ts / app.html / app.spec.ts        # Root shell (<app-sidebar>, <main>, <app-bottom-nav>, snap preview, @defer modal)
    ├── core/
    │   ├── components/{sidebar,bottom-nav,brand-logo,confirm-dialog}/  # 4-edge desktop dock, 2-edge mobile dock, brand logo & <app-confirm-dialog>
    │   ├── i18n/                              # i18n.types.ts (L1-18), es.ts (L1-18), en.ts (L1-18), i18n.service.ts (L1-49)
    │   │   └── domains/                       # shell, dashboard, books, analytics, series, settings, about
    │   ├── models/
    │   │   ├── catalog-preferences.model.ts   # CatalogViewMode, CatalogSortOption & runtime guards
    │   │   └── confirm-dialog.model.ts        # ConfirmDialogOptions, ConfirmEntityPreview & ConfirmSuppressionKey
    │   ├── services/
    │   │   ├── confirm-dialog.service.ts      # Promise-based Signal confirmation dialog & suppression preferences
    │   │   ├── cover-color.service.ts         # 16x16 canvas cover hue extraction + LRU cache & O(1) fallback
    │   │   ├── dock-position.service.ts       # 4-edge desktop & 2-edge mobile dock position + drag preview signals
    │   │   ├── storage-adapter.service.ts     # L1-361: IndexedDB + LocalStorage fallback + catalog/confirm prefs
    │   │   ├── theme.service.ts               # Light/dark/system theme mode & 5 accent palettes persistence
    │   │   └── ui-state.service.ts            # L1-66: Sidebar collapse, create modal state/prefill & scroll lock
    │   └── utils/
    │       ├── date-formatter.ts              # Locale-aware Intl date & month formatters
    │       ├── dock-snap.utils.ts             # Quadrant snap-edge detection & preview rect calculation
    │       └── temporal-bounds.utils.ts       # Temporal bounds (1900..currentYear+1), antique year check & typo repair
    ├── shared/
    │   └── utils/book-display.utils.ts        # Shared getStatusBadgeClass & formatRatingBadge helpers
    └── features/
        ├── dashboard/                         # Home launchpad (/)
        │   ├── pages/dashboard-page/          # Dashboard layout coordinator
        │   └── components/{currently-reading-hero,reading-streak-widget,annual-goal-card,recent-activity-feed}/
        ├── books/                             # Books catalog & reading logs domain (/books)
        │   ├── models/
        │   │   ├── book.model.ts              # L1-185: Book, BookSeries, ReadingLog, ReadingStats, ReadingGoals, StreakInfo
        │   │   ├── book-metadata.model.ts     # L1-28: Metadata lookup result & duplicate check models
        │   │   └── catalog-filter.model.ts    # L1-51: CatalogViewMode, CatalogSortOption, CatalogFilterState, StatusCounts
        │   ├── schemas/
        │   │   ├── book.schema.ts             # L1-119: BookSchema, ReadingLogSchema, isSafeCoverUrl
        │   │   ├── book-metadata.schema.ts    # Open Library (Bibkey/Search/Editions), Google Books, Wikidata, Apple Books, Internet Archive & Crossref Zod parsers
        │   │   └── reading-goals.schema.ts    # L1-28: ReadingGoalsSchema
        │   ├── services/
        │   │   ├── books.service.ts           # L1-133: CRUD + persistence orchestration
        │   │   ├── reading-log.service.ts     # L1-98: Session logs + bidirectional page delta sync
        │   │   ├── reading-stats.service.ts   # L1-324: Computed stats, streaks & annual goals progress
        │   │   ├── catalog-filter.service.ts  # L1-377: Omni-search, status/format/rating filters, 7 sorts & view mode state
        │   │   ├── image-optimizer.service.ts # L1-132: Canvas WebP/JPEG compression & remote cover fetch
        │   │   └── book-metadata.service.ts   # 5-source metadata waterfall, cross-edition fusion, balanced 8-result quota & duplicate detector
        │   ├── utils/
        │   │   ├── book-form.utils.ts         # Shared status/autofill/format/rating/series & metadata form-patch helpers
        │   │   └── isbn.utils.ts              # Pure ISBN-10/13 checksum & normalization helpers
        │   ├── pages/books-page/              # Catalog coordinator, 3 view modes & zero-match empty state
        │   └── components/{cover-picker,isbn-scanner,book-metadata-lookup,book-create-modal,book-edit-modal,book-detail-modal,reading-log-editor,catalog-toolbar,book-grid-card,book-detailed-card,book-compact-row}/
        ├── analytics/                         # Reading analytics domain (/stats)
        │   ├── models/analytics.model.ts      # Period, KPI, trend, distribution, weekday pace & highlights contracts
        │   ├── services/analytics.service.ts  # Reactive period filtering & hybrid ReadingLog + Book aggregation
        │   ├── components/{analytics-header,analytics-kpi-grid,reading-velocity-chart,library-composition-section,reading-habits-section}/
        │   └── pages/stats-page/              # Analytics coordinator (/stats), empty library state & integration spec
        ├── series/                            # Sagas, Series & Collections domain (/series)
        │   ├── models/series.model.ts         # SeriesMetadata, SagaAggregation, SagaVolumeSlot, SagaBentoScale
        │   ├── schemas/series.schema.ts       # Zod SeriesMetadataSchema runtime persistence validator
        │   ├── services/series.service.ts     # Normalized grouping, gap radar, filters/sorts & bulk link/unlink
        │   ├── utils/series.utils.ts          # Pure normalization, timeline slots, bento scale & aggregation helpers
        │   ├── components/{series-toolbar,saga-bento-card,saga-detail-modal}/
        │   └── pages/series-page/             # Variable-scale Bento gallery (/series) & modal coordinator
        ├── settings/                          # Settings, Data Portability & Backup Engine (/settings)
        │   ├── models/cover-enrichment.model.ts       # CoverEnrichmentState, MissingCoverSummary & skipped report contracts
        │   ├── models/data-health.model.ts            # DataHealthReport, DataHealthIssue & remediation contracts
        │   ├── models/data-portability.model.ts       # BackupEnvelope, ImportPreviewSummary, StorageBreakdownSummary
        │   ├── schemas/backup.schema.ts               # Zod BackupEnvelopeSchema & versioned restore validation
        │   ├── services/cover-enrichment.service.ts   # Integral metadata & cover auto-enrichment (ISBN -> Title+Author cascade) + visual assistant
        │   ├── services/data-health.service.ts        # Local 4-category data health auditor & 1-click remediation engine
        │   ├── services/data-portability.service.ts   # Light/Full JSON, expanded CSV, .ZIP bundle export/import, flexible normalizer & quota inspector
        │   ├── utils/
        │   │   └── zip-archive.utils.ts          # Zero-dependency browser-native .ZIP reader/writer (CompressionStream/DecompressionStream)
        │   ├── components/{settings-preferences-section,storage-quota-inspector,data-portability-section,cover-enrichment-section,data-health-section,danger-zone-section}/
        │   └── pages/settings-page/                   # /settings coordinator & reactive storage breakdown
        └── about/pages/about-page/            # Project info & Local-First manifesto (/about)

tests/e2e/                                     # Playwright specs: overflow, navigation-and-theme, books-flow, dashboard-flow, catalog-flow, analytics-flow, settings-flow, isbn-lookup-flow, series-flow
scripts/verify-quiet.mjs                       # Token-optimized auto-fix + quiet verification gate
```

---

## 4. Antigravity Token, Quota & Dynamic Model Routing Strategy

See `AGENTS.md` Section 3 for the full Dynamic Model Routing, Subagent Delegation, and Quota Optimization rules.

---

## 5. Phase Documentation & Major Changes Protocol (Interactive Discovery)

Whenever the user requests documenting a new phase or planning major features:

1. **Pre-Phase Autonomous Branch Hygiene:** Follow `AGENTS.md` Section 2.5 before starting/defining a new phase.
2. **Interactive Interview (`/grill-me` in Spanish):**
   - Conduct a step-by-step interview walking through the decision tree one question at a time via `ask_question`.
   - Maintain high-standard UX/UI and architecture focus aligned with BookStack's vision and provide opinionated recommendations prefixed with `(Recommended)`.
3. **Zero-Ambiguity Phase Artifacts Synthesis:**
   - Translate resolved decisions into `docs/tasks/phase-XX-<name>/index.md` and atomic `task-X.Y-*.md` files.
   - **Mandatory JIT Requirement:** Every `task-X.Y-*.md` MUST include a `## Target Files & Line Pointers` section listing the exact files and line ranges to read/edit so the implementing agent requires zero exploratory searches.
   - **Synchronize `docs/TASKS.md`, `docs/ROADMAP.md`, `README.md`, `README.es.md`, and `CONTEXT.md` (Tier 2 Per-Phase Sync).**
4. **Periodic Project Hardening & Consolidation Protocol (Every Several Phases / On User Request):**
   - Whenever the user asks to run a general project improvement, consolidation, security/schema hardening, or performance/architecture sweep after developing several feature phases (like `Phase 12` and its post-phase hardening commits), immediately load `.agents/skills/periodic-project-hardening/SKILL.md`.
   - Follow its **Low-Token Static Diagnostic Sweep** first and audit all 8 mandatory pillars (Token Hygiene & Monolith Splitting first, Legal/Privacy/CSP & Zod `.max()` bounds, Offline PWA & Brand Assets, IndexedDB Batch ACID & `DataPortabilityService` cross-service sync, Memoized `Intl.*` & single-pass $O(N)$ engines, `@defer` modal splitting & budgets, Clean Architecture `core`/`shared`/`features` boundaries & suffixless naming, and Unit/E2E Regression coverage).
