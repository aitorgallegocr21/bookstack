# TASK-005: Checklist de Implementación Sesiones, Portadas, Rating 0-10 y Modo Oscuro

- **Especificación asociada:** `docs/feature-book-domain-workplan/SPEC/SPEC-005.md`
- **Estado:** EN PROCESO

---

### Fase 1: Motor de Theming y Configuración Base
- [x] 1.1 Configurar `darkMode: 'class'` en `tailwind.config.js`.
- [x] 1.2 Crear `ThemeService` en `src/app/core/services/theme.service.ts` con Signals (`theme`, `isDark`), persistencia en `LocalStorage` (`bookstack_theme_v1`) y manipulación del DOM.
- [x] 1.3 Incorporar botón conmutador Sol/Luna en la cabecera de `BooksPageComponent` (`books-page.html` y `.ts`).

### Fase 2: Modelo de Dominio y Calificación 0-10
- [x] 2.1 Actualizar `Book.rating` en `src/app/features/books/models/book.model.ts` para soportar rango `0 - 10`.
- [x] 2.2 Actualizar input y visualización de valoración en `BookCreateModalComponent`, `BookEditModalComponent` y `BookDetailModalComponent` a escala 0-10.
- [x] 2.3 Actualizar badge de puntuación en `BooksPageComponent` (`★ X/10`).

### Fase 3: Aspect Ratio Vertical (2:3) de Portadas y Vista Móvil
- [x] 3.1 Refactorizar maquetación móvil de tarjetas de libros en `BooksPageComponent` aplicando `aspect-[2/3]` con `object-cover`.
- [x] 3.2 Corregir el previsualizador de portada en `BookCreateModalComponent` y `BookEditModalComponent` a contenedor con relación de aspecto $2:3$.

### Fase 4: Sesiones de Lectura Colapsables y Botón de Registro
- [x] 4.1 Rediseñar el botón "+ Registrar lectura" en la ficha de cada libro con estilos destacados.
- [x] 4.2 Implementar lógica reactiva de colapso/expansión para mostrar 2 sesiones por defecto y toggle para ver el historial restante.

### Fase 5: Auditoría y Aplicación de Clases Dark en Toda la UI
- [x] 5.1 Aplicar clases `dark:` en `BooksPageComponent` (fondo, tarjetas de estadísticas, tablas, filtros, distribución).
- [ ] 5.2 Aplicar clases `dark:` en `BookCreateModalComponent` y `BookEditModalComponent`.
- [ ] 5.3 Aplicar clases `dark:` en `BookDetailModalComponent` y `ReadingLogEditorComponent`.

### Fase 6: Validación y Build
- [ ] 6.1 Validar persistencia de tema tras recargar el navegador.
- [ ] 6.2 Comprobar responsive en pantallas $<640\text{px}$ y validar aspect ratio de portadas.
- [ ] 6.3 Ejecutar `npm run build` y asegurar compilación limpia sin advertencias.
