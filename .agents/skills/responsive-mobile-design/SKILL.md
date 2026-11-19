---
name: responsive-mobile-design
description: On-demand responsive breakpoint recipes (320px-1280px), asymmetric shell rules, modal scroll-lock/focus snippets, and WCAG 2.1 AA touch ergonomics. Activate when building or modifying UI components, cards, toolbars, or modals.
---

# Responsive & Accessible UI Recipes (On-Demand Reference)

> Core mobile-first rules are already loaded in `AGENTS.md`. Use this skill for layout recipes and modal accessibility patterns.

## 1. Breakpoint & Overflow Guardrails

- **Asymmetric Shell (`768px / md`):** Desktop/tablet `<app-sidebar>` uses `hidden md:flex` (`68px` collapsed / `240px` expanded). Mobile `<app-header>` and `<app-bottom-nav>` use `md:hidden` with `<main>` bottom clearance (`pb-20` / `pb-24`).
- **Ultra-Small Viewports (`320px–359px`):** Use `min-w-0` + `truncate` or `line-clamp-2` on flex/grid text children so long titles never push `scrollWidth > clientWidth`. Stack media cards vertically below `360px` (`max-[359px]:flex-col`).
- **Touch Ergonomics & Viewport:** Interactive controls require $\ge 44\times44\text{px}$ hit targets (`min-h-11 min-w-11` or equivalent padding) and $\ge 8\text{px}$ (`gap-2`) separation. Use `100dvh` instead of `100vh` on overlays.

## 2. Accessible Modal & Drawer Pattern

1. **Host Escape Binding:** `host: { '(document:keydown.escape)': 'onEscape()' }`.
2. **Backdrop Click Guard:** Close only when `event.target === event.currentTarget`.
3. **Reference-Counted Scroll Lock:** Call `this.uiState.acquireScrollLock()` on modal open and `this.uiState.releaseScrollLock()` in `ngOnDestroy()`.
4. **Programmatic Focus:** Focus the primary interactive element via `viewChild()` inside `afterNextRender()` or `queueMicrotask()` (never raw HTML `autofocus`).
5. **Collapsible Panels / Drawers:** Animate height smoothly using CSS Grid row transitions (`grid-rows-[0fr]` $\leftrightarrow$ `grid-rows-[1fr]` with `transition-[grid-template-rows] duration-200` and inner `overflow-hidden`) instead of `transition-all`.
