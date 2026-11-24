# Task 17B.2: Fix Mobile Dock Left-Edge Gap & Icon Symmetry (`BottomNavComponent`)

- **Phase:** 17B — Performance Stabilization, Route Transitions & Editorial UX Polish (`v2.3.1`)
- **Status:** Pending
- **Goal:** Eliminate the asymmetric left-edge gap in the unified mobile floating dock so the Home icon on the left and the BookStack menu button on the right sit with identical visual margins from the dock border, while preserving drag-to-snap (`top` $\leftrightarrow$ `bottom`) ergonomics and WCAG 2.1 AA touch targets.

---

## 1. Root-Cause Analysis

- In `src/app/core/components/bottom-nav/bottom-nav.html` (L99-L181), the inner dock container (`flex items-center gap-0.5 rounded-2xl px-1.5 py-1`) places a dedicated vertical drag-handle `<button class="h-11 w-4">` as the **first** flex child on the far left (L103-L111).
- As a result, the Home icon (`routerLink="/"`) is pushed `~18px` (`w-4` + `gap-0.5`) away from the left dock border, whereas the BookStack logo overflow button on the right sits directly flush (`px-1.5` = `6px`) against the right dock border.

---

## 2. Implementation Specification

1. **Remove the Asymmetric Left-Edge Drag Button:**
   - Remove the `w-4` vertical drag-handle button from inside the horizontal icon row in `bottom-nav.html`.
   - Ensure the horizontal icon row contains strictly the 6 balanced controls:
     1. Home (`routerLink="/"`)
     2. Books (`routerLink="/books"`)
     3. Central `+` Add Book CTA
     4. Stats (`routerLink="/stats"`)
     5. Settings (`routerLink="/settings"`)
     6. Brand Logo / Overflow Menu (`<app-brand-logo [size]="24" />`)
   - Keep uniform container padding (`px-1.5 py-1.5` or `px-2 py-1.5`) and uniform `gap-0.5` so `leftEdgeToHomeIcon === rightEdgeToLogoButton`.
2. **Centered Horizontal Drag Pill Handle:**
   - Add a sleek, centered horizontal drag handle button (`w-12 h-3 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing`) containing a subtle `h-1 w-8 rounded-full bg-border-strong/70` pill positioned:
     - On the **top** center of the dock bar when `position() === 'bottom'` (indicating upward drag), or
     - On the **bottom** center of the dock bar when `position() === 'top'` (indicating downward drag),
     - Inside the same glass pill shell (stacked vertically via `flex-col` inside the bordered glass container, with zero horizontal width impact!).
   - Keep `[attr.aria-label]="i18n.t().nav.dockDragHint"` and `(pointerdown)="onDragStart($event)"` on the centered drag handle so keyboard/pointer drag-to-snap remains fully functional.
3. **Touch Target & `320px` Viewport Check:**
   - Verify all 6 interactive dock items retain `min-h-[44px] min-w-[44px]` and total dock width fits cleanly inside `320px` (`6 * 44px + 5 * 2px + 12px = 286px < 320px`) with zero horizontal overflow.

---

## 3. Target Files & Line Pointers

- `src/app/core/components/bottom-nav/bottom-nav.html` (L99-L182 — restructure dock container to stack centered horizontal drag pill + symmetric 6-item icon row)
- `src/app/core/components/bottom-nav/bottom-nav.spec.ts` (L1-L106 — verify centered drag handle and symmetric 6-control row)
- `tests/e2e/navigation-and-theme.spec.ts` (L137-L187 — add bounding-box symmetry assertion verifying `Math.abs(leftInset - rightInset) <= 2` at `320px` and `375px`)

---

## 4. Verification & Acceptance Criteria

- [ ] At `320px` and `375px`, the distance from the dock's left border to the Home icon equals the distance from the BookStack logo button to the dock's right border ($\le 2\text{px}$ tolerance).
- [ ] Dragging the centered pill handle still triggers `DockPositionService` snap preview and snaps between `top` and `bottom`.
- [ ] All 6 dock buttons meet `>= 44×44px` touch target size with zero horizontal overflow.
- [ ] `npm run test:file -- src/app/core/components/bottom-nav/bottom-nav.spec.ts` passes.
