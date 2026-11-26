# Task 19.3: General & Appearance + Catalog & Reading Sections & Downstream Wiring

## Objective

Refine `SettingsPreferencesSectionComponent` to focus cleanly on **General & Appearance** (adding Adaptive Cover Tinting and Reduced Motion controls), create `SettingsCatalogReadingSectionComponent` for the **Catalog & Reading** tab (moving Default Catalog View here and adding Default Sort, New Book Defaults, Card Visibility toggles, Quick-Page Step, Reading Time toggle, and Granular Confirmation Dialog controls), and wire all downstream components to honor these preferences reactively.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/settings/components/settings-catalog-reading-section/settings-catalog-reading-section.ts`
  - `src/app/features/settings/components/settings-catalog-reading-section/settings-catalog-reading-section.html`
  - `src/app/features/settings/components/settings-catalog-reading-section/settings-catalog-reading-section.spec.ts`
- **Read & Edit:**
  - `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.ts` (`L1-L158`)
  - `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.html` (`L1-L246`)
  - `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.spec.ts`
  - `src/app/features/settings/pages/settings-page/settings-page.ts` & `.html` (mount `<app-settings-catalog-reading-section />` in the `catalog` tab)
  - `src/app/features/books/components/book-create-modal/book-create-modal.ts` (`L1-L140` — initialize form `format` and `status` from `AppPreferencesService.defaultBookFormat()` / `defaultBookStatus()` when no prefill overrides them)
  - `src/app/features/books/components/book-grid-card/book-grid-card.ts` (`L1-L65`) & `.html` (conditionally render quick action buttons and progress bar based on `AppPreferencesService.showCardQuickActions()` / `showCardProgressBar()`)
  - `src/app/features/books/components/book-detailed-card/book-detailed-card.ts` (`L1-L69`) & `.html` (conditionally render quick action buttons based on `showCardQuickActions()`)
  - `src/app/features/dashboard/components/currently-reading-hero/currently-reading-hero.ts` (`L1-L150`) & `.html` (use `AppPreferencesService.quickPageStep()` for the quick page increment action button label and delta)
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.ts` (`L1-L171`) & `.html` (hide/skip the `timeSpentMinutes` field when `AppPreferencesService.trackReadingTime()` is `false`)
  - `src/app/core/i18n/domains/settings.i18n.ts` (add any remaining bilingual keys for these controls)

---

## Functional & Technical Requirements

1. **General & Appearance (`SettingsPreferencesSectionComponent`):**
   - Keep existing controls with `[data-setting-id]` attributes for search deep-linking:
     - `pref-language`: Active Language (`es` / `en`).
     - `pref-theme`: Theme Mode (`light` / `dark` / `system`).
     - `pref-accent`: 5-column Accent Swatch Grid (`blue`, `indigo`, `emerald`, `amber`, `rose`).
     - `pref-dock`: Desktop 4-edge & Mobile 2-edge Dock Position selectors.
   - **Add New Appearance Controls:**
     - `pref-adaptive-tint`: Toggle switch (`role="switch"`, `aria-checked`, `min-h-[44px]`) for **Adaptive Cover Tinting (`--book-tint`)** with short editorial description.
     - `pref-reduced-motion`: Segmented control (`System` / `Reduced`) for **Motion & Animations** override (`AppPreferencesService.reducedMotion()`).
   - Remove Default Catalog View and Suppressed Confirmations from this component (moved cleanly to **Catalog & Reading**).
2. **Catalog & Reading (`SettingsCatalogReadingSectionComponent`):**
   - **Card 1 — Catalog Defaults & Card Display:**
     - `pref-default-view`: Default Catalog View (`grid` / `detailed` / `compact`, wired to `CatalogFilterService.setViewMode`).
     - `pref-default-sort`: Default Catalog Sort (all 7 `CatalogSortOption` values, wired to `CatalogFilterService.setSortBy`).
     - `pref-card-actions`: Toggle for showing quick action buttons on catalog cards (`showCardQuickActions`).
     - `pref-card-progress`: Toggle for showing reading progress bar on grid cards (`showCardProgressBar`).
   - **Card 2 — New Book & Reading Session Defaults:**
     - `pref-default-format`: Default Format for new books (`physical` / `ebook` / `audiobook`).
     - `pref-default-status`: Default Initial Status for new books (`pending` / `reading`).
     - `pref-quick-page-step`: Segmented control (`+1`, `+5`, `+10`, `+25`) for Dashboard quick page increment.
     - `pref-track-time`: Toggle for **Track Reading Time (minutes)** in session logs (with helper note explaining it prepares adaptive time analytics).
   - **Card 3 — Confirmation Dialogs (`pref-confirmations`):**
     - Lists each `ConfirmSuppressionKey` (`deleteReadingLog`, `unlinkSagaBook`, `manualAntiqueYear`) with an accessible `role="switch"` toggle ("Ask before deleting a reading session", "Ask before unlinking a book from a saga", "Ask before saving an antique publication year `< 1900`").
     - Note: Switch ON = prompt enabled (`!isSuppressed(key)`), Switch OFF = suppressed (`isSuppressed(key)`).
     - Includes a **"Restore all confirmations"** button when any confirmation is currently suppressed.
3. **Downstream Consumer Wiring:**
   - `BookCreateModalComponent`: on open/reset, apply `defaultBookFormat()` and `defaultBookStatus()` unless explicit prefill (e.g., saga prefill) specifies otherwise.
   - `BookGridCardComponent` / `BookDetailedCardComponent`: honor `showCardQuickActions()` and `showCardProgressBar()`.
   - `CurrentlyReadingHeroComponent`: quick increment button uses `quickPageStep()` (e.g., `+5`, `+10`, `+25`) and caps safely at `book.totalPages`.
   - `ReadingLogEditorComponent`: when `trackReadingTime()` is `false`, omit the minutes input field and submit `timeSpentMinutes: undefined`.

---

## Verification & Acceptance Criteria

- [ ] All toggle switches use accessible `role="switch"`, `aria-checked`, keyboard focus ring, and `>= 44×44px` touch targets.
- [ ] Changing `defaultBookFormat` or `defaultBookStatus` in `/settings?tab=catalog` immediately pre-selects those values when opening `BookCreateModalComponent`.
- [ ] Disabling `trackReadingTime` hides the minutes field in `ReadingLogEditorComponent`.
- [ ] Unit specs for `settings-preferences-section`, `settings-catalog-reading-section`, `book-create-modal`, `currently-reading-hero`, and `reading-log-editor` pass.
- [ ] `npm run verify:quiet` passes cleanly.
