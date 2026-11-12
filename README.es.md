# BookStack

> 🌐 **Idioma:** [English](README.md) | Español

Aplicación web moderna, minimalista y **Local-First** para el seguimiento de lectura personal, registro de sesiones, analítica de hábitos y gestión de biblioteca privada.

![Angular](https://img.shields.io/badge/Angular-22%2B-DD0031?style=flat-square&logo=angular)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-38B2AC?style=flat-square&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## Características Principales

- **Panel Principal Interactivo (Dashboard):** Tarjeta destacada de "Leyendo ahora" con actualizador rápido de página en línea, selector de lecturas paralelas activas, estados vacíos inteligentes (bienvenida inicial vs. seleccionar de pendientes), racha diaria de lectura con llama animada e indicadores semanales, metas anuales combinadas (libros y páginas) con editor modal, y feed de actividad reciente.
- **Gestión de Biblioteca:** Organiza tus libros por estado (_Por leer_, _Leyendo_, _Completado_, _Abandonado_) con vista previa de portadas, valoraciones y formatos.
- **Registro de Sesiones y Progreso Bidireccional:** Registra sesiones con páginas leídas y tiempo invertido; BookStack recalcula automáticamente `currentPage`, el porcentaje de avance y las transiciones de estado.
- **Analítica de Lectura:** Métricas reactivas de velocidad de lectura (`pp/h`), distribución por estado y actividad mensual.
- **Optimización de Portadas en Cliente:** Pipeline HTML5 Canvas que comprime las portadas subidas ($\le 400\text{px}$, WebP/JPEG) antes de guardarlas localmente.
- **Shell Responsiva Asimétrica:** Barra lateral colapsable (`68px` / `240px`) en escritorio y tablet ($\ge 768\text{px}$) y cabecera compacta con barra inferior táctil en móvil ($< 768\text{px}$), con persistencia de tema claro/oscuro.
- **Privacidad Total Local-First:** Tus datos nunca salen de tu navegador gracias a `IndexedDB` (con respaldo seguro en `LocalStorage` y validación Zod). Sin backend obligatorio.
- **Internacionalización (`es` / `en`):** Interfaz en español (`es`) por defecto con diccionarios completos reactivos en español e inglés intercambiables en tiempo real desde `/settings`.

---

## Stack Tecnológico

- **Frontend:** Angular 22+ (Standalone Components, Signals, Control Flow `@if`/`@for`, `OnPush`, Lazy Routes)
- **Estilos:** Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Iconos:** `@lucide/angular`
- **Validación:** `zod`
- **Base de Datos Local:** `IndexedDB` del navegador + fallback en `LocalStorage`
- **Testing y Calidad:** Vitest 5, Playwright E2E, ESLint + `angular-eslint`, Prettier

---

## Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/aitorgallegocr21/bookstack.git
cd bookstack

# 2. Cambiar a la rama de desarrollo activo
git checkout develop

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
```

---

## Comandos de Calidad y Verificación

| Comando               | Descripción                                                                 |
| :-------------------- | :-------------------------------------------------------------------------- |
| `npm run verify`      | Puerta de calidad completa (`check` + `lint` + `format` + `test` + `build`) |
| `npm run verify:fast` | Validación rápida (`check` + `lint` + `format` + `test`)                    |
| `npm run check`       | Comprobación estricta de tipos TypeScript (`app` y `spec`)                  |
| `npm run lint`        | ESLint + `angular-eslint` + reglas de accesibilidad en plantillas           |
| `npm run format`      | Verificación de Prettier y ordenamiento de clases Tailwind v4               |
| `npm test`            | Ejecutar suite unitaria y de componentes con Vitest                         |
| `npm run test:e2e`    | Ejecutar pruebas End-to-End en navegador con Playwright                     |
| `npm run build`       | Compilación de producción en `dist/bookstack/browser`                       |

---

## Flujo de Ramas y Documentación

- **`main`:** Rama de producción desplegada automáticamente en GitHub Pages. Se actualiza exclusivamente mediante Pull Requests verificados en GitHub desde `develop`.
- **`develop`:** Rama principal de integración para el desarrollo diario de funcionalidades, correcciones y refactorizaciones.
- **Documentación Técnica (en inglés):** Consulta [`AGENTS.md`](AGENTS.md), [`CONTEXT.md`](CONTEXT.md), [`docs/TASKS.md`](docs/TASKS.md) y [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

---

## Licencia

Distribuido bajo la licencia [MIT](LICENSE).
