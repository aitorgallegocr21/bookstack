# Design System & UI Architecture

> **Single Source of Truth** for BookStack's Tailwind CSS v4 visual tokens, responsive breakpoints, asymmetric navigation shell, and accessibility standards.

---

## 1. Visual Identity & Surfaces

BookStack uses **Tailwind CSS v4** (`@import 'tailwindcss';` in `src/styles.css`) with class-based dark mode enabled via:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

### Surface Hierarchy (Warm Modern Editorial `@theme`)

| Role                                       | Light Mode (Warm Paper/Stone)                                                               | Dark Mode (Warm Charcoal)                        |
| :----------------------------------------- | :------------------------------------------------------------------------------------------ | :----------------------------------------------- |
| **App Canvas**                             | `bg-canvas` (`#f6f4ef` / `text-ink`)                                                        | `dark` (`#111010` / `text-ink`)                  |
| **Elevated Card / Dock / Modal**           | `bg-surface` (`#fcfbf8` / `border-subtle`)                                                  | `dark` (`#1a1817` / `border-subtle`)             |
| **Subtle Surface / Input**                 | `bg-surface-subtle` (`border-subtle`)                                                       | `dark` (`bg-surface-subtle` / `border-subtle`)   |
| **Primary Brand Accent (`[data-accent]`)** | `bg-accent hover:bg-accent-hover text-white` (`blue`, `indigo`, `emerald`, `amber`, `rose`) | Same WCAG AA token variables per `[data-accent]` |
| **Active Nav Pill**                        | `bg-accent-soft text-accent-soft-text`                                                      | `bg-accent-soft text-accent-soft-text`           |
| **Adaptive Cover Tint (`--book-tint`)**    | `CoverColorService` `8%–14%` ambient wash                                                   | `CoverColorService` `14%–22%` ambient wash       |

### Status Badge Tokens (`BOOK_STATUS_CONFIG`)

Defined centrally in `src/app/features/books/models/book.model.ts`:

