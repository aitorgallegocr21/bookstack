# Phase 19: Extended Categorized Settings (`/settings`), Privacy/Offline Controls & Web Crypto Backups

- **Status:** Completed (`2026-11`)
- **Target Release:** `v2.5.0` (Minor Feature Release — Extended Settings, Network Privacy & Encrypted Backups)
- **Target Branch:** `feat/phase-19-extended-settings-privacy-crypto` $\to$ `develop`
- **Core Mission:** Refactor and expand `/settings` from a single vertical stack into a comprehensive, well-organized **Master-Detail Control Center** across 5 thematic categories, preserving and enhancing every existing capability while introducing unified reactive preferences, 100% Offline Mode, granular 5-provider metadata controls, camera/scanner privacy controls, `navigator.storage.persist()` safeguards, zero-dependency Web Crypto (`PBKDF2` + `AES-GCM-256`) password-encrypted backups, cover compression tuning, selective partial resets, and anonymous system diagnostics.

---

## 1. Architectural Summary & Resolved Product Decisions

1. **Master-Detail Categorized `/settings` Hub with URL Sync & Live Search:**
   - **Desktop ($\ge 768\text{px}$):** Sticky vertical category sidebar (`240px`) paired with a clean editorial content panel (`max-w-3xl`).
   - **Mobile ($< 768\text{px}$):** Horizontally scrollable pill tab bar (`overflow-x-auto no-scrollbar`, `>= 44×44px` touch targets, `role="tablist"`/`role="tab"`, zero horizontal page overflow down to `320px`).
   - **5 Thematic Categories:**
     1. `general` — **General & Appearance** (Language, Theme, 5 Accent Palettes, 4-Edge Desktop / 2-Edge Mobile Dock, Adaptive Cover Tinting `--book-tint`, Manual Reduced Motion override).
     2. `catalog` — **Catalog & Reading** (Default View, Default Sort, New Book Default Format & Status, Card Quick Actions & Progress Bar visibility, Dashboard Quick-Page Increment Step, Reading Time Tracking toggle, Granular Confirmation Dialog controls).
     3. `data` — **Data & Backups** (Storage Quota Inspector + `navigator.storage.persist()` safeguard + IndexedDB diagnostics, Data Health Auditor, Data Portability JSON/CSV/ZIP + Encrypted Backups + Optional Preferences Sync, Bulk Cover Enrichment, and a quick-jump link card to Danger Zone in Advanced & System).
     4. `privacy` — **Privacy & Scanner** (Master **100% Offline Mode**, granular enable/disable & priority reorder for all 5 metadata providers, Camera consent management, remembered rear camera `deviceId` inspector/reset, and scanner defaults for Photo Mode / Auto-Torch).
     5. `advanced` — **Advanced & System** (always visible with an `"Expert"` badge: Cover Compression max dimension & quality sliders, Metadata Search Quota tuning, Selective Partial Resets [Cover Color Cache, Reading Logs only, Preferences only], Anonymous Technical Diagnostics JSON export, and the Danger Zone card).
   - **Deep Linking & Instant Search:** Active tab syncs with `?tab=general|catalog|data|privacy|advanced`. A live search input filters a bilingual settings index and jumps directly to the matching tab and highlighted control (`[data-setting-id]`).
   - **Passive Backup Reminder:** When the library has at least 1 book and no backup has been exported in the last 30 days (or ever), displays a subtle dismissible reminder banner with a 1-click jump to `?tab=data`.

2. **Single Source of Truth for User Preferences (`AppPreferencesService`):**
   - Centralizes all new user preferences in `src/app/core/models/app-preferences.model.ts`, validated at runtime via Zod (`AppPreferencesSchema`), persisted in `localStorage` (`bookstack_app_preferences_v1`), and exposed as read-only Angular Signals.
   - Optionally included in full `.JSON` and `.ZIP` backups (`BackupEnvelope.preferences`) so users can clone their exact configuration across devices.

3. **Zero-Dependency Web Crypto Encrypted Backups (`AES-GCM-256`):**
   - Uses browser-native `crypto.subtle` (`PBKDF2` with `SHA-256` + `250,000` iterations, random 16-byte salt, random 12-byte IV, `AES-GCM` 256-bit authenticated encryption) to encrypt both Full JSON and `.ZIP` archive backups with a user-supplied passphrase.
   - Import flow automatically detects encrypted envelopes, prompts for the passphrase inline, decrypts in memory, and hands off seamlessly to the existing Zod validation preview (`Merge` / `Overwrite`).

