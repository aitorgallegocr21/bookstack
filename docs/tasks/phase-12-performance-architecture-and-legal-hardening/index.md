# Phase 12: Performance, Caching, Architecture & Legal Hardening

**Status:** In Progress  
**Target Branch:** `feature/12-performance-architecture-and-legal-hardening` $\to$ `develop`  
**Core Mission:** Harden BookStack across five non-visual engineering pillars—**AI Token & Verification Efficiency**, **Legal/Privacy/CSP Compliance**, **True Offline App Shell Caching (PWA/Service Worker)**, **IndexedDB Transaction Resilience & Single-Pass $O(N)$ Runtime Performance**, and **Clean Architecture Boundaries (`shared/`, zero `core` $\to$ `features` inversion, and unified Angular 22+ file naming)**—maximizing runtime speed and resource efficiency while preserving 100% functional backward compatibility.

---

## 1. Architectural Summary & Execution Strategy

1. **Token-First Ordering (Why Task 12.1 Runs First):**
   - Splitting the ~1,900-line monolithic i18n dictionaries (`i18n.types.ts`, `es.ts`, `en.ts`) into domain slices (`src/app/core/i18n/domains/*.i18n.ts`) and enabling cached ESLint/Prettier + quiet Playwright reporting in Task 12.1 cuts agent read/verification token consumption by **70–85%** for every subsequent task in Phase 12 and future phases.
