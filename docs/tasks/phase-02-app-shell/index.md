# Phase 02: Asymmetric App Shell, Modular Routing & Accessibility

**Status:** Completed (Archived — Consolidated into `develop`)  
**Timeline:** September 2026  
**Core Mission:** Decouple global navigation from the catalog page by introducing an asymmetric App Shell (`SidebarComponent` on tablet/desktop, `HeaderComponent` + `BottomNavComponent` on mobile), lazy-loaded feature routes, global modal state, and WCAG 2.1 AA keyboard ergonomics.

---

## Summary of Delivered Capabilities

1. **Lazy Modular Routing (`src/app/app.routes.ts`):** Configured code-split `loadComponent` routes for `/` (`DashboardPage`), `/books` (`BooksPage`), `/stats` (`StatsPage` placeholder), `/settings` (`SettingsPage` placeholder), and `/about` (`AboutPage`), with wildcard fallback to `/`.
2. **Asymmetric Navigation Shell:**
   - **Desktop/Tablet:** Collapsible `SidebarComponent` (`68px` $\leftrightarrow$ `240px`) persisted in `UiStateService`, with centered brand icon in collapsed state, `+ Añadir libro` CTA, active route highlighting, Settings/About links, GitHub link, and animated theme toggle.
   - **Mobile:** Compact `HeaderComponent` (logo, GitHub icon, animated Sun/Moon theme toggle, `+` create trigger) and fixed `BottomNavComponent` with `>= 48px` touch targets and `<350px` adaptive visibility.
3. **Global Create Modal Trigger:** Exposed `isCreateModalOpen`, `openCreateModal()`, and `closeCreateModal()` in `BooksService` and mounted `<app-book-create-modal>` in the root shell (`app.html`).
4. **Dashboard vs. Catalog Separation:** Moved summary metrics and monthly charts from `BooksPage` into `DashboardPage`, leaving `/books` dedicated to catalog management.
5. **Modal & A11y Hardening:** Implemented `overflow-hidden` body scroll lock across modals, `Escape` key dismissal, safe backdrop click checks, programmatic focus on first input, and `focus-visible` focus rings.
