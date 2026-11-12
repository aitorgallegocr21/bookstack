# Task 5.3: Component & Modal Regression Tests

**Status:** Completed  
**Phase:** `phase-05-testing-suite-and-qa-gate`

## Objective

Validate Shell navigation components, Dashboard/Books pages, and all 4 modal dialogs including keyboard `Escape` handling and body scroll lock cleanup.

## Checklist

- [x] Write `src/app/core/components/sidebar/sidebar.component.spec.ts` (including `hidden md:flex` tablet visibility regression, collapse toggle, exact `/` matching).
- [x] Write `src/app/core/components/header/header.component.spec.ts` and `bottom-nav.component.spec.ts`.
- [x] Write `src/app/features/dashboard/pages/dashboard-page/dashboard-page.spec.ts` and `src/app/features/books/pages/books-page/books-page.spec.ts`.
- [x] Write modal component tests (`book-create-modal.spec.ts`, `book-edit-modal.spec.ts`, `book-detail-modal.spec.ts`, `reading-log-editor.spec.ts`) verifying `overflow-hidden` body scroll lock & `ngOnDestroy` cleanup, `Escape` dismissal, and CRUD emissions.
