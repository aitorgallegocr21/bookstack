## 📋 Summary of Changes

<!-- Brief 1-3 line description of what this PR introduces, fixes, or improves. -->

- **Related Phase / Task:** `docs/tasks/...` <!-- e.g., Phase 03, Task 3.4 -->
- **Type of Change:**
  - [ ] 🚀 `feat`: New feature or user-facing capability
  - [ ] 🐛 `fix`: Bug fix, layout correction, or regression fix
  - [ ] 💄 `style`: Visual styling, Tailwind token, or UI polish
  - [ ] ♻️ `refactor`: Code restructuring without functional changes
  - [ ] 📝 `docs`: Documentation, task specs, or backlog synchronization
  - [ ] 🧪 `test`: Unit, component, or end-to-end tests
  - [ ] 🔧 `chore`: Tooling, dependencies, CI/CD, or configuration

---

## 🔍 Key Architectural Changes

<!-- Bullet points summarizing modifications to components, services, schemas, routes, or styles. -->

-
-

---

## ✅ Quality Gate & Inviolable Rules Checklist

Before requesting review or merging into `main`, verify all checks:

- [ ] **Branch Target:** Changes were integrated and tested in `develop` before opening this PR to `main`.
- [ ] **Angular & Strict Typing:** Standalone + `OnPush`, Signal state (`signal`/`computed`/`input`/`output`/`viewChild`), `inject()`, native Control Flow (`@if`/`@for`), zero `any`, zero `// TODO`.
- [ ] **Quality Verification Gate:** `npm run verify` passed with 0 errors (`check` + `lint` + `format` + `test` + `build`).
- [ ] **Tests & Regressions:** Unit/component tests cover new features and regression tests cover every fixed bug.
- [ ] **E2E Testing:** Playwright browser tests passed (`npm run test:e2e`).
- [ ] **Mobile-First & WCAG 2.1 AA:** Verified across `375px`, `390px`, `768px`, and `1280px` with touch targets $\ge 44\times44\text{px}$ and zero horizontal overflow.
- [ ] **English Engineering & Docs Sync:** All code comments, docs, and `docs/TASKS.md` / `CONTEXT.md` / `README*.md` are synchronized in English.

---

## 📸 Visual Previews / Screenshots (Optional)

<!-- Attach before/after screenshots or recordings if visual or layout changes were made. -->
