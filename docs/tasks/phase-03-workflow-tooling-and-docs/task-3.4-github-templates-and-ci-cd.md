# Task 3.4: GitHub Templates, CI Quality Gate & SPA Deploy

**Status:** Completed  
**Phase:** `phase-03-workflow-tooling-and-docs`

## Objective

Standardize GitHub collaboration templates and configure CI/CD workflows so full verification runs exclusively before merging a PR into `main`, while production builds deploy directly on push/merge to `main` without redundant test runs.

## Checklist

- [x] Create `.github/pull_request_template.md` with Quality Gate checklist (strict TS, Signals/`OnPush`, unit + E2E tests, WCAG AA, mobile overflow check, docs sync).
- [x] Create `.github/ISSUE_TEMPLATE/config.yml`, `bug_report.md`, and `feature_request.md`.
- [x] Create `.github/workflows/ci.yml` triggered on `pull_request` to `main`, executing `lint`, `format`, `check`, `test`, `build`, and `test:e2e`.
- [x] Update `.github/workflows/deploy.yml` triggered on `push` to `main` (`workflow_dispatch` optional) to build production assets and create `404.html` fallback from `index.html` in `./dist/bookstack/browser` for GitHub Pages SPA deep links.
