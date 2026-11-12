# Task 7.3: Three View Modes & Zero-Match Empty State

**Phase:** Phase 07: Catalog Filtering, Search & View Density  
**Status:** In Progress  
**Estimated Impact:** High (modular view rendering, book grid card, detailed card refinement, compact row component, dedicated zero-match empty state).

---

## 1. Technical Objectives

1. **View Mode 1: Visual Bookshelf Grid (`BookGridCardComponent`):**
   - Create standalone component in `src/app/features/books/components/book-grid-card/`:
     - Large 2:3 ratio book cover with rounded corners, subtle border, and elevation on hover (`hover:-translate-y-1 hover:shadow-lg transition-transform`).
     - Floating top badge: discrete status pill (Reading, Completed, Pending, Dropped) or rating stars.
     - Bottom progress bar overlay at the base of the cover for active reads (`currentPage / totalPages`).
     - Book title (truncated to 2 lines) and author below the cover.
     - Top-right 3-dots quick action menu (or hover overlay) with:
       - Open Details
       - Log Reading Session (if active)
       - Edit Book
       - Delete Book
     - Clicking the card body or cover triggers `bookSelected` (opens details modal).
   - Layout grid: 2 columns on mobile ($<640\text{px}$), 3 on tablet, 4-5 on desktop, 6 on ultra-wide screens.
2. **View Mode 2: Detailed Cards (`BookDetailedCardComponent`):**
   - Extract and refine the current Media-Object card into `BookDetailedCardComponent` in `src/app/features/books/components/book-detailed-card/`:
     - Medium book cover on the left (2:3 aspect ratio).
     - Right details: title, author, series/saga pill (if assigned), status badge, format pill, star rating.
     - Full progress bar with percentage and page counter (`currentPage / totalPages`).
     - Direct action buttons along the card bottom/footer:
       - "Registrar lectura" (pencil/book icon)
       - "Ver detalles" (eye icon)
       - "Editar" (edit icon)
       - "Eliminar" (trash icon)
   - Layout: 1 column on mobile, 2 columns on tablet/desktop, 3 on large screens.
3. **View Mode 3: High-Density Compact List (`BookCompactRowComponent`):**
   - Create standalone component in `src/app/features/books/components/book-compact-row/`:
     - Horizontal slim table-like row with minimal vertical height.
     - Left: Small cover thumbnail ($32\times48\text{px}$).
     - Center: Title and author, status badge, format icon/pill, star rating.
     - Progress column: Mini progress bar + `XX% (currentPage / totalPages)`.
     - Right: Action buttons (Quick log, View, Edit, Delete).
     - Entire row is keyboard accessible (`tabindex="0"`, Enter/Space to open detail).
4. **Dedicated Zero-Match Empty State:**
   - In `BooksPage`, distinguish between:
     - **Library is totally empty (`totalBooks === 0`):** Existing onboarding card ("Añade tu primer libro").
     - **Filter/Search has no results (`totalBooks > 0 && filteredBooks.length === 0`):**
       - Modern illustration or search icon with soft glow background.
       - Clear heading: _"No se encontraron libros"_ / _"No books found"_.
       - Explanatory description: _"No hay libros que coincidan con los filtros aplicados o tu término de búsqueda."_
       - Prominent primary button: _"Restablecer filtros"_ / _"Clear filters"_ which resets all filters back to default.
5. **Performance & Clean Transitions:**
   - Use Angular Native Control Flow (`@switch (viewMode()) { @case ('grid') ... }`).
   - Strict `track book.id` on `@for` loops.
   - Use `decoding="async"` and `loading="lazy"` on all `<img>` tags.
   - Prohibit `transition-all` on card containers.

---

## 2. Verification Gate

- `npm run check`
- `npm run lint`
- `npm run format`
- `npm test`
