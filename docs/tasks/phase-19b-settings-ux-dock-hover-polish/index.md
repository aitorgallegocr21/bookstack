# Phase 19B: Settings UX Polish, Dock Popover Auto-Close, Book Hover Refinement & Feature Governance (`v2.5.1`)

- **Status:** Completed
- **Target Version:** `2.5.1`
- **Branch:** `develop`
- **Depends On:** [Phase 19: Extended Categorized Settings, Privacy/Offline Controls & Web Crypto Backups (`v2.5.0`)](../phase-19-extended-settings-privacy-crypto/index.md)

---

## 1. Objective

Deliver a focused visual, ergonomics, and governance polish pass following Phase 19 (`v2.5.0`):

1. **Settings Navigation & Search Polish (`/settings`):**
   - Remove the `Experto` / `Expert` pill badge from the **Avanzado y sistema** (`advanced`) tab and communicate its elevated/system role via a subtle semantic rose/red color treatment without increasing tab dimensions.
   - Replace the horizontally scrollable mobile/tablet tab strip (`< 1024px`) with a zero-scroll **2-column Adaptive Bento category grid** (`2×2` primary categories + full-width `col-span-2` rose-accented Advanced row) so every category is immediately visible and tappable (`>= 44×44px`) from `320px` to `1023px`.
   - Eliminate the duplicate native `::-webkit-search-cancel-button` "X" icon in the `/settings` search input (keeping only the accessible custom Lucide clear button + Escape-to-clear).
   - Add clean vertical breathing room between the **"Resolución máxima"** (`coverMaxDimension`) and **"Resultados por búsqueda"** (`metadataSearchQuota`) labels and their option card grids in `SettingsAdvancedSectionComponent`.
2. **Dock Layout Popover Auto-Close (`SidebarComponent` & `BottomNavComponent`):**
   - Fix the desktop dock layout (`disposición`) popover so it closes immediately when clicking any other dock navigation link/action, clicking anywhere outside the popover/trigger, navigating via Angular `Router`, or pressing `Escape`.
3. **Book Card Hover Clipping Fix & Zero-Cost Adaptive Tint Intensification (`/books`):**
   - Eliminate the top-border and shadow clipping on book card hover caused by `contain: paint` / `content-visibility: auto` on `.catalog-card-contain` by expanding the host paint box with symmetric padding + matching negative margin (preserving full `content-visibility: auto` rendering performance).
   - Intensify each book's adaptive `--book-tint` color on hover (background wash, border, and soft glow) using **zero-cost pure CSS** (`color-mix()` transitions already declared on `.card-lift`, zero JS/Canvas work).
   - Fix `reducedMotion` (`html[data-reduced-motion='reduce']` & `@media (prefers-reduced-motion: reduce)`) so hover lift (`-translate-y-*`), cover zoom (`scale-*`), and intense hover tint effects are fully neutralized, and ensure disabling `adaptiveCoverTint` renders a clean neutral card without falling back to `--accent-primary`.
4. **Permanent Feature Governance Protocol:**
   - Codify a mandatory **Settings Relevance & Reduced-Motion Governance Gate** in `AGENTS.md` (Rule 11) and `docs/DESIGN_SYSTEM.md` so every future feature is explicitly evaluated for `/settings` integration and `reducedMotion` / `adaptiveCoverTint` / `offlineMode` compliance.

---

## 2. Atomic Tasks

- [x] **[Task 19B.1: Settings UX Polish — Red Advanced Tab, Zero-Scroll Mobile Bento Tabs, Single Search Clear & Advanced Spacing](task-19b.1-settings-ux-tabs-search-spacing.md)**
- [x] **[Task 19B.2: Dock Popover Auto-Close, Book Card Hover Clipping Fix & Zero-Cost Adaptive Tint Intensification](task-19b.2-dock-popover-autoclose-and-book-hover-polish.md)**
- [x] **[Task 19B.3: Feature Governance Rules (`AGENTS.md` & `DESIGN_SYSTEM.md`), Full QA Gate & `v2.5.1` Tier 2 Sync](task-19b.3-governance-docs-and-phase-19b-sync.md)**

---

## 3. Quality & Regression Gate

- Unit/Component tests (`Vitest` + Angular TestBed) covering all modified components and regression scenarios.
- Playwright E2E tests (`tests/e2e/`) verifying zero horizontal overflow at `320px`/`375px`/`768px`, zero-scroll mobile settings grid, single search clear control, desktop dock popover auto-close on dock navigation, and unclipped book card hover borders.
- Full verification via `npm run verify:quiet` and `npm run test:e2e`.
