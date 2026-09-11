# TASK-009: Checklist de Shell Global, Enrutamiento Modular y Desacoplamiento

- **Especificación asociada:** `docs/features/02-app-shell/SPEC/SPEC-009.md`
- **Estado:** EN PROCESO

---

### Fase 1: Estado Global de Modales y Vistas Placeholder
- [x] 1.1 Agregar `isCreateModalOpen`, `openCreateModal()` y `closeCreateModal()` a `BooksService` (`books.service.ts`).
- [x] 1.2 Crear componente Standalone `DashboardPageComponent` en `src/app/features/dashboard/pages/dashboard-page/`.
- [x] 1.3 Crear componente Standalone `StatsPageComponent` en `src/app/features/analytics/pages/stats-page/`.
- [x] 1.4 Crear componente Standalone `SeriesPageComponent` en `src/app/features/series/pages/series-page/`.
- [x] 1.5 Crear componente Standalone `SettingsPageComponent` en `src/app/features/settings/pages/settings-page/`.

### Fase 2: Configuración del Enrutador Angular
- [z] 2.1 Configurar rutas perezosas en `src/app/app.routes.ts` para `/`, `/books`, `/stats`, `/series`, `/settings` y comodín `**`.

### Fase 3: Construcción de Componentes del Core Shell
- [ ] 3.1 Crear `HeaderComponent` (`header.component.ts` y `.html`) en `src/app/core/components/header/`:
  - [ ] Integrar branding, navegación desktop con `routerLink` / `routerLinkActive`.
  - [ ] Integrar botón conmutador Sol/Luna con `ThemeService`.
  - [ ] Integrar botón `+ Añadir libro` enlazado a `booksService.openCreateModal()`.
- [ ] 3.2 Crear `BottomNavComponent` (`bottom-nav.component.ts` y `.html`) en `src/app/core/components/bottom-nav/`:
  - [ ] Implementar los 5 botones con iconos vectoriales y zona táctil $\ge 48\text{px}$.

### Fase 4: Refactorización de Shell y Página de Libros
- [ ] 4.1 Actualizar `src/app/app.ts` y `src/app/app.html` con `<app-header>`, `<router-outlet>`, `<app-bottom-nav>` y renderizado condicional de `BookCreateModalComponent`.
- [ ] 4.2 Limpiar la cabecera redundante de `BooksPageComponent` (`books-page.html` y `.ts`).

### Fase 5: Validación Técnica y Build
- [ ] 5.1 Verificar navegación completa en escritorio y móvil haciendo clic en las 5 pestañas.
- [ ] 5.2 Probar apertura del modal de creación desde diferentes rutas (`/` y `/stats`).
- [ ] 5.3 Ejecutar `npm run build` y asegurar compilación limpia con 0 errores.
