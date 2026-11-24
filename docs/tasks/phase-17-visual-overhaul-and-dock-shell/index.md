# Phase 17: Major Visual Overhaul, 4-Edge Dockable Shell & Adaptive Cover Aesthetics (`v2.3.0`)

- **Status:** Completed (2026-11)
- **Target Release:** `v2.3.0` (Minor release on completion; `v3.0.0` reserved for Phase 20 Integrated eBook Reader milestone)
- **Recommended Branch:** `feat/phase-17-visual-overhaul-and-dock-shell` (branched from `develop`)

## 1. Phase Mission & Design Decisions (Resolved via `/grill-me`)

Elevate BookStack's entire interface to a **Warm Modern Editorial** aesthetic while introducing a high-craft, GPU-efficient **4-edge dockable desktop shell**, a **unified 2-edge floating mobile dock**, **official Brand Logo visibility**, **cached cover-color adaptive tinting**, and **mobile lookup/scanner UX fixes** — with zero external font requests, zero `transition-all`, and strict WCAG 2.1 AA compliance down to `320px`.

### Agreed Architecture & Visual Pillars

1. **Warm Modern Editorial Surfaces (`@theme` in `src/styles.css`):**
   - Light mode: warm paper/stone canvas (`#f6f4ef` / `#fcfbf8` cards) instead of cold blue-slate.
   - Dark mode: rich high-contrast warm charcoal (`#111010` canvas / `#1a1817` cards) instead of cold `slate-950`.
2. **Zero-Overhead Editorial Typography:**
   - Optimized native system font stack (`sans` for UI + editorial `serif` stack for display headings & book titles) + `tabular-nums` on all KPIs, counters, ratings, and page numbers (`0 KB` bundle overhead, 100% offline/private).
3. **5 Curated WCAG AA Brand Accent Palettes + `system` Theme Mode:**
   - `blue` (Classic Blue), `indigo` (Indigo), `emerald` (Emerald), `amber` (Editorial Amber), `rose` (Rose/Terracotta) via `[data-accent]` CSS custom properties.
   - `ThemeMode = 'light' | 'dark' | 'system'` with reactive `matchMedia` listener persisted in `localStorage`.
4. **4-Edge Dockable Desktop Shell & Unified 2-Edge Floating Mobile Dock:**
   - **Desktop (`>= 768px`):** Supports all 4 positions (`left` default collapsible `68px` ↔ `240px`, `right` collapsible, `top` floating horizontal bar, `bottom` floating horizontal dock) via both magnetic quadrant drag-and-snap (with visual snap preview) and an accessible quick-dock popover.
   - **Mobile (`< 768px`):** Unifies the legacy separate `HeaderComponent` and `BottomNavComponent` into a **single floating translucent Mobile Dock** movable between `bottom` (default) and `top` (reclaiming ~60px of vertical viewport space). Contains the 4 primary routes (`/`, `/books`, `/stats`, `/settings`), central `+` Add Book CTA, and compact official BookStack Brand Logo / Menu button that opens a directional spring popover (Theme, `/series`, `/about`, GitHub, Top ↔ Bottom toggle).
5. **Official Project Icon (`public/favicon.svg`) In-App:**
   - Reusable `<app-brand-logo>` rendering the official 3-book stack SVG (`amber` + `indigo` + `blue`) inside the Desktop Dock, Unified Mobile Dock, and `/about` Hero Header.
6. **High-Performance Cover-Color Adaptive Tinting (`CoverColorService`):**
   - Extracts a tasteful muted dominant hue **once** via a tiny `16×16` offscreen `<canvas>` (`< 1ms`), cached in memory + bounded `localStorage` LRU (`bookstack_cover_tints_v1`), with an instant `O(1)` deterministic title+author editorial fallback when no cover exists or CORS blocks pixel reads.
   - Applied via `--book-tint` CSS variable as a subtle editorial ambient wash (`8%–14%` light / `14%–22%` dark), hover border highlight, and immersive `BookDetailModal` hero gradient while keeping 100% WCAG AA text contrast.
7. **Mobile Metadata Lookup & ISBN Scanner Layout Fix:**
   - Fixes cramped/overlapping button clusters and awkward text indentation in `BookMetadataLookupComponent` and `IsbnScannerComponent` at `320px–430px`.
8. **Settings Scope Boundary:**
   - Phase 17 adds only essential Appearance controls to `/settings` (Theme Mode `Light/Dark/System`, 5 Accent Swatches, and Dock Position). Deep UI density, card action toggles, and advanced customization remain scoped to **Phase 18**.
9. **GPU-Composited Micro-Transitions:**
   - Clean, eye-catching, low-overhead transitions using strictly GPU-composited properties (`transform`, `opacity`, `background-color`, `border-color`), `prefers-reduced-motion: reduce` guards, and zero `transition-all`.

---

## 2. Atomic Task Checklist

- [x] **[Task 17.1: Semantic `@theme` Tokens, 5 Accent Palettes, `system` Theme Mode & `<app-brand-logo>`](task-17.1-theme-tokens-accents-and-brand-logo.md)** — Core CSS `@theme` architecture, warm editorial light/dark surfaces, 5 WCAG AA accents, `ThemeService` upgrade (`system` mode + accent persistence), GPU transition utilities, and official `<app-brand-logo>` component.
- [x] **[Task 17.2: 4-Edge Dockable Desktop Shell & Unified 2-Edge Floating Mobile Dock](task-17.2-dockable-desktop-and-unified-mobile-shell.md)** — `DockPositionService`, magnetic drag-and-snap utility, redesigned 4-edge desktop dock, unified floating 2-edge mobile dock (retiring separate mobile header), directional popovers, and dynamic `App` shell offsets.
- [x] **[Task 17.3: Cached Cover-Color Adaptive Tinting, Tactile Book/Saga Cards & `BookDetailModal`](task-17.3-cover-color-tinting-cards-and-detail-modal.md)** — `CoverColorService` (`16×16` canvas extraction + `O(1)` persistent cache + deterministic fallback), tactile cover framing across Grid/Detailed/Compact cards & `SagaBentoCard`, and cover-tinted `BookDetailModal` hero redesign.
- [x] **[Task 17.4: Mobile Metadata Lookup & ISBN Scanner Fix + Editorial Modals & Forms](task-17.4-mobile-lookup-scanner-fix-and-modals.md)** — Fix mobile button alignment/overlap in `book-metadata-lookup` and `isbn-scanner`, and migrate shared form controls and all modals/dialogs to the warm editorial token system.
- [x] **[Task 17.5: Full-App Editorial Surface Migration & Essential `/settings` Appearance Controls](task-17.5-full-editorial-surface-migration-and-settings.md)** — Migrate `/`, `/books`, `/series`, `/stats`, `/settings`, and `/about` (with `<app-brand-logo>`) to semantic `@theme` tokens, `tabular-nums`, and dynamic accents; add Theme Mode, 5 Accent Swatches, and Dock Position controls to `/settings` with full ES/EN i18n.
- [x] **[Task 17.6: Playwright E2E Suite, Performance Verification & Tier 2 Docs Sync (`v2.3.0`)](task-17.6-e2e-verification-and-phase-sync.md)** — Update & expand Playwright E2E specs (4-edge desktop dock, unified mobile dock `top`/`bottom` at `320px`/`375px`, accent & theme persistence, mobile lookup/scanner layout, cover tinting), verify bundle & `npm run verify:quiet`, and complete Tier 2 docs sync.
