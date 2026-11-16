# Phase 09: Settings, Data Portability & Backup Engine (`/settings`)

**Status:** Active (In Progress)  
**Target Branch:** `feature/09-settings-portability-backup` $\to$ `develop`  
**Core Mission:** Transform `/settings` from a minimal language-switcher page into a comprehensive **Local-First Control, Data Portability & Storage Hub**. Deliver strict Content-Security-Policy (CSP) hardening in `src/index.html`, a unified interface preferences panel (language, light/dark theme, default catalog view), a real-time IndexedDB/LocalStorage quota & category byte inspector, a Zod-validated JSON (full backup) and RFC 4180 CSV (catalog table) export/import engine with interactive pre-import preview (`Merge` vs. `Overwrite`), and a two-tier Danger Zone reset workflow with 1-click pre-reset backup download.

---

## 1. Architectural Summary & Decisions

1. **Dual-Format Data Portability (JSON Master Backup + CSV Catalog Table):**
   - **JSON (`.json` — Full Versioned Backup):** Serializes a versioned envelope (`schemaVersion: 1`, `app: 'BookStack'`, `exportedAt` UTC ISO-8601) packaging `books` (including Base64/URL covers), `readingLogs`, `readingGoals`, and user `preferences` (`locale`, `theme`, `catalogViewMode`, `catalogSort`). Designed for 100% lossless restore and future Android/cloud compatibility.
   - **CSV (`.csv` — Spreadsheet Catalog):** Exports and imports the `books` catalog in RFC 4180 format with a UTF-8 BOM (`\uFEFF`) for seamless Excel/Google Sheets compatibility on Windows/macOS and formula-injection sanitization (`=`, `+`, `-`, `@`, `\t`, `\r` cell guards).
2. **Two-Step Import Flow with Zod Validation Preview & Conflict Modes:**
   - Selecting a `.json` or `.csv` file parses and validates records through Zod (`BackupEnvelopeSchema` / `BookSchema` / `ReadingLogSchema` / `ReadingGoalsSchema`) **without mutating persistent state immediately**.
   - Renders an **Import Preview Summary** displaying valid vs. invalid/skipped records, detected sesiones/goals/preferences, and a conflict resolution selector:
     - **Merge (`Combinar` — Default):** Upserts imported books by `id` (or normalized `title + author` fallback for CSV rows) and reading logs by `id`, preserving existing non-conflicting records.
     - **Overwrite (`Reemplazar todo`):** Replaces the entire library and reading log history atomically (with automatic in-memory snapshot rollback if storage persistence fails).
3. **Granular Storage Quota & Health Inspector:**
   - Calculates real UTF-8 byte footprints across 4 categories: **Book Metadata**, **Local Base64 Covers**, **Reading Logs (`ReadingLog`)**, and **Settings & Goals (`LocalStorage`)**, paired with record counts (`books`, `readingLogs`).
   - Displays a segmented visual storage bar, active persistence engine badge (`IndexedDB` vs. `LocalStorage` fallback), and browser quota health status (`Saludable` / `Moderado` / `Cerca del límite`) via `navigator.storage.estimate()`.
4. **Expanded Interface Preferences & Two-Action Danger Zone:**
   - **Interface Preferences:** Combines **Language (`es` / `en`)**, **Visual Theme (`Claro` / `Oscuro`)**, and **Default Catalog View (`Cuadrícula` / `Detallada` / `Compacta`)** in a single cohesive section.
   - **Danger Zone (Destructive Actions):** Provides two granular reset controls — **Clear Reading Sessions Only** (preserves book catalog, resets `readingLogs`) and **Factory Reset Application** (clears all books, sessions, goals, and preferences) — guarded by an accessible confirmation modal featuring scroll-lock, `Escape` support, programmatic focus, and a **1-click "Download JSON Backup First"** safety action.
5. **CSP Meta Hardening (`src/index.html`):**
   - Adds a strict, console-warning-free `<meta http-equiv="Content-Security-Policy" ... />` policy locking down `object-src 'none'`, `base-uri 'self'`, and `form-action 'self'`, while permitting Local-First `data:`/`blob:`/`https:` cover images and pre-authorizing Phase 10 ISBN lookup origins (`https://openlibrary.org`, `https://*.openlibrary.org`, `https://www.googleapis.com`).

---

## 2. Atomic Task Breakdown

- [x] **[Task 9.1: CSP Hardening, Storage Batch Primitives, Portability Models & Zod Backup Schema](task-9.1-csp-storage-and-backup-schemas.md)** — Harden `src/index.html` with CSP meta, add `clearStore`/`replaceStore`/`estimateBrowserQuota` to `StorageAdapterService` (and batch methods to `BooksService` & `ReadingLogService`), define portability models & `BackupEnvelopeSchema`, and extend `es`/`en` i18n dictionaries.
- [x] **[Task 9.2: Data Portability Service (JSON Backup, RFC 4180 CSV w/ Formula Guard & Storage Inspector Engine)](task-9.2-data-portability-and-inspector-service.md)** — Implement `DataPortabilityService` for JSON/CSV export, Zod-validated import preview, `merge` vs. `overwrite` execution with rollback protection, and 4-category byte/quota calculation.
- [ ] **[Task 9.3: Interface Preferences Hub & Storage Quota Inspector UI Components](task-9.3-preferences-and-storage-inspector-ui.md)** — Build `SettingsPreferencesSectionComponent` (language, theme, default catalog view) and `StorageQuotaInspectorComponent` (segmented byte bar, 4-category cards, engine & quota badges).
- [ ] **[Task 9.4: Data Portability Panel (Export/Import Preview Flow) & Danger Zone Reset Modal](task-9.4-portability-panel-and-danger-zone-ui.md)** — Build `DataPortabilitySectionComponent` (JSON/CSV export buttons, file picker, validation preview & `Merge`/`Overwrite` confirmation) and `DangerZoneSectionComponent` (session reset vs. factory reset modal with 1-click backup button).
- [ ] **[Task 9.5: Settings Page Coordinator, Responsive Polish & Playwright E2E Suite](task-9.5-settings-qa-and-e2e-suite.md)** — Integrate all panels into `SettingsPage`, verify `320px–1280px` responsive ergonomics, add `settings-page.spec.ts` & Playwright E2E suite (`tests/e2e/settings-flow.spec.ts`), and perform Tier 2 Per-Phase documentation sync + autonomous branch hygiene.
