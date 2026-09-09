# SPEC-006: Optimización de Rendimiento, Pipeline de Renderizado y Aislamiento de Reflow

- **Estado:** COMPLETADO
- **Fecha:** Septiembre 2026
- **Área:** Frontend / Core Web Vitals (LCP, INP, CLS) / Rendimiento Gráfico / Ergonomía Responsive
- **Archivos Afectados:**
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/features/books/pages/books-page/books-page.css`
  - `src/app/features/books/components/book-create-modal/book-create-modal.html`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.html`
  - `src/styles.css`

---

## 1. Objetivos

1. **Eliminar el Layout Thrashing en Resize:** Erradicar la propiedad `transition-all` en contenedores estructurales, rejillas y tarjetas de libros que provocan recálculos síncronos de geometría en cada píxel durante el redimensionamiento del viewport.
2. **Optimizar Decodificación de Portadas (LCP < 2.5s):** Configurar `decoding="async"` y `loading="lazy"` en todas las etiquetas `<img>` de portadas, trasladando el desempaquetado de Base64 fuera del hilo principal (Main Thread).
3. **Aislamiento de Layout (CSS Containment):** Implementar reglas de contención gráfica (`contain: layout paint;` / `content-visibility: auto`) en las tarjetas y elementos repetitivos del catálogo para impedir la propagación de reflow al árbol DOM completo.
4. **Optimización de Renderizado Dual (Mobile/Desktop):** Mitigar el coste de rasterizado simultáneo en las vistas móvil (`md:hidden`) y tabla de escritorio (`hidden md:block`).

---

## 2. Diagnóstico Técnico y Reglas de Implementación

### 2.1 Sustitución Estricta de Transiciones CSS

Está terminantemente prohibido utilizar `transition-all` en elementos que contengan texto, imágenes o dimensiones relativas.

* **Incorrecto (Bloquea CPU en Resize):**
  ```html
  <div class="transition-all duration-200 hover:shadow-md ...">
