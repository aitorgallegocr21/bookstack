# TASK-010: Checklist de Accesibilidad WCAG, Control de Foco y Resiliencia

- **Especificación asociada:** `docs/features/02-app-shell/SPEC/SPEC-010.md`
- **Estado:** EN PROCESO

---

### Fase 1: Resiliencia de Almacenamiento Local-First
- [x] 1.1 Modificar `src/app/features/books/services/storage-adapter.service.ts`:
  - [x] Implementar captura segura de `QuotaExceededError` en `setItem` y retornar booleano de éxito.

### Fase 2: Control por Teclado y Cierre Seguro en Modales
- [ ] 2.1 Actualizar `BookCreateModalComponent` (`book-create-modal.ts` y `.html`):
  - [ ] Añadir `@HostListener('document:keydown.escape')`.
  - [ ] Asegurar `onBackdropClick` seguro.
  - [ ] Asignar `autofocus` al input de título.
- [ ] 2.2 Actualizar `BookEditModalComponent` (`book-edit-modal.ts` y `.html`):
  - [ ] Añadir `@HostListener('document:keydown.escape')`.
  - [ ] Asegurar `onBackdropClick` seguro.
  - [ ] Asignar `autofocus` al input de título.
- [ ] 2.3 Actualizar `BookDetailModalComponent` (`book-detail-modal.ts` y `.html`):
  - [ ] Añadir `@HostListener('document:keydown.escape')`.
  - [ ] Asegurar `onBackdropClick` seguro.
- [ ] 2.4 Actualizar `ReadingLogEditorComponent` (`reading-log-editor.ts` y `.html`):
  - [ ] Añadir `@HostListener('document:keydown.escape')`.
  - [ ] Asegurar `onBackdropClick` seguro.
  - [ ] Asignar `autofocus` al campo de páginas leídas.

### Fase 3: Accesibilidad WCAG AA y Foco Visible
- [ ] 3.1 Auditar y añadir `aria-label`, `title` y `focus-visible:ring-2` en:
  - [ ] Botones de tarjeta de catálogo (`books-page.html`).
  - [ ] Botones de cabecera (`header.component.html` si aplica).
  - [ ] Botones de barra inferior (`bottom-nav.component.html` si aplica).
  - [ ] Botones de cierre (`×`) y acciones dentro de todos los modales.

### Fase 4: Ergonomía de Tarjetas en Viewports Medios
- [ ] 4.1 Ajustar espaciados y truncados elípticos en la vista de tarjetas de `books-page.html` para tablets (640px a 1024px).

### Fase 5: Validación Técnica y Build
- [ ] 5.1 Probar navegación por teclado (Tab + Shift+Tab + Escape) en todos los flujos de la app.
- [ ] 5.2 Ejecutar `npm run build` y asegurar 0 errores de tipado.