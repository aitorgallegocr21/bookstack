# Phase 18: Modern Native ISBN Scanner Engine (`getUserMedia` + `BarcodeDetector` & Local ZXing-WASM)

- **Status:** Active / Ready for Implementation
- **Target Release:** `v2.4.0` (Minor Feature & Architecture Modernization)
- **Target Branch:** `feat/phase-18-native-isbn-scanner-engine` $\to$ `develop`
- **Core Mission:** Replace the unmaintained, heavyweight `html5-qrcode@2.3.8` wrapper (~350 KB+ chunk) with a fast, 100% Local-First, offline-capable native scanning engine built on `navigator.mediaDevices.getUserMedia()`, browser-native hardware-accelerated `BarcodeDetector`, and a lazy-loaded local `barcode-detector` (ZXing-C++ WASM) ponyfill for Safari/Firefox—delivering `<500 ms` repeat camera startup, multi-lens Android Camera2 resilience, progressive autofocus, and optional flashlight (torch) control.

---

## 1. Background & Real-Device Root-Cause Analysis

Real-device testing on a multi-lens Android flagship (POCO F4 GT / `21121210G`, Brave Android / Chromium) after Phase 17D uncovered fundamental limitations in `html5-qrcode`:

1. **Multi-Sensor Android Camera2 Traps:**
   - The device exposes 7 `videoinput` devices (`camera 0, facing back` through `camera 6, facing front`), of which 3 auxiliary sensors (`camera 4`, `camera 5`, `camera 6`) permanently hang `getUserMedia()` until timeout, and generic `{ facingMode: 'environment' }` requests also hang indefinitely.
   - By contrast, opening the primary rear sensor directly by `deviceId` (`camera 0, facing back`) succeeds in **~408 ms** and the primary front sensor (`camera 1, facing front`) succeeds in **~333 ms**.
2. **`html5-qrcode` Architectural Bottlenecks:**
   - Unmaintained since 2023; bundles ~350 KB+ of legacy JS + DOM/canvas wrapper code.
   - Cannot reuse or inspect a live `MediaStream` independently of its internal state machine (`Cannot transition to a new state, already under transition` on timeout recovery).
   - Forces full teardown/remount to switch cameras, apply constraints, or verify live frames (`video.videoWidth > 0`).
   - Adds 3.5 s–10.5 s startup latency whenever an initial HD constraint or unlabeled first-visit fallback ladder stalls on a broken HAL sensor.

---

## 2. Architectural Summary & Resolved Decisions

1. **Zero-Dependency Native Camera Controller (`CameraStreamService`):**
   - Directly orchestrates `navigator.mediaDevices.getUserMedia()`, `<video playsinline muted autoplay>`, passive `enumerateDevices()`, and guaranteed `MediaStreamTrack.stop()` cleanup.
   - **Preferred Rear Camera Memory (`localStorage`):** Persists the last verified working rear `deviceId` (key: `bookstack.scanner.preferredRearDeviceId`, validated against current `enumerateDevices()`). On returning visits, opens `camera 0` directly in **~350–450 ms** with zero probe/timeout overhead.
   - **Primary-Sensor Index Ranking (`camera-selection.utils.ts`):** Preserves and consolidates Camera2 ascending numeric index sorting (`camera 0` rear, `camera 1` front ranked ahead of `camera 4/5/6`) and auxiliary lens filtering.
   - **Fast-First Startup + Progressive Track Enhancement:** Acquires the stream quickly without rigid HD constraints that can stall Android Camera2 HAL, verifies active video frames (`readyState >= HAVE_CURRENT_DATA` / `videoWidth > 0`), and then applies `focusMode: 'continuous'` and ideal HD resolution progressively via `track.applyConstraints()` inside a non-blocking `try/catch`.
   - **Flashlight (Torch) Control:** Inspects `track.getCapabilities().torch`; when supported on the active rear track, exposes a reactive `torchSupported` / `torchEnabled` signal pair and `toggleTorch()` method.

