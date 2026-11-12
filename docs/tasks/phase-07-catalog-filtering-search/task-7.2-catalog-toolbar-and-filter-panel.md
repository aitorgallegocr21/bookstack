# Task 7.2: Catalog Toolbar & Filter Panel

**Phase:** Phase 07: Catalog Filtering, Search & View Density  
**Status:** In Progress  
**Estimated Impact:** Medium-High (new reusable standalone toolbar component, search input with clear button, status chips with real-time badges, view mode toggle, collapsible secondary filter panel).

---

## 1. Technical Objectives

1. **`CatalogToolbarComponent` Architecture:**
   - Create standalone component in `src/app/features/books/components/catalog-toolbar/`:
     - Inputs:
       - `criteria: CatalogFilterCriteria` (or individual input signals)
       - `viewMode: CatalogViewMode`
       - `sortOption: CatalogSortOption`
       - `statusCounts: Record<BookStatus | 'all', number>`
       - `totalBooks: number`
       - `filteredBooksCount: number`
     - Outputs:
       - `criteriaChange: OutputEmitterRef<Partial<CatalogFilterCriteria>>`
       - `viewModeChange: OutputEmitterRef<CatalogViewMode>`
       - `sortChange: OutputEmitterRef<CatalogSortOption>`
       - `resetFilters: OutputEmitterRef<void>`
2. **Top Control Bar:**
   - **Search Input:**
     - Search icon prefix + text input with placeholder (`i18n.t().catalog.searchPlaceholder`).
     - Clear button (`x`) appearing when `searchQuery.length > 0` that clears the query in 1 click.
     - Responsive width: full width on mobile, flexible expand on tablet/desktop.
   - **View Mode Switcher:**
     - Segmented button group with 3 icon buttons:
       - `Grid` (LayoutGrid icon) -> Bookshelf visual mode
       - `Detailed` (LayoutList or ListFilter icon) -> Media-object cards
       - `Compact` (AlignJustify or Rows icon) -> Condensed rows
     - Highlights active mode with contrasting background (`bg-white shadow-xs dark:bg-slate-800`).
     - Tooltips and `aria-label`s for full accessibility.
   - **Sort Selector:**
     - Stylized dropdown select bound to `sortOption`.
     - Supports all 7 sort options with localized labels.
3. **Bottom Quick Filter Row:**
   - **Status Filter Chips:**
     - Horizontal scrolling container (`overflow-x-auto no-scrollbar py-1`) with chips:
       - `Todos`, `Leyendo`, `Pendientes`, `Completados`, `Abandonados`
     - Each chip displays the localized label plus a rounded counter badge showing real-time quantity.
     - Active chip highlighted with primary brand colors (`bg-blue-600 text-white` or dark equivalent).
   - **Secondary Filters Toggle Button:**
     - Button labeled "Filtros" with Filter icon and a badge indicator showing count of active secondary filters (format != 'all' + minRating > 0).
     - Clicking toggles the collapsible advanced filter drawer/panel.
4. **Collapsible Secondary Filter Drawer:**
   - Smooth expand/collapse panel directly underneath the toolbar.
   - **Format Filter:** Pill buttons or select for formats (`Todos`, `Tapa blanda`, `Tapa dura`, `eBook`, `Audiolibro`).
   - **Rating Filter:** Interactive star selector (1★+, 2★+, 3★+, 4★+, 5★, or `Todas`).
   - **Reset Filter Action:** "Limpiar filtros" link/button with badge showing active filter count.
5. **Ergonomic & A11y Standards:**
   - All interactive targets $\ge 44\times44\text{px}$.
   - Focus ring indicators (`focus-visible:ring-2 focus-visible:ring-blue-500`).
   - Zero horizontal overflow at $350\text{px}$.

---

## 2. Verification Gate

- `npm run check`
- `npm run lint`
- `npm run format`
- `npm test`
