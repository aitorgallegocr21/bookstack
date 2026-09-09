# SPEC-008: Sincronización de Progreso de Lectura, Contraste Modo Claro, Responsive <360px y Micro-animaciones

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Fecha:** Septiembre 2026
- **Área:** Frontend / UI / UX / Accesibilidad / Lógica de Dominio Local-First
- **Archivos Afectados:**
  - `src/app/core/utils/date-formatter.ts` (Nuevo)
  - `src/app/core/services/theme.service.ts`
  - `src/app/features/books/services/books.service.ts`
  - `src/app/features/books/services/reading-log.service.ts`
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/features/books/pages/books-page/books-page.ts`
  - `src/app/features/books/components/book-create-modal/book-create-modal.html`
  - `src/app/features/books/components/book-create-modal/book-create-modal.ts`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.html`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.html`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.ts`

---

## 1. Objetivos

1. **Micro-animación en Toggle de Tema:** Implementar transición con rotación y desvanecimiento (300ms) entre los iconos de Sol y Luna.
2. **Refuerzo de Contraste en Modo Claro:** Actualizar el fondo de la página a `bg-slate-100/80`, reforzar bordes a `border-slate-300` y optimizar contrastes tipográficos bajo WCAG AA.
3. **Selector de Archivo de Portada Estilizado:** Diseñar un cargador de archivos visual con soporte de drag/drop, previsualización del nombre del archivo y botón de remoción.
4. **Sincronización Automática de Progreso de Lectura:** 
   - Sumar páginas leídas al crear un log (`currentPage += pagesRead`).
   - Restar páginas al eliminar un log (`currentPage -= pagesRead`).
   - Ajustar páginas proporcionalmente al editar un log.
   - Transicionar estado a `COMPLETED` si se llega al 100% de páginas, o revertir a `READING` si baja del total.
5. **Switch de Saga con Animación Fluida:** Sustituir checkbox de saga por switch deslizante y animar la aparición de sus campos con CSS Grid transition.
6. **Soporte Ultra-Compacto (<360px):** Adaptar las tarjetas de libros para reorganizarse verticalmente en pantallas de ancho inferior a 360px sin desbordamiento.
7. **Formateo de Fechas en Español:** Centralizar la visualización de fechas en formato `DD/MM/YYYY` o `D de MMMM, HH:mm` usando utilidades `es-ES`.

---

## 2. Contratos y Especificación Técnica

### 2.1 Utilidad de Fechas (`src/app/core/utils/date-formatter.ts`)

```typescript
export function formatSpanishDate(dateStr: string | undefined | null, includeTime: boolean = false): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  if (includeTime) {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}
