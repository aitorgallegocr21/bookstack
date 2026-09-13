# CONTEXT.md - BookStack (Single Source of Truth)

## 1. Visión General del Proyecto
- **Nombre:** BookStack
- **Propósito:** Aplicación web minimalista, visual, privada y de alto rendimiento para el seguimiento de lectura personal, gestión de sagas, registro de sesiones y analítica de hábitos.
- **Estrategia:** Local-First (100% ejecución en cliente, persistencia en navegador mediante `LocalStorage` / `IndexedDB`, sin backend obligatorio).

---

## 2. Stack Tecnológico y Dependencias Clave
- **Framework:** Angular v18+ (Standalone Components, Signals reactivos, Control Flow nativo `@if` / `@for`, Lazy Loading con `loadComponent`).
- **Estilos & UI:** Tailwind CSS (sistema dark/light estricto, micro-animaciones aceleradas por hardware, ergonomía móvil <360px).
- **Iconografía:** Lucide Icons (`lucide-angular`) y SVGs vectoriales inline.
- **Internacionalización:** Localización nativa en español (`es-ES`) mediante `Intl.DateTimeFormat`.
- **Despliegue & CI/CD:** GitHub Pages vía GitHub Actions (`.github/workflows/deploy.yml`).

---

## 3. Decisiones Arquitectónicas Consolidadas (ADR)

1. **Estado Reactivo:** Basado íntegramente en Angular Signals (`signal`, `computed`). Prohibido RxJS para estado local en componentes.
2. **Arquitectura Shell Asimétrica:**
   - Desktop ($\ge 768\text{px}$): `SidebarComponent` colapsable ($68\text{px} \leftrightarrow 240\text{px}$) con persistencia en `UiStateService` (`LocalStorage`).
   - Móvil ($< 768\text{px}$): `HeaderComponent` compacto + `BottomNavComponent` fijo con 5 accesos táctiles ($\ge 48\text{px}$).
3. **Rendimiento Gráfico & Core Web Vitals:** Transiciones discretas (`transition-colors`, `transition-[width]`), prohibido `transition-all`. Portadas con `decoding="async"` y `loading="lazy"`.
4. **Optimización Canvas en Cliente:** Pipeline `ImageOptimizerService` para compresión de portadas ($400\text{px}$ máx., calidad $0.75$) previo a persistencia.
5. **Sincronización Bidireccional:** Registros de lectura recalculan automáticamente `Book.currentPage` mediante deltas y transicionan estado (`COMPLETED` / `READING`).
6. **Accesibilidad Semántica (WCAG 2.1 AA):** Control universal por teclado (`Escape`, autofoco en modales), `aria-label` descriptivos y foco visible (`focus-visible:ring-2`).
7. **Resiliencia Local-First:** Captura controlada de `QuotaExceededError` en `StorageAdapterService`.

---

## 4. Punteros Semánticos del Código Fuente Actual (JIT)

Consulta y modifica exclusivamente las rutas reales presentes en la base de código:

```text
src/app/
├── app.config.ts                     # Configuración global y proveedores (ApplicationConfig, routing)
├── app.routes.ts                     # Rutas Lazy (/, /books, /stats, /settings, /about)
├── app.ts / app.html                 # Shell raíz (<app-sidebar>, <app-header>, <router-outlet>, <app-bottom-nav>)
│
├── core/                             # Núcleo transversal y UI Shell
│   ├── components/
│   │   ├── sidebar/                  # Barra lateral desktop colapsable (68px / 240px)
│   │   ├── header/                   # Cabecera mínima para móvil (<768px)
│   │   └── bottom-nav/               # Barra de navegación inferior móvil
│   ├── services/
│   │   ├── theme.service.ts          # Gestión reactiva del tema (dark / light)
│   │   └── ui-state.service.ts       # Estado de UI (sidebar colapsado/expandido)
│   └── utils/
│       └── date-formatter.ts         # Formateador de fechas en español (es-ES)
│
└── features/                         # Módulos desacoplados por dominio
    ├── dashboard/pages/dashboard-page/ # Vista de inicio y resumen de lectura (/)
    ├── books/                          # Dominio consolidado de Libros (/books)
    │   ├── models/book.model.ts        # -> Contratos: Book, BookSeries, ReadingLog, ReadingStats
    │   ├── services/                   # BooksService, ReadingLogService, ReadingStatsService, ImageOptimizer, StorageAdapter
    │   ├── pages/books-page/           # Catálogo maestro (Media-Object, layout fluido)
    │   └── components/                 # Modales: create, edit, detail, reading-log-editor
    ├── analytics/pages/stats-page/     # Módulo de analítica y estadísticas (/stats)
    ├── settings/pages/settings-page/   # Módulo de ajustes y copias de seguridad (/settings)
    └── about/pages/about-page/         # Módulo informativo y manifiesto Local-First (/about)
