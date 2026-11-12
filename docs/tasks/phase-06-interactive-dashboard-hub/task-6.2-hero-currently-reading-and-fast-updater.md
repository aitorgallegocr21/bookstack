# Task 6.2: Hero "Currently Reading", Fast Updater & Smart Empty States

**Phase:** Phase 06: Interactive Dashboard Hub  
**Status:** Pending  
**Estimated Impact:** Medium (new reusable components, inline page update workflow, auto-completion trigger, smart empty states).

---

## 1. Technical Objectives

1. **`CurrentlyReadingHeroComponent`:**
   - Create standalone component in `src/app/features/dashboard/components/currently-reading-hero/`.
   - Accept the primary active book as an input signal.
   - Display book cover (using `loading="lazy"` and `decoding="async"`), title, author, format pill, progress percentage bar, and page counter (`currentPage` / `totalPages`).
   - If other books have `status === 'reading'`, render a compact horizontal thumbnail strip below the card, allowing the user to select another book to focus on.
2. **Inline Fast Progress Updater:**
   - Numerical input bound to `newPageValue` with validation ($0 \le \text{newPage} \le \text{totalPages}$).
   - Pressing Enter or clicking "Actualizar" calls a method in `BooksService` / `ReadingLogService`:
     - Calculates delta: `deltaPages = newPage - book.currentPage`.
     - Appends a new `ReadingLog` with today's date and `pagesRead = deltaPages`.
     - Updates `book.currentPage`.
     - If `newPage === book.totalPages`, updates `book.status = 'completed'` and sets `completedAt`.
   - Add secondary button with book/log icon to open the full `ReadingLogEditorComponent` for logging duration (minutes) and notes.
3. **Smart Dual Empty States:**
   - **Case A (Empty Library):** If `totalBooks === 0`, render an inviting welcome hero with an illustration/icon and a primary button that opens the global `BookCreateModalComponent`.
   - **Case B (No Active Reads):** If `totalBooks > 0` but `readingBooks === 0`, render a "Pick your next read" carousel showcasing books with `status === 'pending'`, featuring a 1-click "Start reading" button that changes status to `'reading'` and brings it into the Hero card.

---

## 2. Verification Gate

- `npm run check`
- `npm run lint`
- `npm run format`
- `npm test`
