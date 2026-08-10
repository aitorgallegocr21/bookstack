# Book Domain Work Plan

## Objetivo
Mantener una hoja de ruta operativa para la elaboración del módulo de libros y sus datos.

## Estado actual
- Base Angular generada por CLI.
- Sin feature concreta para libros.
- Sin interfaz de negocio `Book`, `ReadingLog` y `ReadingStats` implementada en código.

## Trabajo realizado
- Rama de feature creada: `feature/book-domain-model`.
- Carpeta base de feature creada en `src/app/features/books`.
- Se ha añadido el modelo de dominio de libros en `src/app/features/books/models/book.model.ts`.

## Siguientes pasos
1. Revisar la ruta y el componente de entrada de la feature.
2. Añadir un servicio local de estado para los libros.
3. Preparar almacenamiento local con `localStorage`/IndexedDB como fallback.
4. Crear componentes visuales de listado y detalle.
5. Añadir estadísticas derivadas y registros de lectura.
