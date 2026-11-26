# Task 18.4: Playwright E2E Verification, Bundle Audit & Tier 2 Docs Sync (`v2.4.0`)

- **Phase:** [Phase 18: Modern Native ISBN Scanner Engine](index.md)
- **Status:** Completed (`2026-11`)
- **Estimated Scope:** Playwright E2E suite update, bundle/asset audit, semantic version bump (`2.4.0`), Tier 2 documentation sync & branch hygiene.

---

## 1. Objective

Verify the modernized native ISBN scanner end-to-end across desktop and mobile viewports (`320px`, `375px`, `1280px`), confirm zero `html5-qrcode` bundle footprint and local `assets/wasm/zxing_reader.wasm` production output, bump BookStack to `v2.4.0`, and perform the full Tier 2 Per-Phase Documentation Sync.

---

## 2. Implementation Specification

1. **Playwright E2E Updates (`tests/e2e/isbn-lookup-flow.spec.ts`):**
   - Verify zero `getUserMedia()` calls occur before tapping **"Escanear código"**.
   - Verify tapping **"Escanear código"** mounts the native `<video>` scanner viewport, displays the inline local-only privacy notice, and handles mocked `getUserMedia()` + `BarcodeDetector` (or photo upload fallback) cleanly.
   - Verify zero horizontal overflow (`scrollWidth <= clientWidth`) at `320px` and `375px` mobile viewports with the scanner open (including controls bar with flip + torch + upload buttons).
2. **Production Build & Local WASM Asset Audit:**
   - Run `npm run verify:quiet` and confirm `dist/bookstack/browser/assets/wasm/zxing_reader.wasm` exists in the production build output.
   - Confirm `html5-qrcode` is absent from all build chunks.
   - Run `npm run test:e2e`.
3. **Real-Device Smoke Check (Optional with User via `adb reverse`):**
   - Confirm sub-second repeat camera startup (`<500 ms`) on the user's Android device with primary rear lens (`camera 0`) and torch toggle.
4. **Tier 2 Per-Phase Documentation Sync & Version Bump:**
   - Bump semantic version in `package.json` and `package-lock.json` (`2.3.3` $\to$ `2.4.0`) using `npm version minor --no-git-tag-version`.
   - Mark `docs/tasks/phase-18-native-isbn-scanner-engine/index.md` and all 4 task specs as `Completed` (`[x]`).
   - Move Phase 18 to **Completed Phases** in `docs/TASKS.md` and update `docs/ROADMAP.md` Phase 18 status to `Completed`.
   - Update `CONTEXT.md`, `README.md`, and `README.es.md` with the new `CameraStreamService` + `BarcodeDecoderService` architecture and `v2.4.0` release notes.
   - Integrate branch into `develop` (`origin/develop`) and run Autonomous Branch Hygiene cleanup (`AGENTS.md` Rule 5).

---

## 3. Target Files

- **Edit:** `tests/e2e/isbn-lookup-flow.spec.ts`
- **Edit:** `package.json`, `package-lock.json` (`2.3.3` $\to$ `2.4.0`)
- **Edit:** `docs/tasks/phase-18-native-isbn-scanner-engine/index.md`, `docs/TASKS.md`, `docs/ROADMAP.md`, `CONTEXT.md`, `README.md`, `README.es.md`

---

## 4. Verification & Acceptance Criteria

- [x] `npm run verify:quiet` passes all 5 gates (`check`, `lint`, `format`, `test`, `build`).
- [x] `npm run test:e2e` passes across all desktop & mobile scenarios with zero horizontal overflow at `320px`/`375px`.
- [x] `dist/bookstack/browser/assets/wasm/zxing_reader.wasm` is emitted locally and `html5-qrcode` is completely gone.
- [x] Version bumped to `2.4.0` and all Tier 2 docs synced in English (plus `README.es.md`).
