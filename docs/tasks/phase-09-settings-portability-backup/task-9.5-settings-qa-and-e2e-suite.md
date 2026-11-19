# Task 9.5: Settings Page Coordinator, Responsive Polish & Playwright E2E Suite

**Phase:** Phase 09: Settings, Data Portability & Backup Engine (`/settings`)  
**Status:** Pending  
**Estimated Impact:** Medium (`SettingsPage` assembly, responsive `320px–1280px` audit, `settings-page.spec.ts` unit suite, `tests/e2e/settings-flow.spec.ts` Playwright E2E suite, Tier 2 Per-Phase documentation sync, and autonomous branch hygiene).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/pages/settings-page/settings-page.ts` (`L1-18`): Current `SettingsPage` component.
- `src/app/features/settings/pages/settings-page/settings-page.html` (`L1-52`): Current `/settings` template.
- `tests/e2e/navigation-and-theme.spec.ts` (`L60-110`): Existing `/settings` language-switching E2E test to keep green.
- `tests/e2e/analytics-flow.spec.ts` (`L1-80`): Reference E2E seeding and viewport overflow assertion patterns.
- `docs/TASKS.md` (`L1-31`): Active vs. Completed phases registry.
- `CONTEXT.md` (`L30-80`): Semantic Source Map & JIT Line Pointers.

**Files to Create / Update:**

- `src/app/features/settings/pages/settings-page/settings-page.ts`
- `src/app/features/settings/pages/settings-page/settings-page.html`
- `src/app/features/settings/pages/settings-page/settings-page.spec.ts`
- `tests/e2e/settings-flow.spec.ts`
- `docs/tasks/phase-09-settings-portability-backup/index.md`
- `docs/TASKS.md`
- `docs/ROADMAP.md`
- `CONTEXT.md`
- `docs/DESIGN_SYSTEM.md`
- `README.md`
- `README.es.md`

---

## 2. Technical Objectives

1. **`SettingsPage` Coordinator Assembly (`settings-page.ts` & `settings-page.html`):**
   - Compose `SettingsPreferencesSectionComponent`, `StorageQuotaInspectorComponent`, `DataPortabilitySectionComponent`, and `DangerZoneSectionComponent` in a clean vertical layout (`max-w-4xl`), removing the legacy placeholder roadmap note.
   - Load `StorageBreakdownSummary` on init and refresh it automatically whenever `BooksService.books()` or `ReadingLogService.readingLogs()` changes or when `DataPortabilitySectionComponent` / `DangerZoneSectionComponent` emits a change event.
2. **`SettingsPage` Integration Unit Tests (`settings-page.spec.ts`):**
   - Verify all 4 sections render, storage breakdown initializes and refreshes after import/reset events, and bilingual headings switch reactively.
3. **Playwright E2E Suite (`tests/e2e/settings-flow.spec.ts`):**
   - **Preferences Flow:** Switch language (`es` $\leftrightarrow$ `en`), toggle theme (`Claro` $\leftrightarrow$ `Oscuro`), change default catalog view mode, and verify persistence on `/books`.
   - **Storage Quota Inspector Flow:** Seed books (including a Base64 cover) and reading logs, navigate to `/settings`, and verify non-zero byte breakdown cards and item counts.
   - **JSON & CSV Portability Flow (Preview + Merge & Overwrite):**
     - Upload a valid JSON backup file, verify the Import Preview summary card renders, execute **Merge (`Combinar`)**, and verify records appear in `/books`.
     - Upload a CSV file in **Overwrite (`Reemplazar todo`)** mode, confirm replacement, and verify the catalog reflects the CSV dataset.
   - **Danger Zone Reset Flow:**
     - Open the **Clear Reading Sessions** modal, verify `Escape` closes it, reopen and confirm session deletion, verifying books remain while sessions reset to `0`.
     - Open the **Factory Reset** modal, confirm reset, and verify the library is completely empty.
   - **CSP & Responsive Parity (`320px–1280px`):** Assert zero console CSP violations and zero horizontal overflow (`scrollWidth <= clientWidth`) at `320px`, `375px`, `768px`, and `1280px`.
4. **Tier 2 Per-Phase Sync & Autonomous Branch Hygiene:**
   - Mark all tasks `[x]` and set `Status: Completed` in `docs/tasks/phase-09-settings-portability-backup/index.md`.
   - Move Phase 09 to `Completed Phases` and promote Phase 10 to `Active Phase` in `docs/TASKS.md` (and update `docs/ROADMAP.md`).
   - Update `CONTEXT.md`, `docs/DESIGN_SYSTEM.md`, `README.md`, and `README.es.md`.
   - Merge/fast-forward `feature/09-settings-portability-backup` into `develop`, push `origin/develop`, and autonomously delete `feature/09-settings-portability-backup` locally and on GitHub.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/settings/pages/settings-page/settings-page.spec.ts`
- [ ] `npm run verify:quiet`
- [ ] `npm run test:e2e`
