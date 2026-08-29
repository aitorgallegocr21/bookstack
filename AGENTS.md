# Directrices Globales de Desarrollo y Agentes IA

Este repositorio utiliza una arquitectura multi-agente modular y desarrollo guiado por especificaciones.

---

## 1. Identidad y Principios Inviolables
- **Calidad de Código:** Escribe código TypeScript/Angular funcional, tipado de forma estricta, mantenible, accesible y performante.
- **Prohibiciones Absolutas:**
  - PROHIBIDO el uso de `any` (usa tipos explícitos, genéricos o `unknown`).
  - PROHIBIDO modificar archivos fuera del alcance definido en la tarea activa (`TASK`).
  - PROHIBIDO dejar código simulado o comentarios tipo `// TODO`. Implementaciones completas y funcionales.
  - PROHIBIDO instalar dependencias (`npm i`) sin aprobación explícita.
- **Acceso a Contexto Just-In-Time (JIT):**
  - Consulta `CONTEXT.md` para el mapa técnico y arquitectónico.
  - Lee únicamente los archivos fuente relevantes para la tarea asignada.

---

## 2. Convenciones de Desarrollo (Angular v18+)

### Componentes y Vistas
- **Standalone:** Todos los componentes, directivas y pipes son Standalone por defecto.
- **Control Flow:** Uso obligatorio de `@if`, `@for (track item.id)` y `@switch`. Prohibido el uso de `*ngIf`, `*ngFor`.
- **Signal Inputs/Outputs:** Usa `input()`, `output()` y `model()` en lugar de los decoradores `@Input()`, `@Output()`.
- **Host Bindings:** Usa el objeto `host: { ... }` del decorador `@Component` / `@Directive`. Prohibido `@HostBinding` y `@HostListener`.
- **Imágenes:** Usa `NgOptimizedImage` para imágenes estáticas (no aplica a base64).
- **Estilos:** Tailwind CSS. Prohibido `ngClass` o `ngStyle`; usa bindings nativos `[class]` y `[style]`.

### Reactividad y Estado
- **Signals:** Estado local gestionado con `signal()`, derivadas con `computed()` y efectos con `effect()`.
- **Inmutabilidad:** Actualiza signals usando `.set()` o `.update()`. Prohibido mutar estado directamente.
- **Servicios:** Registro mediante `@Injectable({ providedIn: 'root' })` e inyección de dependencias con `inject()`.

### Accesibilidad (a11y)
- Cumplimiento estricto de **WCAG AA** y validación con reglas AXE.
- HTML semántico obligatorio (`<main>`, `<section>`, `<article>`, `<button>`, `<header>`).

---

## 3. Orquestación Multi-Agente (.agent/)

Activa el rol correspondiente según la fase del trabajo:

| Rol | Archivo de Instrucciones | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Arquitecto** | `.agent/01_architect.md` | Diseño técnico, redacción de `SPEC.md` y desglose de `TASK.md`. |
| **Frontend** | `.agent/02_frontend.md` | Implementación de componentes, templates Tailwind y servicios en Angular. |
| **Reviewer** | `.agent/03_reviewer.md` | Auditoría de código, verificación de estándares y cobertura de tests. |
| **Git / GitHub** | `.agent/04_git_github.md` | Control de versiones, Conventional Commits y preparación de PRs. |

---

## 4. Ciclo de Trabajo Obligatorio

1. **Requisitos (SPEC):** Define el alcance, entradas, salidas y criterios de aceptación en `docs/feature-*/SPEC/SPEC-XXX.md`.
2. **Planificación (TASK):** Desglosa la SPEC en tareas atómicas y secuenciales en un plan de trabajo.
3. **Ejecución (Coding):** El agente de Frontend implementa una única tarea atómica a la vez.
4. **Verificación:** Ejecuta linters y tests antes de finalizar la tarea.
5. **Commit:** Aplica Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`).
