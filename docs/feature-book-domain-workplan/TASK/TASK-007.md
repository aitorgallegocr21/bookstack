# TASK-007: Checklist de Implementación Media-Object, Layout Ultra-Wide y Theming de Formularios

- **Especificación asociada:** `docs/feature-book-domain-workplan/SPEC/SPEC-007.md`
- **Estado:** EN PROCESO

---

### Fase 1: Corrección Estructural del Canvas y Layout Ultra-Wide
- [x] 1.1 Asegurar que `html`, `body` y el componente raíz en `src/index.html` y `src/app/app.html` tengan `class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"`.
- [x] 1.2 Actualizar el contenedor maestro de `src/app/features/books/pages/books-page/books-page.html` a `max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8`.
- [x] 1.3 Modificar la rejilla de estadísticas para pantallas anchas (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`).

### Fase 2: Rediseño de Tarjetas Media-Object en Catálogo
- [x] 2.1 Eliminar el renderizado de la lista de sesiones de lectura dentro de las tarjetas en `books-page.html`.
- [x] 2.2 Reestructurar la tarjeta a patrón horizontal:
  - [x] Portada fija a la izquierda: `aspect-[2/3] w-20 sm:w-24 shrink-0`.
  - [x] Columna derecha: Título, autor, badge de estado, barra de progreso compacta y valoración.
  - [x] Barra de acción: botón `+ Registrar` y botonera de iconos (`Detalle`, `Editar`, `Eliminar`).
- [x] 2.3 Configurar la rejilla responsiva del catálogo: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4`.

### Fase 3: Centralización de Sesiones en Detalle de Libro
- [ ] 3.1 Verificar y refinar `BookDetailModalComponent` (`book-detail-modal.html` y `.ts`) para albergar el historial de sesiones con acordeón ("Ver más / Ver menos").

### Fase 4: Modo Oscuro Estricto en Formularios y Modales
- [ ] 4.1 Actualizar inputs, selects, textareas y options en `src/app/features/books/components/book-create-modal/book-create-modal.html` con clases `dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100`.
- [ ] 4.2 Actualizar inputs, selects, textareas y options en `src/app/features/books/components/book-edit-modal/book-edit-modal.html` con la misma paleta oscura.
- [ ] 4.3 Verificar contraste de placeholders y textos de ayuda en modo oscuro.

### Fase 5: Validación Técnica y Build
- [ ] 5.1 Probar visualización en viewport móvil (<640px) y ultra-ancho (>1440px).
- [ ] 5.2 Conmutar modo claro/oscuro y validar ausencia de elementos blancos residuales en formularios y fondos.
- [ ] 5.3 Ejecutar `npm run build` y asegurar 0 errores.
