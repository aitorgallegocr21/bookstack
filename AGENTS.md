You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

# BOOKSTACK - MULTI-AGENT INSTRUCTIONS

Este repositorio utiliza un sistema de agentes especializados definido en la carpeta `.agent/`.
Cualquier asistente de IA debe consultar `CONTEXT.md` para el estado del proyecto y aplicar el rol correspondiente según la tarea:

1. **Arquitectura y Documentación:** `.agent/01_architect.md`
2. **Desarrollo Frontend (Angular/Tailwind):** `.agent/02_frontend.md`
3. **Revisión de Código y QA:** `.agent/03_reviewer.md`
4. **Estrategia Git y GitHub:** `.agent/04_git_github.md`

> **Instrucción general para la IA:** Lee siempre `CONTEXT.md` antes de proponer cambios o generar código.
> **Instrucción de continuidad de la feature:** Lee también `docs/*feature*` para identificar el estado operativo actual de la feature y para actualizarlo con cada cambio relevante que se aplique al proyecto.
> **Regla de documentación:** Si el agente toca arquitectura, modelos de dominio, routing, servicios o UI de la feature, debe reflejar el estado actualizado en el plan de la feature y en el documento principal de contexto cuando se altere la especificación base.
