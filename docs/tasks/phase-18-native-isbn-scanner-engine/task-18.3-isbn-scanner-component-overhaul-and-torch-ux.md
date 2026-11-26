# Task 18.3: `IsbnScannerComponent` Native `<video>` Overhaul, Torch Toggle & Bilingual i18n

- **Phase:** [Phase 18: Modern Native ISBN Scanner Engine](index.md)
- **Status:** Pending
- **Estimated Scope:** Rewrite `IsbnScannerComponent` (`.ts`, `.html`, `.spec.ts`), update `books.i18n.ts`, and uninstall `html5-qrcode`.

---

## 1. Objective

Replace `html5-qrcode` inside `IsbnScannerComponent` with `CameraStreamService` + `BarcodeDecoderService`, rendering a native `<video playsinline muted autoplay>` element with a custom editorial Tailwind v4 viewfinder overlay, a throttled live decode loop, a conditional flashlight/torch toggle button, instant front/rear switching, static photo scanning, and complete bilingual i18n support.

---

## 2. Implementation Specification

### 2.1 Remove `html5-qrcode`

- Run `npm uninstall html5-qrcode` now that no source file imports it.

### 2.2 Bilingual i18n Keys (`src/app/core/i18n/domains/books.i18n.ts`)

Add strictly typed keys under `bookForm.lookup` in `BooksI18n`, `es`, and `en`:

- `toggleTorchOn`: `'Encender linterna'` / `'Turn on flashlight'`
- `toggleTorchOff`: `'Apagar linterna'` / `'Turn off flashlight'`
- `loadingCamera`: `'Iniciando cámara...'` / `'Starting camera...'`

### 2.3 `IsbnScannerComponent` (`src/app/features/books/components/isbn-scanner/isbn-scanner.ts`)

1. **Dependencies & Signals:**
   - Inject `I18nService`, `CameraStreamService`, `BarcodeDecoderService`.
   - Use `viewChild<ElementRef<HTMLVideoElement>>('videoEl')` for the native `<video>` element.
   - Maintain `scannerState = signal<ScannerState>('idle' | 'starting' | 'scanning' | 'error')`, `errorMessage = signal<string | null>(null)`, `selectedCameraId = signal<string>('')`, `cameraSwitchPlan = signal<CameraSwitchPlan>(...)`.
   - Expose computed signals delegating to `CameraStreamService`: `torchSupported`, `torchEnabled`.
2. **Lifecycle & 1-Tap Direct Startup:**
   - Start camera immediately in `ngAfterViewInit()` via `void this.startCamera()`.
   - On `ngOnDestroy()`, cancel the decode loop (`stopDecodeLoop()`), detach `video.srcObject = null`, and call `cameraStream.stopStream()`.
3. **Video Attachment & Readiness Verification:**
   - Assign `video.srcObject = stream`, call `await video.play()`, and wait briefly (up to 1.5 s) for `video.readyState >= HAVE_CURRENT_DATA` / `video.videoWidth > 0`.
   - Trigger `cameraStream.enhanceActiveTrack()` after playback starts so autofocus and HD resolution never delay first frame.
   - Compute `cameraSwitchPlan` from `cameraStream.availableDevices()` and `cameraStream.activeTrackSettings()`.
4. **Throttled Live Decode Loop (`startDecodeLoop()`):**
   - Run an asynchronous scheduled loop (e.g., `setTimeout` / `requestAnimationFrame` gated at `~120 ms` intervals, never overlapping concurrent `detect()` calls).
   - Pause decoding automatically while `document.visibilityState === 'hidden'` to save battery.
   - When `barcodeDecoder.decodeFromVideo(video)` returns a valid `BarcodeDetectionResult`:
     - Stop the decode loop and camera stream (`stopCamera()`).
     - Emit `isbnDetected.emit(result.normalizedIsbn)` (deduplicated against `hasEmittedCurrentSession`).
