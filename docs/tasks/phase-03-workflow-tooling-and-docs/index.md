# Phase 03: Agent Operating System, English Docs, Tooling & Branching Baseline

**Status:** Completed  
**Target Branch:** `refactor/engineering-baseline` $\to$ `develop`  
**Core Mission:** Establish a professional, deterministic engineering baseline modeled after `personal-website`: dual-branch workflow (`main` / `develop`), fully upgraded stable dependencies (Angular 22.2.6, Tailwind CSS v4, Vitest 5.1, ESLint + `angular-eslint`, Prettier, Zod, Playwright), English-first `AGENTS.md` + `.agents/skills/`, unified `docs/TASKS.md` backlog, and automated GitHub PR/Issue templates and CI/CD pipelines.

---

## 1. Context & Architectural Principles

1. **Dual-Branch Workflow (`main` & `develop`):**
   - `develop` acts as the continuous integration branch where feature/refactor branches merge locally after verification.
   - `main` receives consolidated Pull Requests on GitHub, triggering CI quality gates and GitHub Pages deployment only when releasing validated milestones.
2. **English-First Engineering & Continuous Docs Sync:**
   - All technical documentation (`AGENTS.md`, `CONTEXT.md`, `docs/`, skills, commits, PRs) is strictly in English, with `README.md` (English) and `README.es.md` (Spanish) synchronized.
   - Every task updates its documentation in the same iteration.
3. **Deterministic Quality Gate (`npm run verify`):**
   - Combines `check` (`tsc --noEmit`), `lint` (`eslint` + `angular-eslint`), `format` (`prettier` + Tailwind sorting), `test` (Vitest), and `build` (Angular production bundle).

---

## 2. Task Breakdown

- [x] **[Task 3.1: Branching Setup, Dependency Upgrades & Quality Tooling](task-3.1-branching-deps-and-quality-tooling.md)** — Initialize `develop`, upgrade all npm packages to latest stable versions, migrate Tailwind CSS v3 $\to$ v4, configure ESLint + Prettier + `package.json` verification scripts.
- [x] **[Task 3.2: Agent Operating System, Skills & Design System](task-3.2-agents-skills-and-design-system.md)** — Write English `AGENTS.md`, create `.agents/skills/` (`bookstack-architecture-workflow`, `responsive-mobile-design`, `angular-testing-qa`), update `CONTEXT.md`, and author `docs/DESIGN_SYSTEM.md`.
- [x] **[Task 3.3: Unified Backlog, Phase Migration & Bilingual READMEs](task-3.3-english-backlog-and-bilingual-readmes.md)** — Migrate Phase 01 & 02 docs to `docs/tasks/`, create `docs/TASKS.md`, document Phases 03–05, and update `README.md` + `README.es.md`.
- [x] **[Task 3.4: GitHub Templates, CI Quality Gate & SPA Deploy](task-3.4-github-templates-and-ci-cd.md)** — Add `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/`, `.github/workflows/ci.yml` (PR gate to `main`), and `.github/workflows/deploy.yml` (build & GitHub Pages SPA deploy on merge/push to `main`).
