# CONTEXT.md - BookStack (Single Source of Truth)

## 1. Visión General del Proyecto
- **Nombre:** BookStack
- **Propósito:** Aplicación web minimalista, visual, privada y de alto rendimiento para el seguimiento de lectura personal, gestión de sagas, registro de sesiones y analítica de hábitos.
- **Estrategia:** Local-First (100% ejecución en cliente, persistencia en el navegador mediante `LocalStorage` / `IndexedDB`, sin backend obligatorio).

---

## 2. Stack Tecnológico y Dependencias Clave
- **Framework:** Angular v18+ (Standalone Components, Signals reactivos, Control Flow nativo `@if` / `@for`).
- **Estilos & UI:** Tailwind CSS (modo claro/oscuro estricto, micro-animaciones aceleradas por hardware, ergonomía móvil <360px).
- **Iconografía:** Lucide Icons (`lucide-angular`) y SVGs vectoriales inline.
- **Internacionalización:** Localización nativa en español (`es-ES`) mediante `Intl.DateTimeFormat`.
- **Despliegue & CI/CD:** GitHub Pages vía GitHub Actions (`.github/workflows/deploy.yml`).

---

## 3. Decisiones Arquitectónicas Consolidadas (ADR)

1. **Gestión de Estado Reactivo:** Basada íntegramente en Angular Signals (`signal`, `computed`). Se prohíbe el uso de RxJS para almacenar estado local.
2. **Optimización de Renderizado & Core Web Vitals:**
   - Prohibido el uso de `transition-all` en contenedores estructurales o tarjetas de catálogo; uso exclusivo de transiciones discretas (`transition-colors`, `transition-opacity`).
   - Atributos `decoding="async"` y `loading="lazy"` obligatorios en todas las etiquetas `<img>` de portadas.
   - Contención de layout (`contain: layout paint; content-visibility: auto`) en listas repetitivas.
3. **Optimización de Portadas en Cliente:** Pipeline Canvas (`ImageOptimizerService`) para compresión a WebP/JPEG ($400\text{px}$ máx., calidad $0.75$) antes de persistir en almacenamiento.
4. **Sincronización Bidireccional de Progreso:** Los registros de lectura recalculan automáticamente `Book.currentPage` mediante deltas y transicionan el estado a `COMPLETED` o `READING`.
5. **Formato Temporal Centralizado:** Toda fecha mostrada al usuario final debe formatearse mediante la utilidad `formatSpanishDate` (`es-ES`).

---

## 4. Punteros Semánticos del Código Fuente Actual (JIT)

Consulta y modifica exclusivamente las rutas reales presentes en la base de código:

```text
src/app/
├── app.config.ts                     # Proveedores globales (ApplicationConfig, routing)
├── app.routes.ts                     # Definición de rutas principales
├── app.ts / app.html                 # Shell raíz actual
├── app.css                           # Estilos base del componente raíz
│
├── core/                             # Utilidades y servicios transversales existentes
│   ├── services/
│   │   └── theme.service.ts          # Gestión reactiva del tema (dark / light)
│   └── utils/
│       └── date-formatter.ts         # Formateador universal de fechas en español (es-ES)
│
└── features/books/                   # Dominio consolidado de Libros
    ├── models/
    │   └── book.model.ts             # -> FUENTE DE LA VERDAD: Interfaces Book, BookSeries, ReadingLog, ReadingStats
    ├── services/
    │   ├── books.service.ts          # Estado reactivo de libros, deltas de lectura y persistencia
    │   ├── reading-log.service.ts    # Historial de logs y sesiones de lectura
    │   ├── reading-stats.service.ts  # Cálculo de métricas analíticas
    │   ├── image-optimizer.service.ts# Pipeline Canvas de compresión de portadas
    │   └── storage-adapter.service.ts# Adaptador de persistencia Local-First
    ├── pages/
    │   └── books-page/               # Vista de catálogo (Media-Object, layout fluido, filtros)
    └── components/
        ├── book-create-modal/        # Modal de alta de libro (drag&drop, switch saga)
        ├── book-edit-modal/          # Modal de edición de libro
        ├── book-detail-modal/        # Ficha técnica e historial colapsable de sesiones
        └── reading-log-editor/       # Editor granular para registrar sesiones de lectura