2. **Legal, Privacy & Security Compliance (`/about`, Camera Gate, CSP & URL Hardening):**
   - Align `/about` with actual application capabilities: explicitly distinguish 100% local `IndexedDB`/`LocalStorage` storage and local-only camera frame scanning from opt-in external metadata queries to **Open Library (Internet Archive)** and **Google Books API** (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`).
   - Add MIT License notice, As-Is Warranty & Local Backup Responsibility disclaimer, and Open-Source / Third-Party API attributions in `/about`.
   - Gate `IsbnScannerComponent` camera initialization behind an explicit user consent action instead of auto-starting `getUserMedia` in `ngAfterViewInit()`, and display a concise inline privacy notice in `BookMetadataLookupComponent`.
   - Harden `isSafeCoverUrl` (reject unencrypted `http://` and `data:image/svg+xml`, allowing only `https://` and raster `data:image/(webp|jpeg|jpg|png|gif|avif);base64,`), add a `6000ms` `AbortController` timeout and MIME guard to `ImageOptimizerService.optimizeRemoteUrl()`, stop persisting raw unverified external cover URLs on fetch failure, and tighten `img-src` in `src/index.html`.
3. **True Local-First Offline App Shell (`@angular/service-worker` & Web App Manifest):**
   - Configure `ngsw-config.json` and `public/manifest.webmanifest` so reloading BookStack with zero internet connectivity serves `index.html`, JS/CSS chunks, and icons from local Service Worker cache while leaving external metadata API calls uncached.
4. **IndexedDB ACID Durability, Batch Writes & Portability Sync:**
   - Attach `db.onclose` and `db.onversionchange` listeners in `StorageAdapterService.initDB()` to invalidate stale connection promises automatically.
   - Resolve `set()` and `remove()` on `transaction.oncomplete` and introduce `putMany<T>(storeName, items)` for single-transaction batch writes.
   - Add `BooksService.updateMany(books)` and refactor `SeriesService` bulk operations (`upsertSeriesMetadata`, `linkBooksToSeries`) from $N$ sequential transactions/emissions to **1 transaction + 1 Signal emission**.
   - Fix `DataPortabilityService` to synchronize `SeriesService` in-memory signals via `replaceAllMetadata()` / `clearAllMetadata()` during backup import and factory reset, optimize `computeStorageBreakdown()` to calculate byte sizes in a single allocation-free pass, and cap `BookMetadataService` caches (`isbnCache`, `queryCache`) with a 50-entry LRU policy.
5. **Runtime Algorithmic Efficiency ($O(N)$ Single-Pass Engines, Cached `Intl.*` & `@defer` Modals):**
   - Memoize `Intl.DateTimeFormat`, `Intl.NumberFormat`, and `Intl.Collator` instances by locale/options in `src/app/core/utils/date-formatter.ts`, eliminating repeated formatter construction inside hot loops and chart `.map()` callbacks.
   - Collapse multi-pass array scans in `ReadingStatsService` (9 book passes + 6 log passes $\to$ 1 book pass + 1 log pass), `CatalogFilterService` (hoist `FORMAT_ALIASES` and query normalization, precompute sort keys), `AnalyticsService` ($O(K)$ min-date scan, 1-pass rating histogram), and `SeriesService` (hoist search normalization, drop redundant sort).
   - Add structural `equal` comparators to derived count/summary `computed()` signals to block redundant downstream template re-evaluations.
   - Wrap secondary modals (`BookDetailModal`, `BookEditModal`, `ReadingLogEditor`, `SagaDetailModal`) in `@defer (when ...)` across `BooksPage`, `SeriesPage`, `DashboardPage`, and `BookDetailModal` to split heavy metadata/form dependencies out of initial route chunks.
6. **Clean Architecture Boundaries, Shared Layer & Modern File Naming:**
   - Eliminate `core/` $\to$ `features/` dependency inversion by consolidating `isCreateModalOpen` / `createModalPrefill` in `UiStateService` and decoupling `StorageAdapterService` from `features/books/models/catalog-filter.model.ts`.
   - Extract duplicated UI helpers (`getStatusBadgeClass`, `formatRatingBadge`) into `src/app/shared/utils/book-display.utils.ts`.
   - Unify all component filenames under the modern Angular 20+ suffixless convention (`*.ts`, `*.html`, `*.spec.ts`), removing the 10 legacy `.component.*` suffixes.

---

## 2. Atomic Task Breakdown

- [x] **[Task 12.1: Token Hygiene, Modular i18n Split & Fast Cached Verification Gate](task-12.1-token-hygiene-modular-i18n-and-cached-verification.md)** — Split `core/i18n/` into domain modules (`domains/*.i18n.ts`), upgrade `scripts/verify-quiet.mjs` with ESLint/Prettier caching + E2E type-checking, add `npm run test:e2e:quiet`, and deduplicate `AGENTS.md` / `CONTEXT.md`.
- [x] **[Task 12.2: Legal, Privacy, `/about` Disclosures, Camera Consent & Security/CSP Hardening](task-12.2-legal-privacy-about-disclosures-and-csp-hardening.md)** — Expand `/about` with transparent Privacy/Legal/License/Attribution sections, gate camera auto-start in `IsbnScannerComponent`, add inline external API disclosure in `BookMetadataLookupComponent`, harden `isSafeCoverUrl` & `ImageOptimizerService`, and tighten CSP `img-src`.
- [x] **[Task 12.3: Offline App Shell Cache (PWA Manifest & Static Asset Caching Strategy)](task-12.3-offline-app-shell-pwa-and-asset-cache.md)** — Configure `@angular/service-worker`, `ngsw-config.json`, and `public/manifest.webmanifest` so the application shell and lazy chunks load reliably offline.
- [x] **[Task 12.4: IndexedDB Lifecycle Resilience, Batch Transactions & Storage Portability Sync](task-12.4-indexeddb-resilience-batch-transactions-and-portability-sync.md)** — Handle `onclose`/`onversionchange` and `transaction.oncomplete`, add `StorageAdapterService.putMany()` + `BooksService.updateMany()`, refactor `SeriesService` batch updates, fix `DataPortabilityService` $\leftrightarrow$ `SeriesService` signal sync, optimize byte breakdown calculation, and bound `BookMetadataService` caches with LRU eviction.
- [ ] **[Task 12.5: Runtime Performance — Cached `Intl.*` Formatters & Single-Pass $O(N)$ Domain Engines](task-12.5-intl-cache-and-single-pass-domain-engines.md)** — Memoize `Intl.DateTimeFormat` / `NumberFormat` / `Collator`, refactor `ReadingStatsService`, `CatalogFilterService`, `AnalyticsService`, and `SeriesService` to single-pass $O(N)$ loops, and add custom `equal` comparators to derived signals.
- [ ] **[Task 12.6: Bundle Splitting (`@defer` Modals), Preloading Strategy & Render Micro-Optimizations](task-12.6-deferred-modals-bundle-splitting-and-render-polish.md)** — Wrap secondary modals in `@defer (when ...)` across `/books`, `/series`, and `/`, replace residual `transition-all` classes with `transition-[width]`, and tighten production bundle budgets in `angular.json`.
- [ ] **[Task 12.7: Clean Architecture Boundaries, Shared UI Primitives (`src/app/shared/`) & File Naming Unification](task-12.7-clean-architecture-shared-layer-and-file-naming.md)** — Remove `core/` $\to$ `features/` imports, centralize create-modal state in `UiStateService`, extract `src/app/shared/utils/book-display.utils.ts`, and standardize the 10 legacy `.component.ts` files to suffixless Angular 22+ naming.
- [ ] **[Task 12.8: Phase 12 End-to-End Verification, Regression Suite & Tier-2 Documentation Sync](task-12.8-phase-12-regression-e2e-suite-and-tier-2-sync.md)** — Add/update Playwright E2E and unit regression specs for `/about` legal sections, camera consent gate, batch transactions, and offline/defer flows; execute full verification gates and Tier 2 Per-Phase documentation sync.
