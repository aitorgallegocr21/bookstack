# TASK-008: Checklist de Sincronización de Progreso, Contraste, Vista <360px y Refinamiento UX

- **Especificación asociada:** `docs/feature-book-domain-workplan/SPEC/SPEC-008.md`
- **Estado:** EN PROCESO

---

### Fase 1: Sincronización Automática de Sesiones y Progreso
- [ ] 1.1 Implementar método `applyReadingDelta(bookId: string, deltaPages: number)` en `BooksService` (`books.service.ts`).
- [ ] 1.2 Conectar `ReadingLogService` (`reading-log.service.ts`) o `ReadingLogEditorComponent` para invocar `applyReadingDelta`:
  - [ ] Al crear un log: sumar `log.pagesRead`.
  - [ ] Al eliminar un log: restar `log.pagesRead`.
  - [ ] Al editar un log: aplicar la diferencia `(newPages - oldPages)`.

### Fase 2: Formateador Universal de Fechas
- [ ] 2.1 Crear `src/app/core/utils/date-formatter.ts` con funciones de formato `es-ES`.
- [ ] 2.2 Aplicar `formatSpanishDate` en `BooksPageComponent`, `BookDetailModalComponent` y `ReadingLogEditorComponent`.

### Fase 3: Theming, Micro-animación de Switch y Contraste
- [ ] 3.1 Añadir micro-animación de rotación y escala al botón Sol/Luna en la cabecera de `BooksPageComponent`.
- [ ] 3.2 Reforzar contraste en modo claro:
  - [ ] Fondo de página: `bg-slate-100/80` (en `index.html` y `books-page.html`).
  - [ ] Tarjetas: `border-slate-300/80` y `shadow-sm`.
  - [ ] Textos secundarios: `text-slate-700 dark:text-slate-300`.

### Fase 4: Ergonomía de Formularios y Modales
- [ ] 4.1 Rediseñar el selector de archivo de imagen de portada en `BookCreateModalComponent` y `BookEditModalComponent` con botón estilizado y badge de archivo.
- [ ] 4.2 Convertir el checkbox de saga en un Switch toggle deslizante moderno con animación fluida de apertura/cierre.

### Fase 5: Responsividad Extrema (<360px)
- [ ] 5.1 Aplicar reglas de reajuste en tarjetas de libro (`books-page.html`) para pantallas de ancho $<360\text{px}$ evitando desbordamientos de botones y texto.

### Fase 6: Validación y Compilación
- [ ] 6.1 Probar ciclo completo de logs: añadir log -> verificar aumento de progreso -> borrar log -> verificar reducción.
- [ ] 6.2 Probar visualización en 320px (Galaxy Fold / iPhone SE) en DevTools.
- [ ] 6.3 Ejecutar `npm run build` y asegurar 0 errores.