- `pending`: Amber (`bg-amber-50 text-amber-700 border-amber-200` / `bg-amber-500`)
- `reading`: Blue (`bg-blue-50 text-blue-700 border-blue-200` / `bg-blue-500`)
- `completed`: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200` / `bg-emerald-500`)
- `abandoned`: Rose (`bg-rose-50 text-rose-700 border-rose-200` / `bg-rose-500`)

---

## 2. Responsive Breakpoints & Asymmetric Shell

| Viewport               | Breakpoint         | Navigation Pattern                                                                                                                           | Layout Rules                                                                                                                                                                     |
| :--------------------- | :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ultra-Small Mobile** | `< 360px`          | Unified floating `BottomNavComponent` (`bottom` default or `top` via drag/menu, `>= 44px` hit targets, `<app-brand-logo>` overflow menu)     | Book cards stack vertically (`max-[359px]:flex-col`), cover switches to `aspect-[5/2]`                                                                                           |
| **Mobile**             | `< 768px` (`< md`) | Unified floating `BottomNavComponent` (`top`/`bottom` edge, `env(safe-area-inset-*)`) + `md:hidden` `Libros \| Sagas` segmented switcher     | Dynamic main shell clearance for `top` or `bottom` dock                                                                                                                          |
| **Tablet & Desktop**   | `>= 768px` (`md:`) | 4-edge dockable `SidebarComponent` (`left`/`right` `68px` ↔ `240px` or `top`/`bottom` floating horizontal dock) via drag-and-snap or popover | Both `app-sidebar` host and `app.html` align strictly on `hidden md:flex` and dynamic edge offsets. `/series` uses a 12-column variable-scale Bento grid (`1×1` / `2×1` / `2×2`) |

---

## 3. Modals, Focus & Accessibility (WCAG 2.1 AA)

- **Scroll Lock:** Opening any modal increments `UiStateService.acquireScrollLock()` (adding `overflow-hidden` to `document.body` while active locks > 0) and calls `releaseScrollLock()` in `ngOnDestroy()` so stacked modals never unlock prematurely.
- **Shared Modal Styles:** Modal animations (`.modal-backdrop`, `.modal-panel`) and form controls (`.field-label`, `.field-input`, `.field-select`, `.cover-dropzone`) live centrally in `src/styles.css` under `@layer components`.
- **Keyboard Closure:** Modals bind `(document:keydown.escape)` via `host` metadata and verify `event.target === event.currentTarget` for backdrop clicks.
- **Programmatic Focus:** Focus the primary input on open via `viewChild()` + `queueMicrotask` (never use the HTML `autofocus` attribute).
- **Focus Ring:** Interactive buttons and links enforce `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`.
- **Touch Targets:** Minimum clickable area of `44x44px` across mobile controls.
- **In-App Confirmation Dialog (`<app-confirm-dialog>`):** Mounted once in the root shell (`App`) at `z-[70]` with `role="alertdialog"`, `aria-modal="true"`, severity badges (`danger`, `warning`, `info`), optional contextual entity preview cards (`coverUrl`, `title`, `subtitle`, `badge`), optional minor-action suppression checkbox, and focus management (`Cancel`/`Confirm`). Zero native `window.confirm()` calls are permitted.
- **Data Health Auditor (`<app-data-health-section>`):** Embedded in `/settings?tab=data` with a reactive health score badge (`100% Saludable` emerald / amber / rose), 4-category summary cards, expandable issue accordions, and 1-click auto-fix controls.
- **Master-Detail Categorized `/settings` Shell:** Uses a `lg:grid-cols-[240px_minmax(0,1fr)]` sticky vertical category sidebar on desktop (`>= 1024px`) and a zero-scroll Adaptive Bento 2-column category grid (`grid-cols-2`, with the 5th `Avanzado y sistema` card spanning `col-span-2`) on mobile/tablet (`< 1024px`, preventing double-sidebar compression alongside the global shell sidebar at `768px`), paired with semantic rose styling for `Avanzado y sistema` (without inflating container height), bilingual instant settings search with a single clear action + `Escape`, and `?tab=` deep-link synchronization.

---

## 4. Rendering Performance Rules

- **No `transition-all`:** Use discrete property transitions (`transition-colors`, `transition-opacity`, `transition-[width]`, `transition-[margin]`, `transition-transform`, `transition-[height]`, `transition-[height,background-color]`, `transition-[transform,background-color,box-shadow]`).
- **Editorial Route Transitions & Hover Craft:** `withViewTransitions({ skipInitialTransition: true })` pins desktop/mobile docks via `view-transition-name` while cross-fading route content; pointer hover elevations (`@media (hover: hover)`) and tactile button/card helpers (`.editorial-hover-card`, `.btn-tactile`, `.book-tint-card[data-book-tint-active='true']:hover`, `.book-tint-row[data-book-tint-active='true']:hover`) intensify `--book-tint` with zero runtime JS overhead while falling back to neutral hover surfaces when `adaptiveCoverTint` is disabled, and are neutralized under both `@media (prefers-reduced-motion: reduce)` and manual `html[data-reduced-motion="reduce"]` override.
- **Native SVG & CSS Visualizations:** Analytics charts (velocity bars, format donut, status stacked bar, rating histogram, weekday pace) use pure reactive SVG/CSS with zero external chart libraries and wrapping pill controls for `320px` overflow safety.
- **List Containment & Paint Margin:** Catalog cards apply `contain: layout style paint; content-visibility: auto;` with an expanded paint box (`padding: 6px 4px 10px; margin: -6px -4px -10px;`) on `.catalog-card-contain` so `-3px` hover lift borders and shadows never clip against the containment boundary.
- **Deferred Heavy Modals:** Secondary modals (`BookDetailModal`, `BookEditModal`, `ReadingLogEditor`, `SagaDetailModal`, `BookCreateModal`) load lazily via `@defer (when ...)` to keep initial route bundles lean.
- **Image Optimization:** Cover uploads compress to WebP/JPEG (`<= 400px`, `0.75` quality) via `ImageOptimizerService`, while bulk cover enrichment enforces an anti-placeholder dimension guard (`>= 80x120px`); cover `<img>` tags include `loading="lazy"` and `decoding="async"`.

---

## 5. New Feature Governance Checklist

Before merging any new UI feature, micro-interaction, or background capability (see `AGENTS.md` Rule 11):

1. **Settings Relevance:** Decide whether the capability belongs in `/settings` (`AppPreferencesService` + Zod schema + `SETTINGS_SEARCH_ENTRIES` + `es`/`en` i18n).
2. **Reduced-Motion Compliance:** Verify that animations, transforms, and intense hover color shifts are neutralized under both `html[data-reduced-motion='reduce']` and `@media (prefers-reduced-motion: reduce)`.
3. **Preference Fallbacks:** Verify clean neutral styling when `adaptiveCoverTint` is off and zero external requests when `offlineMode` is on.
