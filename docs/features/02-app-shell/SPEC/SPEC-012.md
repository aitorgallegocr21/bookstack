# SPEC-012: Refinamiento de Shell, Corrección de Breakpoints, Body Scroll Lock, Micro-animaciones y Autoría

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Fecha:** Septiembre 2026
- **Área:** Frontend / UI Shell / Responsive Fixes / Animations / WCAG AA / Scroll Management
- **Archivos Afectados:**
  - `src/app/core/components/sidebar/sidebar.component.html`
  - `src/app/core/components/sidebar/sidebar.component.ts`
  - `src/app/core/components/header/header.component.html`
  - `src/app/core/components/header/header.component.ts`
  - `src/app/core/components/bottom-nav/bottom-nav.component.html`
  - `src/app/core/components/bottom-nav/bottom-nav.component.ts`
  - `src/app/features/dashboard/pages/dashboard-page/dashboard-page.component.html`
  - `src/app/features/about/pages/about-page/about-page.component.html`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.ts`
  - `src/app/features/books/components/book-create-modal/book-create-modal.ts`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.ts`
  - `src/app/app.html`

---

## 1. Objetivos Técnicos

1. **Corrección de Breakpoints Responsivos:** Asegurar visibilidad continua sin puntos ciegos entre $768\text{px}$ y $1024\text{px}$ fijando el umbral `md` en `app.html` y los componentes de shell.
2. **Rediseño del Header del Sidebar:** Eliminar colisiones en modo colapsado ($68\text{px}$). Mostrar el isotipo centrado interactivo que permite expandir la barra y estilizar el botón de alternancia.
3. **Corrección de RouterLinkActive:** Aplicar `[routerLinkActiveOptions]="{ exact: true }"` al enlace de Inicio (`/`) en toda la navegación para evitar selecciones dobles.
4. **Bloqueo de Scroll de Fondo (Body Scroll Lock):** Bloquear el scroll de la página de fondo al abrir cualquier modal (`BookDetailModal`, `BookCreateModal`, etc.) y restaurarlo al destruirse.
5. **Autofocus Garantizado:** Asegurar que los modales de creación y edición enfoquen inmediatamente el primer `<input>` mediante `ngAfterViewInit` y `@ViewChild`.
6. **Restauración de Hover en Dashboard:** Reincorporar las clases de elevación visual (`hover:shadow-md hover:-translate-y-0.5 transition-all`) en las tarjetas del Dashboard.
7. **Cabecera Móvil Completa:**
   - Botón de cambio de tema exclusivamente con icono y animación de rotación/escala Sol/Luna.
   - Botón de acceso directo a GitHub con icono oficial.
   - Botón prominente `+` para añadir libros directamente desde el móvil.
8. **Ergonomía Ultra-Small (<350px):** Ocultar el acceso *Acerca de* en la barra inferior móvil en anchos $<350\text{px}$ y añadir enlace directo dentro de *Ajustes*.
9. **Créditos y Autoría en Acerca de:** Añadir tarjeta de presentación del autor (Aitor Gallego) y enlaces al repositorio en GitHub.

---

## 2. Especificación de Componentes y Plantillas

### 2.1 Enrutamiento y Enlaces Activos (`sidebar.component.html` & `bottom-nav.component.html`)

```html
<!-- Enlace Inicio con coincidencia exacta obligatoria -->
<a
  routerLink="/"
  [routerLinkActive]="'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold'"
  [routerLinkActiveOptions]="{ exact: true }"
  class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
  aria-label="Inicio"
  title="Inicio"
>
  <!-- Icono Casita -->
</a>
