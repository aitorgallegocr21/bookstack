# Task 19.4: Privacy, 100% Offline Mode, 5-Provider Controls & Scanner Privacy Section

## Objective

Build the **Privacy & Scanner** settings tab (`SettingsPrivacyScannerSectionComponent`) and enforce strict network privacy across BookStack: a master **100% Offline Mode** toggle that blocks all outbound metadata/cover network requests, granular enable/disable and priority reordering for all 5 public metadata providers, and dedicated camera/scanner privacy & default controls.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/settings/components/settings-privacy-scanner-section/settings-privacy-scanner-section.ts`
  - `src/app/features/settings/components/settings-privacy-scanner-section/settings-privacy-scanner-section.html`
  - `src/app/features/settings/components/settings-privacy-scanner-section/settings-privacy-scanner-section.spec.ts`
- **Read & Edit:**
  - `src/app/features/settings/pages/settings-page/settings-page.ts` & `.html` (mount `<app-settings-privacy-scanner-section />` in the `privacy` tab)
  - `src/app/features/books/services/book-metadata.service.ts` (`L20-L50`, `L180-L420` — add `'OFFLINE_MODE'` to `BookMetadataErrorCode`, guard every network method when `offlineMode()` is `true`, filter enabled providers, respect `orderedProviderIds()` priority order, and read `metadataSearchQuota()` instead of hardcoded `MAX_SEARCH_RESULTS = 8`)
  - `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.ts` (`L1-L263`) & `.html` (display clear Offline Mode notice with link to `/settings?tab=privacy` and disable remote search/ISBN lookup actions while offline mode is active)
  - `src/app/features/settings/services/cover-enrichment.service.ts` (`L1-L160`) & `src/app/features/settings/components/cover-enrichment-section/cover-enrichment-section.html` (guard enrichment queue startup when `offlineMode()` is `true` and show clear offline banner)
  - `src/app/features/books/services/camera-stream.service.ts` (`L1-L120`, `L400-L513` — expose `getPreferredRearDeviceId(): string | null` and `clearPreferredRearDeviceId(): void`)
  - `src/app/features/books/components/isbn-scanner/isbn-scanner.ts` (`L1-L200` — read `scannerPreferPhotoMode()` and `scannerAutoTorch()` on startup; expose/share camera consent storage key constant `CAMERA_CONSENT_STORAGE_KEY` if stored, or manage camera consent consistently via `StorageAdapterService` / `localStorage`)
  - `src/app/core/i18n/domains/settings.i18n.ts` & `src/app/core/i18n/domains/books.i18n.ts` (bilingual `es`/`en` offline & privacy notices)

---

## Functional & Technical Requirements

1. **Master 100% Offline Mode (`pref-offline-mode`):**
   - Prominent card with live status pill (`100% Offline Active` vs. `Public Metadata Allowed`) and `role="switch"` toggle.
   - When enabled:
     - `BookMetadataService` immediately rejects/throws `BookMetadataError('OFFLINE_MODE', ...)` before any `fetch()` call in `lookupByIsbn()`, `searchBooks()`, `lookupIsbnBatch()`, and remote cover fetches.
     - `CoverEnrichmentService` blocks starting auto-enrichment and surfaces an explicit offline message.
     - `BookMetadataLookupComponent` displays an informative banner explaining that 100% Offline Mode is active, with a direct link to `/settings?tab=privacy`.
     - Local features (manual book creation, local photo cover upload, local ISBN barcode scanning via `BarcodeDecoderService`, IndexedDB storage, backups) remain 100% operational.
2. **Granular 5-Provider Metadata Controls (`pref-metadata-providers`):**
   - Ordered list of the 5 public providers (`Google Books`, `Open Library`, `Apple Books ES`, `Wikidata`, `Internet Archive / Crossref`):
     - Provider name, short coverage description (e.g., Spanish retail editions, open catalog, academic/archive), enable/disable `role="switch"`, and accessible Up/Down priority buttons (`min-h-[44px] min-w-[44px]`, disabled at top/bottom bounds).
     - Dimmed/disabled visual state when Master Offline Mode is ON (preserving user's saved provider config underneath).
     - Warning hint if all 5 providers are toggled OFF.
     - **"Reset default order"** button.
   - `BookMetadataService` strictly queries only enabled providers, applies the user's custom priority order in `PROVIDER_QUOTA_ORDER` / candidate merging, and limits final results to `AppPreferencesService.metadataSearchQuota()`.
3. **Camera & ISBN Scanner Privacy (`pref-scanner-privacy`):**
   - **Camera Consent Management:** Shows whether local camera access has been consented/acknowledged and provides a 1-click button to reset/revoke the stored in-app consent prompt.
   - **Remembered Rear Camera Sensor (Phase 18):** Displays whether a preferred rear camera `deviceId` is currently cached (`bookstack.scanner.preferredRearDeviceId`, truncated safely for display) with a **"Forget remembered camera"** button (`CameraStreamService.clearPreferredRearDeviceId()`).
   - **Scanner Behavior Defaults:**
     - Toggle: **Prefer Photo Upload Mode** (`scannerPreferPhotoMode`) — skips auto-starting live camera viewfinder and highlights static photo decoding.
     - Toggle: **Auto-enable Flashlight (Torch)** (`scannerAutoTorch`) — automatically enables torch when starting a rear camera that reports `capabilities.torch === true`.

---

## Verification & Acceptance Criteria

- [ ] Regression test in `book-metadata.service.spec.ts` verifies **zero** `fetch()` calls are ever issued when `offlineMode()` is `true`, and verifies disabled providers are never queried while priority order is respected.
- [ ] Unit tests for `settings-privacy-scanner-section.spec.ts`, `camera-stream.service.spec.ts`, and `isbn-scanner.spec.ts` pass.
- [ ] `npm run verify:quiet` passes cleanly.
