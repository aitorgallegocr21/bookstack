# Task 3.1: Branching Setup, Dependency Upgrades & Quality Tooling

**Status:** Completed  
**Phase:** `phase-03-workflow-tooling-and-docs`

## Objective

Initialize the `develop` branch from the finished `feature/02-app-shell` baseline, upgrade all npm dependencies to their latest stable compatible versions, migrate Tailwind CSS from v3 to v4, and configure deterministic linting, formatting, and verification scripts.

## Checklist

- [x] Create and push `develop` tracking `origin/develop` from `origin/feature/02-app-shell`.
- [x] Branch `refactor/engineering-baseline` from `develop`.
- [x] Upgrade Angular (`22.2.6`), `@lucide/angular` (`1.72.0`), `rxjs` (`~7.8.2`), `tslib` (`^2.9.1`), `tailwindcss` + `@tailwindcss/postcss` (`^4.3.5`), `vitest` (`^5.1.0`), `jsdom` (`^31.0.0`), `prettier` (`^3.10.1`), `postcss` (`^8.5.32`), `typescript` (`~6.0.3`).
- [x] Install `zod`, `eslint`, `typescript-eslint`, `angular-eslint`, `prettier-plugin-tailwindcss`, `@playwright/test`, and `fake-indexeddb`.
- [x] Replace `postcss.config.js` + `tailwind.config.js` with `.postcssrc.json` and update `src/styles.css` for Tailwind CSS v4 (`@import 'tailwindcss';` + `@custom-variant dark`).
- [x] Configure `eslint.config.mjs`, `.prettierrc.mjs`, `.prettierignore`, and `package.json` scripts (`check`, `lint`, `format`, `test`, `test:e2e`, `verify:fast`, `verify`).
- [x] Confirm `npx tsc --noEmit` and `npx ng build` succeed with 0 errors.
