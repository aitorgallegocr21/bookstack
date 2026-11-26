# Task 19B.2: Dock Popover Auto-Close, Book Card Hover Clipping Fix & Zero-Cost Adaptive Tint Intensification

- **Phase:** [Phase 19B (`v2.5.1`)](index.md)
- **Status:** Completed
- **Target Files:**
  - `src/app/core/components/sidebar/sidebar.ts` (L1–L226)
  - `src/app/core/components/sidebar/sidebar.html` (L129–L203, L331–L388)
  - `src/app/core/components/sidebar/sidebar.spec.ts`
  - `src/app/core/components/bottom-nav/bottom-nav.ts` (verify/harden outside-click scope)
  - `src/styles.css` (L467–L603, L739–L783)
  - `src/app/features/books/components/book-grid-card/book-grid-card.html` (L1–L30)
  - `src/app/features/books/components/book-detailed-card/book-detailed-card.html` (L1–L30)
  - `src/app/features/books/components/book-compact-row/book-compact-row.html` (L1–L15)
  - `tests/e2e/navigation.spec.ts` (or `dock-shell.spec.ts`) & `tests/e2e/catalog-flow.spec.ts`

---

## 1. Requirements

### 1.1 Desktop Dock Layout Popover (`disposición`) Auto-Close

- **Root Cause:** `SidebarComponent.onDocumentClick()` checks `!this.elementRef.nativeElement.contains(target)` against the entire `<app-sidebar>` host, so clicking any other dock link (`Inicio`, `Libros`, `Series`, `Estadísticas`, `Ajustes`, `Acerca de`) or dock action (`Añadir libro`, `Tema`, `Colapsar`, `GitHub`) leaves `isDockMenuOpen()` stuck open.
- **Fix:**
  1. Mark the dock layout trigger + popover wrapper with `data-dock-menu-root` (in both vertical and horizontal layouts of `sidebar.html`).
  2. Update `onDocumentClick(event: Event)` in `sidebar.ts` to close `isDockMenuOpen` whenever `!(target instanceof Element) || !target.closest('[data-dock-menu-root]')`.
  3. Inject `Router` and close `isDockMenuOpen` on `NavigationStart` (`takeUntilDestroyed()`), and also call `closeDockMenu()` inside `toggleSidebar()`, `openCreate()`, `toggleTheme()`, and `openGitHub()` for immediate state hygiene.
  4. Verify `BottomNavComponent` closes its overflow menu when clicking anywhere outside its menu/trigger (`data-mobile-menu-root`) or on route navigation.

### 1.2 Fix Book Card Hover Top-Border & Shadow Clipping (`/books`)

- **Root Cause:** `.catalog-card-contain` (`src/styles.css` L523–L527) uses `contain: layout style paint; content-visibility: auto;`. Because `contain: paint` clips anything painted outside the host's border box, lifting the inner `<article>` upward via `hover:-translate-y-1` (`-4px`) clips the top border of the card and clips the outer hover `box-shadow`.
- **Fix (Zero-Performance-Loss):**
  - Expand `.catalog-card-contain`'s paint box cleanly without altering grid spacing:
    ```css
    .catalog-card-contain {
      contain: layout style paint;
      content-visibility: auto;
      contain-intrinsic-size: auto 220px;
      padding: 6px 4px 10px;
      margin: -6px -4px -10px;
    }
    ```
  - This keeps `content-visibility: auto` off-screen rendering optimization 100% intact while giving the `-4px` hover lift, top border, and tinted hover shadow ample unclipped paint space.

### 1.3 Zero-Cost Pure-CSS `--book-tint` Hover Intensification

- **Performance Guarantee:** Zero JavaScript, zero extra Canvas extractions, zero runtime listeners. Pure CSS `color-mix()` transitions already declared on `.card-lift` (`background-color`, `border-color`, `box-shadow`), scoped strictly inside `@media (hover: hover)`.
- **Visual Enhancement:**
  - Add `[attr.data-book-tint-active]="bookTint() ? 'true' : null"` on the `<article>` in `book-grid-card.html`, `book-detailed-card.html`, and `book-compact-row.html`.
  - When `adaptiveCoverTint` is **enabled** (`[data-book-tint-active='true']`):
    - **Light mode hover:** subtly richer tinted `background-color` (`color-mix(in srgb, var(--book-tint) 9%, var(--surface-card))`), bolder tinted `border-color` (`color-mix(in srgb, var(--book-tint) 58%, var(--border-strong))`), and warmer tinted glow `box-shadow` (`26%`).
    - **Dark mode hover:** richer tinted `background-color` (`color-mix(in srgb, var(--book-tint) 16%, var(--surface-card))`), bolder tinted `border-color` (`color-mix(in srgb, var(--book-tint) 66%, var(--border-strong))`), and deeper tinted glow `box-shadow` (`34%`).
    - **Compact row hover (`.book-tint-row[data-book-tint-active='true']:hover`):** intensified left accent stripe (`80%` / `88%`) and soft tinted row wash (`12%` / `18%`).
  - When `adaptiveCoverTint` is **disabled** (`bookTint() === null`):
    - Render a clean neutral surface (`background-image: none; background-color: var(--surface-card);`) instead of falling back to `--accent-primary`, with a restrained neutral hover border.

### 1.4 Full `reducedMotion` Compliance on Book Card Hover

- Under both `@media (prefers-reduced-motion: reduce)` and `[data-reduced-motion='reduce']` in `src/styles.css`:
  - Neutralize hover lift and cover zoom transforms (`transform: none !important;` on `.card-lift:hover`, `.editorial-hover-card:hover`, `.book-tint-card:hover img`, `.book-cover-frame:hover`).
  - Keep hover feedback calm and static (no sudden upward jump, no image zoom, and no intense color-saturation flash — only a gentle static border highlight).

---

## 2. Acceptance Criteria & Tests

- [x] Opening the desktop dock `disposición` popover and clicking any dock nav item (`Inicio`, `Libros`, `Ajustes`, etc.) or outside area closes the popover immediately.
- [x] Hovering over a book card in Grid or Detailed view never clips its top border or shadow.
- [x] Hovering over a book card with `adaptiveCoverTint` enabled intensifies its `--book-tint` color smoothly in pure CSS; disabling `adaptiveCoverTint` renders a clean neutral card.
- [x] Enabling `reducedMotion` (`Reducir animaciones`) disables both hover lift/zoom transforms and intense hover glow on book cards.
- [x] Unit regression tests (`sidebar.spec.ts` + book card specs) and Playwright E2E regression tests pass.
