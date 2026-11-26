# Task 19.7: Advanced & System Section, Cover Compression Tuning, Selective Resets & Diagnostics

## Objective

Build the **Advanced & System** settings tab (`SettingsAdvancedSectionComponent`), wiring dynamic cover compression parameters into `ImageOptimizerService`, exposing metadata search quota tuning, implementing 3 safe selective partial resets protected by `<app-confirm-dialog>`, adding a 1-click strictly anonymous Technical Diagnostic Report JSON export, and housing the Danger Zone card (`#danger-zone`) reachable both directly and via the Data & Backups shortcut link.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/settings/components/settings-advanced-section/settings-advanced-section.ts`
  - `src/app/features/settings/components/settings-advanced-section/settings-advanced-section.html`
  - `src/app/features/settings/components/settings-advanced-section/settings-advanced-section.spec.ts`
- **Read & Edit:**
  - `src/app/features/books/services/image-optimizer.service.ts` (`L1-L80` — inject `AppPreferencesService` and read `coverMaxDimension()` and `coverQuality()` dynamically during `optimize()` instead of hardcoded `360` / `0.7`)
  - `src/app/features/books/services/reading-log.service.ts` (`L1-L100` — add `clearAllLogs(): Promise<void>` if not already present, clearing only the reading logs store and refreshing reactive signals without deleting books or series)
  - `src/app/features/settings/pages/settings-page/settings-page.ts` & `.html` (mount `<app-settings-advanced-section />` and `<app-danger-zone-section data-setting-id="danger-zone" />` inside the `advanced` tab)
  - `src/app/features/settings/components/danger-zone-section/danger-zone-section.ts` (`L1-L125`) & `.html` (ensure clean visual cohesion inside the `advanced` tab)
  - `src/app/core/i18n/domains/settings.i18n.ts` (bilingual `es`/`en` keys for compression tuning, search quota, selective resets, confirmation prompts, and diagnostic report)

---

## Functional & Technical Requirements

1. **Image Compression Tuning (`pref-cover-compression`):**
   - **Max Cover Resolution:** Segmented control (`300 px`, `360 px`, `400 px`, `600 px`) bound to `AppPreferencesService.coverMaxDimension()`.
   - **Compression Quality:** Range slider (`50%` to `95%`, step `5%`) displaying live percentage in `tabular-nums` (`0.50`–`0.95`), bound to `AppPreferencesService.coverQuality()`.
   - Helper note clarifying that new settings apply to newly uploaded or enriched covers (existing covers are untouched).
   - `ImageOptimizerService` reads `coverMaxDimension()` and `coverQuality()` on every `optimize()` invocation.
2. **Metadata Search Quota (`pref-metadata-quota`):**
   - Segmented control (`4`, `8`, `12` results per search) bound to `AppPreferencesService.metadataSearchQuota()` (already consumed by `BookMetadataService` from Task 19.4).
3. **Selective Partial Resets (`pref-selective-resets`):**
   - Three clearly separated action rows, each opening `<app-confirm-dialog>` (severity `'warning'` or `'danger'`) before executing and showing non-intrusive completion feedback:
     1. **Clear Cover Color Cache:** Calls `CoverColorService.clearCache()` (frees cached palette entries in `localStorage`; hues recompute lazily on next view).
     2. **Clear Reading Session Logs Only:** Calls `ReadingLogService.clearAllLogs()`, refreshes storage breakdown, leaves all books, covers, and sagas untouched.
     3. **Reset All Preferences to Defaults:** Resets `AppPreferencesService.resetToDefaults()`, `ThemeService` (`system` + `blue`), `DockPositionService` (`left` + `bottom`), `CatalogFilterService` (`grid` + default sort), and `ConfirmDialogService.resetSuppressions()` — leaves all books, logs, and sagas untouched.
4. **Anonymous Technical Diagnostic Export (`pref-diagnostics`):**
   - 1-click **"Export Diagnostic Report (.json)"** button downloading `bookstack-diagnostics-YYYY-MM-DD.json`.
   - Strictly anonymous payload (zero book titles, authors, ISBNs, notes, or saga names):
     - `appVersion` (from `package.json`)
     - `exportedAt` (UTC ISO-8601)
     - `environment`: `{ userAgent, language, viewportWidth, viewportHeight, online, standalonePwa }`
     - `storage`: `{ engine, persistenceStatus, totalBookstackBytes, browserUsageBytes, browserQuotaBytes, booksCount, coversCount, readingLogsCount }`
     - `scanner`: `{ nativeBarcodeDetectorSupported }`
     - `preferences`: sanitized `AppPreferences` summary (e.g., `offlineMode`, `coverMaxDimension`, `coverQuality`, `metadataSearchQuota`, enabled provider count)
5. **Danger Zone Relocation (`#danger-zone`):**
   - `<app-danger-zone-section>` lives at the bottom of the `advanced` tab with `data-setting-id="danger-zone"` so both direct navigation and the shortcut card from `?tab=data` land cleanly on it.

---

## Verification & Acceptance Criteria

- [ ] Unit test in `image-optimizer.service.spec.ts` verifies dynamic `coverMaxDimension` and `coverQuality` changes affect canvas dimensions and `toDataURL` quality parameter.
- [ ] Unit tests in `settings-advanced-section.spec.ts` verify all 3 selective resets require confirmation and preserve books, and verify the exported diagnostic JSON contains **zero** PII/book titles/authors.
- [ ] `npm run verify:quiet` passes cleanly.
