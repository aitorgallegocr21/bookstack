# Task 19B.1: Settings UX Polish — Red Advanced Tab, Zero-Scroll Mobile Bento Tabs, Single Search Clear & Advanced Spacing

- **Phase:** [Phase 19B (`v2.5.1`)](index.md)
- **Status:** Completed
- **Target Files:**
  - `src/app/features/settings/models/settings-navigation.model.ts` (L6–L37)
  - `src/app/features/settings/pages/settings-page/settings-page.html` (L14–L43, L139–L218)
  - `src/app/features/settings/pages/settings-page/settings-page.ts` (Escape-to-clear search handler)
  - `src/app/features/settings/components/settings-advanced-section/settings-advanced-section.html` (L27–L55, L112–L135)
  - `src/app/features/settings/pages/settings-page/settings-page.spec.ts`
  - `tests/e2e/settings-flow.spec.ts`

---

## 1. Requirements

### 1.1 Red/Rose Tone for "Avanzado y sistema" Tab (No Expert Badge)

- Replace `hasExpertBadge?: boolean` on `SettingsTabDefinition` (`settings-navigation.model.ts`) with `isDangerTone?: boolean` (set `true` on `advanced`).
- Remove the `tab.hasExpertBadge` badge `<span>` from both the mobile/tablet tab selector and the desktop sidebar tab list in `settings-page.html`.
- Style `advanced` (`tab.isDangerTone`) with a clean, WCAG AA rose/red treatment that adds **zero extra width or height**:
  - **Inactive:** `text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-800 dark:hover:text-rose-300` (with `border-rose-500/20` on the mobile Bento tile, `border-transparent` on the desktop list).
  - **Active:** `border-rose-500/35 bg-rose-500/12 font-semibold text-rose-700 dark:text-rose-300`.

### 1.2 Zero-Scroll Mobile/Tablet Category Selector (`< 1024px`)

- Replace `<div role="tablist" class="no-scrollbar flex gap-2 overflow-x-auto pb-1">` in `settings-page.html` (L140–L172) with a compact, zero-horizontal-scroll **Adaptive Bento Category Grid**:
  - Container: `rounded-2xl border border-subtle bg-surface p-1.5 shadow-2xs`.
  - Grid: `grid grid-cols-2 gap-1.5`.
  - The first 4 categories (`General`, `Catálogo y lectura`, `Datos y copias`, `Privacidad y red`) form a balanced `2×2` grid; the 5th category (`Avanzado y sistema`, `tab.isDangerTone`) spans full width (`col-span-2`) as a distinct bottom bar.
  - Every tab button preserves `min-h-[44px]`, crisp icon + readable label (`leading-tight`, no awkward overflow down to `320px`), and clear active state highlight.
  - Works seamlessly across `320px`, `375px`, `640px`, and `768px` (even alongside the expanded `240px` tablet sidebar) with zero horizontal scrolling.

### 1.3 Eliminate Duplicate "X" Clear Button in Settings Search

- In `settings-page.html` (L22–L30), change the search `<input>` from `type="search"` to `type="text" inputmode="search" enterkeyhint="search" autocomplete="off" role="searchbox"` so Chromium/WebKit browsers never render the native `::-webkit-search-cancel-button` next to `[data-testid="settings-search-clear"]`.
- Add `(keydown.escape)="clearSearch()"` on the search input so pressing `Escape` immediately clears the query and closes the results popover.

### 1.4 Clean Vertical Spacing in `SettingsAdvancedSectionComponent`

- In `settings-advanced-section.html`:
  - **Card 1 (`coverMaxDimension` / "Resolución máxima", L28–L36):** Remove `mb-0` conflict / increase spacing between the label and the 4-button option grid (`space-y-3 pt-1` on the wrapper and `mt-3` or clean `flex flex-col gap-3` so the label is clearly separated from the option cards).
  - **Card 2 (`metadataSearchQuota` / "Resultados por búsqueda", L112–L117):** Apply the same `flex flex-col gap-3 pt-1` vertical rhythm between the label and the 3-button option grid.

---

## 2. Acceptance Criteria & Tests

- [ ] No `Experto`/`Expert` badge renders anywhere on `/settings`; `advanced` tab displays semantic rose/red styling in both light and dark modes with identical height to sibling tabs.
- [ ] Mobile/tablet settings navigation (`< 1024px`) has zero horizontal scrolling (`scrollWidth <= clientWidth`) and all 5 categories are immediately visible on `320px`, `375px`, and `768px`.
- [ ] Typing in `[data-testid="settings-search-input"]` shows exactly **one** clear button (`[data-testid="settings-search-clear"]`), and pressing `Escape` clears the search.
- [ ] `coverMaxDimension` and `metadataSearchQuota` labels have clear vertical spacing (`>= 12px`) above their option card grids.
- [ ] Unit specs (`settings-page.spec.ts`) and Playwright E2E (`settings-flow.spec.ts`) updated and passing.
