# TASK SPECIFICATION: Unificación de Modales de Edición y Reubicación del Botón 'Registrar Lectura'

## Objetivo
Refactorizar la interfaz de la página de libros (`books-page`) para unificar el flujo de edición utilizando únicamente la versión modal de `BookEditorComponent`, y consolidar la acción de "Registrar lectura" en el botón iconográfico `+` de la sección de lecturas de cada libro.

## Pasos Requeridos

1. **Modificaciones en `books-page.html`:**
   - [ ] Localizar el grupo de botones de acción principal de cada libro en la plantilla.
   - [ ] Eliminar el botón "Registrar Lectura" / "Añadir Log" del grupo de acciones principales.
   - [ ] Asegurar que el botón de icono `+` dentro de la sección de sesiones/progreso de lectura del libro ejecute el método `openReadingLogModal(book)`.
   - [ ] Verificar que la acción de edición ("Editar") en todos los puntos de la tarjeta invoque el método unificado `openEditBookModal(book)`.
   - [ ] Confirmar que solo exista una instancia del modal `<app-book-editor>` vinculada al Signal `selectedBookForEdit()`.

2. **Modificaciones en `books-page.ts`:**
   - [ ] Asegurar que el manejo del estado use Signals (`selectedBookForEdit`, `isBookModalOpen`, `selectedBookForLog`, `isLogModalOpen`).
   - [ ] Validar que la limpieza de selección ocurra al cerrar los modales (`cancel` / `close`).

3. **Verificación de Calidad:**
   - [ ] Ejecutar `npm run build` o la verificación de TypeScript para asegurar que no hay errores de tipos.
   - [ ] Confirmar que el flujo de edición actualiza el Signal del catálogo (`BooksService`) correctamente sin regresiones.
