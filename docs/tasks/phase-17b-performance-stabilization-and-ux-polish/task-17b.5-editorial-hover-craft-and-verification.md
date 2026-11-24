# Task 17B.5: Editorial Hover Micro-Interactions, Full Verification & Tier 2 Docs Sync (`v2.3.1`)

- **Phase:** 17B — Performance Stabilization, Route Transitions & Editorial UX Polish (`v2.3.1`)
- **Status:** Pending
- **Goal:** Elevate hover micro-interactions across navigation docks, book/saga cards, dashboard tiles, and interactive buttons with theme-aware GPU-composited polish (`@media (hover: hover)` + reduced-motion guards, zero `transition-all`), run the full verification & Playwright E2E suites, and complete the Tier 2 docs sync (`v2.3.1`) and branch cleanup.

---

## 1. Hover Micro-Interaction Polish Specification

All hover enhancements MUST strictly use GPU-composited properties (`transform`, `opacity`, `background-color`, `border-color`, `box-shadow`), NEVER use `transition-all`, and wrap pointer-hover elevations in `@media (hover: hover)` so touch devices do not suffer sticky hover states:

1. **Navigation Docks (`sidebar.html` & `bottom-nav.html`):**
   - Nav items transition smoothly into a soft accent-tinted wash (`hover:bg-accent-soft/65 hover:text-accent-soft-text`) instead of a flat gray box, with a subtle icon micro-nudge/scale (`group-hover:scale-105`).
   - Primary `+` Add Book CTA gets a subtle tactile lift (`hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]`) and accent shadow bloom.
2. **Book & Saga Cards (`src/styles.css` `.book-tint-card`, `.book-tint-row`):**
   - Enhance `.book-tint-card:hover` with a refined cover-tinted editorial glow:
     ```css
     @media (hover: hover) {
       .book-tint-card:hover {
         border-color: color-mix(
           in srgb,
           var(--book-tint, var(--accent-primary)) 44%,
           var(--border-strong)
         );
         box-shadow:
           0 8px 20px -6px
             color-mix(in srgb, var(--book-tint, var(--accent-primary)) 18%, transparent),
           0 2px 6px -1px rgba(28, 25, 23, 0.06);
       }
     }
     ```
   - Enhance `.book-tint-row:hover` with a crisp left accent border/tint wash for scannability in Compact List mode.
3. **Interactive Editorial Utility Classes (`src/styles.css`):**
   - Add `.editorial-hover-card` (subtle border-accent highlight + gentle lift on hover) for interactive Dashboard / About / Settings cards, and `.btn-tactile` (`active:scale-[0.98]`) for primary/secondary buttons.
   - Ensure all hover animations are neutralized under `@media (prefers-reduced-motion: reduce)`.

---

## 2. Target Files & Line Pointers

- `src/styles.css` (L491-L575 & L647-L664 — refine `.book-tint-card:hover`, `.book-tint-row:hover`, add `.editorial-hover-card` & `@media (hover: hover)` + reduced-motion guards)
- `src/app/core/components/sidebar/sidebar.html` (L53-L140, L243-L385 — accent-tinted hover washes & tactile CTA states)
- `src/app/core/components/bottom-nav/bottom-nav.html` (L28-L180 — accent-tinted hover states for popover & dock buttons)
- `package.json` (L3 — bump `"2.3.0"` $\to$ `"2.3.1"`)
- `docs/tasks/phase-17b-performance-stabilization-and-ux-polish/index.md` (mark all tasks `[x]` and `Status: Completed`)
- `docs/TASKS.md`, `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, `README.es.md` (Tier 2 Per-Phase Sync)

---

## 3. Verification & Tier 2 Sync Checklist

- [ ] Verify zero `transition-all` occurrences across `src/` (`rg "transition-all" src/`).
- [ ] Run `npm run verify:quiet` (all 5 gates: `check`, `lint`, `format`, `test`, `build`).
- [ ] Run `npm run test:e2e:quiet` (all Playwright E2E specs pass across mobile & desktop viewports).
- [ ] Complete Tier 2 Documentation Sync (`package.json` `2.3.1`, `docs/TASKS.md`, `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, `README.es.md`).
- [ ] Merge `fix/phase-17b-performance-and-ux-polish` into `develop`, push `origin/develop`, and execute Autonomous Branch Hygiene cleanup (delete completed branch locally and on `origin`).
