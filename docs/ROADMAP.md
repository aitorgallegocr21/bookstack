# Product Roadmap & Architectural Milestones

This document preserves the official milestone roadmap for **BookStack**, migrating the original planning artifact (`docs/Hoja_de_ruta.png`) into a structured markdown document. It establishes the technical scope, code impact, architectural mapping, and transition from legacy specifications to the active task methodology.

---

## 1. Original Roadmap Registry (Source Extraction)

The table below transcribes the exact records from the original roadmap:

| Fase       | Hito / Especificación                               | Alcance Técnico                                                                                                             | Impacto en Código                   |
| :--------- | :-------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------- | :---------------------------------- |
| **Fase 1** | `SPEC-009: Shell Global & Enrutamiento`             | Configurar `app.routes.ts` con lazy loading, crear Header desktop, Bottom Bar móvil y reubicar la vista actual en `/books`. | Bajo (sin cambios en lógica).       |
| **Fase 2** | `SPEC-010: Hub de Inicio / Dashboard ( / )`         | Diseñar la vista de resumen: tarjeta _"Leyendo ahora"_, racha, meta anual y accesos rápidos a registro.                     | Medio (nueva vista presentacional). |
| **Fase 3** | `SPEC-011: Catálogo y Filtros Avanzados ( /books )` | Buscador multi-criterio (ISBN, autor, título), filtros combinados y selector de columnas/densidad.                          | Medio (refinamiento de filtros).    |
| **Fase 4** | `SPEC-012: Suite de Estadísticas ( /stats )`        | Módulo dedicado de analítica visual basado en `ReadingStatsService` con desglose temporal y formatos.                       | Medio (nueva vista analítica).      |
| **Fase 5** | `SPEC-013: Sagas y Ajustes Local-First`             | Vistas `/series` (progreso por colecciones) y `/settings` (exportación e importación de backups JSON/CSV).                  | Medio (gestión de archivos).        |

---

## 2. Modern Phase Mapping & Architectural Alignment

In BookStack's modernized engineering system, the legacy `SPEC-XXX` nomenclature has been deprecated in favor of **Domain Phases** with atomic task breakdowns in `docs/tasks/`. The table below maps each milestone from the source roadmap to its modern architectural phase and status:

| Original Milestone      | Modern Phase            | Scope & Target Route                                                                                                                                                                                                                                                  | Current Status       |
| :---------------------- | :---------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------- |
| **Fase 1 (`SPEC-009`)** | **Phase 02 & Phase 04** | Asymmetric responsive shell (`SidebarComponent` + `HeaderComponent` + `BottomNavComponent`), lazy routing, a11y hardening, clean `StorageAdapterService`.                                                                                                             | **Completed**        |
| **Fase 2 (`SPEC-010`)** | **Phase 06**            | Interactive Dashboard Hub (`/`): "Currently Reading" hero card, daily streaks, annual reading goal, quick progress increment, and reading insights.                                                                                                                   | **Next Up (Active)** |
| **Fase 3 (`SPEC-011`)** | **Phase 07**            | Catalog Filtering, Search & View Density (`/books`): Multi-criteria live search (ISBN, author, title), combined filters (status, format, rating), and compact/comfortable grid layout switchers.                                                                      | **Backlog**          |
| **Fase 4 (`SPEC-012`)** | **Phase 08**            | Advanced Analytics Suite (`/stats`): Interactive reading velocity charts, chronological monthly/yearly trends, format breakdown, and habit analytics driven by `ReadingStatsService`.                                                                                 | **Backlog**          |
| **Fase 5 (`SPEC-013`)** | **Phase 09 & Phase 10** | **Phase 09:** Settings, Data Portability & Backup Engine (`/settings`): Zod-validated JSON/CSV export & import, storage quota inspector, and reset controls.<br>**Phase 10:** Sagas & Series Management (`/series`) + camera ISBN barcode scanner via `html5-qrcode`. | **Backlog**          |

---

## 3. High-Level Phase Descriptions

### Phase 06: Interactive Dashboard Hub (`/`)

- **Objective:** Transform the root route into a dynamic, motivating reading launchpad.
- **Key Deliverables:**
  - _"Currently Reading"_ hero card displaying the active book with visual cover, progress bar, percentage, and current page.
  - Quick-log progress widget (increment pages directly with 1 click).
  - Habit metrics: Current reading streak (consecutive active days), annual book goal progress, and recent sessions list.
  - Contextual empty states with prompt to start reading or add a new book.

### Phase 07: Catalog Filtering, Search & View Density (`/books`)

- **Objective:** Enable high-velocity book discovery, filtering, and flexible library viewing.
- **Key Deliverables:**
  - Real-time multi-criteria search bar querying across title, author, and ISBN.
  - Multi-tag filter bar: Reading status (`pending`, `reading`, `completed`), format (`paperback`, `hardcover`, `ebook`, `audiobook`), and star rating bounds ($1\dots5$).
  - Grid density toggle: Comfortable card view vs. compact list/dense grid with persistent user preference.
  - Sorting criteria: By title, author, rating, recently updated, and reading progress.

### Phase 08: Advanced Analytics Suite (`/stats`)

- **Objective:** Deliver deep, visual, client-side insights into reading habits and library composition.
- **Key Deliverables:**
  - Interactive monthly and annual page-count velocity graphs using SVG/CSS bar visualizations.
  - Format distribution breakdown (percentage of physical, digital, and audio reading).
  - Time investment and completion rate statistics.
  - Exportable reading report summary for personal records.

### Phase 09: Settings, Data Portability & Backup Engine (`/settings`)

- **Objective:** Guarantee absolute data ownership, privacy, and seamless backup/restore capabilities.
- **Key Deliverables:**
  - Client-side JSON and CSV full library export (books, reading sessions, metadata).
  - Zod-validated backup importer with schema validation, conflict resolution, and rollback protection.
  - IndexedDB storage quota inspector with byte calculation and health status.
  - Factory reset mechanism with confirmation dialog and scroll-locked safety prompt.

### Phase 10: ISBN Barcode Scanner & Series Management (`/series`)

- **Objective:** Streamline book addition with physical barcode scanning and organize multi-volume sagas.
- **Key Deliverables:**
  - Camera-based ISBN-10 / ISBN-13 barcode scanner using `html5-qrcode`.
  - External metadata enrichment (Open Library / Google Books API) with fallback to manual entry.
  - Dedicated `/series` route tracking completion progress across multi-book sagas and collections.
  - Chronological volume ordering and series completion badges.
