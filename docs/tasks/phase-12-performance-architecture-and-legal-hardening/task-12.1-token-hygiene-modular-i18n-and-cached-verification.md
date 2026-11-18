# Task 12.1: Token Hygiene, Modular i18n Split & Fast Cached Verification Gate

**Phase:** Phase 12: Performance, Caching, Architecture & Legal Hardening  
**Status:** Completed  
**Estimated Impact:** High (Splits 1,901-line monolithic i18n files into domain slices, adds caching to `verify-quiet.mjs`, adds E2E type-checking and `test:e2e:quiet`, and updates `CONTEXT.md` / `AGENTS.md`).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/app/core/i18n/i18n.types.ts` (`L1-619`): Full `I18nDictionary` interface (`nav` L4-22, `status` L23-28, `dashboard` L29-90, `books` L91-108, `catalog` L109-152, `bookForm` L153-263, `bookDetail` L264-292, `readingLog` L293-302, `stats` L303-390, `settings` L391-496, `about` L497-538, `series` L539-612, `common` L613-618).
- `src/app/core/i18n/es.ts` (`L1-644`): Full `ES_DICTIONARY` object (`nav` L4-22, `status` L23-28, `dashboard` L29-92, `books` L93-111, `catalog` L112-156, `bookForm` L157-268, `bookDetail` L269-297, `readingLog` L298-307, `stats` L308-398, `settings` L399-519, `about` L520-562, `series` L563-637, `common` L638-643).
- `src/app/core/i18n/en.ts` (`L1-638`): Full `EN_DICTIONARY` object (`nav` L4-22, `status` L23-28, `dashboard` L29-92, `books` L93-111, `catalog` L112-155, `bookForm` L156-267, `bookDetail` L268-296, `readingLog` L297-306, `stats` L307-395, `settings` L396-514, `about` L515-556, `series` L557-631, `common` L632-637).
- `src/app/core/i18n/i18n.service.ts` (`L1-49`): `I18nService` consuming `ES_DICTIONARY`, `EN_DICTIONARY`, and `I18nDictionary`.
- `scripts/verify-quiet.mjs` (`L1-59`): Auto-fix and verification gate runner.
- `package.json` (`L1-25`): `scripts` section (`check`, `lint`, `format`, `test:e2e`, `verify:quiet`).
- `playwright.config.ts` (`L1-44`): Playwright reporter configuration (`L23`).
- `eslint.config.mjs` (`L1-45`): ESLint rules (`no-console` at `L21`).
- `.gitignore` (`L1-45`): Ignored build/cache directories.
- `AGENTS.md` (`L1-85`) & `CONTEXT.md` (`L1-127`): Agent rules and semantic source map.

**Files to Create / Update:**

- `src/app/core/i18n/domains/shell.i18n.ts` (`nav`, `status`, `common` types + `es`/`en` slices)
- `src/app/core/i18n/domains/dashboard.i18n.ts` (`dashboard` types + `es`/`en` slices)
- `src/app/core/i18n/domains/books.i18n.ts` (`books`, `catalog`, `bookForm`, `bookDetail`, `readingLog` types + `es`/`en` slices)
- `src/app/core/i18n/domains/analytics.i18n.ts` (`stats` types + `es`/`en` slices)
- `src/app/core/i18n/domains/series.i18n.ts` (`series` types + `es`/`en` slices)
- `src/app/core/i18n/domains/settings.i18n.ts` (`settings` types + `es`/`en` slices)
- `src/app/core/i18n/domains/about.i18n.ts` (`about` types + `es`/`en` slices)
- `src/app/core/i18n/i18n.types.ts` (Composes `I18nDictionary` from domain interfaces; <40 lines)
- `src/app/core/i18n/es.ts` (Composes `ES_DICTIONARY` from domain `ES_*` slices; <40 lines)
- `src/app/core/i18n/en.ts` (Composes `EN_DICTIONARY` from domain `EN_*` slices; <40 lines)
- `scripts/verify-quiet.mjs`
- `package.json`
- `playwright.config.ts`
- `eslint.config.mjs`
- `.gitignore`
- `AGENTS.md`
- `CONTEXT.md`

---

## 2. Technical Objectives

1. **Modular Domain i18n Architecture (`src/app/core/i18n/domains/*.i18n.ts`):**
   - Extract each domain's TypeScript interface and `es` / `en` dictionary slices into dedicated domain files under `src/app/core/i18n/domains/`.
   - Keep `src/app/core/i18n/i18n.types.ts`, `es.ts`, and `en.ts` as lightweight barrel aggregators (~30 lines each) exporting the exact same `SupportedLocale`, `I18nDictionary`, `ES_DICTIONARY`, and `EN_DICTIONARY` symbols so zero components or specs break.
   - Future tasks modifying a single feature's translations only need to read a single 50–150 line domain file instead of 1,901 lines across 3 files.
2. **Cached & Faster Verification Gate (`scripts/verify-quiet.mjs`, `package.json`, `eslint.config.mjs`, `.gitignore`):**
   - Add `.cache/` and `.eslintcache` to `.gitignore`.
   - In `scripts/verify-quiet.mjs`:
     - Use `--cache --cache-location .cache/prettier` on Prettier and `--cache --cache-location .cache/eslint` on ESLint.
     - Eliminate the duplicate second scan: run cached `prettier --write .` and `eslint . --fix --max-warnings=0` once as part of the verification step itself instead of running a separate full-repo pass before `steps`.
   - In `eslint.config.mjs` (`L21`), promote `'no-console'` from `'warn'` to `['error', { allow: ['warn', 'error'] }]` so stray `console.log` statements fail `--quiet` builds deterministically.
   - In `playwright.config.ts` (`L23`), use `process.env['PW_QUIET'] ? [['dot']] : [['html', { open: 'never' }], ['list']]` and add `"test:e2e:quiet": "PW_QUIET=1 playwright test"` to `package.json`.
3. **Deduplicate `AGENTS.md` & `CONTEXT.md` and Sync Line Pointers:**
   - Remove duplicated Branch Hygiene and Model Routing tables from `CONTEXT.md` (referencing `AGENTS.md` Sections 2 & 3 in 2 concise lines).
   - Update `CONTEXT.md` Section 3 with accurate line counts for all services and the new `src/app/core/i18n/domains/` files.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/core/i18n/i18n.service.spec.ts`
- [x] `npm run verify:quiet`