2. **Hybrid Native + Local WASM Barcode Decoder (`BarcodeDecoderService`):**
   - **Tier 1 (Zero-KB Hardware Native):** Uses `window.BarcodeDetector` when available and `BarcodeDetector.getSupportedFormats()` includes `ean_13` and `ean_8` (Chrome, Brave, Edge on Android/macOS/ChromeOS).
   - **Tier 2 (Lazy Local ZXing-C++ WASM Ponyfill):** On browsers without native `BarcodeDetector` (iOS Safari, Firefox, Linux Desktop Chromium), dynamically imports `barcode-detector/ponyfill` (`barcode-detector` v3.x backed by `zxing-wasm`) and configures `prepareZXingModule()` to load `zxing_reader.wasm` strictly from BookStack's own local asset path (`${document.baseURI}assets/wasm/zxing_reader.wasm`)—**never** from an external CDN.
   - **Offline PWA & CSP Compliance:**
     - `angular.json` copies `node_modules/zxing-wasm/dist/reader/zxing_reader.wasm` to `assets/wasm/zxing_reader.wasm`.
     - `ngsw-config.json` caches `/assets/**` lazily so the WASM binary works 100% offline once fetched.
     - `src/index.html` CSP `script-src` adds `'wasm-unsafe-eval'` to allow local WebAssembly compilation without relaxing script safety (`unsafe-eval` remains forbidden).
   - **Unified Live & Static Decoding:** Both live `<video>` frame decoding (`decodeFromVideoFrame`) and static photo uploads (`decodeFromImageFile` via `createImageBitmap` / `HTMLImageElement` fallback) run through the exact same `BarcodeDecoderService` and `isValidIsbn()` / `normalizeIsbn()` pipeline.

3. **Modernized `<app-isbn-scanner>` UI & Controls:**
   - Removes `html5-qrcode` completely (`npm uninstall html5-qrcode`).
   - Renders a native `<video>` with a crisp Tailwind v4 editorial viewfinder frame, animated scan line (respecting `prefers-reduced-motion`), 1-tap front/rear toggle (`facing-toggle`) or cleaned desktop `<select>` (`device-select`), conditional `>= 44×44px` flashlight/torch toggle button, start/stop toggle, and photo upload button.
   - Absorbs and supersedes the uncommitted working-tree camera ranking/timeout improvements on `develop` cleanly into the new modular architecture.

---

## 3. Atomic Task Breakdown

- [x] **[Task 18.1: Local ZXing-WASM Asset Bundling, CSP Update & `BarcodeDecoderService`](task-18.1-dependencies-local-wasm-and-barcode-decoder-service.md)** — Remove `html5-qrcode`, install `barcode-detector`, bundle `zxing_reader.wasm` locally in `angular.json`, add `'wasm-unsafe-eval'` to `src/index.html` CSP, and build `BarcodeDecoderService` (native `BarcodeDetector` + lazy local WASM ponyfill for live frames and static image files) with full Vitest unit tests.
- [x] **[Task 18.2: Native `CameraStreamService`, Preferred Device Memory & Progressive Track Controls](task-18.2-native-camera-stream-service-and-device-memory.md)** — Finalize `camera-selection.utils.ts` (Camera2 index ranking + auxiliary filtering) and implement `CameraStreamService` with fast `deviceId` memory (`localStorage`), short per-attempt timeouts, dead-sensor skipping, progressive autofocus/HD constraints, torch control, and guaranteed track teardown, backed by Vitest specs.
- [ ] **[Task 18.3: `IsbnScannerComponent` Native `<video>` Overhaul, Torch Toggle & Bilingual i18n](task-18.3-isbn-scanner-component-overhaul-and-torch-ux.md)** — Rewrite `IsbnScannerComponent` (`isbn-scanner.ts` / `.html`) to use `CameraStreamService` + `BarcodeDecoderService` with a throttled live scan loop, custom Tailwind v4 viewfinder overlay, conditional torch button, photo upload decoding, bilingual `es`/`en` i18n strings, and comprehensive component/regression tests.
- [ ] **[Task 18.4: Playwright E2E Verification, Bundle Audit & Tier 2 Docs Sync (`v2.4.0`)](task-18.4-e2e-verification-bundle-audit-and-tier-2-sync.md)** — Update `tests/e2e/isbn-lookup-flow.spec.ts` for the native scanner engine, verify zero overflow at `320px`/`375px`, run `npm run verify:quiet` and `npm run test:e2e`, confirm bundle size reduction after removing `html5-qrcode`, bump version to `2.4.0`, and execute Tier 2 Per-Phase Documentation Sync.
