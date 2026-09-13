# TASK-011: Checklist de Implementación de Sidebar Plegable, Ajuste de Vistas y Página Acerca de

- **Especificación asociada:** `docs/features/02-app-shell/SPEC/SPEC-011.md`
- **Estado:** COMPLETADO

---

### Fase 1: Estado de UI y Rutas
- [x] 1.1 Crear `UiStateService` en `src/app/core/services/ui-state.service.ts` con señal `isSidebarCollapsed` y persistencia en `LocalStorage`.
- [x] 1.2 Crear componente Standalone `AboutPageComponent` en `src/app/features/about/pages/about-page/`.
- [x] 1.3 Actualizar `src/app/app.routes.ts`:
  - [x] Eliminar ruta `/series`.
  - [x] Registrar ruta `/about`.
  - [x] Validar mapeo de `/` (Dashboard) y `/books` (BooksPage).

### Fase 2: Construcción de `SidebarComponent` (Desktop)
- [x] 2.1 Crear `SidebarComponent` en `src/app/core/components/sidebar/` (`sidebar.component.ts` y `.html`).
- [x] 2.2 Maquetar botón de colapso/expansión y enlace al branding.
- [x] 2.3 Implementar botón primario `+ Añadir libro` enlazado a `BooksService.openCreateModal()`.
- [x] 2.4 Maquetar navegación central (`/`, `/books`, `/stats`) con iconos modernos y `routerLinkActive`.
- [x] 2.5 Maquetar cluster inferior: `Ajustes` (`/settings`), `Acerca de` (`/about`), enlace externo a GitHub y conmutador de tema (`ThemeService`).

### Fase 3: Adaptación de Header y BottomNav (Mobile)
- [x] 3.1 Simplificar `HeaderComponent` para vista móvil (logo + conmutador de tema).
- [x] 3.2 Actualizar `BottomNavComponent` con los 5 accesos táctiles: *Inicio*, *Libros*, *Stats*, *Ajustes*, *Acerca de*.

### Fase 4: Reorganización de Layout e Intercambio de Vistas
- [x] 4.1 Actualizar `app.html` y `app.ts` para integrar `<app-sidebar>` en desktop y layout responsivo fluido.
- [x] 4.2 Ajustar `DashboardPageComponent` y `BooksPageComponent` para asegurar la correcta distribución del contenido.

### Fase 5: Validación Técnica y Build
- [x] 5.1 Probar alternancia de colapso/expansión del sidebar y verificar persistencia tras recargar el navegador.
- [x] 5.2 Comprobar navegación completa en modo claro y modo oscuro.
- [x] 5.3 Probar apertura del modal de creación desde la barra lateral colapsada y expandida.
- [x] 5.4 Ejecutar `npm run build` y asegurar 0 errores de tipado.
