# Task 17B.3: Lightweight GPU-Composited Editorial Route Transition Animations

- **Phase:** 17B — Performance Stabilization, Route Transitions & Editorial UX Polish (`v2.3.1`)
- **Status:** Pending
- **Goal:** Introduce a subtle, modern, GPU-composited editorial cross-fade and micro-rise animation when navigating between routes (`/`, `/books`, `/series`, `/stats`, `/settings`, `/about`) while keeping the desktop/mobile dock rock-steady, adding zero JS bundle overhead, and respecting `prefers-reduced-motion: reduce`.

---

## 1. Architectural Design

1. **Native View Transitions API (`withViewTransitions`):**
   - Enable `withViewTransitions({ skipInitialTransition: true })` in `src/app/app.config.ts` inside `provideRouter(...)`.
   - Pin persistent shell elements so they remain completely static during route cross-fades:
     - `app-sidebar aside` $\to$ `view-transition-name: desktop-dock;`
     - `app-bottom-nav nav` $\to$ `view-transition-name: mobile-dock;`
   - Define lightweight, GPU-composited editorial keyframes in `src/styles.css` for `::view-transition-old(root)` and `::view-transition-new(root)`:
     - Outgoing page: `150ms cubic-bezier(0.4, 0, 1, 1)` fading `opacity: 1 -> 0` and subtle `translate3d(0, -4px, 0)`.
     - Incoming page: `220ms cubic-bezier(0.16, 1, 0.3, 1)` fading `opacity: 0 -> 1` and rising `translate3d(0, 8px, 0) -> translate3d(0, 0, 0)`.
     - Ensure `::view-transition-group(desktop-dock)` and `::view-transition-group(mobile-dock)` use `animation: none` so the dock never blinks or shifts.
2. **Graceful CSS Fallback for Non-VTA Browsers:**
   - In `src/app/app.ts` / `src/app/app.html`, hook `<router-outlet (activate)="onRouteActivate()">` (or bind a lightweight CSS class toggle when `typeof document.startViewTransition !== 'function'`) to replay `.page-enter` (`opacity` + `translate3d(0, 6px, 0)`, `200ms cubic-bezier(0.16, 1, 0.3, 1)`) on `<main>` in Firefox / older Safari without triggering layout thrashing.
3. **Accessibility & Performance Invariants:**
   - Guard both `::view-transition-old(*)`, `::view-transition-new(*)`, and `.page-enter` inside `@media (prefers-reduced-motion: reduce)` with `animation: none !important;`.
   - Zero `transition-all`, zero third-party animation packages (`@angular/animations` stays excluded to keep bundle lean).

---

## 2. Target Files & Line Pointers

- `src/app/app.config.ts` (L1-L19 — add `withViewTransitions({ skipInitialTransition: true })` to `provideRouter`)
- `src/app/app.ts` (L1-L49 — add lightweight `routeTransitionTick` / fallback handler for non-VTA browsers if needed)
- `src/app/app.html` (L17-L23 — wire `(activate)` fallback hook on `<router-outlet>`)
- `src/app/core/components/sidebar/sidebar.css` (L1-L15 — add `view-transition-name: desktop-dock` on `aside`)
- `src/app/core/components/bottom-nav/bottom-nav.css` (L1-L10 — add `view-transition-name: mobile-dock` on `nav`)
- `src/styles.css` (L592-L664 — add `::view-transition-old(root)` / `::view-transition-new(root)` editorial keyframes, `.page-enter` class, and `prefers-reduced-motion: reduce` overrides)
- `src/app/app.spec.ts` (verify app shell mounts cleanly with router activation)

---

## 3. Verification & Acceptance Criteria

- [ ] Navigating between `/`, `/books`, `/series`, `/stats`, `/settings`, and `/about` plays a smooth `~220ms` editorial cross-fade + micro-rise while the desktop/mobile dock stays completely still.
- [ ] Under `prefers-reduced-motion: reduce`, route transitions complete instantaneously with zero animation.
- [ ] Zero console errors or view-transition aborts when clicking navigation links rapidly in Playwright E2E tests.
- [ ] `npm run test:file -- src/app/app.spec.ts` passes.
