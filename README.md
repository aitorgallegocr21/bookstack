# BookStack

> 🌐 **Language:** English | [Leer en Español](README.es.md)

Modern, minimalist, **Local-First** web application for personal reading tracking, session logging, habit analytics, and private library management.

![Angular](https://img.shields.io/badge/Angular-22%2B-DD0031?style=flat-square&logo=angular)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-38B2AC?style=flat-square&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Core Features

- **Interactive Dashboard Hub:** "Currently Reading" hero showcase with inline fast page updater, parallel active reads selector, smart dual empty states (welcome prompt vs. pick from pending), daily reading streak with animated flame and weekly activity indicators, combined annual goals (books + pages) with modal editor, and recent activity feed.
- **Versatile Catalog Browsing & View Density:** Switch seamlessly between three distinct library views (Visual Bookshelf Grid, Media-Object Detailed Cards, and High-Density Compact List). Features real-time omni-search across title, author, and saga/series, quick status filter chips with dynamic count badges, collapsible secondary filters (format and star ratings), comprehensive sorting (7 criteria), persistent view preferences in LocalStorage, and a dedicated zero-match empty state with 1-click filter reset.
- **Sagas, Series & Collections (`/series`):** Variable-scale Bento gallery (`1×1` compact, `2×1` medium, `2×2` showcase) grouping series automatically with a Missing-Volume Radar, 1-click "Continue / Next Volume" action, interactive Saga Detail Modal (chronological volume timeline, inline renumbering, `+ Add Vol. X` prefill, and standalone book bulk linker), series autocomplete, and full IndexedDB v2 + JSON backup portability.
- **Advanced Reading Analytics (`/stats`):** 100% client-side analytics powered by Angular Signals and native SVG/CSS visualizations. Includes reactive time-horizon filters (This Year, Last 12 Months, All Time, Specific Year), 4 executive KPI cards, hybrid `ReadingLog` + direct book progress aggregation, interactive 3-metric velocity chart, format donut, status stacked bar, ratings histogram, top authors, weekday reading pace, and period highlights.
- **Library Management:** Organize books by reading status (_Pending_, _Reading_, _Completed_, _Abandoned_) with cover previews, ratings, and format tracking.
- **ISBN Barcode Scanner & 5-Source Metadata Auto-Fill:** Lazy-loaded camera & image-file ISBN-10/13 barcode scanner (`html5-qrcode`) and on-demand 5-provider metadata waterfall (**Open Library**, **Google Books**, **Wikidata**, **Apple Books ES**, and **Internet Archive / Crossref**) with cross-edition fusion, balanced 8-result ranking, automatic local cover compression, duplicate detection, and smart edit-mode field protection.
- **Session Logging & Bidirectional Progress:** Log reading sessions with page deltas and time spent; BookStack automatically recalculates `currentPage`, completion percentage, and status transitions.
- **Reading Analytics:** Real-time computed metrics for reading speed (`pp/h`), status distribution, and monthly reading activity.
- **Client-Side Cover Optimization:** Built-in HTML5 Canvas pipeline compresses uploaded covers ($\le 400\text{px}$, WebP/JPEG) before saving locally.
- **Warm Modern Editorial Design System & 4-Edge Dockable Shell:** Semantic `@theme` surfaces with 5 WCAG AA accent palettes (`blue`, `indigo`, `emerald`, `amber`, `rose`), `Light` / `Dark` / `System` theme persistence, cached `16×16` canvas cover-color adaptive tinting (`--book-tint`), a 4-edge dockable desktop shell (`left`/`right` collapsible `68px` ↔ `240px`, or `top`/`bottom` floating bar with magnetic drag-and-snap), and a unified 2-edge (`top`/`bottom`) floating mobile dock (`< 768px`) with `@container`-driven grids.
- **100% Local-First Privacy & Offline PWA:** Data stays on your device using ACID-resilient `IndexedDB` batch transactions (with safe `LocalStorage` fallback and Zod schema validation), while `@angular/service-worker` caches the app shell for full offline use. Includes transparent privacy, MIT license, and third-party API disclosures in `/about` plus an explicit camera consent gate for barcode scanning.
- **Settings, Data Portability, Data Health & Integral Auto-Enrichment (`/settings`):** Unified interface preferences (language, light/dark theme, default catalog view), real-time 4-category storage quota & byte inspector, 4-mode offline export/import suite (**Portable `.ZIP` Archive** with `backup.json` + `catalog.csv` + `covers/` images, **Full Base64 JSON**, **Lightweight Text-Only JSON**, and expanded **RFC 4180 CSV**), flexible external/AI JSON & CSV normalizer with pre-import validation preview (`Merge` vs. `Overwrite`), automatic post-import & on-demand **Integral Metadata & Cover Enrichment** (ISBN $\to$ Title+Author cascade backfilling covers, `totalPages`, `publicationYear`, `publisher`, `isbn`, and `series`, plus Step-by-Step Visual Assistant), a 1-click **Library Data Health Auditor** (detecting and fixing anomalous dates, completed-book page mismatches, probable duplicates, and fragmented saga names), accessible in-app confirmation dialogs (`<app-confirm-dialog>`) with entity previews, and a 2-tier Danger Zone reset modal with 1-click pre-reset backup.
- **Multi-Language i18n (`es` / `en`):** Spanish (`es`) default UI with complete modular Signal-based Spanish and English translation dictionaries switchable live from `/settings`.

---

## Tech Stack

- **Frontend:** Angular 22+ (Standalone Components, Signals, `@if`/`@for` Control Flow, `OnPush`, Lazy Routes)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Icons:** `@lucide/angular`
- **Validation:** `zod`
- **Local Persistence:** Browser `IndexedDB` + `LocalStorage` fallback
- **Testing & Quality:** Vitest 5, Playwright E2E, ESLint + `angular-eslint`, Prettier

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/aitorgallegocr21/bookstack.git
cd bookstack

# 2. Checkout develop for active development
git checkout develop

# 3. Install dependencies
npm install

# 4. Start the local dev server
npm run dev
```

---

## Quality & Verification Commands

| Command                    | Description                                                                           |
| :------------------------- | :------------------------------------------------------------------------------------ |
| `npm run verify:quiet`     | Token-optimized gate (auto-fixes format/lint + compact `check`/`lint`/`test`/`build`) |
| `npm run verify`           | Full verbose quality gate (`check` + `lint` + `format` + `test` + `build`)            |
| `npm run verify:fast`      | Quick quality gate (`check` + `lint` + `format` + `test`)                             |
| `npm run test:file -- <f>` | Run Vitest on a single spec file with minimal output                                  |
| `npm run check`            | Strict TypeScript type checking (`app` and `spec`)                                    |
| `npm run lint`             | ESLint + `angular-eslint` + template accessibility rules                              |
| `npm run format`           | Prettier formatting and Tailwind v4 class sorting check                               |
| `npm test`                 | Run Vitest unit & component tests                                                     |
| `npm run test:e2e`         | Run Playwright End-to-End browser tests                                               |
| `npm run build`            | Production build to `dist/bookstack/browser`                                          |

---

## Branching & Documentation Workflow

- **`main`:** Production-ready branch deployed automatically to GitHub Pages. Updated strictly via verified GitHub Pull Requests from `develop`.
- **`develop`:** Primary integration branch for daily feature, fix, and refactoring work.
- **Engineering Docs:** See [`AGENTS.md`](AGENTS.md), [`CONTEXT.md`](CONTEXT.md), [`docs/TASKS.md`](docs/TASKS.md), [`docs/ROADMAP.md`](docs/ROADMAP.md), and [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

---

## License

Licensed under the [MIT License](LICENSE).
