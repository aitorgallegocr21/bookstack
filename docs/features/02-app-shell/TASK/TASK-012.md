# TASK-012: Checklist de Refinamiento de Shell, Correcciones de Breakpoints y Ergonomía

- **Especificación asociada:** `docs/features/02-app-shell/SPEC/SPEC-012.md`
- **Estado:** EN PROCESO

---

### Fase 1: Breakpoints y Enrutamiento Activo
- [ ] 1.1 Auditar `app.html` asegurando que `<app-sidebar>` use `hidden md:flex` y que `<app-header>` / `<app-bottom-nav>` usen `md:hidden`.
- [ ] 1.2 Añadir `[routerLinkActiveOptions]="{ exact: true }"` al enlace `/` en `sidebar.component.html` y `bottom-nav.component.html`.

### Fase 2: Rediseño del Sidebar Header y Theming
- [ ] 2.1 Refactorizar el contenedor superior de `sidebar.component.html`:
  - [ ] Modo expandido: Logo + nombre + botón chevron a la derecha.
  - [ ] Modo colapsado: Botón isotipo centrado interactivo que ejecuta `uiState.toggleSidebar()`.
- [ ] 2.2 Restaurar la animación SVG de Sol/Luna en `sidebar.component.html` y `header.component.html`.

### Fase 3: Cabecera Móvil y Acciones Globales
- [ ] 3.1 Actualizar `header.component.html` para vista móvil:
  - [ ] Eliminar la palabra "Tema" y dejar solo el icono animado.
  - [ ] Añadir botón con icono de GitHub (`target="_blank" rel="noopener noreferrer"`).
  - [ ] Añadir botón primario `+` enlazado a `booksService.openCreateModal()`.
- [ ] 3.2 Ajustar `bottom-nav.component.html` para ocultar la 5ª pestaña en pantallas $<350\text{px}` (`hidden xs:flex` o similar).

### Fase 4: Control de Scroll y Autofocus en Modales
- [ ] 4.1 Implementar bloqueo de scroll (`document.body.classList.add/remove('overflow-hidden')`) en:
  - [ ] `BookDetailModalComponent` (`book-detail-modal.ts`).
  - [ ] `BookCreateModalComponent` (`book-create-modal.ts`).
  - [ ] `BookEditModalComponent` (`book-edit-modal.ts`).
  - [ ] `ReadingLogEditorComponent` (`reading-log-editor.ts`).
- [ ] 4.2 Asegurar `autofocus` funcional con `@ViewChild` y `ngAfterViewInit` en modales de creación y edición.

### Fase 5: UI del Dashboard y Página Acerca de
- [ ] 5.1 Restaurar clases hover (`hover:shadow-md hover:-translate-y-0.5 transition-all`) en las tarjetas de `dashboard-page.component.html`.
- [ ] 5.2 Añadir sección de autoría (Aitor Gallego) y enlaces a GitHub en `about-page.component.html`.

### Fase 6: Validación Técnica y Build
- [ ] 6.1 Validar visualización en $320\text{px}$, $375\text{px}$, $768\text{px}$, $1024\text{px}$ y $>1280\text{px}$.
- [ ] 6.2 Probar apertura de modales, bloqueo de scroll y autofocus.
- [ ] 6.3 Ejecutar `npm run build` y asegurar 0 errores de compilación.
