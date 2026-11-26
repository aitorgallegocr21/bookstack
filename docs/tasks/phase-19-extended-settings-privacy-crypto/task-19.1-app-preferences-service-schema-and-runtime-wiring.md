# Task 19.1: Unified `AppPreferencesService`, Zod Schema & Global Runtime Wiring

## Objective

Create the Single Source of Truth for all extended user preferences (`AppPreferences`), validated at runtime with Zod (`AppPreferencesSchema`) and persisted cleanly via `StorageAdapterService`. Wire global DOM/service runtime behaviors for **Adaptive Cover Tinting (`--book-tint`)**, **Manual Reduced Motion Override (`data-reduced-motion="reduce"`)**, and **Granular Confirmation Dialog Suppression Toggles**.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/core/models/app-preferences.model.ts`
  - `src/app/core/schemas/app-preferences.schema.ts`
  - `src/app/core/services/app-preferences.service.ts`
  - `src/app/core/services/app-preferences.service.spec.ts`
- **Read & Edit:**
  - `src/app/core/services/storage-adapter.service.ts` (`L1-L60`, `L380-L488` — add `loadAppPreferences()` / `saveAppPreferences()` / `clearAppPreferences()` under `bookstack_app_preferences_v1` with safe `localStorage` fallback).
  - `src/app/core/services/theme.service.ts` (`L1-L155` — apply/remove `data-reduced-motion="reduce"` on `document.documentElement` driven by `AppPreferencesService.reducedMotion()`).
  - `src/app/core/services/cover-color.service.ts` (`L1-L120` — return neutral/disabled tint when `AppPreferencesService.adaptiveCoverTint()` is `false` and expose `clearCache(): void` for Task 19.7).
  - `src/app/core/services/confirm-dialog.service.ts` (`L1-L92` — add `setSuppressed(key: ConfirmSuppressionKey, suppressed: boolean): void` and expose `suppressedKeys` readonly signal so individual confirmations can be toggled on/off in Settings).
  - `src/styles.css` (`L1-L80`, `L650-L761` — add `[data-reduced-motion='reduce']` rules mirroring `@media (prefers-reduced-motion: reduce)` for transitions, animations, and view transitions).

---

## Functional & Technical Requirements

1. **`AppPreferences` Contract (`src/app/core/models/app-preferences.model.ts`):**
   - `ConfigurableMetadataProvider = 'googlebooks' | 'openlibrary' | 'applebooks' | 'wikidata' | 'archive'` (note: `archive` controls the Internet Archive / Crossref slot in the 5-provider waterfall).
   - `MetadataProviderPreference = { id: ConfigurableMetadataProvider; enabled: boolean }`.
   - `ReducedMotionPreference = 'system' | 'reduce'`.
   - `QuickPageStep = 1 | 5 | 10 | 25`.
   - `CoverMaxDimension = 300 | 360 | 400 | 600`.
   - `MetadataSearchQuota = 4 | 8 | 12`.
   - `DefaultBookFormat = 'physical' | 'ebook' | 'audiobook'` (use union matching `BookFormat` without importing from `features/` to preserve `core` $\to$ `features` zero-inversion rule!).
   - `DefaultBookStatus = 'pending' | 'reading'` (strict subset of `BookStatus`).
   - `AppPreferences` interface & `DEFAULT_APP_PREFERENCES`:
     - `adaptiveCoverTint: true`
     - `reducedMotion: 'system'`
     - `defaultBookFormat: 'physical'`
     - `defaultBookStatus: 'pending'`
     - `showCardQuickActions: true`
     - `showCardProgressBar: true`
     - `quickPageStep: 10`
     - `trackReadingTime: true`
     - `offlineMode: false`
     - `metadataProviders`: ordered default `['googlebooks', 'openlibrary', 'applebooks', 'wikidata', 'archive']`, all `enabled: true`
     - `scannerPreferPhotoMode: false`
     - `scannerAutoTorch: false`
     - `coverMaxDimension: 360`
     - `coverQuality: 0.7` (bounds `0.5`..`0.95`)
     - `metadataSearchQuota: 8`
     - `includePreferencesInBackup: true`
     - `lastBackupExportedAt: null` (`string | null`, ISO-8601 UTC timestamp)
2. **Zod Validation & Safe Normalization (`src/app/core/schemas/app-preferences.schema.ts`):**
   - `parseAppPreferences(raw: unknown): AppPreferences` safely merges partial/older JSON objects with `DEFAULT_APP_PREFERENCES`, deduplicates and ensures all 5 `ConfigurableMetadataProvider` entries always exist in `metadataProviders` (appending any missing provider as `enabled: true`), and clamps `coverQuality` to `[0.5, 0.95]`.
3. **`AppPreferencesService` (`src/app/core/services/app-preferences.service.ts`):**
   - Signal-first (`_preferences = signal<AppPreferences>(...)`, readonly `preferences`, plus ergonomic computed selectors for every field, e.g. `offlineMode`, `adaptiveCoverTint`, `reducedMotion`, `enabledProviderIds`, `orderedProviderIds`, `coverMaxDimension`, `coverQuality`, `metadataSearchQuota`, `isBackupOverdue` [true when `lastBackupExportedAt` is null or older than 30 days]).
   - Methods:
     - `update(patch: Partial<AppPreferences>): void`
     - `setProviderEnabled(id: ConfigurableMetadataProvider, enabled: boolean): void`
     - `moveProvider(id: ConfigurableMetadataProvider, direction: 'up' | 'down'): void`
     - `resetProvidersOrder(): void`
     - `recordBackupExport(isoTimestamp?: string): void`
     - `resetToDefaults(options?: { preserveLastBackupTimestamp?: boolean }): void`
     - `exportSnapshot(): AppPreferences`
     - `importSnapshot(raw: unknown): void`
4. **Runtime Wiring:**
   - `ThemeService`: `effect()` sets/removes `data-reduced-motion="reduce"` on `document.documentElement` when `appPreferences.reducedMotion() === 'reduce'`.
   - `src/styles.css`: add `[data-reduced-motion='reduce'] *, [data-reduced-motion='reduce'] *::before, [data-reduced-motion='reduce'] *::after` animation/transition disabling and `::view-transition-*` suppression.
   - `CoverColorService`: when `appPreferences.adaptiveCoverTint()` is `false`, `getTintForBook()` / computed tint returns `null` (no ambient wash applied) without destroying cached hues; add `clearCache(): void` to wipe in-memory map + `localStorage` cache cleanly.
   - `ConfirmDialogService`: add `setSuppressed(key: ConfirmSuppressionKey, suppressed: boolean)` and expose `isSuppressed(key)` / `suppressedKeys` signal.

---

## Verification & Acceptance Criteria

- [ ] `core/` has **zero** imports from `features/` (Clean Architecture boundary preserved).
- [ ] `npm run test:file -- src/app/core/services/app-preferences.service.spec.ts` passes (covers defaults, partial/corrupted JSON recovery, provider deduplication/reordering, `isBackupOverdue` 30-day math, and `resetToDefaults`).
- [ ] Updated unit specs for `theme.service.spec.ts`, `cover-color.service.spec.ts`, and `confirm-dialog.service.spec.ts` pass.
- [ ] `npm run verify:quiet` passes with zero errors.
