# Task 19.2: Master-Detail Categorized `/settings` Shell, URL Sync & Live Search

## Objective

Transform `/settings` (`SettingsPage`) from a single long vertical stack into a polished, responsive **Master-Detail Control Center** featuring 5 clear categories (`General & Appearance`, `Catalog & Reading`, `Data & Backups`, `Privacy & Scanner`, `Advanced & System` with `"Expert"` badge), URL `?tab=` synchronization, an instant bilingual Settings Search bar with jump-and-highlight navigation, and a passive 30-day backup reminder banner.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/settings/models/settings-navigation.model.ts` (`SettingsTabId`, `SettingsTabDefinition`, `SettingsSearchEntry`, `SETTINGS_TABS`, `SETTINGS_SEARCH_ENTRIES`)
- **Read & Edit:**
  - `src/app/features/settings/pages/settings-page/settings-page.ts` (`L1-L81`)
  - `src/app/features/settings/pages/settings-page/settings-page.html` (`L1-L28`)
  - `src/app/features/settings/pages/settings-page/settings-page.spec.ts` (update & expand integration tests)
  - `src/app/core/i18n/domains/settings.i18n.ts` (`L1-L799` — add complete bilingual `es`/`en` keys for all 5 tabs, search bar, empty search state, backup reminder banner, and new section headings/descriptions)

---

## Functional & Technical Requirements

1. **5 Thematic Tabs (`SettingsTabId = 'general' | 'catalog' | 'data' | 'privacy' | 'advanced'`):**
   - `general`: General & Appearance (`Palette` icon)
   - `catalog`: Catalog & Reading (`BookOpen` icon)
   - `data`: Data & Backups (`Database` icon)
   - `privacy`: Privacy & Scanner (`ShieldCheck` icon)
   - `advanced`: Advanced & System (`SlidersHorizontal` icon, subtle `"Experto"` / `"Expert"` pill badge)
2. **Responsive Master-Detail Layout (`max-w-5xl` container):**
   - **Desktop (`md:` / `>= 768px`):** 2-column grid (`md:grid-cols-[240px_minmax(0,1fr)]` with `items-start gap-6`). Left sticky vertical nav (`sticky top-6`, `role="tablist"`, `aria-orientation="vertical"`) with active pill highlight (`bg-accent-soft text-accent-soft-text border-accent/20`), icon, label, and optional badge.
   - **Mobile (`< 768px`):** Horizontally scrollable pill tab strip (`flex gap-2 overflow-x-auto no-scrollbar pb-1`, `role="tablist"`, `aria-orientation="horizontal"`), every tab button `min-h-[44px] shrink-0 whitespace-nowrap` with zero horizontal page overflow at `320px`.
   - **Active Panel:** Renders the selected tab's components inside `<div role="tabpanel">` using `@switch (activeTab())`. Initially mounts existing sections in `general` (`SettingsPreferencesSectionComponent`), `data` (`StorageQuotaInspectorComponent`, `DataHealthSectionComponent`, `DataPortabilitySectionComponent`, `CoverEnrichmentSectionComponent`), and `advanced` (`DangerZoneSectionComponent`), with clean placeholder containers for the new section components created in Tasks 19.3, 19.4, and 19.7.
3. **URL Query Param Synchronization (`?tab=...`):**
   - Read `ActivatedRoute.queryParamMap` (via `toSignal` or `DestroyRef` subscription updating a Signal) to resolve `?tab=<id>`; invalid/missing values default to `'general'`.
   - Clicking a tab updates the URL via `router.navigate([], { relativeTo: this.route, queryParams: { tab }, queryParamsHandling: 'merge', replaceUrl: true })`.
   - Preserve `scrollToCoverEnrichment()`: switches to `'data'` tab if needed and scrolls smoothly to `coverEnrichmentSection`.
   - Add `navigateToSection(tab: SettingsTabId, settingId?: string): void`: switches tab, waits one microtask/frame, smooth-scrolls to `[data-setting-id="<settingId>"]`, and briefly applies a subtle accent ring pulse (`2s` timeout cleaned up on destroy) so the user immediately sees the jumped-to setting.
4. **Instant Settings Search Bar:**
   - Placed in the `/settings` header area (`type="search"`, `aria-label`, clear `×` button when non-empty).
   - Filters `SETTINGS_SEARCH_ENTRIES` client-side (accent-insensitive normalized substring match against localized title, description, and Spanish/English keywords).
   - When a query is active, renders an inline accessible results panel below the search bar showing matching settings with their category badge; clicking a result calls `navigateToSection(entry.tab, entry.settingId)` and clears the search query. Shows a clean empty state when no setting matches.
5. **Passive 30-Day Backup Reminder Banner:**
   - Computed signal `showBackupReminder = computed(() => this.booksService.books().length > 0 && this.appPreferences.isBackupOverdue() && !this.backupReminderDismissed())`.
   - Renders a discreet editorial amber/info card with a 1-click **"Export backup"** button (`navigateToSection('data', 'data-portability')`) and a session-dismiss button (`×`, `min-h-[44px] min-w-[44px]`).

---

## Verification & Acceptance Criteria

- [ ] Navigating to `/settings?tab=data` activates the Data & Backups tab directly; invalid `?tab=unknown` safely falls back to `general`.
- [ ] Searching for `"offline"`, `"cifrado"`, `"idioma"`, or `"compresión"` returns matching entries and clicking one navigates to the exact tab and scrolls to the target setting.
- [ ] Passive backup reminder appears when books exist and `isBackupOverdue()` is `true`, and hides after dismissal or when `lastBackupExportedAt` is recent.
- [ ] `npm run test:file -- src/app/features/settings/pages/settings-page/settings-page.spec.ts` passes.
- [ ] `npm run verify:quiet` passes cleanly.
