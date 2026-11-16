# Task 9.3: Interface Preferences Hub & Storage Quota Inspector UI Components

**Phase:** Phase 09: Settings, Data Portability & Backup Engine (`/settings`)  
**Status:** Pending  
**Estimated Impact:** Medium (two standalone `OnPush` presentational/container components for `/settings`: `SettingsPreferencesSectionComponent` and `StorageQuotaInspectorComponent` with unit tests).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/features/settings/pages/settings-page/settings-page.html` (`L1-52`): Existing language selector markup and styling conventions.
- `src/app/core/services/theme.service.ts` (`L1-83`): `theme` signal (`'light' | 'dark'`) and `setTheme()`.
- `src/app/features/books/services/catalog-filter.service.ts` (`L70-120`): `viewMode` signal (`'grid' | 'detailed' | 'compact'`) and `setViewMode()`.
- `src/app/features/settings/models/data-portability.model.ts` (`L1-80`): `StorageBreakdownSummary` contract.
- `src/app/core/i18n/i18n.types.ts` (`L345-410`): `settings` translation keys added in Task 9.1.

**Files to Create:**

- `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.ts`
- `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.html`
- `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.spec.ts`
- `src/app/features/settings/components/storage-quota-inspector/storage-quota-inspector.ts`
- `src/app/features/settings/components/storage-quota-inspector/storage-quota-inspector.html`
- `src/app/features/settings/components/storage-quota-inspector/storage-quota-inspector.spec.ts`

---

## 2. Technical Objectives

1. **Interface Preferences Hub (`SettingsPreferencesSectionComponent`):**
   - Standalone `ChangeDetectionStrategy.OnPush` component injecting `I18nService`, `ThemeService`, and `CatalogFilterService`.
   - Renders 3 accessible preference controls with `min-h-[44px]` touch targets and responsive layout (`grid-cols-1 sm:grid-cols-3` or stacked cards with segmented buttons/selects):
     - **Active Language (`es` / `en`):** Preserves `#settings-language` `<select>` compatibility so existing E2E tests (`navigation-and-theme.spec.ts`) continue to pass without regression.
     - **Visual Theme (`Claro` / `Oscuro`):** Accessible segmented toggle buttons (`aria-pressed`) switching between `'light'` and `'dark'` via `ThemeService.setTheme()`.
     - **Default Catalog View (`Cuadrícula` / `Detallada` / `Compacta`):** Select or segmented control updating `CatalogFilterService.setViewMode()`.
2. **Storage Quota & Breakdown Inspector (`StorageQuotaInspectorComponent`):**
   - Accepts `breakdown = input.required<StorageBreakdownSummary>()` and `refreshRequested = output<void>()`.
   - Formats byte values cleanly (`B`, `KB`, `MB`) via a pure helper method.
   - Displays:
     - **Header Status Row:** Total BookStack usage badge (e.g. `142.5 KB`), active storage engine pill (`IndexedDB` vs. `LocalStorage`), and health status badge (`Saludable` emerald / `Moderado` amber / `Cerca del límite` rose), plus browser quota usage when reported by `navigator.storage.estimate()`.
     - **Segmented Horizontal Bar:** 4 proportional segments (`transition-[width]`, never `transition-all`) representing **Book Metadata**, **Base64 Covers**, **Reading Logs**, and **Settings & Goals**.
     - **4 Category Breakdown Cards (`grid-cols-1 sm:grid-cols-2`):** Showing color dot, category name, byte size, percentage share, and item count (`N libros`, `M portadas`, `K sesiones`).
3. **Component Unit Tests:**
   - `settings-preferences-section.spec.ts`: Verify locale switching, theme switching, and default catalog view mode updates.
   - `storage-quota-inspector.spec.ts`: Verify byte formatting (`B` / `KB` / `MB`), percentage segment widths, engine badge rendering (`indexeddb` vs `localstorage`), and health status badge classes.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/settings/components/settings-preferences-section/settings-preferences-section.spec.ts`
- [ ] `npm run test:file -- src/app/features/settings/components/storage-quota-inspector/storage-quota-inspector.spec.ts`
- [ ] `npm run verify:quiet`
