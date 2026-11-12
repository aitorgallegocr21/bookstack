---
name: responsive-mobile-design
description: Mobile-first responsive UI standards, touch ergonomics, dynamic viewport handling, asymmetric Shell breakpoints, modal accessibility, and zero-overflow verification for BookStack.
---

# Responsive Mobile-First & Accessibility Design Skill

This skill guides AI agents and engineers implementing UI components, Shell layouts, catalog cards, and modal dialogs in BookStack to guarantee mobile ergonomics, WCAG 2.1 AA compliance, and zero layout regressions.

---

## 1. Asymmetric Shell Breakpoint Contract (`768px / md`)

- **Desktop & Tablet ($\ge 768\text{px}$, `md:`):**
  - `SidebarComponent` is fixed on the left (`68px` collapsed / `240px` expanded, persisted via `UiStateService`).
  - Both `app.html` and `SidebarComponent` host class MUST align strictly on `hidden md:flex` (never `lg:flex` vs `md:ml-...` mismatch).
  - Mobile `<app-header>` and `<app-bottom-nav>` are hidden via `md:hidden`.
- **Mobile ($< 768\text{px}$):**
  - Compact `<app-header>` at top (`role="banner"`).
  - Fixed `<app-bottom-nav>` at bottom (`role="navigation"`, `pb-[env(safe-area-inset-bottom)]`), reserving bottom clearance (`pb-20` / `pb-24`) on `<main>` so content is never obscured.
  - Below `350px`, auxiliary tabs (e.g., `/about`) collapse gracefully from the bottom bar while remaining accessible from `/settings`.

---

## 2. Core Ergonomic & Touch Standards

### A. Touch Targets (WCAG 2.5.5 / Apple HIG)

- Every interactive control (buttons, nav tabs, icon toggles, modal close buttons) must provide a minimum clickable/tappable area of **44x44 CSS pixels** (or `>= 48px` height in bottom navigation).
- Maintain at least `gap-2` (`8px`) between adjacent icon action buttons.

### B. Dynamic Viewport Units (`dvh` over `vh`)

- Prefer `min-h-[100dvh]` / `h-[100dvh]` over raw `100vh` for full-screen overlays and modal containers so mobile browser URL bars never clip modal footers or actions.

### C. Ultra-Small Viewport Ergonomics (`< 360px`)

- Book catalog cards stack cleanly on `< 360px` (`max-[359px]:flex-col`) with a compact banner cover (`aspect-[5/2]`) and wrapping action bar (`flex-wrap`).
- Apply `min-w-0` and `truncate` on flex text containers to prevent long book titles or author names from forcing horizontal overflow.

---

## 3. Modals, Focus Management & Performance

1. **Keyboard & Focus:**
   - Modals close on `Escape` and safe backdrop clicks (`event.target === event.currentTarget`).
   - Programmatically focus the primary `<input>` via `viewChild()` + `afterNextRender`/`queueMicrotask` instead of the HTML `autofocus` attribute.
   - Lock background scroll via `document.body.classList.add('overflow-hidden')` on open and remove in `ngOnDestroy()`.
2. **WCAG 2.1 AA:**
   - Semantic landmarks (`<header>`, `<main>`, `<nav>`, `<section>`, `<article>`).
   - Visible keyboard focus (`focus-visible:ring-2 focus-visible:ring-blue-500`).
   - Explicit `<label for="...">` associations for every form input.
3. **Rendering Performance:**
   - Never use `transition-all` on catalog cards or structural wrappers; use discrete `transition-colors`, `transition-opacity`, `transition-[width]`, or `transition-[margin]`.
   - Use `contain: layout paint; content-visibility: auto;` on long repetitive lists and `loading="lazy" decoding="async"` on cover images.

---

## 4. Verification Checkpoints

Every UI or layout PR must pass Playwright and manual viewport checks at:

- **375px** (standard mobile — zero horizontal overflow: `scrollWidth <= clientWidth`)
- **390px** (flagship mobile)
- **768px** (tablet breakpoint transition — sidebar visible, mobile header/nav hidden)
- **1280px+** (desktop expanded and collapsed sidebar)
