# Task 19.5: Persistent Storage Safeguard (`navigator.storage.persist()`) & Data/Backups Upgrades

## Objective

Upgrade the **Data & Backups** tab (`?tab=data`) with browser-level eviction protection (`navigator.storage.persist()` + live `persisted()` status and IndexedDB diagnostics), optional inclusion/restoration of user preferences inside full `.JSON` and `.ZIP` backups, automatic `lastBackupExportedAt` timestamp recording (powering the passive 30-day reminder), and a clean shortcut link card pointing to the Danger Zone in **Advanced & System**.

---

## Target Files & Line Pointers

- **Read & Edit:**
  - `src/app/features/settings/models/data-portability.model.ts` (`L1-L71` — extend `StorageBreakdownSummary` with `persistenceStatus: 'persisted' | 'best-effort' | 'unsupported'` and `indexedDbInfo: { dbName: string; version: number; objectStoresCount: number }`; extend `BackupEnvelope` with optional `preferences?: AppPreferencesBackupSnapshot`; extend `ImportPreviewSummary` with `hasPreferences: boolean`)
  - `src/app/features/settings/schemas/backup.schema.ts` (`L1-L361` — add optional `preferences` validation to `BackupEnvelopeSchema` while keeping 100% backward compatibility with v1/v2 backups that omit `preferences`)
  - `src/app/features/settings/services/data-portability.service.ts` (`L1-L260`, `L520-L780`, `L980-L1146` — query `navigator.storage.persisted()`, add `requestPersistentStorage(): Promise<'persisted' | 'denied' | 'unsupported'>`, include `preferences` snapshot on JSON/ZIP export when `includePreferencesInBackup()` is `true`, apply imported `preferences` when user opts in on restore, and call `appPreferencesService.recordBackupExport()` on every successful export)
  - `src/app/features/settings/components/storage-quota-inspector/storage-quota-inspector.ts` (`L1-L133`) & `.html` (display live Persistent Storage protection badge, 1-click **"Request Persistent Storage"** button when `best-effort`, and compact IndexedDB engine diagnostics strip)
  - `src/app/features/settings/components/data-portability-section/data-portability-section.ts` (`L1-L278`) & `.html` (add **"Include app preferences in backup"** toggle bound to `AppPreferencesService.includePreferencesInBackup()`, show preferences indicator & checkbox in `ImportPreviewSummary`)
  - `src/app/features/settings/pages/settings-page/settings-page.html` (add a compact editorial link card at the bottom of the `data` tab: _"Need to clear logs, reset preferences, or wipe your library?"_ $\to$ button calling `navigateToSection('advanced', 'danger-zone')`)
  - `src/app/core/i18n/domains/settings.i18n.ts` (bilingual `es`/`en` keys for persistence status, IndexedDB diagnostics, preference backup toggle, and Danger Zone shortcut)

---

## Functional & Technical Requirements

1. **Persistent Storage Safeguard (`StorageQuotaInspectorComponent` + `DataPortabilityService`):**
   - `computeStorageBreakdown()` safely checks `'storage' in navigator && typeof navigator.storage.persisted === 'function'`:
     - `'persisted'` when `await navigator.storage.persisted()` is `true`.
     - `'best-effort'` when `false`.
     - `'unsupported'` when API is unavailable or throws.
   - `requestPersistentStorage()` calls `navigator.storage.persist()` inside a safe `try/catch`, refreshes `storageBreakdown()`, and surfaces clear feedback (e.g., _"Storage protected against automatic browser eviction"_ or _"Browser kept best-effort storage; installing as PWA or bookmarking increases approval"_).
   - Compact IndexedDB health line showing engine (`IndexedDB` vs `LocalStorage fallback`), database name (`bookstack_db`), schema version, and active record counts.
2. **Optional Preferences Sync in Full Backups (`BackupEnvelope.preferences`):**
   - `AppPreferencesBackupSnapshot` captures `AppPreferences` plus `themeMode`, `accent`, `locale`, `desktopDockPosition`, `mobileDockPosition`, `catalogViewMode`, and `catalogSortBy`.
   - Exported in both Full JSON (`exportFullJson`) and `.ZIP` bundle (`exportZipBundle`) when `includePreferencesInBackup()` is enabled.
   - Backward compatible: older backups without `preferences` continue to pass `BackupEnvelopeSchema` without warnings.
   - On import preview, if `hasPreferences` is `true`, display a toggleable checkbox (_"Restore saved app preferences"_, default checked) and apply them cleanly on confirm.
3. **Last Backup Timestamp Tracking:**
   - Every successful export (`Light JSON`, `Full JSON`, `CSV`, `.ZIP`, or encrypted backup) calls `appPreferencesService.recordBackupExport()`.
   - Display a subtle _"Last backup: <relative/localized date>"_ indicator inside `DataPortabilitySectionComponent`.
4. **Danger Zone Cross-Link in Data & Backups:**
   - Clean, non-intrusive card at the bottom of `?tab=data` linking directly to `?tab=advanced` (`#danger-zone`).

---

## Verification & Acceptance Criteria

- [ ] Unit tests in `data-portability.service.spec.ts` cover `persisted()` / `persist()` granted, denied, and unsupported environments, `preferences` export/import round-trip, backward compatibility with legacy backups without `preferences`, and `lastBackupExportedAt` updates.
- [ ] Unit tests in `storage-quota-inspector.spec.ts` and `data-portability-section.spec.ts` pass.
- [ ] `npm run verify:quiet` passes cleanly.
