# TASK SPECIFICATION: Unificación de Modales de Edición y Reubicación del Botón 'Registrar Lectura'

## Objetivo
Refactorizar la interfaz de la página de libros (`books-page`) para desacoplar y unificar el flujo de edición utilizando modales dedicados (`BookCreateModalComponent` para altas y `BookEditModalComponent` para modificaciones), consolidando la acción de "Registrar lectura" en el botón iconográfico `+` de la sección de lecturas de cada libro y dentro de `BookDetailModalComponent`.

## Pasos Requeridos

1. **Modificaciones en `books-page.html`:**
   - [x] Localizar el grupo de botones de acción principal de cada libro en la plantilla.
   - [x] Eliminar el botón "Registrar Lectura" / "Añadir Log" del grupo de acciones principales.
   - [x] Asegurar que el botón de icono `+` dentro de la sección de sesiones/progreso de lectura del libro ejecute el método `openReadingLogEditor(book)`.
   - [x] Verificar que la acción de edición ("Editar") en todos los puntos de la tarjeta invoque el método dedicado `openEditModal(book.id)`.
   - [x] Confirmar que la interacción con la tarjeta o el botón "Ver detalle" abra `BookDetailModalComponent` mediante el Signal `selectedBookForDetailId()`.
   - [x] Asegurar que la creación de un nuevo libro abra exclusivamente `BookCreateModalComponent` vinculado al Signal `showCreateModal()`.

2. **Modificaciones en `books-page.ts`:**
   - [x] Asegurar que el manejo del estado use Signals independientes (`showCreateModal`, `selectedBookForEditId`, `selectedBookForDetailId`, `readingLogBookId`, `showReadingLogEditor`).
   - [x] Validar que la limpieza de selección ocurra al cerrar los modales (`cancel` / `close` / `closed`).

3. **Verificación de Calidad y Refactorización:**
   - [x] Eliminación del componente redundante `BookEditorComponent`.
   - [x] Resolución total de reglas de accesibilidad WCAG / SonarQube (`Web:S6853`, `Web:MouseEventWithoutKeyboardEquivalentCheck`, `axe/forms`).
   - [x] Ejecutar la verificación de TypeScript/Angular para asegurar cero errores de compilación o de tipos.
   - [x] Confirmar que el flujo de edición actualiza el Signal del catálogo (`BooksService`) correctamente sin regresiones.
