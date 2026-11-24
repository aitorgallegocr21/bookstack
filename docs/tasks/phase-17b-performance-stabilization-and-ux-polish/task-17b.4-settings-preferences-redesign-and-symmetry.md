# Task 17B.4: Redesign `/settings` Interface Preferences Layout, Ordering & Control Symmetry

- **Phase:** 17B — Performance Stabilization, Route Transitions & Editorial UX Polish (`v2.3.1`)
- **Status:** Completed
- **Goal:** Redesign `SettingsPreferencesSectionComponent` in `/settings` so desktop and mobile share a crisp, symmetric, vertical editorial layout with zero overlapping buttons in the 4-edge Desktop Dock selector, equal-width Theme Mode & Default Catalog View controls, and an intentionally ordered 5-column Accent Swatch grid.

---

## 1. Root-Cause Analysis

Inspecting `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.html` (L14-L213):

1. **Desktop Dock Button Overlap (L150-L180):**
   - The Desktop Dock (`grid-cols-4`) is nested inside `md:grid-cols-2` $\to$ `sm:grid-cols-2`, giving it only **25% of the section width** on desktop! Four Spanish labels (`Izquierda`, `Derecha`, `Arriba`, `Abajo`) cannot fit inside ~200px total width, causing text collisions and overlap.
2. **Asymmetric Theme Mode Control & Cramped 3-Column Top Row (L14-L106):**
   - Language, Visual Theme (`Claro` / `Oscuro` / `Sistema`), and Default Catalog View are squeezed into `sm:grid-cols-3`. Because `Claro` (5 chars), `Oscuro` (6 chars), and `Sistema` (7 chars) sit in a tight horizontal cell without equal-width `min-w-0` spacing and breathing room, the segmented pill looks visually unbalanced.
3. **Unordered, Ragged Accent Swatches (L118-L146):**
   - The 5 accent swatches use `flex flex-wrap` with variable-width pill buttons, wrapping unevenly onto two lines on desktop with no consistent column grid alignment.

---

## 2. Implementation Specification

Restructure `settings-preferences-section.html` into a **vertical editorial settings stack** (`divide-y divide-subtle`) where every preference has clear visual hierarchy, generous spacing, and strict geometric symmetry:

1. **Row 1 — Active Language (`Idioma activo`):**
   - Responsive 2-part row (`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`): label on left, `#settings-language` select (`w-full sm:w-64 md:w-72`) on right.
2. **Row 2 — Visual Theme (`Tema visual`):**
   - Responsive 2-part row: label on left, equal-width `grid grid-cols-3` segmented control (`w-full sm:w-72 md:w-80`) on right.
   - Each of the 3 buttons (`theme-light-btn`, `theme-dark-btn`, `theme-system-btn`) uses `min-w-0 flex-1` with a compact Lucide icon (`Sun`, `Moon`, `Monitor`, `size="14"`) + centered text inside identical-width `1fr` tracks so `Claro`, `Oscuro`, and `Sistema` have 100% identical container widths.
3. **Row 3 — Default Catalog View (`Vista por defecto`):**
   - Responsive 2-part row: label on left, `#settings-default-view` select (`w-full sm:w-64 md:w-72`) aligned cleanly with Row 1 (or matching equal-width control) on right.
4. **Row 4 — Accent Color (`Color de acento`):**
   - Full-width block with label on top and a symmetric **5-column grid** (`grid grid-cols-2 gap-2.5 sm:grid-cols-5`) in intentional chromatic spectrum order (`blue` $\to$ `indigo` $\to$ `emerald` $\to$ `amber` $\to$ `rose`).
   - Every swatch button (`data-testid="accent-swatch-<id>"`) has identical height (`min-h-[44px]`), equal column width, a crisp `h-4 w-4 rounded-full` color circle, centered/aligned label, and a subtle active accent ring + check indicator.
5. **Row 5 — Dock Position (`Posición del dock`):**
   - Full-width responsive 2-block layout (`grid grid-cols-1 gap-4 lg:grid-cols-12`):
     - **Desktop Dock (8 cols on `lg:`):** `grid grid-cols-2 gap-1.5 sm:grid-cols-4` inside a spacious segmented tray, where each button (`data-testid="dock-desktop-<pos>"`) displays a directional Lucide icon (`PanelLeft`, `PanelRight`, `PanelTop`, `PanelBottom`, `size="15"`) + full non-overlapping label (`Izquierda`, `Derecha`, `Arriba`, `Abajo`) with `min-h-[44px]`.
     - **Mobile Dock (4 cols on `lg:`):** `grid grid-cols-2 gap-1.5` inside a matching segmented tray, where each button (`data-testid="dock-mobile-<pos>"`) displays `PanelBottom` / `PanelTop` + full centered label (`Abajo`, `Arriba`) with `min-h-[44px]`.
6. **Preserve Existing Test IDs & Accessibility:**
   - Keep `#settings-language`, `#settings-default-view`, `theme-light-btn`, `theme-dark-btn`, `theme-system-btn`, `accent-swatch-*`, `dock-desktop-*`, `dock-mobile-*`, `reset-suppressed-confirms-btn`, and all `role="group"` + `aria-labelledby` + `aria-pressed` attributes intact.

---

## 3. Target Files & Line Pointers

- `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.ts` (L1-L107 — import Lucide icons `Sun`, `Moon`, `Monitor`, `PanelLeft`, `PanelRight`, `PanelTop`, `PanelBottom` and expose icon map)
- `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.html` (L1-L236 — vertical editorial row redesign, equal-width controls, 5-col accent grid, spacious 4-edge desktop + 2-edge mobile dock selectors)
- `src/app/features/settings/components/settings-preferences-section/settings-preferences-section.spec.ts` (update/verify unit tests for all controls)
- `tests/e2e/settings-flow.spec.ts` (add desktop `1280px` & mobile `375px` layout symmetry + non-overlap assertions for theme buttons, accent swatches, and 4-edge desktop dock buttons)

---

## 4. Verification & Acceptance Criteria

- [x] On desktop (`1280px`) and tablet (`768px`/`1000px`), all 4 Desktop Dock buttons (`Izquierda`, `Derecha`, `Arriba`, `Abajo`) have zero bounding-box overlap and zero clipped text.
- [x] All 3 Theme Mode buttons (`Claro`, `Oscuro`, `Sistema`) have identical widths ($\le 1\text{px}$ variance).
- [x] All 5 Accent Swatches align in a single clean 5-column row on desktop (`sm:grid-cols-5`) with equal widths.
- [x] Zero horizontal overflow on mobile (`320px` & `375px`).
- [x] `npm run test:file -- src/app/features/settings/components/settings-preferences-section/settings-preferences-section.spec.ts` passes.
