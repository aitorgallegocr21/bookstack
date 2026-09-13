# FEATURE WORKPLAN: App Shell, Navegación Global y Enrutamiento Modular

- **ID del Feature:** `02-app-shell`
- **Estado:** COMPLETADO / BASELINE
- **Autor:** Lead Architect & Technical Writer
- **Fecha de Inicio:** Septiembre 2026
- **Fecha de Cierre:** Septiembre 2026
- **Hito del Proyecto:** Fase 2 / Modularización & Core Shell
- **Especificaciones Técnicas Asociadas:**
  - `docs/features/02-app-shell/SPEC/SPEC-009.md` (Routing lazy y shell inicial)
  - `docs/features/02-app-shell/SPEC/SPEC-010.md` (Accesibilidad WCAG, scroll lock y foco)
  - `docs/features/02-app-shell/SPEC/SPEC-011.md` (Sidebar colapsable, ruta /about y estado UI)
  - `docs/features/02-app-shell/SPEC/SPEC-012.md` (Breakpoints 768px, body scroll lock y theming)
- **Listas de Tareas Asociadas:**
  - `docs/features/02-app-shell/TASK/TASK-009.md`
  - `docs/features/02-app-shell/TASK/TASK-010.md`
  - `docs/features/02-app-shell/TASK/TASK-011.md`
  - `docs/features/02-app-shell/TASK/TASK-012.md`

---

## 1. Contexto y Justificación Arquitectónica

La primera iteración del proyecto consolidó el dominio de libros (`feature-book-domain`) bajo una arquitectura de vista única (`BooksPageComponent`). Si bien satisfizo las reglas de negocio y persistencia Local-First, concentró responsabilidades dispares en un único árbol DOM.

El objetivo de este feature ha sido implementar la **Shell Global Asimétrica de la Aplicación**, logrando:
1. Una infraestructura de navegación desacoplada: **Barra lateral colapsable en escritorio ($\ge 768\text{px}$)** y **Bottom Nav fija con header compacto en móvil ($< 768\text{px}$)**.
2. Un sistema de enrutamiento modular con carga perezosa (*Lazy Loading*) para 5 módulos funcionales.
3. La orquestación global de modales mediante Signals sin acoplamiento a rutas específicas.
4. Accesibilidad semántica (WCAG 2.1 AA), control estricto por teclado (`Escape`/`autofocus`) y bloqueo de scroll de fondo (*Body Scroll Lock*).

---

## 2. Alcance del Feature (Scope & Boundaries)

### 2.1 En Alcance (Consolidado)
* **Infraestructura de Rutas (`app.routes.ts`):**
  - Carga diferida (`loadComponent`) para las 5 secciones maestras:
    - `/` $\to$ `DashboardPageComponent` (Hub central de inicio).
    - `/books` $\to$ `BooksPageComponent` (Catálogo, filtros y futuras sagas).
    - `/stats` $\to$ `StatsPageComponent` (Analítica avanzada - Placeholder).
    - `/settings` $\to$ `SettingsPageComponent` (Ajustes y persistencia - Placeholder).
    - `/about` $\to$ `AboutPageComponent` (Manifiesto Local-First y créditos de autor).
  - Coincidencia exacta obligatoria (`exact: true`) para evitar selecciones múltiples en el enlace `/`.
  - Redirección automática de comodín `**` a `/`.
* **Componentes del Core Shell (`src/app/core/components/`):**
  - `SidebarComponent`: Barra lateral desktop fija con soporte de colapso ($68\text{px} \leftrightarrow 240\text{px}$), botón `+ Añadir libro`, enlaces semánticos, cluster inferior (Ajustes, Acerca de, GitHub, Tema animado) y persistencia de estado vía `UiStateService`.
  - `HeaderComponent`: Cabecera móvil mínima con branding, botón `+`, enlace a GitHub y conmutador de tema animado sin texto redundante.
  - `BottomNavComponent`: Barra de navegación inferior móvil fija con 5 accesos táctiles ergonómicos ($\ge 48\text{px}$).
* **Estado Global de Diálogos y UI:**
  - `BooksService.isCreateModalOpen`: Señal reactiva para apertura del modal de creación desde cualquier punto de la aplicación.
  - `UiStateService.isSidebarCollapsed`: Señal sincronizada con `LocalStorage` para recordar la preferencia de visualización del sidebar.
* **Ergonomía, A11y y Resiliencia:**
  - Control de excepciones `QuotaExceededError` en `StorageAdapterService`.
  - Bloqueo de scroll (`document.body.classList.add('overflow-hidden')`) al abrir cualquier diálogo modal.
  - Autofocus programático en el primer `<input>` de formularios.
  - `aria-label`, `title` contextual y foco visible (`focus-visible:ring-2`) en botones interactivos.

### 2.2 Fuera de Alcance (Futuras Fases)
* La construcción de los widgets interactivos y tarjeta *"Leyendo ahora"* del Hub en `DashboardPageComponent` (se abordará en `03-dashboard`).
* El filtrado avanzado multi-criterio y selector de densidad en `BooksPageComponent` (se abordará en `03.1-books-catalog`).
* Los gráficos temporales e interactivos en `StatsPageComponent` (se abordará en `04-analytics`).
* El pipeline de importación y exportación de backups JSON/CSV en `SettingsPageComponent` (se abordará en `05-settings`).

---

## 3. Estructura de Módulos y Directorios Afectados

```text
src/app/
├── core/
│   ├── components/
│   │   ├── sidebar/                  # Barra lateral desktop colapsable
│   │   │   ├── sidebar.component.ts
│   │   │   ├── sidebar.component.html
│   │   │   └── sidebar.component.css
│   │   ├── header/                   # Cabecera móvil (<768px)
│   │   │   ├── header.component.ts
│   │   │   ├── header.component.html
│   │   │   └── header.component.css
│   │   └── bottom-nav/               # Barra inferior táctil móvil
│   │       ├── bottom-nav.component.ts
│   │       ├── bottom-nav.component.html
│   │       └── bottom-nav.component.css
│   ├── services/
│   │   ├── theme.service.ts          # Conmutador dark/light
│   │   └── ui-state.service.ts       # Estado persistente del sidebar
│   └── utils/
│       └── date-formatter.ts         # Formateador es-ES
│
├── features/
│   ├── dashboard/pages/dashboard-page/ # Vista de inicio (/)
│   ├── books/                          # Dominio y catálogo (/books)
│   ├── analytics/pages/stats-page/     # Analítica (/stats)
│   ├── settings/pages/settings-page/   # Ajustes (/settings)
│   └── about/pages/about-page/         # Acerca de y autoría (/about)
│
├── app.routes.ts
├── app.ts
└── app.html
