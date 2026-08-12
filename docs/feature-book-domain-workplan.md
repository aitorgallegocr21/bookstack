# Book Domain Work Plan

## Objetivo
Mantener una hoja de ruta operativa para la elaboración del módulo de libros y sus datos.

## Feature activo
- Nombre: `book-domain-model`
- Estado: `active`
- Alcance: dominio de libros, semilla inicial, servicio de acceso, métricas y persistencia base con `IndexedDB` y fallback a `LocalStorage`.
- Principio: esta feature se considera cerrada si el trabajo no aporta contratos nuevos de modelo ni requiere nuevas interfaces de acceso al dominio.

## Estado actual
- Base Angular v18+ configurada con componentes Standalone (`standalone: true`).
- Rama activa: `feature/book-domain-model`.
- Enrutamiento optimizado mediante carga perezosa (`loadComponent`) con entrada en `/books` y fallback `**`.
- Estrategia de detección de cambios `ChangeDetectionStrategy.OnPush` aplicada de forma global en componentes y páginas.
- El dominio de libros está definido con TypeScript estricto en `models/book.model.ts` y se sirve reactivamente mediante Signals desde `BooksService` y `ReadingLogService`.
- Motor de persistencia *Local-First* completado mediante `StorageAdapterService` apoyado en `IndexedDB` con fallback a `LocalStorage`.
- Métricas y analíticas reactivas memoizadas mediante `computed()` en `ReadingStatsService`.
- Componentes modales editores (`BookEditorComponent` y `ReadingLogEditorComponent`) totalmente integrados y accesibles mediante el elemento HTML5 nativo `<dialog>`.

## Trabajo realizado
- Rama de feature creada: `feature/book-domain-model`.
- Carpeta base de feature creada en `src/app/features/books`.
- Añadido el modelo de dominio de libros en `src/app/features/books/models/book.model.ts`.
- Añadida semilla de ejemplo en `src/app/features/books/data/books.seed.ts` y de logs en `data/reading-logs.seed.ts`.
- Añadidos los servicios de estado reactivo `BooksService`, `ReadingLogService` y `ReadingStatsService`.
- Implementado el adaptador de almacenamiento `StorageAdapterService` con `IndexedDB` y `LocalStorage`.
- Creada la página principal `BooksPage` con resumen de lectura, distribución por estados y gráfica de actividad mensual.
- Creados los componentes modales `BookEditorComponent` y `ReadingLogEditorComponent` con gestión de formularios, validación asíncrona y accesibilidad `<dialog>`.
- Refactorizada la enrutación global en `app.routes.ts` y `app.config.ts` (`withComponentInputBinding`).
- Corregidos errores de análisis estático SonarQube (`S6671` e inicialización asíncrona en constructores).
- Optimizada la plantilla de `BooksPage` eliminando pipes innecesarios e implementando agrupación $O(1)$ con `logsByBookMap`.

## Reglas de documentación para esta feature
- Todo agente que trabaje en la feature debe leer este documento antes de iniciar.
- Si el cambio afecta al dominio, routing, servicio, componente visual o pruebas de la feature, debe actualizar este plan con el estado del trabajo.
- Este documento es el archivo operativo activo de la feature y no debe quedar obsoleto entre cambios del bloque.

## Bloques de trabajo

### Bloque 1 — Feature `book-domain-model` (activo / núcleo)
Objetivo: materializar el dominio, la semilla, los servicios de acceso, las métricas y la persistencia base de la entidad libro.

1. Revisar la ruta y el componente de entrada de la feature. [Completado]
2. Añadir un servicio local de estado para los libros. [Completado]
3. Añadir una capa de registros de lectura (`ReadingLog`) para preparar la capa de métricas. [Completado]
4. Añadir un servicio de estadísticas derivadas sobre libros y logs. [Completado]
5. Preparar almacenamiento local con `localStorage` como persistencia base. [Completado]
6. Crear el componente visual de listado de libros. [Completado]

### Bloque 2 — Siguiente capa funcional (interacción y persistencia avanzada)
Objetivo: cerrar la operación en el cliente para que el libro sea interactivo y navegable desde la vista.

7. Preparar almacenamiento con `IndexedDB` o una capa de fallback más robusta. [Completado: `StorageAdapterService`]
8. Crear componentes de detalle/edición de libro y registro de lectura. [Completado: `BookEditorComponent` y `ReadingLogEditorComponent`]

## Instrucciones próximas (orden de ejecución)
1. ./feature-book-domain-workplan/SPEC-001.md [Pendiente]
2. Añadir pruebas unitarias y de integración (Jest/Jasmine) para servicios (`BooksService`, `StorageAdapterService`) y componentes modales para asegurar la estabilidad del CRUD. [Pendiente]
3. Realizar una revisión de refinamiento visual (Tailwind CSS, modo oscuro y micro-interacciones) para cerrar el bloque de experiencia de usuario. [Pendiente]

## Registro de cambios relevantes
- 2026-08-10: Se crea el modelo base del dominio y la rama `feature/book-domain-model`.
- 2026-08-10: Se añaden semillas, servicios de libros, logs y cálculo de estadísticas.
- 2026-08-10: Se arman las vistas de `BooksPage`, `BookEditorComponent` y `ReadingLogEditorComponent`.
- 2026-08-12: Auditoría de QA y Rendimiento Angular. Se aplica `OnPush` global, Signals reactivos (`computed`), carga perezosa en rutas y la estrategia de persistencia `StorageAdapterService` (`IndexedDB` + `LocalStorage`).
- 2026-08-12: Refactorización de accesibilidad modal a la etiqueta nativa `<dialog>` (SonarQube `Web:S6819`), resolución de advertencias de SonarQube (`S6671`) e implementación de agrupación reactiva $O(1)$ (`logsByBookMap`) en la vista principal.
