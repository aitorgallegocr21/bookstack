# TASK-006: Checklist de Optimización de Rendimiento y Aislamiento de Reflow

- **Especificación asociada:** `docs/feature-book-domain-workplan/SPEC/SPEC-006.md`
- **Estado:** EN PROCESO

---

### Fase 1: Limpieza de Transiciones Ineficientes (Layout Thrashing)
- [x] 1.1 Auditar `src/app/features/books/pages/books-page/books-page.html`:
  - [x] Reemplazar todas las ocurrencias de `transition-all` en tarjetas de estadísticas, lista móvil, tabla de escritorio y contenedores por `transition-colors`, `transition-opacity` o `transition-shadow`.
- [x] 1.2 Auditar modales (`book-create-modal.html`, `book-edit-modal.html`, `book-detail-modal.html`, `reading-log-editor.html`):
  - [x] Eliminar `transition-all` en contenedores de diálogo y campos de formulario, asegurando transiciones aisladas (`transition-colors`, `transition-opacity`).

### Fase 2: Optimización del Pipeline de Portadas e Imágenes
- [x] 2.1 Actualizar etiquetas `<img>` en la vista móvil de `books-page.html`:
  - [x] Añadir `loading="lazy"` y `decoding="async"`.
- [x] 2.2 Actualizar etiquetas `<img>` en la tabla de escritorio de `books-page.html`:
  - [x] Añadir `loading="lazy"` y `decoding="async"`.
- [x] 2.3 Actualizar previsualizadores de portada en modales de creación, edición y detalle:
  - [x] Añadir `decoding="async"`.

### Fase 3: Aislamiento Gráfico con CSS Containment
- [x] 3.1 Agregar clases de contención en `books-page.css`:
  - [x] Aplicar `contain: layout paint;` y `content-visibility: auto;` en las tarjetas de libros móviles.
  - [x] Aplicar `contain: paint;` en las filas de tabla.
- [x] 3.2 Asignar las clases de contención a los elementos repetitivos existentes (`book-card-item` en las tarjetas y `book-reading-log-item` en los registros de lectura).

### Fase 4: Verificación de Rendimiento y Compilación
- [x] 4.1 Probar redimensionamiento continuo con DevTools Device Toolbar activado y comprobar ausencia de bloqueos.
- [x] 4.2 Ejecutar auditoría de rendimiento en DevTools para confirmar LCP < 2.5s.
- [x] 4.3 Ejecutar `npm run build` y asegurar 0 errores.
