# Task 14.7: Modern `/about` Page Redesign, Playwright E2E Suite & Tier 2 Sync

**Phase:** [Phase 14: Visual Polish, Responsive Layout & UX Refinements](index.md)  
**Status:** Pending  
**Recommended Model:** Gemini 4 Neon (Medium)

---

## 1. Objective

Complete Phase 14 by:

1. Redesigning `/about` (`AboutPage`) with modern, concise Bento-style cards (tighter project overview, Local-First manifesto highlights, and compact Privacy & Legal cards) followed by a sleek **Personal Author Profile Card** at the bottom featuring **Aitor Gallego-Casilda Romero**, the motto _"Aprende y deja aprender."_ (_"Learn and let learn."_), links to **GitHub**, **Personal Website**, **Instagram**, and a prominent **Source Code** (`Código fuente`) button.
2. Adding/updating Playwright E2E responsive regression tests verifying zero horizontal overflow and clean layout across ~1000px tablet (with expanded sidebar) and 375px mobile viewports across `/`, `/books`, `/series`, `/stats`, and `/about`.
3. Running the full verification gates (`npm run verify:quiet` + `npm run test:e2e`) and executing **Tier 2 Per-Phase Documentation Sync** + **Autonomous Branch Hygiene**.

---

## 2. Target Files & Line Pointers

- `src/app/features/about/pages/about-page/about-page.ts` — L1-L12 (import Lucide icons: `LucideCode2`, `LucideGlobe`, `LucideGithub`, `LucideInstagram`, `LucideShieldCheck`, `LucideDatabase`, `LucideScale`, `LucideSparkles`, `LucideExternalLink`, etc.).
- `src/app/features/about/pages/about-page/about-page.html` — L1-L172 (full modern concise Bento redesign + bottom Author Profile Card).
- `src/app/core/i18n/domains/about.i18n.ts` — L1-L202 (tighten verbose copy and add bilingual `es`/`en` keys for author motto, personal website, Instagram, and concise source code button).
- `src/app/features/about/pages/about-page/about-page.spec.ts` — Unit tests verifying author profile links (`github.com/aitorgallegocr21`, `aitorgallegocr21.github.io/personal-website/`, `instagram.com/aitorgallegoo_cr/`, `github.com/aitorgallegocr21/bookstack`), `rel="noopener noreferrer"`, and motto rendering.
- `tests/e2e/overflow.spec.ts` — Add ~1000px tablet-with-sidebar checks alongside existing mobile checks.
- `tests/e2e/dashboard-flow.spec.ts`, `tests/e2e/catalog-flow.spec.ts`, `tests/e2e/series-flow.spec.ts`, `tests/e2e/analytics-flow.spec.ts` — Update/add assertions for Phase 14 visual/responsive guarantees.
- **Tier 2 Sync Targets:** `docs/tasks/phase-14-visual-polish-and-responsive-ux/index.md`, `docs/TASKS.md`, `CONTEXT.md`, `README.md`, `README.es.md`.

---

## 3. Implementation Checklist

- [ ] **Bilingual i18n Updates (`about.i18n.ts`):**
  - Keep existing privacy/legal disclosures accurate while making project manifesto and feature descriptions tighter and easier to scan.
  - Add keys:
    - `authorMotto`: `'Aprende y deja aprender.'` (`es`) / `'Learn and let learn.'` (`en`)
    - `personalWebsiteLabel`: `'Web personal'` (`es`) / `'Personal Website'` (`en`)
    - `personalWebsiteAria`: `'Página web personal de Aitor Gallego-Casilda Romero'` (`es`) / `'Aitor Gallego-Casilda Romero personal website'` (`en`)
    - `instagramLabel`: `'Instagram'` (`es` & `en`)
    - `instagramAria`: `'Perfil de Instagram de Aitor Gallego-Casilda Romero'` (`es`) / `'Aitor Gallego-Casilda Romero Instagram profile'` (`en`)
    - `sourceCodeLabel`: `'Código fuente'` (`es`) / `'Source Code'` (`en`)
- [ ] **Modern Concise `/about` Redesign (`about-page.ts` & `about-page.html`):**
  - Use a clean responsive container (`max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6`).
  - **Top Section (Project Overview & Local-First Pillars):**
    - Compact hero header with BookStack badge/version pill (`v1.0.0`), concise subtitle, and tech stack pills (`Angular 22+`, `Tailwind CSS v4`, `IndexedDB`, `PWA`).
    - Compact 2-column Bento grid for **Local-First Manifesto** (tight bullet points with Lucide icons) and **Privacy & Permissions** (local storage, optional external lookup, local camera barcode decoding).
    - Compact collapsible or streamlined **License & Attributions** card (MIT License, warranty notice, Open Library / Google Books / OSS stack).
  - **Bottom Featured Section (Personal Author Profile Card):**
    - Modern elevated card with avatar monogram (`AG`) or sleek gradient accent, full name **Aitor Gallego-Casilda Romero**, and the motto _"Aprende y deja aprender."_ (_"Learn and let learn."_).
    - Clean action button row (`flex flex-wrap gap-2.5`) with accessible `min-h-[44px]`, `target="_blank"`, `rel="noopener noreferrer"`:
      - **GitHub:** `https://github.com/aitorgallegocr21`
      - **Web personal:** `https://aitorgallegocr21.github.io/personal-website/`
      - **Instagram:** `https://www.instagram.com/aitorgallegoo_cr/`
      - **Código fuente** (primary highlighted button): `https://github.com/aitorgallegocr21/bookstack`
- [ ] **Unit & Playwright E2E Regression Coverage:**
  - Create/update `about-page.spec.ts` verifying all 4 external URLs, `rel="noopener noreferrer"`, motto text, and i18n language switching (`es` $\leftrightarrow$ `en`).
  - Run & update Playwright E2E specs to verify:
    - Zero horizontal overflow at `375px` mobile and `1000px` tablet (with expanded sidebar) across `/`, `/books`, `/series`, `/stats`, `/about`.
    - Dashboard 6-month compact activity widget & `/stats` link, non-scrolling parallel reads grid.
    - Catalog filter toolbar & card action buttons without overflow.
    - Series full-width multi-volume cards & wrapping covers without horizontal scroll.
    - `/about` profile links present and reachable.
- [ ] **Full Verification & Tier 2 Per-Phase Sync:**
  - Run `npm run verify:quiet` and `npm run test:e2e`.
  - Mark Phase 14 as `Completed` in `docs/tasks/phase-14-visual-polish-and-responsive-ux/index.md` and move Phase 14 to `Completed Phases` in `docs/TASKS.md`.
  - Synchronize `CONTEXT.md`, `README.md`, and `README.es.md`.
  - Merge `feature/14-visual-polish-responsive-ux` into `develop`, push `origin/develop`, and run Autonomous Branch Hygiene cleanup (delete completed feature branch locally and on origin).

---

## 4. Verification Gate

1. `npm run test:file -- src/app/features/about/pages/about-page/about-page.spec.ts`
2. `npm run verify:quiet`
3. `npm run test:e2e`
4. Tier 2 Per-Phase Doc Sync + Branch Hygiene.
