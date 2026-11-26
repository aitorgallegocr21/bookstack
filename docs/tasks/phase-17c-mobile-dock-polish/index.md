# Phase 17C: Mobile Dock Exterior Grip Tab & Overflow Popover Auto-Close (`v2.3.2`)

- **Status:** Completed
- **Target Release:** `v2.3.2` (Patch / Micro-UX Polish)
- **Recommended Branch:** `fix/mobile-dock-polish` (branched from `develop`)

---

## 1. Mission & Root-Cause Summary

Eliminate the remaining vertical inset asymmetry inside the mobile floating dock (`BottomNavComponent`), replace the ambiguous flat horizontal drag line with a clear exterior 6-dot grip tab (`LucideGripHorizontal`), and ensure the BookStack logo overflow popover closes automatically whenever the user taps any other dock navigation control.

### Confirmed Root Causes

1. **Vertical Dead Space Inside `mobile-dock-shell` (`src/app/core/components/bottom-nav/bottom-nav.html` L114-L132):**
   - `mobile-dock-shell` stacks `dock-drag-handle` (`h-3` = `12px`) in normal flex flow above (when docked at `bottom`) or below (when docked at `top`) `mobile-dock-row` (`44px`), on top of `py-1` (`4px`).
   - This creates a `16px` gap between the icons and the inner dock border on the drag-pill side versus `4px` on the opposite side.
   - Visually, a flat `h-1 w-8` horizontal bar resembles a bottom-sheet drawer handle rather than a dock drag-to-snap handle.
2. **Overflow Popover Stays Open on Dock Route Clicks (`src/app/core/components/bottom-nav/bottom-nav.ts` L115-L123 & `bottom-nav.html` L133-L207):**
   - `onDocumentClick()` only closes `isMenuOpen` when the click target is outside `app-bottom-nav`.
   - The 4 primary route links inside `mobile-dock-row` (`/`, `/books`, `/stats`, `/settings`) do not invoke `closeMenu()` on `(click)`, so tapping another dock section while the BookStack logo popover is open leaves the popover floating over the new route.

---

## 2. Implementation Specification

### 2.1 Symmetric Mobile Dock Box + Exterior `GripHorizontal` Tab

1. **Import `LucideGripHorizontal` in `src/app/core/components/bottom-nav/bottom-nav.ts`:**
   - Add `LucideGripHorizontal` to the `@lucide/angular` import block and expose `protected readonly GripHorizontal = LucideGripHorizontal;`.
2. **Make `mobile-dock-shell` Strictly Symmetric (`bottom-nav.html` L114-L132):**
   - Remove `flex-col` / `flex-col-reverse` from `[data-testid="mobile-dock-shell"]` and add `relative`:
     ```html
     <div
       data-testid="mobile-dock-shell"
       class="border-border-subtle relative flex items-center rounded-2xl border bg-surface-glass px-1.5 py-1 shadow-lg backdrop-blur-md"
     ></div>
     ```
   - Keep `[data-testid="mobile-dock-row"]` as the sole in-flow child (`flex items-center gap-0.5`), guaranteeing identical vertical (`topInset ≈ bottomInset`, `4px + 1px border`) and horizontal (`leftInset ≈ rightInset`, `6px + 1px border`) padding in both `bottom` and `top` dock positions.
