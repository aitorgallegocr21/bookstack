# Task 15.6: Playwright E2E Verification & Tier 2 Per-Phase Documentation Sync

**Phase:** Phase 15: Multi-Source Metadata Engine (5 Providers), Integral Auto-Enrichment & Offline `.ZIP` Bundles  
**Status:** Pending  
**Estimated Impact:** Medium (End-to-End Playwright verification for 5-source balanced search, flexible AI JSON import with automatic integral metadata enrichment, and `.ZIP` offline bundle export/import, followed by Tier 2 documentation and branch hygiene sync).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `tests/e2e/isbn-lookup-flow.spec.ts` (`L1-190`): Public metadata lookup E2E scenarios.
- `tests/e2e/settings-flow.spec.ts` (`L1-260`): Data portability & cover enrichment E2E scenarios.
- `docs/TASKS.md` (`L1-43`)
- `docs/tasks/phase-15-multi-source-metadata-and-offline-bundles/index.md` (`L1-95`)
- `CONTEXT.md` (`L1-126`)
- `README.md` (`L14-30`) & `README.es.md` (`L14-30`)

**Files to Create / Update:**

- `tests/e2e/isbn-lookup-flow.spec.ts`
- `tests/e2e/settings-flow.spec.ts`
- `docs/TASKS.md`
- `docs/tasks/phase-15-multi-source-metadata-and-offline-bundles/index.md`
- `CONTEXT.md`
- `README.md`
- `README.es.md`

---

## 2. Technical Objectives

1. **Playwright E2E Multi-Source Lookup Verification (`tests/e2e/isbn-lookup-flow.spec.ts`):**
   - Mock the 5 provider endpoints via `page.route()` (Open Library, Google Books, Wikidata, Apple Books ES, Internet Archive/Crossref) and verify that searching by Title + Author in `BookCreateModalComponent` displays the fused (`merged`) candidate plus balanced candidates from Google Books, Open Library, and Apple Books/Wikidata, and populates `totalPages`, `publicationYear`, `publisher`, `isbn`, and `coverUrl` on selection.
2. **Playwright E2E Flexible AI JSON Import, Auto-Enrichment & `.ZIP` Portability (`tests/e2e/settings-flow.spec.ts`):**
   - **Scenario A (Flexible AI JSON Import + Auto-Enrichment):** Upload a JSON array of books missing `id`, `totalPages` (`0`/omitted), `publicationYear`, and `coverUrl`. Verify that 0 books are discarded in the preview, `import-auto-enrich-checkbox` is checked by default, and confirming the import automatically enriches the missing cover, `totalPages`, `publicationYear`, and `publisher` via the ISBN $\to$ Title+Author cascade.
   - **Scenario B (Offline `.ZIP` Bundle Export & Round-Trip Restore):** Trigger `export-zip-btn` and `export-json-light-btn`, verify downloads, and test importing a `.zip` bundle containing `backup.json` + `covers/` images to confirm 100% offline cover & metadata restoration.
3. **Tier 2 Per-Phase Documentation Sync & Branch Hygiene (`AGENTS.md` Rules 3 & 5):**
   - Mark all tasks `[x]` and set `Status: Completed` in `docs/tasks/phase-15-multi-source-metadata-and-offline-bundles/index.md`.
   - Move **Phase 15** to `Completed Phases` in `docs/TASKS.md`.
   - Update `CONTEXT.md` (Section 2 ADRs and Section 3 Semantic Source Map including `zip-archive.utils.ts`), `README.md`, and `README.es.md`.
   - Run `npm run verify:quiet` and `npm run test:e2e`.
   - Merge/integrate into `develop`, push to `origin/develop`, and execute Autonomous Completed-Branch Cleanup (`git fetch --all --prune` and delete auxiliary branch locally and on `origin`).

---

## 3. Verification Gate

- [ ] `npm run verify:quiet`
- [ ] `npm run test:e2e`