5. **Camera Controls & Photo Upload:**
   - `toggleFacingMode()`: determines target facing (`'environment'` vs `'user'`) and calls `startCamera({ facingMode: target })`.
   - `onCameraChange(cameraId)`: calls `startCamera({ deviceId: cameraId })`.
   - `toggleTorch()`: calls `await cameraStream.toggleTorch()`.
   - `onFileSelected(event)`: uses `barcodeDecoder.decodeFromImageFile(file)`:
     - `'isbn'` $\to$ stop camera and emit `isbnDetected.emit(result.isbn)`.
     - `'invalid-barcode'` $\to$ show `invalidBarcodeError`.
     - `'no-barcode'` $\to$ show `noBarcodeInImageError`.

### 2.4 Native Viewfinder Template (`src/app/features/books/components/isbn-scanner/isbn-scanner.html`)

1. **Viewport Container:**
   - Fixed-aspect or `min-h-[220px] max-h-[320px]` rounded container (`overflow-hidden bg-slate-950`) containing:
     - `<video #videoEl playsinline muted autoplay class="h-full w-full object-cover" [class.opacity-0]="scannerState() !== 'scanning'"></video>`
     - **Editorial Viewfinder Overlay** (shown when `scannerState() === 'scanning'`, `pointer-events-none`): subtle darkened framing mask with 4 crisp corner brackets centered over a horizontal 1D barcode guide box (`w-[80%] max-w-[280px] h-[110px]`) and a subtle horizontal laser line (`motion-safe:animate-pulse`).
     - **Loading Spinner State** (`scannerState() === 'starting'`): centered spinner + `loadingCamera` label.
     - **Error / Idle Overlay:** clean inline message without blocking the controls bar below.
2. **Controls Bar (Mobile-First, Zero Overflow at `320px`):**
   - `flex flex-wrap items-center gap-2` with all interactive buttons `min-h-[44px]`:
     - Start / Stop Camera button.
     - `@switch (cameraSwitchPlan().mode)` $\to$ 1-tap `facing-toggle` button (`data-testid="toggle-camera-facing-btn"`) or cleaned `device-select` dropdown (`data-testid="camera-device-select"`) or hidden (`'none'`).
     - `@if (scannerState() === 'scanning' && torchSupported())` $\to$ Torch toggle button (`data-testid="toggle-torch-btn"`) with `LucideFlashlight` / `LucideFlashlightOff` and `aria-pressed`.
     - Upload Photo button (`data-testid="upload-barcode-photo-btn"`).
   - Inline local-only privacy caption (`cameraConsentHint`) below the controls bar.

---

## 3. Target Files

- **Edit:** `package.json`, `package-lock.json` (remove `html5-qrcode`)
- **Edit:** `src/app/core/i18n/domains/books.i18n.ts`
- **Edit:** `src/app/features/books/components/isbn-scanner/isbn-scanner.ts`
- **Edit:** `src/app/features/books/components/isbn-scanner/isbn-scanner.html`
- **Edit:** `src/app/features/books/components/isbn-scanner/isbn-scanner.spec.ts`

---

## 4. Verification & Acceptance Criteria

- [ ] Zero references to `html5-qrcode` remain anywhere in `src/` or `package.json`.
- [ ] `isbn-scanner.spec.ts` passes all component/regression tests covering:
  - Direct 1-tap startup on mount attaching `MediaStream` to `<video>`.
  - Live decode loop emitting normalized ISBN and stopping the camera on hit.
  - Android multi-lens collapse to 1-tap `toggle-camera-facing-btn`, desktop multi-webcam `camera-device-select`, and single-camera hidden switcher.
  - Conditional `toggle-torch-btn` rendering only when `torchSupported()` is `true` and toggling `aria-pressed`.
  - Photo upload handling `'isbn'`, `'invalid-barcode'`, and `'no-barcode'` states.
  - Permission denied error state (`NotAllowedError`) and guaranteed track cleanup on destroy.
- [ ] `npm run verify:quiet` passes completely (including production build verifying `assets/wasm/zxing_reader.wasm` is emitted cleanly).
