# CONTEXT.md - BookStack (Single Source of Truth)

## 1. Visión General del Proyecto
- **Nombre:** BookStack
- **Propósito:** Aplicación web minimalista, visual y privada para el seguimiento de lectura personal, registro de sesiones y estadísticas avanzadas.
- **Estrategia:** Local-First (100% cliente, sin backend, almacenamiento persistente en el navegador). Gratuito y de alto rendimiento.

---

## 2. Stack Tecnológico y Dependencias Clave
- **Framework:** Angular v18+ (Standalone Components, Signals, Control Flow nativo).
- **Estilos:** Tailwind CSS (modo claro/oscuro, micro-interacciones).
- **Iconos:** Lucide Icons (`lucide-angular`).
- **Gráficos:** Chart.js / `ng2-charts` (o Apache ECharts).
- **Persistencia Local:** `IndexedDB` (vía wrapper nativo o librería `idb`) con fallback en `LocalStorage`.
- **Herramientas Adicionales:** `html5-qrcode` (lector de código de barras/ISBN).
- **Despliegue & CI/CD:** GitHub Pages vía GitHub Actions (`.github/workflows/deploy.yml`).

---

## 3. Mapa de Arquitectura y Punteros Semánticos (JIT)

Para consultar o modificar implementaciones, acude directamente a los archivos fuente:

```text
src/app/
├── app.config.ts                     # Configuración global y proveedores (routing)
├── app.routes.ts                     # Definición de rutas principales
└── features/books/                   # Módulo principal de Libros
    ├── models/
    │   └── book.model.ts             # -> FUENTE DE LA VERDAD: Interfaces Book, SeriesInfo, ReadingLog, ReadingStats
    ├── services/
    │   ├── books.service.ts          # Gestión reactiva del estado de libros
    │   ├── reading-log.service.ts    # Registro de sesiones de lectura
    │   ├── reading-stats.service.ts  # Cálculo de métricas y estadísticas
    │   └── storage-adapter.service.ts# Adaptador de persistencia Local/IndexedDB
    ├── pages/
    │   └── books-page/               # Vista principal de listado y biblioteca
    └── components/
        ├── book-create-modal/        # Modal para añadir nuevos libros
        ├── book-edit-modal/          # Modal de edición de libros
        ├── book-detail-modal/        # Vista detallada de un libro
        └── reading-log-editor/       # Editor para registrar sesiones de lectura
