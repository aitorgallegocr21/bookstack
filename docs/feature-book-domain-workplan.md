# Book Domain Work Plan

## Objetivo
Mantener una hoja de ruta operativa para la elaboración del módulo de libros y sus datos.

## Estado actual
- Base Angular generada por CLI.
- Rama activa: `feature/book-domain-model`.
- La feature de libros ya tiene una ruta mínima apuntando a `/books` y una vista de listado básica.
- El dominio de libros está definido en el modelo y se sirve desde un `BooksService` con una semilla inicial.

## Trabajo realizado
- Rama de feature creada: `feature/book-domain-model`.
- Carpeta base de feature creada en `src/app/features/books`.
- Se ha añadido el modelo de dominio de libros en `src/app/features/books/models/book.model.ts`.
- Se ha añadido una semilla de ejemplo en `src/app/features/books/data/books.seed.ts`.
- Se ha añadido el servicio `BooksService` en `src/app/features/books/services/books.service.ts`.
- Se ha añadido una semilla de registros `ReadingLog` en `src/app/features/books/data/reading-logs.seed.ts`.
- Se ha añadido el servicio `ReadingLogService` en `src/app/features/books/services/reading-log.service.ts`.
- Se ha añadido el servicio `ReadingStatsService` en `src/app/features/books/services/reading-stats.service.ts`.
- Se ha conectado el servicio de estadísticas al page component de listado para materializar un resumen derivado en la vista.
- Se ha ampliado la visual del `BooksPage` con una sección de análisis y distribución por estado / actividad mensual.
- Se ha añadido la página de listado `BooksPage` y una primera versión del layout en `src/app/features/books/pages/books-page/books-page.html` y `books-page.css`.
- Se ha conectado la ruta `/books` en `src/app/app.routes.ts` y el contexto raíz se apoya en un `RouterOutlet` público en `src/app/app.html`.

## Reglas de documentación para esta feature
- Todo agente que trabaje en la feature debe leer este documento antes de iniciar.
- Si el cambio afecta al dominio, routing, servicio, componente visual o pruebas de la feature, debe actualizar este plan con el estado del trabajo.
- Este documento es el archivo operativo activo de la feature y no debe quedar obsoleto entre cambios del bloque.

## Siguientes pasos
1. Revisar la ruta y el componente de entrada de la feature. [Completado]
2. Añadir un servicio local de estado para los libros. [Completado]
3. Añadir una capa de registros de lectura (`ReadingLog`) para preparar la capa de métricas. [Completado]
4. Añadir un servicio de estadísticas derivadas sobre libros y logs. [Completado]
5. Preparar almacenamiento local con `localStorage`/IndexedDB como fallback. [Pendiente]
6. Crear componentes visuales de listado y detalle. [En progreso: listado base y layout mínimo]
7. Añadir estadísticas derivadas y registros de lectura. [En progreso]

## Registro de cambios relevantes
- 2026-08-10: se crea el modelo base del dominio y la rama `feature/book-domain-model`.
- 2026-08-10: se añade la semilla y el servicio local de libros.
- 2026-08-10: se añade una semilla de registros de lectura y un servicio de acceso a esos logs.
- 2026-08-10: se añade un servicio de cálculo de estadísticas sobre estado de libros y logs de lectura.
- 2026-08-10: se arma una ruta `/books` y una vista de `BooksPage` con un layout inicial.
