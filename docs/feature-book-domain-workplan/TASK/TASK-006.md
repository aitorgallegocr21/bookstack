# TASK-006: Checklist de Optimización de Rendimiento y Aislamiento de Reflow

- **Especificación asociada:** `docs/feature-book-domain-workplan/SPEC/SPEC-006.md`
- **Estado:** EN PROCESO

---

### Fase 1: Limpieza de Transiciones Ineficientes (Layout Thrashing)
- [ ] 1.1 Auditar `src/app/features/books/pages/books-page/books-page.html`:
  - [ ] Reemplazar todas las ocurrencias de `transition-all` en tarjetas de estadísticas, lista móvil, tabla de escritorio y contenedores por `transition-colors`, `transition-opacity` o `transition-shadow`.
- [ ] 1.2 Auditar modales (`book-create-modal.html`, `book-edit-modal.html`, `book-detail-modal.html`, `reading-log-editor.html`):
  - [ ] Eliminar `transition-all` en contenedores de diálogo y campos de formulario, asegurando transiciones aisladas (`transition-colors`, `transition-opacity`).

### Fase 2: Optimización del Pipeline de Portadas e Imágenes
- [ ] 2.1 Actualizar etiquetas `<img>` en la vista móvil de `books-page.html`:
  - [ ] Añadir `loading="lazy"` y `decoding="async"`.
- [ ] 2.2 Actualizar etiquetas `<img>` en la tabla de escritorio de `books-page.html`:
  - [ ] Añadir `loading="lazy"` y `decoding="async"`.
- [ ] 2.3 Actualizar previsualizadores de portada en modales de creación, edición y detalle:
  - [ ] Añadir `decoding="async"`.

### Fase 3: Aislamiento Gráfico con CSS Containment
- [ ] 3.1 Agregar clases de contención en `books-page.css`:
  - [ ] Aplicar `contain: layout paint;` y `content-visibility: auto;` en las tarjetas de libros móviles.
  - [ ] Aplicar `contain: paint;` en las filas de tabla.
- [ ] 3.2 Asignar las clases correspondientes (`book-card-item`, `book-table-row`) en el template HTML.

### Fase 4: Verificación de Rendimiento y Compilación
- [ ] 4.1 Probar redimensionamiento continuo con DevTools Device Toolbar activado y comprobar ausencia de bloqueos.
- [ ] 4.2 Ejecutar auditoría de rendimiento en DevTools para confirmar LCP < 2.5s.
- [ ] 4.3 Ejecutar `npm run build` y asegurar 0 errores.
