# Task 7.4: Catalog QA, Component Specs & Playwright E2E Suite

**Phase:** Phase 07: Catalog Filtering, Search & View Density  
**Status:** In Progress  
**Estimated Impact:** High (deterministic test coverage, regression prevention, end-to-end user journey verification, mobile overflow validation).

---

## 1. Technical Objectives

1. **Unit & Logic Tests (Vitest):**
   - Create `src/app/features/books/services/catalog-filter.service.spec.ts` (or equivalent engine spec):
     - Test accent-insensitive & case-insensitive live search on title, author, and series name.
     - Test multi-criteria filter combinations (status + format + rating).
     - Test all 7 sort options for deterministic order.
     - Test dynamic count calculation for status chips.
     - Test edge cases: empty strings, special characters, unrated books sorting, 0-page books.
2. **Component Unit Tests (Vitest + Angular TestBed):**
   - `catalog-toolbar.component.spec.ts`:
     - Test search input emissions and clear button click.
     - Test view mode switcher emissions and active state styling.
     - Test sort dropdown emissions.
     - Test status chip selection and count badge rendering.
     - Test secondary filter collapse toggle and reset action.
   - `book-grid-card.component.spec.ts`:
     - Test cover render, title, author, progress bar, and card click output.
   - `book-compact-row.component.spec.ts`:
     - Test compact row display and action button outputs.
   - `book-detailed-card.component.spec.ts`:
     - Test detailed card actions (log, view, edit, delete).
   - `books-page.spec.ts`:
     - Test integration of toolbar with view modes and zero-match empty state.
3. **Playwright E2E Test Suite (`tests/e2e/catalog-flow.spec.ts`):**
   - Write comprehensive E2E tests:
     - **Live Search Flow:** Type query in search bar, verify list updates instantaneously, click clear ('x'), verify full list returns.
     - **Status Filter Flow:** Click status chips ('Leyendo', 'Completados'), verify cards match selected status.
     - **Advanced Filter Flow:** Open secondary filter panel, select format / rating, verify filtered results.
     - **Sort Flow:** Change sort to 'Título (A-Z)' and 'Mayor valoración', verify DOM order.
     - **View Mode Switching:** Switch between Grid, Detailed, and Compact views, verifying structural layout differences and element visibility.
     - **Zero-Match Flow:** Type a nonexistent query (e.g., "NonExistentBookXYZ"), verify zero-match empty state appears, click "Restablecer filtros", verify original list restored.
     - **Mobile Responsiveness & Overflow:** Test at $375\times667\text{px}$, verify zero horizontal overflow (`scrollWidth <= innerWidth`) and status chips touch scrollability.
4. **Final Gate Verification:**
   - Execute deterministic gate: `npm run verify` (`check` + `lint` + `format` + `test` + `build`).
   - Execute Playwright E2E: `npm run test:e2e`.

---

## 2. Verification Gate

- `npm run verify`
- `npm run test:e2e`
