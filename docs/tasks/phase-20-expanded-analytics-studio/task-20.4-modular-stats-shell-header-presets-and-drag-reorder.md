# Task 20.4: Modular `/stats` Bento Shell, Customize Mode, Presets & Accessible Reordering

## Objective

Transform `StatsPage` and `AnalyticsHeaderComponent` into a modular, user-customizable **Analytics Studio** powered by `AppPreferencesService.analyticsLayout()`, featuring an interactive Edit Layout mode with drag-and-drop reordering, accessible Move Up / Move Down controls, show/hide toggles, compact/full span switching, 1-click layout presets, and full bilingual `analytics.i18n.ts` dictionary scaffolding.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/analytics/components/analytics-widget-shell/analytics-widget-shell.ts`
  - `src/app/features/analytics/components/analytics-widget-shell/analytics-widget-shell.html`
  - `src/app/features/analytics/components/analytics-widget-shell/analytics-widget-shell.spec.ts`
- **Read & Edit:**
  - `src/app/core/i18n/domains/analytics.i18n.ts` — add complete bilingual (`es` / `en`) translations for Edit Layout mode, presets, widget names, all new widgets (Tasks 20.5–20.9), drill-down modal, and Reading Card export.
  - `src/app/features/analytics/components/analytics-header/` — add the **"Personalizar" / "Customize"** toggle button, inline preset switcher bar (`Editorial` / `Minimalist` / `Deep Data` + `Reset` + `Done`) when Edit Mode is active, and optional **"Export Reading Card"** quick action button.
  - `src/app/features/analytics/pages/stats-page/stats-page.ts` & `stats-page.html` — replace the static component stack with a `@container` 2-column responsive Bento grid (`grid-cols-1 xl:grid-cols-2 gap-6`) rendering visible widgets via `@for (slot of visibleWidgets(); track slot.id)` + `@switch (slot.id)`, wrapped in `<app-analytics-widget-shell>`, plus a collapsible **"Hidden Widgets"** restore drawer when Edit Mode is active.
  - `src/app/features/analytics/pages/stats-page/stats-page.spec.ts` — test layout ordering, edit mode toggle, show/hide, preset switching, and reset.

---

## Functional & Technical Requirements

1. **`<app-analytics-widget-shell>` Wrapper Component:**
   - Wraps each widget slot with consistent Bento grid span (`slot.span === 'full' ? 'xl:col-span-2' : 'xl:col-span-1'`).
   - When `editMode()` is `false`: renders clean `<ng-content />` with zero extra visual chrome or DOM clutter.
   - When `editMode()` is `true`: renders a sleek editorial dashed/accent customization frame header containing:
     - Drag handle (`LucideGripVertical`) enabling HTML5/Pointer drag-and-drop reordering between widget shells (`draggable="true"`, drop indicator highlight ring on target slot).
     - Widget localized title badge.
     - Accessible Move Up / Move Down buttons (`>= 44×44px` on touch devices, disabled at list bounds) so mobile (`320px`) and keyboard-only users can reorder effortlessly.
     - Span toggle button (`Compact` ↔ `Full Width`) when `registryEntry.allowSpanToggle` is `true` (visible on `xl:` viewports).
     - Hide widget button (`LucideEyeOff`) moving the widget to the Hidden Widgets tray.
2. **Hidden Widgets Restore Tray:**
   - Visible in Edit Mode whenever at least 1 widget is hidden; lists hidden widgets as 1-tap `+ Restore` pill buttons (`>= 44×44px`).
3. **Graceful Placeholders for Widgets Built in Tasks 20.5–20.9:**
   - Ensure `StatsPage` compiles cleanly at the end of Task 20.4 (wire existing widgets immediately and keep remaining `@switch` branches clean until Tasks 20.5–20.9 plug in each component).
4. **Reduced Motion & Mobile Parity (Rule 7 & Rule 11):**
   - Zero horizontal overflow at `320px–375px` in both normal and Edit Layout modes.
   - Drag/drop highlight and edit-mode transitions strictly honor `html[data-reduced-motion='reduce']` and `@media (prefers-reduced-motion: reduce)`.

---

## Verification & Acceptance Criteria

- [ ] `npm run test:file -- src/app/features/analytics/components/analytics-widget-shell/analytics-widget-shell.spec.ts` passes.
- [ ] `npm run test:file -- src/app/features/analytics/pages/stats-page/stats-page.spec.ts` passes (reordering updates DOM order, hiding removes widget & shows restore pill, switching presets updates visible set).
- [ ] `npm run verify:quiet` passes with zero TypeScript, ESLint, or i18n key-parity errors.
