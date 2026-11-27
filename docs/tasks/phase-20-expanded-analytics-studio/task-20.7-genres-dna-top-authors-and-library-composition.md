# Task 20.7: Genres Thematic DNA, Multi-Mode Top Authors & Library Composition

## Objective

Create dedicated, modular Bento widgets for **Genres & Thematic DNA** (with books, pages, and average rating per genre), **Multi-Mode Top Authors Leaderboard**, **Library Composition** (Format Donut + Status Funnel), and **Rating Profile & Reader Critic Tendency**—all supporting click-to-drill-down exploration.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/analytics/components/genre-distribution-widget/genre-distribution-widget.ts`
  - `src/app/features/analytics/components/genre-distribution-widget/genre-distribution-widget.html`
  - `src/app/features/analytics/components/genre-distribution-widget/genre-distribution-widget.spec.ts`
  - `src/app/features/analytics/components/top-authors-widget/top-authors-widget.ts`
  - `src/app/features/analytics/components/top-authors-widget/top-authors-widget.html`
  - `src/app/features/analytics/components/top-authors-widget/top-authors-widget.spec.ts`
  - `src/app/features/analytics/components/rating-profile-widget/rating-profile-widget.ts`
  - `src/app/features/analytics/components/rating-profile-widget/rating-profile-widget.html`
  - `src/app/features/analytics/components/rating-profile-widget/rating-profile-widget.spec.ts`
- **Read & Edit:**
  - `src/app/features/analytics/components/library-composition-section/` — focus cleanly on **Format Donut** (Physical / eBook / Audiobook with books & pages toggle) + **Status Stacked Bar** (completion & abandonment rates) so Rating Histogram and Top Authors live as independent reorderable widgets in the Bento studio.
  - `src/app/features/analytics/pages/stats-page/stats-page.ts` & `stats-page.html` — wire `genre-distribution`, `top-authors`, `library-composition`, and `rating-profile` slots and connect drill-down outputs.

---

## Functional & Technical Requirements

1. **Genres & Thematic DNA (`GenreDistributionWidgetComponent`):**
   - Metric switcher: **By Books** | **By Pages** | **By Avg Rating**.
   - Horizontal ranked editorial bars (top 8 genres + optional "Show all" expander) displaying genre name, book count, total pages, share `%`, and star rating pill when rated books exist.
   - Clicking any genre emits a drill-down event (`{ type: 'genre', value: genreName }`).
   - Thoughtful empty state when no books have genres yet, with a 1-click hint explaining how to tag books in Create/Edit modals.
2. **Multi-Mode Top Authors (`TopAuthorsWidgetComponent`):**
   - Mode toggle: **Books** | **Pages** | **Rating** (min 1 rated book).
   - Displays ranked top 6 authors with proportional progress bars, `tabular-nums` counts, and average rating badge.
   - Clicking any author emits `{ type: 'author', value: authorName }`.
3. **Library Composition (`LibraryCompositionSectionComponent`):**
   - Crisp SVG Format Donut (`physical`, `ebook`, `audiobook`) with toggleable Books vs. Pages share and clickable format legend rows (`{ type: 'format', value }`).
   - Status Stacked Bar with completion rate `%`, abandonment rate `%`, and clickable status counts.
4. **Rating Profile & Critic Tendency (`RatingProfileWidgetComponent`):**
   - Full `0–10` rating distribution histogram with clickable bars (`{ type: 'rating', min, max }`).
   - Displays **Mean Rating**, **Median Rating**, and **Rated Books Count**.
   - Editorial **Reader Critic Profile** pill derived from mean & dispersion (e.g., _Generous Enthusiast_ `>= 8.2`, _Balanced Critic_ `6.5–8.1`, _Selective Connoisseur_ `< 6.5`), shown only when `ratedBooksCount >= 3`.

---

## Verification & Acceptance Criteria

- [ ] Unit specs pass for `genre-distribution-widget`, `top-authors-widget`, `rating-profile-widget`, and updated `library-composition-section`.
- [ ] All interactive rows/bars have `>= 44px` comfortable touch targets or accessible buttons with clear `focus-visible` rings.
- [ ] `npm run verify:quiet` passes with zero errors.
