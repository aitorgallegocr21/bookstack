# Task 16.2: Signal-Driven Confirmation Dialog Engine (`ConfirmDialogService` & `<app-confirm-dialog>`)

**Phase:** Phase 16: Data Health, Temporal Bounds Fix (`2925`) & Native Confirmation Dialog Engine  
**Status:** Pending  
**Estimated Impact:** High (Introduces BookStack's global Signal-driven confirmation dialog system, contextual entity preview cards, minor-action suppression persistence, root shell mounting, and bilingual `es`/`en` i18n keys).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/core/services/ui-state.service.ts` (`L1-66`): Reference-counted `acquireScrollLock()` / `releaseScrollLock()` pattern.
- `src/app/core/services/storage-adapter.service.ts` (`L1-65`, `L300-361`): `localStorage` preference helpers and key conventions.
- `src/app/app.ts` (`L1-26`) & `src/app/app.html` (`L1-19`): Root application shell and `@defer` modal mounting.
- `src/app/core/i18n/domains/shell.i18n.ts` (`L1-101`): Core shell i18n interface and `ES_SHELL` / `EN_SHELL` dictionaries.
- `src/styles.css` (`L1-120`): Shared modal backdrop, surface, and animation primitives.

**Files to Create / Update:**

- `src/app/core/models/confirm-dialog.model.ts` _(new)_
- `src/app/core/services/confirm-dialog.service.ts` _(new)_
- `src/app/core/services/confirm-dialog.service.spec.ts` _(new)_
- `src/app/core/components/confirm-dialog/confirm-dialog.ts` _(new)_
- `src/app/core/components/confirm-dialog/confirm-dialog.html` _(new)_
- `src/app/core/components/confirm-dialog/confirm-dialog.spec.ts` _(new)_
- `src/app/core/services/storage-adapter.service.ts`
- `src/app/core/i18n/domains/shell.i18n.ts`
- `src/app/app.ts`
- `src/app/app.html`

---

## 2. Technical Objectives

1. **Confirmation Dialog Domain Contracts (`src/app/core/models/confirm-dialog.model.ts`):**
   - Define strict TypeScript contracts (zero `any`):
     ```ts
     export type ConfirmDialogSeverity = 'danger' | 'warning' | 'info';

     export type ConfirmSuppressionKey =
       'deleteReadingLog' | 'unlinkSagaBook' | 'manualAntiqueYear';

     export interface ConfirmDialogEntityPreview {
       title: string;
       subtitle?: string;
       badge?: string;
       coverUrl?: string;
     }

     export interface ConfirmDialogOptions {
       title: string;
       message: string;
       confirmLabel?: string;
       cancelLabel?: string;
       severity?: ConfirmDialogSeverity;
       entityPreview?: ConfirmDialogEntityPreview;
       suppressibleKey?: ConfirmSuppressionKey;
       suppressCheckboxLabel?: string;
     }
     ```

2. **Minor-Action Suppression Persistence (`StorageAdapterService` & `ConfirmDialogService`):**
   - Store suppressed minor confirmation keys in `localStorage` under `bookstack_suppressed_confirms_v1` (validated at runtime against allowed `ConfirmSuppressionKey` values).
   - Provide `isConfirmSuppressed(key: ConfirmSuppressionKey): boolean`, `setConfirmSuppressed(key: ConfirmSuppressionKey, suppressed: boolean): void`, and `resetSuppressedConfirms(): void` so users can also reset suppressed prompts from `/settings`.
   - When `confirm(options)` is called with a `suppressibleKey` that is currently suppressed, `ConfirmDialogService.confirm()` immediately resolves to `Promise.resolve(true)` without opening the modal.

3. **Promise-Based Signal Service (`src/app/core/services/confirm-dialog.service.ts`):**
   - Expose `readonly activeDialog = signal<ConfirmDialogState | null>(null)` and `readonly dontAskAgainChecked = signal<boolean>(false)`.
   - `confirm(options: ConfirmDialogOptions): Promise<boolean>`:
     - Checks suppression first if `options.suppressibleKey` is provided.
     - If another dialog is already active, safely resolves the previous pending promise with `false` before opening the new request.
     - Acquires scroll lock via `UiStateService.acquireScrollLock()` when opening and releases it via `UiStateService.releaseScrollLock()` when resolving (`accept()` or `cancel()`).
   - `accept(): void`:
     - If `dontAskAgainChecked()` is `true` and the active dialog has a `suppressibleKey`, persists the suppression via `setConfirmSuppressed(key, true)`.
     - Resolves the pending Promise with `true` and clears `activeDialog`.
   - `cancel(): void`:
     - Resolves the pending Promise with `false` and clears `activeDialog`.

4. **Accessible Confirmation Modal Component (`src/app/core/components/confirm-dialog/`):**
   - Standalone `ChangeDetectionStrategy.OnPush` component `<app-confirm-dialog>`.
   - Keyboard & ARIA compliance:
     - `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby="confirm-dialog-title"`, `aria-describedby="confirm-dialog-message"`.
     - Host listener `'(document:keydown.escape)': 'onEscape($event)'` that calls `confirmDialogService.cancel()` and stops propagation so underlying modals (like `BookDetailModal` or `SagaDetailModal`) do not accidentally close at the same time.
     - Programmatic initial focus on the cancel button (for `danger` severity) or confirm button (for `warning`/`info` severity) via `viewChild()`.
   - Visual features:
     - Severity icon header (`danger` in red/rose, `warning` in amber, `info` in blue).
     - Optional **Entity Preview Card** (`@if (dialog.entityPreview)`): displays cover thumbnail (`40x56px` with fallback icon), bold entity title, subtitle (e.g., author or session date), and badge (e.g., pages or volume number).
     - Optional **"Do not ask again for this action"** checkbox (`@if (dialog.suppressibleKey)`) with touch target $\ge 44\text{px}$ height.
     - Responsive action footer (`Cancel` + severity-styled `Confirm` button) with zero horizontal overflow at `320px`.

5. **Root Shell Mounting & Bilingual i18n (`src/app/app.html` & `shell.i18n.ts`):**
   - Mount `<app-confirm-dialog />` at the bottom of `src/app/app.html` (with `z-[70]` so it renders cleanly above any open detail/edit modal at `z-50`).
   - Extend `shell.i18n.ts` (`ES_SHELL` and `EN_SHELL`) with `confirmDialog` default labels (`confirm`, `cancel`, `delete`, `dontAskAgainMinor`).

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/core/services/confirm-dialog.service.spec.ts`
- [ ] `npm run test:file -- src/app/core/components/confirm-dialog/confirm-dialog.spec.ts`
- [ ] `npm run test:file -- src/app/app.spec.ts`
- [ ] `npm run verify:quiet`
