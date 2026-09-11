# FEATURE WORKPLAN: App Shell, Navegación Global y Enrutamiento Modular

- **ID del Feature:** `02-app-shell`
- **Estado:** COMPLETADO
- **Autor:** Lead Architect & Technical Writer
- **Fecha de Inicio:** Septiembre 2026
- **Hito del Proyecto:** Fase 2 / Modularización & Core Shell
- **Especificaciones Técnicas Asociadas:**
  - `docs/features/02-app-shell/SPEC/SPEC-009.md`
- **Listas de Tareas Asociadas:**
  - `docs/features/02-app-shell/TASK/TASK-009.md`

---

## 1. Contexto y Justificación Arquitectónica

La primera iteración del proyecto consolidó el dominio central de libros (`feature-book-domain`) bajo una arquitectura de vista única (`BooksPageComponent`). Si bien satisfizo las reglas de negocio y persistencia Local-First, concentró responsabilidades dispares (estadísticas, distribución, catálogo de libros y controles de sesión) en un único árbol DOM.

El objetivo de este feature es implementar la **Shell Global de la Aplicación**, estableciendo:
1. Una infraestructura de navegación desacoplada entre escritorio y móvil.
2. Un sistema de enrutamiento modular con carga perezosa (*Lazy Loading*).
3. La orquestación global de modales sin acoplamiento a una ruta específica.

---

## 2. Alcance del Feature (Scope & Boundaries)

### 2.1 En Alcance (In Scope)
* **Infraestructura de Rutas (`app.routes.ts`):**
  - Carga diferida (`loadComponent`) para las 5 secciones maestras:
    - `/` $\to$ `DashboardPageComponent` (Hub central de inicio).
    - `/books` $\to$ `BooksPageComponent` (Catálogo y gestión completa).
    - `/stats` $\to$ `StatsPageComponent` (Analítica avanzada - Vista inicial).
    - `/series` $\to$ `SeriesPageComponent` (Sagas y colecciones - Vista inicial).
    - `/settings` $\to$ `SettingsPageComponent` (Ajustes y persistencia - Vista inicial).
  - Redirección automática de comodín `**` a `/`.
* **Componentes del Core Shell (`src/app/core/components/`):**
  - `HeaderComponent`: Barra superior fija con branding, navegación desktop (`routerLink` / `routerLinkActive`), conmutador animado de tema (Sol/Luna) y disparador de creación de libro.
  - `BottomNavComponent`: Barra de navegación inferior móvil (`fixed bottom-0`, visible en `< 768px`) con 5 accesos táctiles ergonómicos ($\ge 48\text{px}$).
* **Estado Global de Diálogos:**
  - Exposición de señales reactivas en `BooksService` (`isCreateModalOpen`) para permitir la apertura del modal de alta desde cualquier punto de la aplicación.
* **Refactorización de `AppComponent` (`app.html` / `app.ts`):**
  - Ensamblado del layout principal con `<app-header />`, `<router-outlet />`, `<app-bottom-nav />` y el contenedor del modal de creación condicional.

### 2.2 Fuera de Alcance (Out of Scope - Futuras Fases)
* La implementación gráfica y analítica detallada de `StatsPageComponent` (se abordará en `04-analytics`).
* La agrupación interactiva y cálculo de progreso de sagas en `SeriesPageComponent` (se abordará en `05-series`).
* La lógica de exportación/importación JSON/CSV en `SettingsPageComponent` (se abordará en `06-settings`).
* La construcción de los widgets del Hub en `DashboardPageComponent` (se abordará en `03-dashboard`).

---

## 3. Estructura de Módulos y Directorios Afectados

```text
src/app/
├── core/
│   ├── components/
│   │   ├── header/
│   │   │   ├── header.component.ts
│   │   │   ├── header.component.html
│   │   │   └── header.component.css
│   │   └── bottom-nav/
│   │       ├── bottom-nav.component.ts
│   │       ├── bottom-nav.component.html
│   │       └── bottom-nav.component.css
│   ├── services/
│   │   └── theme.service.ts
│   └── utils/
│       └── date-formatter.ts
│
├── features/
│   ├── dashboard/
│   │   └── pages/dashboard-page/
│   ├── books/
│   │   └── pages/books-page/
│   ├── analytics/
│   │   └── pages/stats-page/
│   ├── series/
│   │   └── pages/series-page/
│   └── settings/
│       └── pages/settings-page/
│
├── app.routes.ts
├── app.ts
└── app.html
