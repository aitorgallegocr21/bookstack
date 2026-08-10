# Book Domain Work Plan

## Objetivo
Mantener una hoja de ruta operativa para la elaboración del módulo de libros y sus datos.

## Feature activo
- Nombre: `book-domain-model`
- Estado: `active`
- Alcance: dominio de libros, semilla inicial, servicio de acceso, métricas y persistencia base `LocalStorage` del mismo bloque.
- Principio: esta feature se considera cerrada si el trabajo no aporta contratos nuevos de modelo ni requiere nuevas interfaces de acceso al dominio.

## Estado actual
- Base Angular generada por CLI.
- Rama activa: `feature/book-domain-model`.
- La feature de libros ya tiene una ruta mínima apuntando a `/books` y una vista de listado básica.
- El dominio de libros está definido en el modelo y se sirve desde un `BooksService` con una semilla inicial.
- Ya existe un primer servicio de persistencia en navegador mediante `localStorage` para libros y registros de lectura.
- El bloque de tareas pendientes (`detalle/edición`, `registro de lectura`, `IndexedDB` y navegación/visual) se mantiene en el mismo ámbito funcional del dominio y no se trata como una feature paralela sin relación.

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
- Se ha añadido persistencia local con `LocalStorage` dentro de `BooksService` y `ReadingLogService`.
- Se ha añadido la página de listado `BooksPage` y una primera versión del layout en `src/app/features/books/pages/books-page/books-page.html` y `books-page.css`.
- Se ha conectado la ruta `/books` en `src/app/app.routes.ts` y el contexto raíz se apoya en un `RouterOutlet` público en `src/app/app.html`.
- Se ha añadido el componente `BookEditorComponent` para crear y editar libros mediante un modal de formulario en la vista principal.
- Se ha conectado la acción de abrir/editar libro desde la lista con el editor del mismo `BooksPage`.

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

### Bloque 2 — Siguiente capa funcional (continuación del mismo feature)
Objetivo: cerrar la operación en el cliente para que el libro sea interactivo y navegable desde la vista.

7. Preparar almacenamiento con `IndexedDB` o una capa de fallback más robusta. [Pendiente]
8. Crear componentes de detalle/edición de libro y registro de lectura. [En progreso: editor de creación/edición ya conectado]
9. Añadir la integración con mapas de lectura y UI de navegación del libro. [Pendiente]

## Regla de transición de feature
- Si las tareas implican cambios de dominio, acceso a datos, estados derivados o persistencia mínima del flujo de lectura, se mantienen en esta feature.
- Si las tareas empiezan a exigir formularios visuales, rutas varias, acciones de usuario, navegación distinta o un flujo de experiencia completo, se debe abrir un nuevo proyecto o subfeature rooteado en UI (`books-crud-ui`, `reading-log-flow`, etc.).
- Esta regla evita que los cambios de UI y los cambios de contrato se mezclen en una única historia larga y poco trazable.

## Registro de cambios relevantes
- 2026-08-10: se crea el modelo base del dominio y la rama `feature/book-domain-model`.
- 2026-08-10: se añade la semilla y el servicio local de libros.
- 2026-08-10: se añade una semilla de registros de lectura y un servicio de acceso a esos logs.
- 2026-08-10: se añade un servicio de cálculo de estadísticas sobre estado de libros y logs de lectura.
- 2026-08-10: se arma una ruta `/books` y una vista de `BooksPage` con un layout inicial.
- 2026-08-10: se añade persistencia local con `localStorage` para `BooksService` y `ReadingLogService`.
- 2026-08-10: se añade un `BookEditorComponent` y se conecta con `BooksPage` para abrir/editar libros desde la lista.
- 2026-08-10: se formaliza la separación entre `book-domain-model` como feature central y el siguiente bloque funcional para interacción CRUD / navegación del usuario.
