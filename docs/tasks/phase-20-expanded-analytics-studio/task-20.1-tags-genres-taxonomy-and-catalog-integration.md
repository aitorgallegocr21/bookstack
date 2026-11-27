# Task 20.1: Genres & Custom Tags Taxonomy (`Book.genre`), `<app-tag-chips-input>` & Catalog Integration

## Objective

Expose and normalize BookStack's existing `Book.genre?: string[]` field end-to-end across book creation, editing, detail inspection, catalog filtering, and external imports—establishing a clean, backward-compatible Genres & Custom Tags taxonomy without breaking existing IndexedDB records or backups.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/books/utils/tag-normalization.utils.ts`
  - `src/app/features/books/utils/tag-normalization.utils.spec.ts`
  - `src/app/features/books/components/tag-chips-input/tag-chips-input.ts`
  - `src/app/features/books/components/tag-chips-input/tag-chips-input.html`
  - `src/app/features/books/components/tag-chips-input/tag-chips-input.spec.ts`
- **Read & Edit:**
  - `src/app/features/books/models/catalog-filter.model.ts` (`L16-L30` — add `genre?: string` to `CatalogFilterCriteria` and `DEFAULT_CATALOG_FILTER_CRITERIA`).
  - `src/app/features/books/services/catalog-filter.service.ts` — add `selectedGenre`, `availableGenres` (sorted by frequency then alphabetically), `setGenre(genre?: string)`, and include genre matching in filtered books + active filter count.
  - `src/app/features/books/components/book-create-modal/` — embed `<app-tag-chips-input>` bound to `genre` and wire metadata lookup auto-fill (`buildMetadataFormPatch()`).
  - `src/app/features/books/components/book-edit-modal/` — embed `<app-tag-chips-input>` bound to `genre` with normalization on save.
  - `src/app/features/books/components/book-detail-modal/` — display clickable genre chips below author/metadata that navigate to `/books?genre=<tag>` (closing the modal).
  - `src/app/features/books/components/catalog-toolbar/` & `src/app/features/books/pages/books-page/` — add genre filter selector inside the collapsible advanced filters panel and sync `?genre=` URL query parameter on init/change.
  - `src/app/features/settings/services/data-portability.service.ts` — accept external JSON/CSV `tags` or `genres` aliases cleanly into normalized `Book.genre` during flexible imports.
  - `src/app/core/i18n/domains/books.i18n.ts` — add bilingual (`es` / `en`) labels, placeholders, curated quick-genre presets, and filter strings.

---

## Functional & Technical Requirements

1. **Tag Normalization (`tag-normalization.utils.ts`):**
   - `normalizeGenreTag(raw: string): string`: trims whitespace, collapses repeated internal spaces, strips leading `#`, caps length at `60` chars.
   - `normalizeGenreList(raw?: readonly string[]): string[]`: normalizes every entry, removes empty strings, performs case-insensitive / diacritic-aware deduplication (preserving first canonical casing), and enforces the `BookSchema` ceiling of `30` tags.
   - `parseRawGenreInput(raw: string): string[]`: splits comma/semicolon-separated strings cleanly.
   - Export `CURATED_GENRE_SUGGESTIONS` keyed by locale (`es` & `en`), e.g., Fiction, Fantasy, Science Fiction, Mystery/Thriller, Non-Fiction, History, Biography, Classic, Essay, Psychology, Poetry, Technology, Romance, Horror.
2. **Reusable `<app-tag-chips-input>` Component:**
   - Standalone `OnPush`, Signal-driven (`tags = model<string[]>([])`, `suggestions = input<readonly string[]>([])`, `maxTags = input(30)`).
   - Supports adding via `Enter` or `,`, removing via chip `×` button (`>= 44×44px` touch target or padded hit area on mobile) or `Backspace` on empty input.
   - Displays a filtered autocomplete dropdown combining existing library genres (from `BooksService`) + curated locale suggestions, excluding already-selected tags.
   - Full keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`) and ARIA `role="listbox"` / `aria-label` accessibility.
3. **Catalog Filtering & Deep Linking:**
   - `CatalogFilterService.filteredBooks()` matches `genre` case-insensitively against `book.genre`.
   - Navigating to `/books?genre=Fantasy` automatically applies the genre filter so `/stats` drill-downs and `BookDetailModal` chips jump straight to the matching books.
   - Respects `reducedMotion` for dropdown and chip transitions.

---

## Verification & Acceptance Criteria

- [ ] `npm run test:file -- src/app/features/books/utils/tag-normalization.utils.spec.ts` passes (deduplication, diacritics, trimming, max 30 cap).
- [ ] `npm run test:file -- src/app/features/books/components/tag-chips-input/tag-chips-input.spec.ts` passes (add via Enter/comma, remove via Backspace/button, autocomplete filtering).
- [ ] Existing `catalog-filter.service.spec.ts` and `data-portability.service.spec.ts` updated and passing with genre filter & `tags` alias import cases.
- [ ] `npm run verify:quiet` passes with zero errors.
