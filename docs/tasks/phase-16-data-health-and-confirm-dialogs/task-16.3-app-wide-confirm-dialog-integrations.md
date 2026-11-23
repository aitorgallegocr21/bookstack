# Task 16.3: Application-Wide Confirmation Dialog Integrations (`/books`, `/series`, `/settings` & Manual Antique Year Prompt)

**Phase:** Phase 16: Data Health, Temporal Bounds Fix (`2925`) & Native Confirmation Dialog Engine  
**Status:** Pending  
**Estimated Impact:** High (Eliminates every `window.confirm()` call in the codebase, integrates contextual entity previews for deleting books/logs, unlinking sagas, and overwriting backups, and adds the source-aware confirmation prompt when a user manually enters an antique year $< 1900$).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/books/pages/books-page/books-page.ts` (`L160-207`): `deleteBook(bookId)` and `deleteReadingLog(logId)`.
- `src/app/features/books/components/book-detail-modal/book-detail-modal.ts` (`L75-125`): `deleteLog(logId)` and `handleEscape()`.
- `src/app/features/books/components/book-create-modal/book-create-modal.ts` (`L120-298`) & `book-create-modal.html` (`L80-220`): Metadata application (`onApplyMetadataCandidate`) and form submission (`onSubmit`).
- `src/app/features/books/components/book-edit-modal/book-edit-modal.ts` (`L150-336`) & `book-edit-modal.html` (`L80-220`): Metadata application (`onApplyMetadataCandidate`) and form submission (`onSubmit`).
- `src/app/features/books/components/reading-log-editor/reading-log-editor.ts` (`L75-146`) & `reading-log-editor.html` (`L1-90`): Session date bounds and submission.
- `src/app/features/series/components/saga-detail-modal/saga-detail-modal.ts` (`L185-234`) & `saga-detail-modal.html` (`L1-260`): `unlinkBook(bookId)` and saga metadata actions.
- `src/app/features/settings/components/data-portability-section/data-portability-section.ts` (`L150-195`): `confirmImport()` when `conflictMode() === 'overwrite'`.
- `src/app/core/i18n/domains/books.i18n.ts`, `series.i18n.ts`, and `settings.i18n.ts`: Confirmation dialog titles, messages, and button labels.

**Files to Create / Update:**

- `src/app/features/books/pages/books-page/books-page.ts`
- `src/app/features/books/pages/books-page/books-page.spec.ts`
- `src/app/features/books/components/book-detail-modal/book-detail-modal.ts`
- `src/app/features/books/components/book-detail-modal/book-detail-modal.spec.ts`
- `src/app/features/books/components/book-create-modal/book-create-modal.ts`
- `src/app/features/books/components/book-create-modal/book-create-modal.html`
- `src/app/features/books/components/book-create-modal/book-create-modal.spec.ts`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
- `src/app/features/books/components/book-edit-modal/book-edit-modal.spec.ts`
- `src/app/features/books/components/reading-log-editor/reading-log-editor.ts`
- `src/app/features/books/components/reading-log-editor/reading-log-editor.html`
- `src/app/features/series/components/saga-detail-modal/saga-detail-modal.ts`
- `src/app/features/series/components/saga-detail-modal/saga-detail-modal.spec.ts`
- `src/app/features/settings/components/data-portability-section/data-portability-section.ts`
- `src/app/features/settings/components/data-portability-section/data-portability-section.spec.ts`
- `src/app/core/i18n/domains/books.i18n.ts`
- `src/app/core/i18n/domains/series.i18n.ts`
- `src/app/core/i18n/domains/settings.i18n.ts`

---

## 2. Technical Objectives

1. **Books & Reading Sessions Deletion Confirmations (`BooksPage` & `BookDetailModalComponent`):**
   - **Delete Book (`BooksPage.deleteBook`):**
     - Replace `window.confirm()` with `await this.confirmDialogService.confirm(...)`.
     - Pass `severity: 'danger'` and an `entityPreview` built from the target `Book` (`title: book.title`, `subtitle: book.author`, `badge: `${book.totalPages} pp.``, `coverUrl: book.coverUrl`).
     - Book deletion is destructive and must **not** set `suppressibleKey`.
   - **Delete Reading Log (`BooksPage.deleteReadingLog` & `BookDetailModalComponent.deleteLog`):**
     - Replace `window.confirm()` with `await this.confirmDialogService.confirm(...)`.
     - Pass `severity: 'danger'`, `suppressibleKey: 'deleteReadingLog'`, and an `entityPreview` showing the parent book title, formatted session date, and `+${log.pagesRead} pp.`.
   - **Escape Key Guard in Underlying Modals:**
     - In `BookDetailModalComponent`, `BookCreateModalComponent`, `BookEditModalComponent`, `ReadingLogEditorComponent`, and `SagaDetailModalComponent`, guard `handleEscape()` so that if `this.confirmDialogService.activeDialog() !== null`, the underlying modal does not close when Escape is pressed to dismiss the confirmation dialog.

2. **Source-Aware Antique Publication Year & Reading Date Validation in Forms (`BookCreateModalComponent`, `BookEditModalComponent`, `ReadingLogEditorComponent`):**
   - Track whether `publicationYear` came from an external metadata provider (`private readonly providerApprovedYear = signal<number | null>(null)`):
     - When `onApplyMetadataCandidate(event)` applies a candidate from Open Library, Google Books, Wikidata, Apple Books, or Internet Archive / Crossref that includes a `publicationYear`, set `this.providerApprovedYear.set(candidate.publicationYear)`.
     - In `BookEditModalComponent`, if the existing stored book already had `book.publicationYear` before editing, treat that unchanged year as already approved.
   - **Hard Block Future Years (`> currentYear + 1`, e.g., `2925`):**
     - Bind `[attr.max]="maxAllowedYear"` on `publicationYear` inputs and `[attr.min]="'1900-01-01'"` / `[attr.max]="maxAllowedIsoDate"` on `startDate`, `endDate`, and `ReadingLog` date inputs.
     - Add form validation rejecting any `publicationYear > maxAllowedYear` or reading date year `> maxAllowedYear` so typos like `2925` can never be submitted.
   - **Manual Antique Year Warning (`< 1900` when NOT from an external metadata provider):**
     - On `onSubmit()`, call `requiresManualAntiqueYearConfirmation({ publicationYear, startDate, endDate, isFromExternalProvider: publicationYear === this.providerApprovedYear() })`.
     - If `required === true`, open `this.confirmDialogService.confirm(...)` with `severity: 'warning'`, `suppressibleKey: 'manualAntiqueYear'`, and a clear message explaining that the manually entered year (e.g., `1605`) is several centuries old and asking the user to confirm it is intentional and not a typo.
     - If the user cancels, keep the form open and focus the year/date input so they can fix the typo; if confirmed, proceed with saving the classic/antique book!

3. **Saga Volume Unlinking Confirmation (`SagaDetailModalComponent`):**
   - In `SagaDetailModalComponent.unlinkBook(bookId)`:
     - Prompt via `this.confirmDialogService.confirm(...)` with `severity: 'warning'`, `suppressibleKey: 'unlinkSagaBook'`, and an `entityPreview` showing the book's title, author,cover, and current saga volume badge (`#${book.series?.volumeNumber}`).

4. **Backup Restore `Overwrite` Confirmation & Suppressed Prompts Reset (`/settings`):**
   - In `DataPortabilitySectionComponent.confirmImport()`:
     - When `this.conflictMode() === 'overwrite'` and the existing library is non-empty (`this.booksService.books().length > 0`), show a `severity: 'danger'` confirmation dialog with an `entityPreview` summarizing how many existing local books/sessions will be replaced by the imported backup.
   - In `SettingsPreferencesSectionComponent`, add a clean button/action allowing the user to reset any suppressed minor confirmation prompts (`confirmDialogService.resetSuppressedConfirms()`) whenever at least one minor prompt is currently suppressed.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/books/pages/books-page/books-page.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/components/book-detail-modal/book-detail-modal.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/components/book-create-modal/book-create-modal.spec.ts`
- [ ] `npm run test:file -- src/app/features/books/components/book-edit-modal/book-edit-modal.spec.ts`
- [ ] `npm run test:file -- src/app/features/series/components/saga-detail-modal/saga-detail-modal.spec.ts`
- [ ] `npm run test:file -- src/app/features/settings/components/data-portability-section/data-portability-section.spec.ts`
- [ ] `npm run verify:quiet`
