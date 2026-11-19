# Task 14.3: Scrollbar-Free Modal Bodies with Subtle Scroll Cues

**Phase:** [Phase 14: Visual Polish, Responsive Layout & UX Refinements](index.md)  
**Status:** Pending  
**Recommended Model:** Gemini 4 Hydrogen (Medium)

---

## 1. Objective

Eliminate the visually intrusive native vertical scrollbar inside the Add Book modal (`book-create-modal`) and maintain visual consistency across all other scrollable modals (`book-edit-modal`, `book-detail-modal`, `saga-detail-modal`, `reading-log-editor`) by combining `.no-scrollbar` with a sleek shared `.modal-scroll-area` utility that provides subtle top/bottom scroll-fade cues while preserving smooth wheel, touch, and keyboard scrolling.

---

## 2. Target Files & Line Pointers

- `src/styles.css` — L240-L295 (add `.modal-scroll-area` utility alongside `.no-scrollbar`).
- `src/app/features/books/components/book-create-modal/book-create-modal.html` — L44-L52 (scrollable form body `overflow-y-auto`).
- `src/app/features/books/components/book-edit-modal/book-edit-modal.html` — L45-L53 (scrollable form body `overflow-y-auto`).
- `src/app/features/books/components/book-detail-modal/book-detail-modal.html` — L48-L54 (scrollable detail body `overflow-y-auto`).
- `src/app/features/series/components/saga-detail-modal/saga-detail-modal.html` — L60-L80 (locate scrollable body `overflow-y-auto`).
- `src/app/features/books/components/reading-log-editor/reading-log-editor.html` — L54-L58 (scrollable form `overflow-y-auto`).
- `src/app/features/books/components/book-create-modal/book-create-modal.spec.ts` — Add regression assertion for `.no-scrollbar` / `.modal-scroll-area`.

---

## 3. Implementation Checklist

- [ ] **Shared Scrollbar-Free Modal Utility (`src/styles.css`):**
  - Define `.modal-scroll-area` (in `@layer components`) that hides native scrollbars (`scrollbar-width: none; -ms-overflow-style: none;` and `::-webkit-scrollbar { display: none; }`), enables smooth inertial scrolling (`overscroll-behavior: contain; -webkit-overflow-scrolling: touch;`), and applies subtle CSS scroll-shadow cues (using `background-attachment: local, local, scroll, scroll` linear gradients or subtle CSS mask fade) that adapt cleanly to both light (`bg-white`) and dark (`dark:bg-slate-900`) modal panels without breaking input focus rings.
- [ ] **Apply to All Scrollable Modals:**
  - Add `modal-scroll-area no-scrollbar` to the `overflow-y-auto` body container in:
    - `book-create-modal.html` (L49)
    - `book-edit-modal.html` (L50)
    - `book-detail-modal.html` (L50)
    - `saga-detail-modal.html` (body scroll container)
    - `reading-log-editor.html` (L55)
  - Verify sticky/fixed modal headers and footers remain unaffected and keyboard tabbing scrolls focused fields into view cleanly.
- [ ] **Unit & Regression Tests:**
  - Update `book-create-modal.spec.ts` to verify the scrollable container carries `modal-scroll-area` and `no-scrollbar` alongside `overflow-y-auto`.

---

## 4. Verification Gate

1. `npm run test:file -- src/app/features/books/components/book-create-modal/book-create-modal.spec.ts`
2. `npm run verify:quiet`
3. Tier 1 Doc Sync: Mark Task 14.3 `[x]` in `docs/tasks/phase-14-visual-polish-and-responsive-ux/index.md`.
