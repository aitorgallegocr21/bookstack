# SPEC-011: Barra Lateral Plegable, Rediseño de Navegación Global, Intercambio de Vistas y Módulo Acerca de

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Fecha:** Septiembre 2026
- **Área:** Frontend / UI Shell / Responsive Navigation / State Management / A11y
- **Archivos Afectados:**
  - `src/app/core/services/ui-state.service.ts` (Nuevo)
  - `src/app/core/components/sidebar/sidebar.component.ts` (Nuevo)
  - `src/app/core/components/sidebar/sidebar.component.html` (Nuevo)
  - `src/app/core/components/header/header.component.ts` (Modificado: solo mobile o simplificado)
  - `src/app/core/components/header/header.component.html` (Modificado)
  - `src/app/core/components/bottom-nav/bottom-nav.component.ts` (Modificado)
  - `src/app/core/components/bottom-nav/bottom-nav.component.html` (Modificado)
  - `src/app/features/about/pages/about-page/about-page.component.ts` (Nuevo)
  - `src/app/features/about/pages/about-page/about-page.component.html` (Nuevo)
  - `src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.ts`
  - `src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.html`
  - `src/app/features/books/pages/books-page/books-page.ts`
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/app.routes.ts`
  - `src/app/app.ts`
  - `src/app/app.html`

---

## 1. Objetivos Técnicos

1. **Barra Lateral Plegable (Desktop $\ge 768\text{px}$):** Crear `SidebarComponent` con soporte de colapso/expansión fluido ($68\text{px} \leftrightarrow 240\text{px}$), persistencia en `LocalStorage` y estados visuales modernos.
2. **Reorganización de Rutas y Menús:**
   - Eliminar ruta `/series` (se asimila conceptualmente en `/books`).
   - Crear ruta `/about` con `AboutPageComponent` describiendo el manifiesto Local-First y versión.
   - Reubicar el resumen de lectura y widgets hacia `DashboardPageComponent` (`/`) y dejar `BooksPageComponent` (`/books`) como la biblioteca completa.
3. **Cluster de Acciones Globales:** Integrar en la base de la barra lateral los accesos a `Ajustes`, `Acerca de`, repositorio de `GitHub` (con icono oficial y apertura en nueva pestaña) y conmutador de tema Sol/Luna.
4. **Modernización de Theming y Estados Activos:**
   - Modo Claro: Fondo `bg-white`, borde `border-slate-200`, activo `bg-blue-50 text-blue-700 font-semibold shadow-xs`.
   - Modo Oscuro: Fondo `bg-slate-900`, borde `border-slate-800`, activo `bg-blue-950/60 text-blue-400 font-semibold shadow-xs`.
   - Micro-animaciones con `transition-colors`, `transition-transform` y `transition-[width]`.
5. **Navegación Móvil Ergonómica ($< 768\text{px}$):** Adaptar `BottomNavComponent` con las 5 opciones táctiles: *Inicio*, *Libros*, *Stats*, *Ajustes* y *Acerca de*.

---

## 2. Contratos y Gestión de Estado

### 2.1 Servicio de Estado de UI (`src/app/core/services/ui-state.service.ts`)

```typescript
import { Injectable, signal, effect, inject } from '@angular/core';
import { StorageAdapterService } from '../../features/books/services/storage-adapter.service';

@Injectable({
  providedIn: 'root'
})
export class UiStateService {
  private readonly storage = inject(StorageAdapterService);
  private readonly STORAGE_KEY = 'bookstack_sidebar_collapsed';

  // Por defecto expandido en desktop salvo preferencia guardada
  readonly isSidebarCollapsed = signal<boolean>(
    this.storage.getItem<boolean>(this.STORAGE_KEY) ?? false
  );

  constructor() {
    effect(() => {
      this.storage.setItem(this.STORAGE_KEY, this.isSidebarCollapsed());
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update((val) => !val);
  }
}
