# Tasks Backlog & Roadmap

> **Agent Protocol:** This document is the single high-level phase registry and active sprint index. For atomic task specifications, inspect the corresponding phase directory inside `docs/tasks/`.
>
> **Execution Loop:** `[Targeted Spec] ➔ [Minimal Code Edit + Tests] ➔ [Validation: npm run verify:quiet] ➔ [Two-Tier Doc Sync] ➔ [Semantic Git Commit]`

---

## Active Phase

- [ ] **[Phase 15: Multi-Source Metadata Engine (5 Providers), Integral Auto-Enrichment & Offline `.ZIP` Bundles](tasks/phase-15-multi-source-metadata-and-offline-bundles/index.md)** — _In Progress_ (5-source browser-native metadata waterfall [`Open Library` + `Google Books` + `Wikidata` + `Apple Books ES` + `Internet Archive / Crossref`], cross-edition metadata fusion & balanced 8-result quota, automatic ISBN $\to$ Title+Author integral enrichment backfilling covers, `totalPages`, `publicationYear`, `publisher`, `isbn`, and `series`, flexible external/AI JSON & CSV import normalizer, and 4-mode offline export/import suite including self-contained `.ZIP` bundles with `/covers` image files).

---

## Upcoming Phases (Backlog & Roadmapped)

- _No additional phases queued yet._

---

## Completed Phases (Archive & Changelog)

- [x] **[Phase 14: Visual Polish, Responsive Layout & UX Refinements](tasks/phase-14-visual-polish-and-responsive-ux/index.md)** — _Completed 2026-11_ (Dashboard dark-mode contrast fix, scrollbar-free 2-column parallel reads grid, symmetric 6-month vertical activity widget + `/stats` link, `@container`-driven ~1000px tablet layout, `.no-scrollbar` + `.modal-scroll-area` scroll cues across all modals, container-aware `/books` grids & overflow-free card action bars, unified symmetric `@container` filter/control toolbars across `/books`, `/series`, and `/stats`, full-width stretching sagas with wrapping multi-row cover shelves & zero-truncation mobile headers, and concise modern `/about` Bento redesign with personal author profile card).

- [x] **[Phase 13: Post-Import Bulk Cover Enrichment & Library Cover Assistant](tasks/phase-13-bulk-cover-enrichment/index.md)** — _Completed 2026-11_ (Post-import & on-demand missing-cover detector in `/settings`, multi-ISBN batch lookup with strict $\ge 80\times120\text{px}$ anti-placeholder cover verification, rate-limited pausable/cancellable queue with incremental IndexedDB `updateMany` persistence, step-by-step Visual Cover Picker Assistant, warning-gated strict Title+Author automated fallback, and expandable verification report).

- [x] **[Phase 12: Performance, Caching, Architecture & Legal Hardening](tasks/phase-12-performance-architecture-and-legal-hardening/index.md)** — _Completed 2026-11_ (Modular domain i18n split & cached verification gate, `/about` legal/privacy/license disclosures & camera consent gate, CSP & cover URL hardening, PWA Service Worker offline app shell cache, IndexedDB connection lifecycle & `putMany` batch transactions, `DataPortabilityService` $\leftrightarrow$ `SeriesService` live sync, memoized `Intl.*` formatters & single-pass $O(N)$ engines, `@defer` modal chunk splitting, `src/app/shared/` extraction, zero `core` $\to$ `features` dependency inversion, and unified Angular 22+ file naming).

- [x] **[Phase 11: Sagas, Series & Collections Management (`/series`)](tasks/phase-11-sagas-series-management/index.md)** — _Completed 2026-11_ (Variable-scale Saga Bento Gallery [`1×1` / `2×1` / `2×2`], Hybrid `Book.series` + persisted `SeriesMetadata` in IndexedDB v2 & JSON backups, missing-volume gap radar, search/status/sort toolbar, series autocomplete & prefill, interactive Saga Detail Modal with chronological timeline & bulk linker, desktop/mobile navigation parity, and 5 Playwright E2E scenarios).

- [x] **[Phase 10: ISBN Barcode Scanner & Public Metadata Auto-Fill](tasks/phase-10-isbn-scanner-metadata-lookup/index.md)** — _Completed 2026-11_ (Privacy-first camera & photo ISBN-10/13 barcode scanner via lazy-loaded `html5-qrcode`, on-demand Open Library + Google Books hybrid metadata waterfall with Zod validation, automatic local cover compression via `ImageOptimizerService`, non-blocking local duplicate detection, smart field protection in Create & Edit modals via `buildMetadataFormPatch()`, and 3 Playwright E2E tests).

