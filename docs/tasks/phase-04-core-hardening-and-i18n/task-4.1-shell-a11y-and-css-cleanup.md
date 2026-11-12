# Task 4.1: Responsive Shell, ESLint A11y & CSS Cleanup

**Status:** Completed  
**Phase:** `phase-04-core-hardening-and-i18n`

## Objective

Fix responsive layout discrepancies, resolve every ESLint/template accessibility error, enforce discrete CSS transitions, and remove dead placeholder code.

## Checklist

- [x] Update `SidebarComponent` `host` class from `hidden lg:flex` to `hidden md:flex` so tablets (`768px–1023px`) align with `app.html`.
- [x] Replace `@ViewChild` with signal `viewChild()` in `BookCreateModalComponent` and `BookEditModalComponent`.
- [x] Remove HTML `autofocus` attributes from `book-create-modal.html` and `book-edit-modal.html` (relying on programmatic focus via `viewChild()`).
- [x] Associate `<label for="...">` with form controls (`book-create-modal.html`, `book-edit-modal.html`).
- [x] Fix `@angular-eslint/template/interactive-supports-focus` on `reading-log-editor.html`.
- [x] Replace `transition-all` in `dashboard-page.html` and `header.component.html` with discrete transitions (`transition-colors`, `transition-shadow`, `transition-transform`).
- [x] Remove redundant duplicate class declarations (`class="..." [class]="..."`) in `books-page.html`.
- [x] Remove unused `src/app/features/series/` placeholder (to be cleanly rebuilt in Phase 10).
