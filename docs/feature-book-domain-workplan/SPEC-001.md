### SPEC-001: Modal Unificado de Detalle y Edición de Libro (`BookDetailModalComponent`)

#### Objetivo:
Crear un componente modal dinámico en la feature de libros que permita consultar los detalles/estadísticas de un libro y alternar hacia el modo de edición de datos sin cambiar de ruta ni perder el contexto de la lista.

#### Requisitos de Implementación:
1. **Creación del Componente Standalone:**
   - Ubicación: `src/app/features/books/components/book-detail-modal/`.
   - Reemplazar/unificar la responsabilidad de edición que antes tenía `BookEditorComponent`.

2. **Gestión de Estados e Interfaz:**
   - **Modo Vista (`mode = 'view'`):**
     - Muestra la portada, título, autor, categoría, páginas totales y estado de lectura.
     - Barra de progreso de lectura basada en el último registro.
     - Historial simplificado de sesiones de lectura (`ReadingLog`).
     - Botón **"Editar libro"** para cambiar `mode` a `'edit'`.
     - Botón **"Registrar lectura"** que abre el flujo rápido de `ReadingLogEditorComponent`.
   - **Modo Edición (`mode = 'edit'`):**
     - Formulario reactivo para actualizar metadatos del libro (título, autor, páginas, estado, portada).
     - Botón **"Guardar cambios"** que invoca `BooksService.updateBook()` y retorna a `mode = 'view'`.
     - Botón **"Cancelar"** que restaura los datos y vuelve a `mode = 'view'`.

3. **Integración en `BooksPageComponent`:**
   - Añadir una señal local `selectedBookId = signal<string | null>(null)`.
   - Al hacer clic en la tarjeta o botón de detalles de un libro, ejecutar `selectedBookId.set(book.id)`.
   - Renderizar `@if (selectedBookId()) { <app-book-detail-modal [bookId]="selectedBookId()" (close)="selectedBookId.set(null)" /> }`.