- [x] **[Phase 09: Settings, Data Portability & Backup Engine](tasks/phase-09-settings-portability-backup/index.md)** — _Completed 2026-11_ (CSP meta hardening, unified interface preferences [language, theme, default catalog view], 4-category storage quota & byte inspector, Zod-validated JSON full backup & RFC 4180 CSV catalog export/import with validation preview [`Merge` vs `Overwrite`], 2-tier Danger Zone reset modal with 1-click backup in `/settings`, `SettingsPage` integration tests, and 5 Playwright E2E tests).

- [x] **[Phase 08: Advanced Analytics](tasks/phase-08-advanced-analytics/index.md)** — _Completed 2026-11_ (Reactive time-horizon selector, 4 executive KPI cards with micro-indicators, hybrid `ReadingLog` + direct book progress engine, 3-metric interactive SVG/CSS velocity chart, format donut + status stacked bar + rating histogram & top authors, weekday reading pace, period highlights in `/stats`, `StatsPage` integration tests, and 35 Playwright E2E tests).

- [x] **[Phase 07: Catalog Filtering, Search & View Density](tasks/phase-07-catalog-filtering-search/index.md)** — _Completed 2026-11_ (Three switchable view modes [Bookshelf Grid, Detailed Cards, Compact List], live omni-search, status chips with real-time counters, 7 sort options, collapsible advanced filters with smooth CSS Grid transition, uniform card sizing, contextual 1-click reset, accessible mobile status menu, and 32 Playwright E2E tests).
- [x] **[Phase 06: Interactive Dashboard Hub](tasks/phase-06-interactive-dashboard-hub/index.md)** — _Completed 2026-11_ (Redesigned home `/` into an interactive reading launchpad: "Currently Reading" hero showcase with inline fast page progress updater and parallel active reads switcher, smart dual empty states, daily reading streak with animated flame and weekly activity indicators, combined annual goals tracking books & pages with modal editor, and recent activity feed).
- [x] **[Phase 05: Comprehensive Test Suite (Vitest + Playwright E2E)](tasks/phase-05-testing-suite-and-qa-gate/index.md)** — _Completed 2026-11_ (Vitest global setup with `fake-indexeddb` + `matchMedia` mock, 20 unit/component/regression test files passing 59 specs, plus 23 Playwright E2E tests covering responsive overflow, navigation, theme persistence, and book/log flows).
- [x] **[Phase 04: Core Hardening, Bug Fixes & i18n Foundation](tasks/phase-04-core-hardening-and-i18n/index.md)** — _Completed 2026-11_ (Sidebar tablet breakpoint `hidden md:flex`, ESLint/template accessibility remediation, `StorageAdapterService` Clean Architecture relocation & IndexedDB optimization, Zod persistence validation, `I18nService` foundation keeping Spanish UI active, and English internal code/docs sync).
- [x] **[Phase 03: Agent Operating System, English Docs, Tooling & Branching Baseline](tasks/phase-03-workflow-tooling-and-docs/index.md)** — _Completed 2026-11_ (`develop`/`main` dual-branch strategy, full dependency upgrades to Angular 22.2.6 & Tailwind CSS v4, ESLint/Prettier/Zod quality gates, English `AGENTS.md` + `.agents/skills/`, bilingual READMEs, GitHub PR/Issue templates, and `ci.yml`/`deploy.yml`).
- [x] **[Phase 02: Asymmetric App Shell, Modular Routing & Accessibility](tasks/phase-02-app-shell/index.md)** — _Completed 2026-09_ (Collapsible desktop sidebar, mobile compact header & fixed bottom nav, lazy-loaded routes `/`, `/books`, `/stats`, `/settings`, `/about`, global create modal state, body scroll lock, Escape/autofocus handling, and WCAG 2.1 AA refinement).
- [x] **[Phase 01: Book Domain Model, Local-First Storage & Catalog MVP](tasks/phase-01-book-domain/index.md)** — _Completed 2026-09_ (Strict TypeScript book/reading-log/stats domain models, `StorageAdapterService` with IndexedDB + LocalStorage fallback, `ImageOptimizerService` Canvas compression pipeline, `ReadingStatsService` computed aggregations, and decoupled create/edit/detail/reading-log modals).
