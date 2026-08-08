# CONTEXT.md - BookStack (Single Source of Truth)

## 1. Visión General del Proyecto

* **Nombre del Proyecto:** BookStack
* **Propósito:** Aplicación web moderna, minimalista y visual para el seguimiento del progreso de lectura personal, registro de sesiones de lectura y visualización de estadísticas avanzadas.
* **Público Objetivo:** Lectores que buscan una alternativa estética, privada y rápida para registrar sus lecturas sin depender de plataformas cerradas o pesadas.
* **Estrategia Comercial/Costes:** Proyecto personal de portfolio. **Fase 1 Local-First** (100% gratuita, sin backend ni infraestructura en la nube). Persistencia en el navegador.

---

## 2. Stack Tecnológico y Herramientas

* **Frontend Framework:** Angular v18+
  * *Arquitectura:* Standalone Components (`standalone: true`), Inyección con `inject()`.
  * *Estado Reactivo:* Angular Signals (`signal()`, `computed()`, `effect()`).
  * *Control Flow:* Sintaxis nativa (`@if`, `@for`, `@switch`).
* **Estilos y UI:**
  * **Tailwind CSS:** Diseño customizado minimalista, modo claro/oscuro, bordes finos, micro-interacciones.
  * **Iconografía:** Lucide Icons (vía `lucide-angular`).
* **Visualización de Datos / Gráficos:** Chart.js con `ng2-charts` (o Apache ECharts).
* **Persistencia Local (Local-First):** `IndexedDB` (a través de un servicio nativo o librería ligera como `idb`) con fallback en `LocalStorage`.
* **Entorno de Desarrollo & Asistentes:**
  * Editor: VSCode (Perfil Web/Angular).
  * Asistencia IA: Multi-agente mediante reglas en `.agent/` (Arquitecto, Frontend, Reviewer, Git/GitHub).
* **Control de Versiones y Despliegue:** Git, GitHub, GitHub Actions, GitHub Pages.

---

## 3. Principios de Arquitectura y Reglas de Código

1. **Estructura Modular por Características (Feature-Based):**
   * El código se organiza por módulos funcionales dentro de `src/app/features/` en lugar de agrupar por tipo de archivo.
2. **TypeScript Estricto:**
   * Prohibido el uso de `any`. Tipado explícito en todas las interfaces, servicios y eventos.
3. **Estado Reactivo Local mediante Signals:**
   * Cero uso de mutable state en componentes. Uso preferente de Signals frente a `BehaviorSubject` para el estado interno del cliente.
4. **HTML Semántico y Accesibilidad (a11y):**
   * Uso obligatorio de etiquetas semánticas (`<main>`, `<article>`, `<header>`, `<nav>`, `<section>`, `<button>`).

---

## 4. Modelo de Datos (Interfaces TypeScript)

```typescript
// ==========================================
// 1. ESTADOS Y ENUMS DE LIBRO
// ==========================================
export type BookStatus = 'pending' | 'reading' | 'completed' | 'abandoned';

export interface BookFormat {
  id: string;
  name: string; // ej. 'Físico', 'Ebook', 'Audiolibro'
}

// ==========================================
// 2. INFORMACIÓN DE SAGA / SERIE
// ==========================================
export interface SeriesInfo {
  seriesName: string;        // Nombre de la saga (ej. "Harry Potter", "Gatos Guerreros")
  orderInSeries: number;     // Número en la saga (ej. 1, 2, 3...)
  prequelBookId?: string;    // ID del libro precuela si existe en la app (opcional)
  sequelBookId?: string;     // ID del libro secuela si existe en la app (opcional)
}

// ==========================================
// 3. MODELO PRINCIPAL DE LIBRO
// ==========================================
export interface Book {
  id: string;                      // UUID único
  isbn?: string;                   // Código ISBN-10 o ISBN-13 (clave para búsquedas)
  title: string;                   // Título del libro
  author: string;                  // Autor(es)
  
  // Métricas físicas y digitales
  totalPages: number;              // Total de páginas
  currentPage: number;             // Página actual alcanzada
  totalWords?: number;             // Total de palabras (opcional, para Ebooks)
  totalCharacters?: number;        // Total de caracteres (opcional, para Ebooks)
  currentWords?: number;           // Palabras leídas (opcional)

  // Metadatos y Organización
  status: BookStatus;              // 'pending' | 'reading' | 'completed' | 'abandoned'
  seriesInfo?: SeriesInfo;         // Información de saga (opcional)
  coverUrl?: string;               // URL de la portada (obtenida automáticamente o custom)
  rating?: number;                 // Puntuación (1 al 5)
  genre?: string[];                // Géneros / Etiquetas
  format?: string;                 // 'Físico', 'Ebook', 'Audiolibro'
  
  // Fechas y Notas
  startDate?: string;              // Fecha inicio (ISO String YYYY-MM-DD)
  endDate?: string;                // Fecha finalización (ISO String YYYY-MM-DD)
  notes?: string;                  // Reseña o notas personales
  
  // Auditoría
  createdAt: string;               // Timestamp de creación
  updatedAt: string;               // Timestamp de última actualización
}

// ==========================================
// 4. REGISTRO DE SESIONES DE LECTURA (LOGS)
// ==========================================
export interface ReadingLog {
  id: string;                      // UUID único de la sesión
  bookId: string;                  // ID del libro asociado
  date: string;                    // Fecha de la sesión (ISO String YYYY-MM-DD)
  pagesRead: number;               // Cantidad de páginas leídas en esta sesión
  timeSpentMinutes?: number;       // Tiempo dedicado en minutos (opcional)
  notes?: string;                  // Notas breves de la sesión
  createdAt: string;
}

// ==========================================
// 5. ESTRUCTURA DE ESTADÍSTICAS CALCULADAS
// ==========================================
export interface ReadingStats {
  totalBooks: number;
  completedBooks: number;
  readingBooks: number;
  pendingBooks: number;
  totalPagesRead: number;
  totalTimeSpentMinutes: number;
  averagePagesPerDay: number;
  averageReadingSpeedPagesPerHour: number;
  monthlyPages: { month: string; pages: number }[];
  statusDistribution: { status: BookStatus; count: number }[];
}

<!-- NUEVAS FUNCIONALIDADES Y SERVICIOS EN CONTEXT.MD -->

### Servicios Externos e Integraciones
* **Open Library API / Google Books API:** Búsqueda automática de metadatos de libros (portadas, autores, número de páginas, ISBN) sin coste.
* **Librería de Escaneo:** `html5-qrcode` para lectura de códigos de barras (ISBN-13) mediante la cámara del dispositivo.

### Nuevas Características del Sistema
1. **Búsqueda Autocompletada & Escáner ISBN:** Creación rápida de libros mediante cámara o barra de búsqueda por título/ISBN.
2. **Soporte para Sagas y Series:** Agrupación de libros por sagas, orden cronológico de lectura y vinculación de secuelas/precuelas.
3. **Métricas Avanzadas de Ebook:** Registro opcional de conteo total de palabras y caracteres para usuarios de formato digital.