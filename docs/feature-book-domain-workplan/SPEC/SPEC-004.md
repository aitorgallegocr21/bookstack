# SPEC-004: Dominio Extendido, Pipeline de Portadas y Refinamiento UI/UX

- **Estado:** COMPLETADO
- **Fecha:** Agosto 2026
- **Área:** Frontend / UI / UX / Arquitectura de Datos / Local-First
- **Archivos Afectados:**
  - `src/app/features/books/models/book.model.ts`
  - `src/app/features/books/services/books.service.ts`
  - `src/app/features/books/services/image-optimizer.service.ts` (Nuevo)
  - `src/app/features/books/pages/books-page/books-page.html`
  - `src/app/features/books/pages/books-page/books-page.ts`
  - `src/app/features/books/components/book-create-modal/book-create-modal.html`
  - `src/app/features/books/components/book-create-modal/book-create-modal.ts`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.html`
  - `src/app/features/books/components/book-edit-modal/book-edit-modal.ts`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.html`
  - `src/app/features/books/components/book-detail-modal/book-detail-modal.ts`

---

## 1. Objetivos

1. **Corrección Visual de Modales:** Corregir el radio de curvatura en esquinas superiores mediante `overflow-hidden` estricto en el contenedor modal.
2. **Transiciones Suaves:** Añadir animaciones de apertura y cierre coordinadas en backdrops y diálogos (`scale-95` $\to$ `scale-100`, `opacity-0` $\to$ `opacity-100`).
3. **Acciones Modernas:** Rediseñar el botón principal "+ Añadir libro" y modernizar los botones de acción de fila ("Ver detalle", "Editar", "Eliminar") con iconografía vectorial y disposición optimizada.
4. **Selectores Estilizados:** Diseñar inputs `<select>` con aspecto moderno, chevron integrado y foco semántico.
5. **Ampliación de Dominio:** Incorporar campos de fechas (`startDate`, `endDate`), `isbn`, `publisher`, `publicationYear`, `totalChapters`, `currentChapter`, `totalCharacters` y saga/serie (`series`).
6. **Subida de Portada Local Segura:** Implementar procesamiento y compresión de imágenes en el cliente (Canvas API a WebP/JPEG $\le 400\text{px}$, $\sim 40\text{KB}$) para permitir adjuntar portadas locales sin comprometer la cuota de `LocalStorage`.
7. **Regla de Autocompletado:** Sincronizar automáticamente el progreso (`currentPage = totalPages`, `currentChapter = totalChapters` y `endDate = today`) al establecer el estado en `COMPLETED`.

---

## 2. Especificación Técnica por Componente

### 2.1 Pipeline de Compresión: `ImageOptimizerService`
Crear `src/app/features/books/services/image-optimizer.service.ts`:
- Recibe un objeto `File`.
- Valida tipo MIME (`image/jpeg`, `image/png`, `image/webp`, `image/avif`) y tamaño máximo de entrada ($10\text{MB}$).
- Procesa la imagen mediante un elemento `<canvas>` virtual:
  - Ancho máximo: $400\text{px}$ (conservando aspect ratio).
  - Conversión a Data URL en formato `image/webp` (o `image/jpeg`) con calidad `0.75`.
- Retorna una promesa con la cadena Base64 resultante.

### 2.2 Modales de Creación y Edición (`BookCreateModal`, `BookEditModal`)
- **Pestaña/Selector de Portada:** Permitir alternar entre "URL web" o "Subir archivo local" con previsualización inmediata y botón de eliminar portada.
- **Formulario en Secciones Lógicas (Scroll Interno):**
  - *Información Básica:* Título, Autor, Editorial, Año, ISBN.
  - *Progreso y Formato:* Estado, Formato, Páginas (leídas/totales), Capítulos (leídos/totales), Caracteres totales.
  - *Saga / Serie (Opcional):* Checkbox "Pertenece a una saga" $\to$ Despliega campos de Nombre de Serie y Número de Volumen.
  - *Fechas de Lectura:* Fecha de inicio y Fecha de fin.
  - *Notas y Valoración:* Puntuación y comentarios personales.
- **Automatización de Estado `COMPLETED`:**
  - `(change)` o `(ngModelChange)` en el selector de estado: si el nuevo valor es `'COMPLETED'`, asignar `currentPage = totalPages`, `currentChapter = totalChapters` y `endDate = fechaActual` si no estuvieran ya definidos.

### 2.3 Página Principal (`BooksPageComponent`)
- **Barra Superior:** Botón "+ Añadir libro" con diseño estilizado (`bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md flex items-center gap-2`).
- **Tabla de Libros:** Columna de acciones con botones de icono modernos agrupados con tooltips:
  - Ver detalle: Icono de ojo / libro (`text-blue-600 hover:bg-blue-50`).
  - Editar: Icono de lápiz (`text-slate-600 hover:bg-slate-100`).
  - Eliminar: Icono de papelera (`text-rose-600 hover:bg-rose-50`).

---

## 3. Criterios de Aceptación

- [x] Todos los modales presentan esquinas perfectamente redondeadas (`rounded-2xl`) en la parte superior e inferior sin desbordamientos.
- [x] Los modales abren y cierran con transiciones de escala y opacidad suaves.
- [x] Los botones de acción en tabla y cabecera cuentan con un diseño moderno, ergonómico y alineado con la paleta clara.
- [x] Los campos desplegables (`<select>`) lucen modernos y homogéneos.
- [x] Es posible capturar y visualizar todos los nuevos campos de metadatos (ISBN, saga, capítulos, fechas, etc.).
- [x] Se puede subir una imagen desde el equipo, la cual es comprimida en cliente a $\le 60\text{KB}$ antes de almacenarse.
- [x] Al seleccionar el estado "Completado", el progreso de páginas y capítulos se actualiza automáticamente al 100%.
- [x] La aplicación compila limpiamente (`npm run build`).