---

## 2. Atomic Task Breakdown

- [x] **[Task 19.1: Unified `AppPreferencesService`, Zod Schema & Global Runtime Wiring](task-19.1-app-preferences-service-schema-and-runtime-wiring.md)** — Define `AppPreferences` domain model, `AppPreferencesSchema` (Zod), `AppPreferencesService` (Signals + persistence), wire `ThemeService` (`data-reduced-motion`), `CoverColorService` (`adaptiveCoverTint` guard), and `ConfirmDialogService` (individual toggle support), with full Vitest unit tests.
- [x] **[Task 19.2: Master-Detail Categorized `/settings` Shell, URL Sync & Live Search](task-19.2-master-detail-settings-shell-url-sync-and-search.md)** — Refactor `SettingsPage` into the 5-category Master-Detail layout (desktop sidebar + mobile scrollable tabs), `?tab=` URL sync, bilingual instant settings search with jump-and-highlight, passive 30-day backup reminder banner, and full bilingual i18n scaffolding.
- [x] **[Task 19.3: General & Appearance + Catalog & Reading Sections & Downstream Wiring](task-19.3-general-appearance-and-catalog-reading-sections.md)** — Upgrade `SettingsPreferencesSectionComponent` (Adaptive Cover Tint + Reduced Motion), create `SettingsCatalogReadingSectionComponent` (defaults, card visibility, quick page step, time tracking, granular confirmations), and wire `BookCreateModal`, catalog cards, `CurrentlyReadingHero`, and `ReadingLogEditor`.
- [x] **[Task 19.4: Privacy, 100% Offline Mode, 5-Provider Controls & Scanner Privacy Section](task-19.4-privacy-offline-mode-providers-and-scanner-section.md)** — Create `SettingsPrivacyScannerSectionComponent`, enforce master 100% Offline Mode across `BookMetadataService`, `CoverEnrichmentService`, and `BookMetadataLookupComponent`, wire granular 5-provider enable/reorder & quota, and connect `CameraStreamService` / `IsbnScannerComponent` privacy & defaults.
- [x] **[Task 19.5: Persistent Storage Safeguard (`navigator.storage.persist()`) & Data/Backups Upgrades](task-19.5-persistent-storage-safeguard-and-data-backups-upgrades.md)** — Add live `navigator.storage.persisted()` inspection, 1-click `persist()` request, and IndexedDB diagnostics to `StorageQuotaInspectorComponent`; add optional `preferences` backup/restore support and `lastBackupExportedAt` tracking to `DataPortabilityService` / `BackupEnvelopeSchema`; add Danger Zone shortcut card in Data & Backups.
- [x] **[Task 19.6: Zero-Dependency Web Crypto Encrypted Backups (`PBKDF2` + `AES-GCM-256`)](task-19.6-web-crypto-encrypted-backups.md)** — Implement pure `backup-crypto.utils.ts` (`PBKDF2` + `AES-GCM-256`) and Zod `EncryptedBackupEnvelopeSchema`, integrate password-protected export (JSON & ZIP) and transparent password-prompted import into `DataPortabilityService` and `DataPortabilitySectionComponent`, with security & error-handling unit tests.
- [x] **[Task 19.7: Advanced & System Section, Cover Compression Tuning, Selective Resets & Diagnostics](task-19.7-advanced-system-section-selective-resets-and-diagnostics.md)** — Build `SettingsAdvancedSectionComponent` (cover max dimension & quality sliders wired to `ImageOptimizerService`, metadata search quota, selective partial resets for cover color cache / reading logs / preferences, anonymous diagnostic JSON export, and relocated Danger Zone with `#danger-zone` anchor).
- [x] **[Task 19.8: Playwright E2E Suite, Responsive Audit (`320px`–`1280px`) & Tier 2 Docs Sync (`v2.5.0`)](task-19.8-e2e-verification-responsive-audit-and-tier-2-sync.md)** — Expand `tests/e2e/settings-flow.spec.ts` for all 5 tabs, search, offline mode, encrypted backups, and selective resets; verify zero horizontal overflow (`320px`/`375px`/`1280px`); run `npm run verify:quiet` & `npm run test:e2e`; bump version to `2.5.0`; execute Tier 2 Per-Phase Documentation Sync.
