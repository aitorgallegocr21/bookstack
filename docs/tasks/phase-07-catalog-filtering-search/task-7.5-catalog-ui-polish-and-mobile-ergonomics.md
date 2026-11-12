# Task 7.5: Catalog UI Polish, Uniform Card Sizing & Mobile Filter Ergonomics

**Phase:** Phase 07: Catalog Filtering, Search & View Density  
**Status:** Completed  
**Estimated Impact:** Medium-High (fixes toolbar-to-catalog spacing, enforces uniform card heights across all view modes, fixes dark/light hover states, adds smooth CSS drawer transitions, surfaces a 1-click inline filter reset button, and replaces the narrow-viewport horizontal scrollbar with an accessible mobile status selector).

---

## 1. Root Cause Analysis (Current Code Findings)

1. **Missing Spacing Between Filter Toolbar and Book Cards:**
   - `CatalogToolbarComponent` (`catalog-toolbar.component.ts`) omits `host: { class: 'block' }`, causing `<app-catalog-toolbar>` to default to `display: inline`. Consequently, the parent `space-y-6` utility in `books-page.html` fails to apply consistent vertical margin below the toolbar across all three view modes.
2. **Inconsistent Card Heights on Long Titles / Optional Metadata:**
   - `BookGridCardComponent` (`book-grid-card.component.html`) and `BookDetailedCardComponent` (`book-detailed-card.component.html`) lack `host: { class: 'block h-full' }` and `h-full` on `<article>`.
   - In `BookGridCardComponent`, 1-line vs. 2-line titles change the `<h2>` height, shifting card proportions and vertical alignment.
   - In `BookDetailedCardComponent`, optional badges (such as series/saga pills or rating badges) alter card heights within the same CSS grid row.
3. **Broken Dark-Mode Hover & Simple Light-Mode Hover on Filter Chips:**
   - `catalog-toolbar.component.html` uses `dark:hover:bg-slate-750` on inactive status chips (line 134) and on the secondary filter toggle button (line 163). Tailwind CSS v4 does not include `slate-750` in the default palette, resulting in zero hover feedback in dark mode, while light mode uses a flat `bg-slate-100 hover:bg-slate-200` without border/elevation refinement.
4. **Abrupt Open/Close of the Secondary Filter Drawer:**
   - The secondary filter drawer is conditionally mounted via `@if (isFilterDrawerOpen())`, causing an abrupt layout jump on both open and close.
5. **Hidden "Reset Filters" Action:**
   - Currently, the `Limpiar filtros` button is only rendered inside the collapsed secondary drawer (`catalog-toolbar.component.html` line 263) or in the zero-match empty state. Users applying a quick status chip or search query with the drawer closed have no immediate 1-click reset control.
6. **Visible Horizontal Scrollbar on Narrow Viewports & Mobile Status UX:**
   - Line 124 of `catalog-toolbar.component.html` references `.no-scrollbar`, which is not defined in `src/styles.css`, causing an ugly native horizontal scrollbar to appear below the status chips on mobile and narrow desktop windows.

---

## 2. Technical Objectives

1. **Fix Toolbar-to-Catalog Spacing (`books-page.html`, `catalog-toolbar.component.ts`):**
   - Add `host: { class: 'block' }` to `CatalogToolbarComponent`.
   - Use `flex flex-col gap-6` (or `gap-5 sm:gap-6`) on the main container in `books-page.html` so spacing between `<header>`, `<app-catalog-toolbar>`, and the catalog `<section>` is guaranteed in `grid`, `detailed`, and `compact` modes.
2. **Uniform Card Sizing Across All Viewports (`book-grid-card`, `book-detailed-card`):**
   - Add `host: { class: 'block h-full' }` to both `BookGridCardComponent` and `BookDetailedCardComponent`, and `h-full` on their root `<article>` elements so every card in a CSS grid row stretches to identical height.
   - In `BookGridCardComponent`, give the `<h2>` title container a consistent 2-line reserved height (`min-h-[2.5rem] leading-5`) with `line-clamp-2` so cards with 1-line and 2-line titles share identical geometry and bottom-action alignment.
   - In `BookDetailedCardComponent`, keep the metadata/progress column in a `flex-1 flex flex-col justify-between` container so progress bars and footer actions align uniformly regardless of whether a book has a series badge or rating.
3. **Polished Light & Dark Hover States (`catalog-toolbar.component.html`):**
   - Replace the invalid `dark:hover:bg-slate-750` class on status chips and the secondary filter button.
   - Inactive chip styling:
     - **Light:** `border border-slate-200/90 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 hover:shadow-2xs`
     - **Dark:** `dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700/80 dark:hover:text-white`
   - Active chip styling: `border border-blue-600 bg-blue-600 text-white shadow-xs hover:bg-blue-500 dark:border-blue-500 dark:hover:bg-blue-500`.
4. **Smooth, Efficient Open/Close Transition for Advanced Filter Drawer (`catalog-toolbar.component.html`):**
   - Replace `@if (isFilterDrawerOpen())` with a lightweight CSS Grid row transition:
     - Wrapper: `grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none` toggling between `grid-rows-[1fr] opacity-100` and `pointer-events-none grid-rows-[0fr] opacity-0`.
     - Inner container: `overflow-hidden`.
     - Accessibility: bind `[attr.aria-hidden]="!isFilterDrawerOpen()"` and `[attr.inert]="!isFilterDrawerOpen() ? '' : null"` so collapsed controls are excluded from keyboard Tab order and screen readers.
5. **Contextual 1-Click "Reset Filters" Button (`catalog-toolbar.component.html`):**
   - Render a compact reset button (`@if (hasActiveFilters())`) directly in the bottom quick-filter bar next to the `Filtros` button (with `RotateCcw` icon + localized label `Limpiar` / `Reset`), visible whenever any filter (search query, status chip, format, or minimum rating) is active.
6. **Eliminate Narrow-Viewport Scrollbar & Upgrade Mobile Status Filter UX (`src/styles.css`, `catalog-toolbar.component.html`):**
   - Define `.no-scrollbar` cleanly in `src/styles.css` (`scrollbar-width: none; -ms-overflow-style: none;` and `::-webkit-scrollbar { display: none; }`) so intermediate tablet widths never render native scrollbars.
   - On mobile (`< sm`, i.e., `< 640px`), replace the horizontal scrolling chip strip with a sleek, accessible native/styled status selector (`sm:hidden`, $\ge 44\text{px}$ touch target, showing the active status and live count, e.g., `Todos (5)`), while displaying the horizontal pill bar from `sm:flex` (`>= 640px`) upward.

---

## 3. Verification Gate

- `npm run verify` (`check` + `lint` + `format` + `test` + `build`)
- `npm run test:e2e` (verify `catalog-flow.spec.ts` and `overflow.spec.ts` with updated mobile status selector, uniform card heights, and zero horizontal overflow)
