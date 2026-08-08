# 📚 BookStack

> Aplicación web moderna, minimalista y Local-First para el seguimiento de lectura, métricas avanzadas y gestión de biblioteca personal.

![Angular](https://img.shields.io/badge/Angular-18%2B-DD0031?style=flat-square&logo=angular)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Características Principales

- 📖 **Gestión de Biblioteca:** Registra y organiza tus libros por estado (*Pendiente*, *Leyendo*, *Completado*, *Abandonado*).
- ⚡ **Búsqueda & Escáner ISBN:** Autocompletado de portadas y datos mediante la cámara del dispositivo o APIs públicas (Open Library / Google Books).
- 📊 **Estadísticas Visuales:** Gráficos de velocidad de lectura, consumo de páginas por mes y hábitos de lectura.
- 📱 **Soporte para Ebooks & Sagas:** Registro opcional de conteo de palabras/caracteres y organización por orden cronológico en sagas.
- 🔒 **Privacidad Total (Local-First):** Tus datos nunca salen de tu navegador. Persistencia local con IndexedDB.

---

## 🛠️ Stack Tecnológico

- **Frontend:** Angular v18+ (Standalone Components, Signals)
- **Estilos:** Tailwind CSS v3
- **Iconos:** `@lucide/angular`
- **Escáner:** `html5-qrcode`
- **Base de Datos Local:** IndexedDB

---

## 🚀 Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone [https://github.com/TU_USUARIO/bookstack.git](https://github.com/TU_USUARIO/bookstack.git)

# 2. Entrar al directorio
cd bookstack

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor de desarrollo
ng serve
