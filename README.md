# 📚 BookStack

> **Seguimiento de lectura personal, privado y de alto rendimiento. Diseñado bajo la filosofía Local-First.**

[![Angular](https://img.shields.io/badge/Angular-v18+-DD0031?style=flat-square&logo=angular&logoColor=white)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Local--First](https://img.shields.io/badge/Architecture-Local--First-10B981?style=flat-square)](https://localfirstweb.dev/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-8B5CF6?style=flat-square)](https://www.w3.org/WAI/WCAG21/quickref/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

## 📖 Acerca del Proyecto

**BookStack** es una aplicación web moderna concebida para lectores que buscan organizar su biblioteca personal, registrar hábitos de lectura y analizar métricas sin ceder sus datos a servidores de terceros.

### 🛡️ Principios Fundamentales
* **100% Local-First:** Todos tus libros, notas y registros de lectura se almacenan y procesan de forma privada en tu propio navegador (`LocalStorage` / `IndexedDB`).
* **Reactividad Nativa:** Arquitectura desacoplada basada en **Angular Signals** para un rendimiento instantáneo sin overhead.
* **Diseño Ergonómico Asimétrico:** Experiencia de escritorio optimizada mediante barra lateral colapsable y navegación táctil inferior en dispositivos móviles.
* **Compresión en Cliente:** Pipeline con Canvas API que optimiza y reduce las portadas a formatos ligeros (WebP/JPEG, $400\text{px}$ máx.) antes de persistir en memoria local.

## 🚀 Funcionalidades Principales

* 📚 **Gestión Integral de Biblioteca:** Catálogo con fichas técnicas completas, soporte para sagas/colecciones literarias, formatos (Físico, Digital, Audiolibro) e ISBN.
* ⏱️ **Registro Granular de Sesiones:** Historial de lecturas con cálculo automático de páginas leídas y alternancia inteligente entre estados `READING` y `COMPLETED`.
* 🎨 **Tema Dinámico Claro/Oscuro:** Conmutador Sol/Luna con micro-animaciones fluidas y preservación de preferencias de usuario.
* ♿ **Accesibilidad de Primer Nivel (WCAG 2.1 AA):** Navegación completa por teclado (`Escape` para cerrar diálogos, autofoco programático) y bloqueo de scroll de fondo.
* 📱 **Adaptabilidad Extrema:** Layout fluido blindado contra colapsos visuales desde pantallas ultra-pequeñas ($< 350\text{px}$) hasta monitores ultra-panorámicos.

## 🏛️ Arquitectura Técnica

```text
src/app/
├── core/                             # Núcleo transversal y UI Shell
│   ├── components/
│   │   ├── sidebar/                  # Barra lateral desktop colapsable (68px / 240px)
│   │   ├── header/                   # Cabecera mínima para móvil (<768px)
│   │   └── bottom-nav/               # Barra táctil inferior fija móvil
│   ├── services/
│   │   ├── theme.service.ts          # Gestión reactiva del tema (dark / light)
│   │   └── ui-state.service.ts       # Estado persistente de UI (sidebar)
│   └── utils/
│       └── date-formatter.ts         # Formateador universal de fechas (es-ES)
│
└── features/                         # Módulos desacoplados por dominio
    ├── dashboard/                    # Vista de inicio y resumen de lectura (/)
    ├── books/                        # Dominio consolidado de libros y modales (/books)
    ├── analytics/                    # Analítica avanzada y estadísticas (/stats)
    ├── settings/                     # Ajustes y copias de seguridad (/settings)
    └── about/                        # Manifiesto y créditos de autoría (/about)
```

## 🛠️ Instalación y Desarrollo Local

### Prerrequisitos
* **Node.js**: >= 18.19.0
* **npm**: >= 10.0.0
* **Angular CLI**: `npm install -g @angular/cli`

### Pasos de Configuración

1. Clonar el repositorio:
   ```bash
   git clone [https://github.com/aitorgallegocr21/bookstack.git](https://github.com/aitorgallegocr21/bookstack.git)
   cd bookstack
2. Instalar las dependencias del proyecto:
   ```bash
   npm install
3. Iniciar el servidor de desarrollo local:
    ```bash
    npm start
- Abre tu navegador en http://localhost:4200/.

4. Compilar para producción (validación estricta de tipado y optimización):
    ```bash
    npm run build

## Autor
Desarrollado y diseñado por Aitor Gallego-Casilda Romero.
- Github: https://www.google.com/search?q=https://github.com/aitorgallegocr21
- Repositorio: https://www.google.com/search?q=https://github.com/aitorgallegocr21/bookstack

## Licencia
Distribuido bajo la Licencia MIT. Código abierto para uso personal, modificación y distribución manteniendo la atribución original del autor.