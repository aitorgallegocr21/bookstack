# Task 14.6: Full-Width Saga Cards, Wrapping Cover Shelves & Zero-Truncation Mobile Headers

**Phase:** [Phase 14: Visual Polish, Responsive Layout & UX Refinements](index.md)  
**Status:** Pending  
**Recommended Model:** Gemini 4 Neon (Medium)

---

## 1. Objective

Fix three layout and readability issues in the Sagas section (`/series`):

1. **Full-Width Stretching on Medium & Large Screens:** Multi-volume sagas (`medium` 3–5 books and `showcase` 6+ books) currently span only 8 of 12 columns (`lg:col-span-8`), leaving awkward empty gaps on wide viewports and cramping volume lists. Stretch `medium` and `showcase` cards to full width (`col-span-full`) across all viewports, while `compact` (1–2 books) sagas fill balanced 1–2 column tracks (`md:col-span-6`).
2. **Wrapping Multi-Row Cover Shelves (Zero Horizontal Scroll):** Replace `overflow-x-auto` cover strips inside `SagaBentoCardComponent` with a responsive wrapping cover grid (`flex flex-wrap gap-2.5` or `grid grid-cols-[repeat(auto-fill,minmax(5rem,5.5rem))]`) so sagas with many volumes display cleanly across 2+ rows on mobile/tablet/desktop without horizontal scrolling or cutting off books.
3. **Zero-Truncation Mobile Saga Titles & Authors:** Remove `truncate` on saga titles and author names in `saga-bento-card.html` (and `saga-detail-modal.html` header), allowing natural multi-line wrapping (`break-words`) and stacking status/volume badges cleanly below the title/author block on narrow screens.

---

## 2. Target Files & Line Pointers

- `src/app/features/series/pages/series-page/series-page.html` — L109-L124 (12-column Bento grid wrapper).
- `src/app/features/series/components/saga-bento-card/saga-bento-card.ts` — L46-L56 (`hostClasses` computed signal).
- `src/app/features/series/components/saga-bento-card/saga-bento-card.html` — L1-L394 (`compact`, `medium`, and `showcase` templates: headers, badges, and cover shelves).
- `src/app/features/series/components/saga-detail-modal/saga-detail-modal.html` — L14-L40 (modal header saga title & author wrapping on mobile).
- `src/app/features/series/components/saga-bento-card/saga-bento-card.spec.ts` — Update host-class & zero-truncation/zero-horizontal-scroll regression tests.

---

## 3. Implementation Checklist

- [ ] **Full-Width Stretching Layout (`saga-bento-card.ts` L46-L56 & `series-page.html` L110-L113):**
  - Update `hostClasses` in `SagaBentoCardComponent`:
    - `'compact'` $\to$ `'block min-w-0 col-span-1 md:col-span-6'` (clean 1-col mobile, 2-col desktop/tablet pair without awkward 1/3rd orphans).
    - `'medium'` $\to$ `'block min-w-0 col-span-full'` (stretches 100% width so 3–5 covers breathe comfortably).
    - `'showcase'` $\to$ `'block min-w-0 col-span-full'` (stretches 100% width with zero artificial row-span trapping or empty right-side voids).
  - Remove rigid `md:auto-rows-[minmax(200px,auto)]` if it causes uneven vertical stretching when full-width cards wrap onto multiple cover rows; keep clean `grid min-w-0 grid-cols-1 gap-4 md:grid-cols-12`.
- [ ] **Wrapping Cover Shelves without Horizontal Scroll (`saga-bento-card.html` L124-L190, L239-L305):**
  - Replace `no-scrollbar flex max-w-full min-w-0 gap-2.5 overflow-x-auto pb-1` in both `medium` and `showcase` cases with `flex flex-wrap gap-2.5 pt-1` (or responsive CSS Grid `grid grid-cols-3 gap-2.5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10`). Using `flex flex-wrap gap-2.5 pt-1` with consistent cover dimensions (`w-[72px] h-[108px]` on mobile, `sm:w-20 sm:h-28` / `sm:w-22 sm:h-32` on desktop) guarantees crisp 2:3 book proportions, clean multi-row wrapping on mobile, zero horizontal scroll, and safe top padding for `hover:-translate-y-0.5`.
- [ ] **Zero-Truncation Saga Title & Author (`saga-bento-card.html` L56-L122, L197-L237 & `saga-detail-modal.html` L17-L39):**
  - Remove `truncate` and `line-clamp-2` from saga title (`<h2>`) and author (`<p>`) across `compact`, `medium`, `showcase`, and `saga-detail-modal.html`. Use `break-words leading-snug` so long saga titles and author names are always 100% readable.
  - Structure `medium` and `showcase` card headers with `flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between` so badges stack neatly underneath the title/author on mobile instead of competing for horizontal space.
- [ ] **Unit & Regression Tests (`saga-bento-card.spec.ts`):**
  - Assert `hostClasses` applies `col-span-full` for `medium` and `showcase` sagas and `md:col-span-6` for `compact`.
  - Assert cover containers do **not** use `overflow-x-auto` and titles/authors do **not** use `truncate`.

---

## 4. Verification Gate

1. `npm run test:file -- src/app/features/series/components/saga-bento-card/saga-bento-card.spec.ts`
2. `npm run verify:quiet`
3. Tier 1 Doc Sync: Mark Task 14.6 `[x]` in `docs/tasks/phase-14-visual-polish-and-responsive-ux/index.md`.
