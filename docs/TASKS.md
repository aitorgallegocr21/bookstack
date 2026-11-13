# Tasks Backlog & Roadmap

> **Agent Protocol:** This document is the single high-level phase registry and active sprint index. For milestone definitions migrated from the original product roadmap, see [docs/ROADMAP.md](ROADMAP.md). For atomic task specifications, inspect the corresponding phase directory inside `docs/tasks/`.
>
> **Execution Loop:** `[Targeted Spec] ➔ [Minimal Code Edit + Tests] ➔ [Validation: npm run verify:quiet] ➔ [Two-Tier Doc Sync] ➔ [Semantic Git Commit]`

---

## Active Phase

- [ ] **[Phase 08: Advanced Analytics](tasks/phase-08-advanced-analytics/index.md)** — _Active_ (Reactive time-horizon selector, 4 executive KPI cards with micro-indicators, hybrid `ReadingLog` + direct book progress engine, 3-metric interactive SVG/CSS velocity chart, format donut + status stacked bar + rating histogram & top authors, weekday reading pace, and period highlights in `/stats`).

---

## Upcoming Phases (Backlog & Roadmapped)

- [ ] **Phase 09: Settings, Data Portability & Backup Engine** — _Roadmapped_ (CSP meta hardening, Zod-validated JSON/CSV export & import, storage quota inspector, and reset controls in `/settings`).
- [ ] **Phase 10: ISBN Barcode Scanner & Series Management** — _Roadmapped_ (Camera ISBN scanning via `html5-qrcode`, Open Library / Google Books metadata lookup, and chronological saga organization).

---

## Completed Phases (Archive & Changelog)

- [x] **[Phase 07: Catalog Filtering, Search & View Density](tasks/phase-07-catalog-filtering-search/index.md)** — _Completed 2026-11_ (Three switchable view modes [Bookshelf Grid, Detailed Cards, Compact List], live omni-search, status chips with real-time counters, 7 sort options, collapsible advanced filters with smooth CSS Grid transition, uniform card sizing, contextual 1-click reset, accessible mobile status menu, and 32 Playwright E2E tests).
- [x] **[Phase 06: Interactive Dashboard Hub](tasks/phase-06-interactive-dashboard-hub/index.md)** — _Completed 2026-11_ (Redesigned home `/` into an interactive reading launchpad: "Currently Reading" hero showcase with inline fast page progress updater and parallel active reads switcher, smart dual empty states, daily reading streak with animated flame and weekly activity indicators, combined annual goals tracking books & pages with modal editor, and recent activity feed).
- [x] **[Phase 05: Comprehensive Test Suite (Vitest + Playwright E2E)](tasks/phase-05-testing-suite-and-qa-gate/index.md)** — _Completed 2026-11_ (Vitest global setup with `fake-indexeddb` + `matchMedia` mock, 20 unit/component/regression test files passing 59 specs, plus 23 Playwright E2E tests covering responsive overflow, navigation, theme persistence, and book/log flows).
- [x] **[Phase 04: Core Hardening, Bug Fixes & i18n Foundation](tasks/phase-04-core-hardening-and-i18n/index.md)** — _Completed 2026-11_ (Sidebar tablet breakpoint `hidden md:flex`, ESLint/template accessibility remediation, `StorageAdapterService` Clean Architecture relocation & IndexedDB optimization, Zod persistence validation, `I18nService` foundation keeping Spanish UI active, and English internal code/docs sync).
- [x] **[Phase 03: Agent Operating System, English Docs, Tooling & Branching Baseline](tasks/phase-03-workflow-tooling-and-docs/index.md)** — _Completed 2026-11_ (`develop`/`main` dual-branch strategy, full dependency upgrades to Angular 22.2.6 & Tailwind CSS v4, ESLint/Prettier/Zod quality gates, English `AGENTS.md` + `.agents/skills/`, bilingual READMEs, GitHub PR/Issue templates, and `ci.yml`/`deploy.yml`).
- [x] **[Phase 02: Asymmetric App Shell, Modular Routing & Accessibility](tasks/phase-02-app-shell/index.md)** — _Completed 2026-09_ (Collapsible desktop sidebar, mobile compact header & fixed bottom nav, lazy-loaded routes `/`, `/books`, `/stats`, `/settings`, `/about`, global create modal state, body scroll lock, Escape/autofocus handling, and WCAG 2.1 AA refinement).
- [x] **[Phase 01: Book Domain Model, Local-First Storage & Catalog MVP](tasks/phase-01-book-domain/index.md)** — _Completed 2026-09_ (Strict TypeScript book/reading-log/stats domain models, `StorageAdapterService` with IndexedDB + LocalStorage fallback, `ImageOptimizerService` Canvas compression pipeline, `ReadingStatsService` computed aggregations, and decoupled create/edit/detail/reading-log modals).
