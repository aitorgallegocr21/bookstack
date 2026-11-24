# Phase 17B: Performance Stabilization, Route Transitions & Editorial UX Polish (`v2.3.1`)

- **Status:** Active (Documented — Ready for Implementation)
- **Target Release:** `v2.3.1` (Patch / Stabilization release on completion)
- **Recommended Branch:** `fix/phase-17b-performance-and-ux-polish` (branched from `develop`)

---

## 1. Phase Mission & Root-Cause Summary

Resolve critical post-Phase-17 performance, flickering, and layout polish issues discovered in real-world usage with large libraries, while elevating navigation fluidity and hover micro-interactions:

1. **Critical `/books` Performance Bottleneck, CPU Fan Spike & `BookDetailModal` Tint Flicker (`CoverColorService`):**
   - **Root Causes Confirmed in `src/app/core/services/cover-color.service.ts`:**
     - **Monolithic `cacheSignal` ($O(N^2)$ Signal Storm):** All book cards read one global `cacheSignal = signal<Record<string, string>>({})`. Completing 1 book's extraction invalidates every rendered card's `bookTint` `computed()`, triggering $N^2$ re-evaluations.
     - **Infinite LRU Eviction Thrashing (`MAX_CACHE_ENTRIES = 250`):** Libraries with $> 250$ books evict earlier keys on insertion, causing those rendered cards and `BookDetailModal` to flip back to fallback tint and immediately re-queue extraction in a permanent 100% CPU loop (explaining the continuous color flicker and fan spin-up).
     - **Unbounded Extraction Concurrency:** Every uncached card fires `new Image()` + `<canvas>` + `getImageData()` simultaneously via `queueMicrotask`.
     - **Synchronous `localStorage.setItem` Per Book:** Every single extraction serializes the full cache synchronously on the main thread.
     - **Missing Card Render Containment:** Rendering hundreds of catalog cards without `content-visibility: auto` forces full layout/paint of offscreen cards on `/books` entry.
   - **Solution:** Per-key granular `WritableSignal<string>` map ($O(1)$ reactivity), session-unbounded in-memory map (zero LRU thrashing) with capped debounced `localStorage` persistence (`500ms`), bounded idle extraction queue (concurrency $\le 2$ via `requestIdleCallback`/timer yielding), and `content-visibility: auto` on catalog cards.
2. **Mobile Dock Left-Edge Asymmetry (`BottomNavComponent`):**
   - **Root Cause:** The standalone left-side `<button class="h-11 w-4">` vertical drag handle adds `~18px` of dead space between the left border and the Home icon, while the right-side BookStack logo button sits flush with the right edge.
   - **Solution:** Relocate the drag affordance to a sleek centered horizontal drag pill integrated cleanly along the dock lip, giving the 6 navigation controls 100% symmetric left/right padding.
3. **Creative, Lightweight Route Transition Animations:**
   - Enable Angular's native `withViewTransitions({ skipInitialTransition: true })` with GPU-composited editorial cross-fade + subtle rise (`opacity` + `translateY(6px)`), keeping desktop/mobile docks pinned via `view-transition-name` so shells never flicker, paired with a lightweight CSS fallback and `prefers-reduced-motion: reduce` guard.
4. **Desktop `/settings` Interface Preferences Redesign & Control Symmetry:**
   - **Root Causes:** Cramming Language, Theme Mode, and Default View into `sm:grid-cols-3` made the 3-option Theme segmented control asymmetric (`Claro` / `Oscuro` / `Sistema`), Accent Swatches wrapped raggedly via `flex-wrap`, and the 4-button Desktop Dock (`grid-cols-4`) was squeezed into 25% of card width causing button text overlap.
   - **Solution:** Clean vertical editorial settings rows with aligned equal-width segmented controls, an ordered 5-column symmetric Accent Swatch grid (`blue` $\to$ `indigo` $\to$ `emerald` $\to$ `amber` $\to$ `rose`), and spacious icon+label Desktop (4-edge) and Mobile (2-edge) dock selectors with zero overlap.
5. **Refined Editorial Hover Micro-Interactions:**
   - Theme-aware, GPU-composited hover states (`@media (hover: hover)`, zero `transition-all`) across dock navigation items, cover-tinted book/saga cards, settings swatches, and interactive buttons.

---

## 2. Atomic Task Breakdown

- [x] **[Task 17B.1: Fix `/books` CPU Spike, Infinite LRU Thrashing & Cover Tint Flicker (`CoverColorService` & Card Containment)](task-17b.1-cover-color-performance-and-flicker-fix.md)** — Replace monolithic `cacheSignal` with per-key signals ($O(1)$), eliminate in-memory LRU eviction loops, add a concurrency-2 idle extraction queue + debounced `localStorage` persistence, add `content-visibility: auto` to catalog cards, and write regression tests.
- [x] **[Task 17B.2: Fix Mobile Dock Left-Edge Gap & Icon Symmetry (`BottomNavComponent`)](task-17b.2-mobile-dock-symmetry-fix.md)** — Replace the asymmetric left-edge drag handle with a centered horizontal drag pill so all 6 mobile dock controls have balanced left/right edge margins, and add unit/E2E symmetry assertions.
- [ ] **[Task 17B.3: Lightweight GPU-Composited Editorial Route Transition Animations](task-17b.3-editorial-route-transition-animations.md)** — Configure Angular `withViewTransitions()` with pinned dock `view-transition-name` layers, bespoke editorial cross-fade/rise CSS, non-VTA fallback, and `prefers-reduced-motion` guard.
- [ ] **[Task 17B.4: Redesign `/settings` Interface Preferences Layout, Ordering & Control Symmetry](task-17b.4-settings-preferences-redesign-and-symmetry.md)** — Restructure `SettingsPreferencesSectionComponent` into symmetric vertical editorial rows, equal-width Theme Mode & Default View controls, an ordered 5-swatch Accent grid, and spacious non-overlapping 4-edge Desktop & 2-edge Mobile Dock controls with unit & E2E verification.
- [ ] **[Task 17B.5: Editorial Hover Micro-Interactions, Full E2E Verification & Tier 2 Docs Sync (`v2.3.1`)](task-17b.5-editorial-hover-craft-and-verification.md)** — Polish GPU-composited hover states across dock nav, book/saga cards, and interactive controls (`@media (hover: hover)` + reduced-motion guard), run `npm run verify:quiet` + `npm run test:e2e:quiet`, and complete Tier 2 docs sync (`v2.3.1`) and branch cleanup.
