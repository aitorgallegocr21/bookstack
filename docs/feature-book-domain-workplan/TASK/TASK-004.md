# TASK-004: Implementación de Dominio Extendido, Portadas Locales y Pulido UI

- **Especificación asociada:** `docs/feature-book-domain-workplan/SPEC-004.md`
- **Estado:** EN PROCESO

---

### Fase 1: Modelo y Servicios Base
- [x] 1.1 Actualizar `src/app/features/books/models/book.model.ts` con la interfaz `BookSeries`, nuevos atributos opcionales en `Book` y DTOs actualizados.
- [x] 1.2 Crear el servicio `ImageOptimizerService` en `src/app/features/books/services/image-optimizer.service.ts` con compresión Canvas a WebP/JPEG ($\le 400\text{px}$, calidad 0.75).

### Fase 2: Automatización y Pipeline de Portadas en Modales
- [ ] 2.1 Refactorizar `BookCreateModalComponent` (`.html`, `.ts`, `.css`):
  - [x] Corregir bordes superiores (`rounded-2xl overflow-hidden` en tarjeta).
  - [x] Implementar animaciones de transición de backdrop y modal.
  - [x] Agregar selector dual de portada (URL externa / Subir archivo local con compresión).
  - [x] Incorporar campos extendidos: ISBN, Editorial, Año, Capítulos, Caracteres, Fechas y Saga/Serie.
  - [ ] Implementar autocompletado de páginas/capítulos/fechas al cambiar estado a `COMPLETED`.
  - [ ] Estilizar `<select>` de estado y formato.
- [ ] 2.2 Refactorizar `BookEditModalComponent` (`.html`, `.ts`, `.css`):
  - [ ] Replicar la estructura de campos extendidos, portadas locales y autocompletado en `COMPLETED`.
- [ ] 2.3 Actualizar `BookDetailModalComponent` (`.html`, `.ts`):
  - [ ] Mostrar los nuevos metadatos si están presentes (Saga, ISBN, Editorial, Fechas, Capítulos).

### Fase 3: Modernización de UI en Página Principal
- [ ] 3.1 Rediseñar el botón "+ Añadir libro" en `BooksPageComponent` (`books-page.html`).
- [ ] 3.2 Rediseñar los botones de acción ("Ver detalle", "Editar", "Eliminar") en la tabla de libros con botones de icono ergonómicos y tooltips.

### Fase 4: Validación y Compilación
- [ ] 4.1 Probar subida de imagen pesada (> 3MB) y verificar en consola/inspección que el Base64 almacenado es ligero (< 60KB).
- [ ] 4.2 Probar flujo de cambio a estado "Completado" y verificar sincronización automática de páginas.
- [ ] 4.3 Ejecutar `npm run build` y validar ausencia de errores de tipado o estilos rotos.
