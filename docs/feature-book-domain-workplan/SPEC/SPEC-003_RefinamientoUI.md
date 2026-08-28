# SPEC-003: Refinamiento de UI, Adaptabilidad Móvil y Localización de Estados

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Autor:** Lead Architect & Technical Writer
- **Fecha:** Agosto 2026
- **Área:** Frontend / UI / UX / Accesibilidad
- **Archivos Afectados:**
  - `src/app/features/books/models/book.model.ts`
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/features/books/pages/books-page/books-page.ts`
  - `src/app/features/books/components/book-create-modal/book-create-modal.html`
  - `src/app/features/books/components/book-create-modal/book-create-modal.ts`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.html`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.ts`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.html`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.ts`

---

## 1. Objetivos

1. **Estandarización Modo Claro:** Homogeneizar los estilos visuales de los modales (`BookCreateModal`, `BookEditModal`, `BookDetailModal`, `ReadingLogEditor`) eliminando fondos oscuros (`slate-900`) e implementando una paleta clara y pulida.
2. **Responsividad Móvil en Modales:** Resolver el desbordamiento vertical del modal de "Añadir libro" y modales adyacentes en pantallas estrechas mediante arquitectura de contenedor Flexbox con scroll interno (`max-h-[90dvh]` + `overflow-y-auto`).
3. **Localización de Estados:** Traducir al español todas las representaciones visuales de los 4 estados del libro (`PLANNING`, `READING`, `COMPLETED`, `DROPPED`) en listados, tablas, filtros y métricas de distribución.
4. **Micro-interacciones y Feedback Visual:** Enriquecer la experiencia de usuario con efectos de hover, iluminación sutil y transiciones consistentes sin degradar el rendimiento ni la accesibilidad.

---

## 2. Definiciones de Datos y Contratos de Presentación

### 2.1 Mapeo de Estados (`src/app/features/books/models/book.model.ts`)

Mantener el tipo `BookStatus` intacto y exportar el diccionario tipado de etiquetas y configuraciones visuales:

```typescript
export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  PLANNING: 'Por leer',
  READING: 'Leyendo',
  COMPLETED: 'Completado',
  DROPPED: 'Abandonado'
};

export interface StatusBadgeConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const BOOK_STATUS_CONFIG: Record<BookStatus, StatusBadgeConfig> = {
  PLANNING: {
    label: 'Por leer',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500'
  },
  READING: {
    label: 'Leyendo',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500'
  },
  COMPLETED: {
    label: 'Completado',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  DROPPED: {
    label: 'Abandonado',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500'
  }
};
