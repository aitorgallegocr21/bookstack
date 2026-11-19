# Task 14.4: Container-Aware Catalog Grids & Overflow-Free Book Card Actions

**Phase:** [Phase 14: Visual Polish, Responsive Layout & UX Refinements](index.md)  
**Status:** Pending  
**Recommended Model:** Gemini 4 Neon (Medium)

---

## 1. Objective

Fix book card crowding and "Log" (`Registrar`) button text overflow in `/books` (Bookshelf Grid and Detailed Card views), especially when the desktop sidebar (`240px`) is expanded:

1. Convert the catalog grid containers in `books-page.html` to **CSS Container Query / intrinsic auto-fill grids** so the number of books per row adapts automatically to the _actual available content width_ (whether the sidebar is expanded or collapsed).
2. Add `@container` to `BookGridCardComponent` and `BookDetailedCardComponent` so the "Log" (`Registrar`) button smoothly collapses its text label to icon-only before text can ever overflow, while maintaining balanced spacing between all action buttons.

---

## 2. Target Files & Line Pointers

- `src/app/features/books/pages/books-page/books-page.html` — L84-L120 (`grid` and `detailed` `<section>` grid classes).
- `src/app/features/books/components/book-grid-card/book-grid-card.html` — L1-L3 (card root `@container`), L91-L138 (bottom action bar & "Log" button).
- `src/app/features/books/components/book-detailed-card/book-detailed-card.html` — L1-L3 (card root `@container`), L106-L152 (actions row & "Log" button).
- `src/app/features/books/components/book-grid-card/book-grid-card.spec.ts` — Unit/regression tests for container-responsive button layout.
- `src/app/features/books/components/book-detailed-card/book-detailed-card.spec.ts` — Unit/regression tests for container-responsive button layout.

---

## 3. Implementation Checklist

- [ ] **Sidebar-Aware Catalog Grids (`books-page.html` L84-L120):**
  - Wrap the catalog content area in `@container`.
  - For **`grid` view (L88)**: replace rigid viewport column counts (`md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`) with container-aware responsive columns (e.g., `grid-cols-2 @[520px]:grid-cols-3 @[760px]:grid-cols-4 @[1020px]:grid-cols-5 @[1300px]:grid-cols-6`) so each grid card always has $\ge 180\text{–}200\text{px}$ of breathing room regardless of sidebar state.
  - For **`detailed` view (L106)**: replace `md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` with container-aware columns (`grid-cols-1 @[680px]:grid-cols-2 @[1080px]:grid-cols-3 @[1440px]:grid-cols-4`) so detailed cards always have $\ge 320\text{px}$ width.
- [ ] **Overflow-Free Action Bar in `BookGridCardComponent` (`book-grid-card.html` L1-L3, L91-L138):**
  - Add `@container` to `<article>`.
  - Make the bottom action bar clean and balanced (`flex items-center justify-between gap-1.5`):
    - The "Log" button uses `shrink-0` / `min-w-0` and shows its text label ONLY when the card container itself is wide enough (`hidden @[205px]:inline`), falling back cleanly to a compact `+` icon button with `aria-label` and `title` tooltip when narrower — guaranteeing zero text clipping or overflow!
    - Keep consistent spacing (`gap-1`) and uniform touch-friendly sizing (`h-8 w-8`) for View, Edit, and Delete icons.
- [ ] **Overflow-Free Action Bar in `BookDetailedCardComponent` (`book-detailed-card.html` L1-L3, L106-L152):**
  - Add `@container` to `<article>`.
  - Ensure the actions row (`L107-L151`) uses `flex items-center justify-between gap-2` with `whitespace-nowrap` on the "Log" button and hides/truncates safely on ultra-narrow card widths (`hidden @[290px]:inline`), keeping uniform spacing (`gap-1`) between action icons.
- [ ] **Unit & Regression Tests:**
  - Update `book-grid-card.spec.ts` and `book-detailed-card.spec.ts` to assert `@container` classes and container-query label visibility classes on the Log button while preserving accessible `aria-label` attributes.

---

## 4. Verification Gate

1. `npm run test:file -- src/app/features/books/components/book-grid-card/book-grid-card.spec.ts`
2. `npm run test:file -- src/app/features/books/components/book-detailed-card/book-detailed-card.spec.ts`
3. `npm run verify:quiet`
4. Tier 1 Doc Sync: Mark Task 14.4 `[x]` in `docs/tasks/phase-14-visual-polish-and-responsive-ux/index.md`.
