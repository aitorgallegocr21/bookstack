# SPEC-005: Sesiones de Lectura Colapsables, Aspect Ratio 2:3, Puntuación 0-10 y Theming Oscuro/Claro

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Fecha:** Agosto 2026
- **Área:** Frontend / UI / UX / Theming / State Management
- **Archivos Afectados:**
  - `tailwind.config.js`
  - `src/app/features/books/models/book.model.ts`
  - `src/app/core/services/theme.service.ts` (Nuevo)
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/features/books/pages/books-page/books-page.ts`
  - `src/app/features/books/pages/books-page/books-page.css`
  - `src/app/features/books/components/book-create-modal/book-create-modal.html`
  - `src/app/features/books/components/book-create-modal/book-create-modal.ts`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.html`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.ts`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.html`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.ts`

---

## 1. Objetivos Técnicos y Funcionales

1. **Gestión de Sesiones de Lectura:** Rediseñar la sección de sesiones en la vista principal con botón ergonómico "+ Registrar lectura" y visualización colapsable/expandible (mostrar 2 sesiones iniciales y toggle *"Ver más / Ver menos"*).
2. **Aspect Ratio 2:3 en Portadas:** Forzar relación de aspecto vertical $2:3$ sin deformación (`aspect-[2/3] object-cover`) en tarjetas móviles, listados y previsualizaciones de modales.
3. **Escala de Valoración 0–10:** Actualizar modelo y formularios para permitir calificaciones de 0 a 10 (con precisión de 0.5) con insignias visuales adaptadas.
4. **Sistema Completo de Modo Oscuro (Dark Mode):**
   - Implementar `ThemeService` con Signals y persistencia Local-First en `LocalStorage` (`bookstack_theme_v1`).
   - Configurar `darkMode: 'class'` en Tailwind.
   - Diseñar botón toggle en cabecera con iconos interactivos Sol/Luna.
   - Aplicar estilos `dark:` coherentes en todas las vistas, modales, tablas, tarjetas y formularios.

---

## 2. Especificación de Diseño y Comportamiento

### 2.1 Theming y Paleta Semántica
- **Fondos:** `bg-slate-50 dark:bg-slate-950` (Página), `bg-white dark:bg-slate-900` (Tarjetas y Modales), `bg-slate-100 dark:bg-slate-800` (Contenedores secundarios).
- **Bordes:** `border-slate-200 dark:border-slate-800`.
- **Textos:** `text-slate-900 dark:text-slate-100` (Primario), `text-slate-600 dark:text-slate-400` (Secundario), `text-slate-400 dark:text-slate-500` (Muted).
- **Inputs & Selects:** `bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-blue-500/20 focus:border-blue-500`.

### 2.2 Aspect Ratio de Portadas
- Clases obligatorias para toda imagen de portada: `aspect-[2/3] object-cover w-full h-full rounded-lg`.
- Previsualizador en modales: Contenedor con `w-32 aspect-[2/3] mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800`.

### 2.3 Historial de Sesiones en Tarjeta de Libro
- Cada libro muestra sus sesiones recientes. Si existen más de 2 sesiones:
  - Mostrar las 2 más recientes.
  - Renderizar botón: `text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline` para alternar la vista completa.

### 2.4 Control de Puntuación (0 - 10)
- Input numérico con `min="0"` `max="10"` `step="0.5"`.
- Renderizado visual: `★ 8.5/10` con badge `bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800`.

---

## 3. Criterios de Aceptación (DoD)

- [ ] `ThemeService` alterna limpiamente entre modo claro y oscuro, persistiendo la preferencia en `LocalStorage` y aplicando `class="dark"` en `<html>`.
- [ ] El botón conmutador Sol/Luna en la cabecera responde con transiciones suaves.
- [ ] Todos los componentes y modales cuentan con soporte visual completo para modo oscuro y modo claro sin textos ilegibles ni contrastes rotos.
- [ ] Las portadas mantienen rigurosamente el aspect ratio 2:3 en dispositivos móviles y modales sin estirarse.
- [ ] La lista de sesiones de lectura en la vista principal es colapsable y el botón de registro tiene diseño ergonómico.
- [ ] La valoración admite rango de 0 a 10 y se visualiza con formato `★ X/10`.
- [ ] `npm run build` compila con 0 errores de TypeScript y CSS.
