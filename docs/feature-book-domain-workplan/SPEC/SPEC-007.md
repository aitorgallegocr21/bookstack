# SPEC-007: Rediseño de Catálogo Media-Object, Layout Ultra-Wide, Encapsulación de Sesiones y Theming Estricto de Formularios

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Fecha:** Septiembre 2026
- **Área:** Frontend / UI / UX / Responsive Layout / Dark Mode / Ergonomía
- **Archivos Afectados:**
  - `src/index.html`
  - `src/styles.css`
  - `src/app/app.html`
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/features/books/pages/books-page/books-page.ts`
  - `src/app/features/books/pages/books-page/books-page.css`
  - `src/app/features/books/components/book-create-modal/book-create-modal.html`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.html`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.ts`

---

## 1. Objetivos

1. **Purificación de Tarjetas del Catálogo:** Eliminar el listado de sesiones de lectura de las tarjetas de la vista principal para aligerar la interfaz y eliminar espacios vacíos.
2. **Layout Horizontal Compacto (Media-Object):** Reestructurar las tarjetas con portada vertical (2:3) a la izquierda y bloque informativo/acciones compacto a la derecha, tanto en móvil como en escritorio.
3. **Encapsulación de Sesiones en Vista Detalle:** Mantener el historial de sesiones de lectura exclusivamente en el modal de detalle del libro con control de expansión/colapso reactivo.
4. **Soporte Ultra-Wide (>1150px) y Corrección de Fondo:** Eliminar las franjas laterales blancas en modo oscuro y permitir que el contenedor aproveche pantallas grandes (hasta 1720px) desplegando estadísticas en una sola fila y cuadrículas de 3 a 4 columnas de libros.
5. **Modo Oscuro Estricto en Formularios:** Corregir todos los inputs, selects, textareas y opciones de selección en los modales de creación y edición para que respondan coherentemente a la paleta oscura (`dark:bg-slate-800`, `dark:border-slate-700`, `dark:text-slate-100`).

---

## 2. Especificación de Diseño y Componentes

### 2.1 Tarjeta de Libro de Alta Densidad (`books-page.html`)
Cada tarjeta de libro adoptará el patrón Media-Object:
- **Contenedor:** `flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 gap-3.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors book-card-item`.
- **Portada (Izquierda):** `w-20 sm:w-24 shrink-0 aspect-[2/3] object-cover rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800`.
- **Cuerpo (Derecha):** `flex-1 flex flex-col justify-between min-w-0`:
  - *Fila 1 (Título & Estado):* Título en `text-sm font-semibold text-slate-900 dark:text-slate-100 truncate` + Badge de estado traducido según `BOOK_STATUS_CONFIG`.
  - *Fila 2 (Metadatos):* Autor en `text-xs text-slate-600 dark:text-slate-400 truncate`, Formato y Valoración (`★ X/10`).
  - *Fila 3 (Progreso):* Mini barra de progreso (`h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden`) y texto de progreso (`text-xs text-slate-500 dark:text-slate-400`).
  - *Fila 4 (Acciones):* Botón `+ Registrar` (`px-2.5 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors`) + Botones de icono de Detalle, Editar y Eliminar.

### 2.2 Rejilla y Contenedor Principal Ultra-Wide
- **Contenedor Principal:** `w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-screen`.
- **Barra de Métricas (Ribbon):** `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3`.
- **Rejilla del Catálogo:** `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4`.

### 2.3 Formulario en Modo Oscuro (`BookCreateModal`, `BookEditModal`)
- Inputs / Textareas:
  ```html
  class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-colors"
