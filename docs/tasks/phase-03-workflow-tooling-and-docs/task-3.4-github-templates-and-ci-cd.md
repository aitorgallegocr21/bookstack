# Task 3.4: GitHub Templates, CI Quality Gate & SPA Deploy

**Status:** Completed  
**Phase:** `phase-03-workflow-tooling-and-docs`

## Objective

Standardize GitHub collaboration templates and configure CI/CD workflows that run exclusively on `main` (and PRs targeting `main`) so daily work on `develop` avoids unnecessary CI runs.

## Checklist

- [x] Create `.github/pull_request_template.md` with Quality Gate checklist (strict TS, Signals/`OnPush`, unit + E2E tests, WCAG AA, mobile overflow check, docs sync).
- [x] Create `.github/ISSUE_TEMPLATE/config.yml`, `bug_report.md`, and `feature_request.md`.
- [x] Create `.github/workflows/ci.yml` triggered on `push`/`pull_request` to `main`, executing `lint`, `format`, `check`, `test`, `build`, and `test:e2e`.
- [x] Update `.github/workflows/deploy.yml` to run quality checks before building and create `404.html` fallback from `index.html` in `./dist/bookstack/browser` for GitHub Pages SPA deep links.
