# Task 20.2: Analytics Layout Preferences, Widget Registry & Settings Integration

## Objective

Create the typed, Zod-validated foundation for the customizable `/stats` Analytics Studio: define all 14 modular widget identifiers, default layout presets, `AppPreferences.analyticsLayout` persistence, reactive reordering/visibility/sizing methods in `AppPreferencesService`, and Rule 11 `/settings` integration.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/core/models/analytics-layout.model.ts`
  - `src/app/core/schemas/analytics-layout.schema.ts`
  - `src/app/core/schemas/analytics-layout.schema.spec.ts`
- **Read & Edit:**
  - `src/app/core/models/app-preferences.model.ts` (`L29-L70` — add `analyticsLayout: AnalyticsLayoutPreferences` to `AppPreferences` and `DEFAULT_APP_PREFERENCES`).
  - `src/app/core/schemas/app-preferences.schema.ts` — integrate `AnalyticsLayoutPreferencesSchema` into `AppPreferencesSchema` with automatic migration/recovery so missing or partial layouts self-heal cleanly.
  - `src/app/core/services/app-preferences.service.ts` — expose `analyticsLayout` computed signal and helper actions (`setAnalyticsWidgetVisible`, `moveAnalyticsWidget`, `reorderAnalyticsWidgets`, `setAnalyticsWidgetSpan`, `applyAnalyticsPreset`, `resetAnalyticsLayout`).
  - `src/app/core/services/app-preferences.service.spec.ts` — add unit tests for all analytics layout mutations and preset switching.
  - `src/app/features/settings/models/settings-navigation.model.ts` — register `analytics-layout` in `SETTINGS_SEARCH_ENTRIES` under `catalog` tab.
  - `src/app/features/settings/components/settings-catalog-reading-section/` — add a concise "Analytics Dashboard Layout" preference card allowing preset selection and 1-click reset to default layout (plus link to `/stats`).
  - `src/app/core/i18n/domains/settings.i18n.ts` — add bilingual labels for the analytics layout setting card and search entry.

---

## Functional & Technical Requirements

1. **14 Registered Widgets (`AnalyticsWidgetId` in `src/app/core/models/analytics-layout.model.ts`):**
   - `kpi-grid` (default: visible, `full`)
   - `activity-heatmap` (default: visible, `full`)
   - `reading-velocity` (default: visible, `full`)
   - `goal-projection` (default: visible, `compact`)
   - `genre-distribution` (default: visible, `compact`)
   - `top-authors` (default: visible, `compact`)
   - `library-composition` (default: visible, `compact`)
   - `rating-profile` (default: visible, `compact`)
   - `reading-habits` (default: visible, `compact`)
   - `length-longevity` (default: visible, `compact`)
   - `publication-eras` (default: visible, `compact`)
   - `saga-analytics` (default: visible, `compact`)
   - `backlog-publishers` (default: visible, `compact`)
   - `personal-records` (default: visible, `full`)
2. **Widget Metadata & Layout Contract:**
   - `AnalyticsWidgetSpan = 'compact' | 'full'` (on 2-column desktop Bento grid, `compact` = 1 col, `full` = `col-span-full`; on mobile `< 1024px`, all widgets stack cleanly in 1 column).
   - `AnalyticsWidgetSlot = { id: AnalyticsWidgetId; visible: boolean; span: AnalyticsWidgetSpan }`.
   - `AnalyticsLayoutPresetId = 'editorial' | 'minimalist' | 'deep-data' | 'custom'`.
   - `AnalyticsLayoutPreferences = { preset: AnalyticsLayoutPresetId; widgets: AnalyticsWidgetSlot[] }`.
   - Each widget in `ANALYTICS_WIDGET_REGISTRY` specifies `allowSpanToggle: boolean` (e.g., `kpi-grid` and `activity-heatmap` are fixed `full` for legibility; Bento cards allow toggling `compact` ↔ `full`).
3. **3 Built-In Layout Presets (`getAnalyticsLayoutPreset(preset)`):**
   - `editorial` (Default): All 14 widgets enabled in balanced narrative order.
   - `minimalist`: Only `kpi-grid`, `activity-heatmap`, `reading-velocity`, and `goal-projection` visible; all others tucked in the hidden tray.
   - `deep-data`: Prioritizes `kpi-grid`, `genre-distribution`, `length-longevity`, `publication-eras`, `library-composition`, `rating-profile`, `top-authors`, `saga-analytics`, `backlog-publishers`, `reading-velocity`, `activity-heatmap`, `reading-habits`, `goal-projection`, `personal-records`.
4. **Zod Self-Healing & Zero Dependency Inversion:**
   - `core/models/analytics-layout.model.ts` MUST NOT import from `features/` (preserving Clean Architecture).
   - `parseAnalyticsLayoutPreferences(raw)` deduplicates widget IDs, discards unknown IDs, enforces `allowSpanToggle` constraints, and automatically appends any newly introduced widget IDs at the end so future upgrades never lose widgets.
   - Changing any widget's order, visibility, or span marks `preset: 'custom'`.

---

## Verification & Acceptance Criteria

- [ ] `core/` has zero imports from `features/`.
- [ ] `npm run test:file -- src/app/core/schemas/analytics-layout.schema.spec.ts` passes (self-healing missing widgets, duplicate removal, invalid span clamping).
- [ ] `npm run test:file -- src/app/core/services/app-preferences.service.spec.ts` passes (reorder, move up/down, toggle visibility, toggle span, presets, reset).
- [ ] Backup export/import with `includePreferencesInBackup: true` preserves `analyticsLayout` automatically.
- [ ] `npm run verify:quiet` passes with zero errors.
