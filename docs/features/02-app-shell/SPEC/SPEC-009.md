# SPEC-009: Shell Global de Navegación, Enrutamiento Modular y Desacoplamiento de Vistas

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Fecha:** Septiembre 2026
- **Área:** Frontend / Core Architecture / Routing / UI Shell / Responsive Navigation
- **Archivos Afectados:**
  - `src/app/app.routes.ts`
  - `src/app/app.ts`
  - `src/app/app.html`
  - `src/app/core/components/header/header.component.ts` (Nuevo)
  - `src/app/core/components/header/header.component.html` (Nuevo)
  - `src/app/core/components/bottom-nav/bottom-nav.component.ts` (Nuevo)
  - `src/app/core/components/bottom-nav/bottom-nav.component.html` (Nuevo)
  - `src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.ts` (Nuevo)
  - `src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.html` (Nuevo)
  - `src/app/features/analytics/pages/stats-page/stats-page.component.ts` (Nuevo)
  - `src/app/features/series/pages/series-page/series-page.component.ts` (Nuevo)
  - `src/app/features/settings/pages/settings-page/settings-page.component.ts` (Nuevo)
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/features/books/pages/books-page/books-page.ts`
  - `src/app/features/books/services/books.service.ts`

---

## 1. Objetivos

1. **Desacoplar la Shell de la Aplicación:** Extraer la cabecera, el interruptor de modo oscuro/claro y el disparador de alta de libros de `BooksPageComponent` hacia componentes globales reutilizables en `src/app/core/components/`.
2. **Arquitectura de Enrutamiento Modular:** Configurar `app.routes.ts` con carga perezosa (`loadComponent`) para las 5 secciones maestras:
   - `/` $\to$ `DashboardPageComponent` (Hub central de inicio).
   - `/books` $\to$ `BooksPageComponent` (Catálogo y gestión completa).
   - `/stats` $\to$ `StatsPageComponent` (Módulo de analítica).
   - `/series` $\to$ `SeriesPageComponent` (Gestión de sagas).
   - `/settings` $\to$ `SettingsPageComponent` (Ajustes y persistencia Local-First).
3. **Navegación Ergonómica Adaptativa:**
   - **Escritorio ($\ge 768\text{px}$):** `HeaderComponent` con isotipo, enlaces con indicador visual de ruta activa (`routerLinkActive`), conmutador de tema animado y botón `+ Añadir libro`.
   - **Móvil ($< 768\text{px}$):** `BottomNavComponent` anclado al fondo (`fixed bottom-0`) con 5 pestañas táctiles ($\ge 48\text{px}$) e iconografía vectorial.
4. **Disparador Global de Creación de Libros:** Permitir la apertura de `BookCreateModalComponent` desde la barra de navegación global sin acoplamiento rígido con la ruta activa.

---

## 2. Contratos y Arquitectura de Enrutamiento

### 2.1 Definición de Rutas (`src/app/app.routes.ts`)

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
        (m) => m.DashboardPageComponent
      ),
    title: 'BookStack - Inicio'
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./features/books/pages/books-page/books-page').then(
        (m) => m.BooksPageComponent
      ),
    title: 'BookStack - Mi Biblioteca'
  },
  {
    path: 'stats',
    loadComponent: () =>
      import('./features/analytics/pages/stats-page/stats-page.component').then(
        (m) => m.StatsPageComponent
      ),
    title: 'BookStack - Estadísticas'
  },
  {
    path: 'series',
    loadComponent: () =>
      import('./features/series/pages/series-page/series-page.component').then(
        (m) => m.SeriesPageComponent
      ),
    title: 'BookStack - Sagas'
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/pages/settings-page/settings-page.component').then(
        (m) => m.SettingsPageComponent
      ),
    title: 'BookStack - Ajustes'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
