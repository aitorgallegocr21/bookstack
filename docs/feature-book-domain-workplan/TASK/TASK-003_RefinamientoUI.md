# TASK-003: Checklist de Implementación UI, Mobile & Localización

- **Especificación asociada:** `docs/feature-book-domain-workplan/SPEC-003.md`
- **Estado:** EN PROCESO

---

### Fase 1: Modelo y Constantes de Presentación
- [x] 1.1 Agregar constantes `BOOK_STATUS_LABELS` y `BOOK_STATUS_CONFIG` en `src/app/features/books/models/book.model.ts` con traducciones al español ('Pendiente', 'Leyendo', 'Completado', 'Abandonado') y paleta clara de badges.

### Fase 2: Adaptabilidad y Modo Claro en Modales
- [x] 2.1 Refactorizar `BookCreateModalComponent` (`.html` y `.ts`):
  - [x] Implementar contenedor `max-h-[90dvh] flex flex-col` con cabecera/pie fijos y cuerpo scrollable (`overflow-y-auto`).
  - [x] Sustituir clases oscuras (`bg-slate-900`, etc.) por paleta clara (`bg-white`, `border-slate-200`, `text-slate-900`, `bg-slate-50`).
  - [x] Configurar rejilla adaptativa (`grid-cols-1 sm:grid-cols-2`).
- [ ] 2.2 Refactorizar `BookEditModalComponent` (`.html` y `.ts`):
  - [ ] Aplicar la misma estructura de scroll interno y paleta clara.
- [ ] 2.3 Refactorizar `BookDetailModalComponent` (`.html` y `.ts`):
  - [ ] Reemplazar paleta oscura por paleta clara y garantizar scroll si el contenido desborda.
- [ ] 2.4 Refactorizar `ReadingLogEditorComponent` (`.html` y `.ts`):
  - [ ] Aplicar estilos claros en inputs de fecha, páginas y comentarios.

### Fase 3: Localización en Vista Principal
- [ ] 3.1 Actualizar widget de distribución por estado en `BooksPageComponent` (`books-page.html`):
  - [ ] Mostrar los 4 estados con sus etiquetas en español y colores semánticos claros.
- [ ] 3.2 Actualizar tabla y listado de libros en `BooksPageComponent`:
  - [ ] Renderizar los badges de estado en español usando `BOOK_STATUS_CONFIG` o `BOOK_STATUS_LABELS`.

### Fase 4: Micro-interacciones y Feedback Visual
- [ ] 4.1 Añadir transiciones (`transition-all duration-200`) y estados hover sutiles en tarjetas de estadísticas y distribución.
- [ ] 4.2 Asegurar transiciones suaves en filas de la tabla (`hover:bg-slate-50/80`) y botones interactivos.

### Fase 5: Validación Técnica
- [ ] 5.1 Ejecutar `npm run build` y comprobar que no existan errores de compilación ni de tipado en TypeScript.
- [ ] 5.2 Verificar la navegación completa en viewport móvil (< 640px) y escritorio.
