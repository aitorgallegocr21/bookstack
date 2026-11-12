# Design System & UI Architecture

> **Single Source of Truth** for BookStack's Tailwind CSS v4 visual tokens, responsive breakpoints, asymmetric navigation shell, and accessibility standards.

---

## 1. Visual Identity & Surfaces

BookStack uses **Tailwind CSS v4** (`@import 'tailwindcss';` in `src/styles.css`) with class-based dark mode enabled via:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

### Surface Hierarchy

| Role                                 | Light Mode                                 | Dark Mode                                            |
| :----------------------------------- | :----------------------------------------- | :--------------------------------------------------- |
| **App Canvas**                       | `bg-slate-100/80 text-slate-900`           | `dark:bg-slate-950 dark:text-slate-100`              |
| **Elevated Card / Sidebar / Header** | `bg-white border-slate-300/80`             | `dark:bg-slate-900 dark:border-slate-800`            |
| **Subtle Surface / Input**           | `bg-slate-100 border-slate-200`            | `dark:bg-slate-800 dark:border-slate-700`            |
| **Primary Brand Accent**             | `bg-blue-600 hover:bg-blue-700 text-white` | `dark:bg-blue-600 dark:hover:bg-blue-500 text-white` |
| **Active Nav Pill**                  | `bg-blue-50 text-blue-700`                 | `dark:bg-blue-950/60 dark:text-blue-400`             |

### Status Badge Tokens (`BOOK_STATUS_CONFIG`)

Defined centrally in `src/app/features/books/models/book.model.ts`:

- `pending`: Amber (`bg-amber-50 text-amber-700 border-amber-200` / `bg-amber-500`)
- `reading`: Blue (`bg-blue-50 text-blue-700 border-blue-200` / `bg-blue-500`)
- `completed`: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200` / `bg-emerald-500`)
- `abandoned`: Rose (`bg-rose-50 text-rose-700 border-rose-200` / `bg-rose-500`)

---

## 2. Responsive Breakpoints & Asymmetric Shell

| Viewport               | Breakpoint         | Navigation Pattern                                                                               | Layout Rules                                                                                                 |
| :--------------------- | :----------------- | :----------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Ultra-Small Mobile** | `< 360px`          | Compact `HeaderComponent` + `BottomNavComponent` (4 primary tabs, `/about` hidden below `350px`) | Book cards stack vertically (`max-[359px]:flex-col`), cover switches to `aspect-[5/2]`                       |
| **Mobile**             | `< 768px` (`< md`) | `HeaderComponent` (top) + `BottomNavComponent` (fixed bottom, `>= 48px` hit targets)             | Main container uses `pb-20` bottom clearance for fixed nav                                                   |
| **Tablet & Desktop**   | `>= 768px` (`md:`) | Fixed collapsible `SidebarComponent` (`68px` collapsed / `240px` expanded)                       | Both `app-sidebar` host and `app.html` align strictly on `hidden md:flex` and `md:ml-[var(--sidebar-width)]` |

---

## 3. Modals, Focus & Accessibility (WCAG 2.1 AA)

- **Scroll Lock:** Opening any modal increments `UiStateService.acquireScrollLock()` (adding `overflow-hidden` to `document.body` while active locks > 0) and calls `releaseScrollLock()` in `ngOnDestroy()` so stacked modals never unlock prematurely.
- **Shared Modal Styles:** Modal animations (`.modal-backdrop`, `.modal-panel`) and form controls (`.field-label`, `.field-input`, `.field-select`, `.cover-dropzone`) live centrally in `src/styles.css` under `@layer components`.
- **Keyboard Closure:** Modals bind `(document:keydown.escape)` via `host` metadata and verify `event.target === event.currentTarget` for backdrop clicks.
- **Programmatic Focus:** Focus the primary input on open via `viewChild()` + `queueMicrotask` (never use the HTML `autofocus` attribute).
- **Focus Ring:** Interactive buttons and links enforce `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`.
- **Touch Targets:** Minimum clickable area of `44x44px` across mobile controls.

---

## 4. Rendering Performance Rules

- **No `transition-all`:** Use discrete property transitions (`transition-colors`, `transition-opacity`, `transition-[width]`, `transition-[margin]`, `transition-transform`).
- **List Containment:** Catalog cards apply `contain: layout paint; content-visibility: auto;`.
- **Image Optimization:** Cover uploads compress to WebP/JPEG (`<= 400px`, `0.75` quality) via `ImageOptimizerService`; cover `<img>` tags include `loading="lazy"` and `decoding="async"`.
