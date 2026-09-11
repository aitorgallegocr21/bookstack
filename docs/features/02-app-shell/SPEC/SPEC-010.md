# SPEC-010: Refinamiento de Accesibilidad WCAG, Ergonomía de Diálogos y Resiliencia Local-First

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Fecha:** Septiembre 2026
- **Área:** Frontend / A11y (WCAG 2.1 AA) / Ergonomía / Resiliencia Local-First
- **Archivos Afectados:**
  - `src/app/features/books/services/storage-adapter.service.ts`
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/features/books/pages/books-page/books-page.ts`
  - `src/app/features/books/components/book-create-modal/book-create-modal.ts`
  - `src/app/features/books/components/book-create-modal/book-create-modal.html`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.ts`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.html`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.ts`
  - `src/app/features/books/components/reading-log-editor/reading-log-editor.html`

---

## 1. Objetivos Técnicos

1. **Accesibilidad Semántica (WCAG 2.1 AA):** Dotar a todos los botones interactivos (iconos sin texto visible) de etiquetas `aria-label`, `title` contextual y estados de foco visibles (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`).
2. **Control por Teclado y Ergonomía de Modales:**
   - Incorporar escucha global de la tecla `Escape` (`@HostListener('document:keydown.escape')`) para cerrar cualquier diálogo activo.
   - Implementar autoenfoque (`autofocus` o directiva de foco) en el primer campo interactivo al abrir un modal.
   - Blindar el cierre por clic en el fondo oscuro (*backdrop*) para evitar descartes accidentales al soltar el ratón tras seleccionar texto.
3. **Resiliencia ante Cuota de Almacenamiento:** Capturar excepciones de tipo `QuotaExceededError` en `StorageAdapterService` para evitar bloqueos de ejecución y notificar de forma no intrusiva al usuario.
4. **Ergonomía de Tarjetas en Viewports Medios (640px–1024px):** Ajustar el empaquetado tipográfico de títulos, badges y botoneras para prevenir solapamientos en pantallas de tablet o escritorios en ventana partida.

---

## 2. Decisiones de Diseño y Contratos de Implementación

### 2.1 Resiliencia de Persistencia (`src/app/features/books/services/storage-adapter.service.ts`)

```typescript
setItem<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error: unknown) {
    if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
      console.error(`[StorageAdapter] Límite de almacenamiento excedido al guardar "${key}".`, error);
      // Aquí se evita que la aplicación lance un uncaught exception
    } else {
      console.error(`[StorageAdapter] Error inesperado al persistir "${key}":`, error);
    }
    return false;
  }
}