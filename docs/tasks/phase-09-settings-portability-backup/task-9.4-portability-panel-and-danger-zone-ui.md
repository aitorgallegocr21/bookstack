# Task 9.4: Data Portability Panel (Export/Import Preview Flow) & Danger Zone Reset Modal

**Phase:** Phase 09: Settings, Data Portability & Backup Engine (`/settings`)  
**Status:** Pending  
**Estimated Impact:** High (interactive `DataPortabilitySectionComponent` with JSON/CSV export and 2-step Zod validation preview, plus `DangerZoneSectionComponent` with accessible scroll-locked confirmation modal and 1-click pre-reset backup).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/models/data-portability.model.ts` (`L1-80`): `ImportPreviewSummary`, `ImportConflictMode`, and `ImportExecutionResult` contracts.
- `src/app/features/settings/services/data-portability.service.ts` (`L1-250`): Export, preview analysis, import execution, and reset methods.
- `src/app/core/services/ui-state.service.ts` (`L1-55`): `acquireScrollLock()` and `releaseScrollLock()` for modal discipline.
- `src/styles.css` (`L1-120`): Shared `.modal-backdrop`, `.modal-panel`, `.btn-primary`, and `.btn-secondary` utility classes.

**Files to Create:**

- `src/app/features/settings/components/data-portability-section/data-portability-section.ts`
- `src/app/features/settings/components/data-portability-section/data-portability-section.html`
- `src/app/features/settings/components/data-portability-section/data-portability-section.spec.ts`
- `src/app/features/settings/components/danger-zone-section/danger-zone-section.ts`
- `src/app/features/settings/components/danger-zone-section/danger-zone-section.html`
- `src/app/features/settings/components/danger-zone-section/danger-zone-section.spec.ts`

---

## 2. Technical Objectives

1. **Data Portability Panel (`DataPortabilitySectionComponent`):**
   - Emits `dataChanged = output<void>()` whenever an import completes so the parent `SettingsPage` refreshes the storage quota inspector.
   - **Export Cards (`grid-cols-1 sm:grid-cols-2`):**
     - **JSON Master Backup Card:** Explains full backup scope (books + covers, reading sessions, annual goals, and preferences) with a `min-h-[44px]` download button (`export-json-btn`).
     - **CSV Catalog Export Card:** Explains spreadsheet compatibility (Excel/Google Sheets with UTF-8 BOM) with a `min-h-[44px]` download button (`export-csv-btn`).
   - **Two-Step Import Workflow:**
     - **Step 1 (File Selection):** Accessible file input (`accept=".json,.csv,application/json,text/csv"`) styled as a clean upload trigger (`import-file-input`). Reads file text and invokes `DataPortabilityService.analyzeImportFile()`.
     - **Step 2 (Validation Preview & Mode Selector):** When `previewSummary()` is non-null, displays a structured preview panel showing:
       - File name and format badge (`JSON` / `CSV`).
       - Counters: valid books (`newBooksCount` new + `duplicateBooksCount` existing matches), valid reading sessions (`validReadingLogs.length`), and skipped invalid items (`invalidBooksCount + invalidLogsCount`).
       - Conflict Mode Selector (`role="radiogroup"`):
         - **`merge` (`Combinar` — Default):** Upserts matching books/logs without deleting unrelated records.
         - **`overwrite` (`Reemplazar todo`):** Shows an amber/rose caution alert explaining that current books and sessions will be replaced.
       - Action buttons: **Apply Import (`confirm-import-btn`)** and **Cancel (`cancel-import-btn`)**.
     - **Result Feedback Banner (`role="status"`):** Displays a dismissible summary banner after import completion (e.g., imported books/logs count).
2. **Danger Zone & Accessible Confirmation Modal (`DangerZoneSectionComponent`):**
   - Emits `dataReset = output<void>()` after a reset completes.
   - Displays two destructive action rows inside a rose-bordered card:
     - **Clear Reading Sessions (`reset-sessions-btn`):** Deletes all `ReadingLog` entries while keeping the book catalog intact.
     - **Factory Reset Application (`factory-reset-btn`):** Wipes all books, reading sessions, annual goals, and preferences.
   - **Accessible Confirmation Modal:**
     - Implements `host: { '(document:keydown.escape)': 'onEscapeKey($event)' }`, acquires/releases scroll lock via `UiStateService.acquireScrollLock()` / `releaseScrollLock()`, and focuses the cancel or backup button via `viewChild()`.
     - Includes a **1-click "Download JSON Backup First" (`modal-backup-first-btn`)** button right inside the modal so users can secure a copy before confirming the destructive action (`confirm-danger-reset-btn`).
3. **Component Unit Tests:**
   - `data-portability-section.spec.ts`: Verify JSON/CSV export button triggers, file upload preview rendering, `merge` vs `overwrite` toggle, import execution, and cancellation.
   - `danger-zone-section.spec.ts`: Verify opening/closing both reset modals (`sessions` vs `factory`), `Escape` key dismissal, scroll lock lifecycle, 1-click backup trigger inside modal, and confirmation execution.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/settings/components/data-portability-section/data-portability-section.spec.ts`
- [ ] `npm run test:file -- src/app/features/settings/components/danger-zone-section/danger-zone-section.spec.ts`
- [ ] `npm run verify:quiet`