3. **Exterior Attached Grip Tab (`[data-testid="dock-drag-handle"]`):**
   - Position the drag handle as a sleek attached exterior tab centered on the outer lip of `mobile-dock-shell`:
     - **When `position() === 'bottom'`:** attached to the top outer border (`bottom-full -mb-px rounded-t-lg border border-b-0`).
     - **When `position() === 'top'`:** attached to the bottom outer border (`top-full -mt-px rounded-b-lg border border-t-0`).
   - Styling:
     ```html
     <button
       type="button"
       data-testid="dock-drag-handle"
       (pointerdown)="onDragStart($event)"
       class="border-border-subtle hover:text-ink-primary absolute left-1/2 flex h-4 w-11 -translate-x-1/2 cursor-grab touch-none items-center justify-center bg-surface-glass text-ink-muted shadow-sm backdrop-blur-md transition-colors focus-visible:ring-2 focus-visible:ring-accent-ring focus-visible:outline-none active:cursor-grabbing"
       [class.bottom-full]="position() === 'bottom'"
       [class.-mb-px]="position() === 'bottom'"
       [class.rounded-t-lg]="position() === 'bottom'"
       [class.border]="true"
       [class.border-b-0]="position() === 'bottom'"
       [class.top-full]="position() === 'top'"
       [class.-mt-px]="position() === 'top'"
       [class.rounded-b-lg]="position() === 'top'"
       [class.border-t-0]="position() === 'top'"
       [attr.aria-label]="i18n.t().nav.dockDragHint"
       [title]="i18n.t().nav.dockDragHint"
     >
       <svg [lucideIcon]="GripHorizontal" size="14" stroke-width="2" aria-hidden="true"></svg>
     </button>
     ```
   - **Popover Clearance (`bottom-nav.html` L21-L25):**
     - Increase the popover vertical offset from `mb-2.5` / `mt-2.5` (`10px`) to `mb-5` / `mt-5` (`20px`) so the opened overflow menu clears the `16px`-tall (`h-4`) exterior grip tab with a clean `4px` gap and never collides with it.

### 2.2 Auto-Close Overflow Popover on Any Dock Navigation Click

- In `src/app/core/components/bottom-nav/bottom-nav.html` (L133-L207), add `(click)="closeMenu()"` to all 4 primary `<a routerLink="...">` controls inside `mobile-dock-row`:
  - Home (`routerLink="/"`)
  - Books (`routerLink="/books"`)
  - Stats (`routerLink="/stats"`)
  - Settings (`routerLink="/settings"`)
- This ensures clicking any dock icon (even the currently active route) immediately dismisses `[role="menu"]`, matching the existing behavior of the central `+` button (`openCreate()`), `/series`, and `/about`.

---

## 3. Target Files & Line Pointers

- `src/app/core/components/bottom-nav/bottom-nav.ts` (L12-L65 — import & expose `LucideGripHorizontal`)
- `src/app/core/components/bottom-nav/bottom-nav.html` (L16-L26 popover clearance; L114-L132 symmetric shell + exterior grip tab; L133-L207 `(click)="closeMenu()"` on all 4 route links)
- `src/app/core/components/bottom-nav/bottom-nav.spec.ts` (update grip-tab structural assertions + add regression test verifying all 4 dock links close `[role="menu"]`)
- `tests/e2e/navigation-and-theme.spec.ts` (L131-L196 — assert vertical symmetry `Math.abs(topInset - bottomInset) <= 2` in both `bottom` and `top` positions at `320px`/`375px` + verify tapping another dock route closes the overflow menu)

---

## 4. Verification & Acceptance Criteria

- [x] `mobile-dock-shell` has zero extra vertical padding on the grip side (`Math.abs(topInset - bottomInset) <= 2px` in both `bottom` and `top` positions at `320px` and `375px`).
- [x] Horizontal symmetry (`Math.abs(leftInset - rightInset) <= 2px`) and `>= 44×44px` touch targets on all 6 controls remain intact with zero horizontal overflow.
- [x] Exterior grip tab renders `LucideGripHorizontal` centered above the dock when at `bottom`, and below the dock when at `top`, without colliding with the opened overflow popover.
- [x] Opening the BookStack logo popover and clicking any of the 4 dock route links (`/`, `/books`, `/stats`, `/settings`) immediately closes `[role="menu"]`.
- [x] Unit tests (`npm run test:file -- src/app/core/components/bottom-nav/bottom-nav.spec.ts`), full gate (`npm run verify:quiet`), and Playwright E2E (`npm run test:e2e`) pass cleanly.
