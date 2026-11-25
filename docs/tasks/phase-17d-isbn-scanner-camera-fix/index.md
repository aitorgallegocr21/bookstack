# Phase 17D: ISBN Scanner Smart Camera Selection, HD Quality & UX Simplification (`v2.3.3`)

- **Status:** Completed
- **Target Release:** `v2.3.3` (Patch / Bug Fix)
- **Recommended Branch:** `fix/isbn-camera-selection` (branched from `develop`)

---

## 1. Problem Statement & Confirmed Root Causes

On Android multi-camera smartphones, opening the ISBN barcode scanner (`IsbnScannerComponent`) fails to automatically start the primary rear camera cleanly, leaves the viewport blank/inactive while prompting the user to activate it, exposes up to 6 cryptic `camera2` lenses in a raw `<select>` dropdown (4 of which are unusable auxiliary sensors), and renders a low-resolution preview when the rear lens is finally found.

### Confirmed Root Causes in Codebase (`html5-qrcode@2.3.8` + `IsbnScannerComponent`)

1. **Double `getUserMedia()` Race & Android Camera2 HAL Lock (`src/app/features/books/components/isbn-scanner/isbn-scanner.ts` L113-L141):**
   - `startCamera()` calls `await this.refreshAvailableCameras(lib)` **before** calling `scanner.start(...)`.
   - Internally, `Html5Qrcode.getCameras()` (`node_modules/html5-qrcode/esm/camera/retriever.js` L80-L96) opens a throwaway `navigator.mediaDevices.getUserMedia({ audio: false, video: true })` stream (no `facingMode`, so Android opens the default/front camera), calls `enumerateDevices()`, and immediately calls `track.stop()`.
   - Milliseconds later, `scanner.start({ facingMode: 'environment' }, ...)` calls `getUserMedia()` again for the rear camera. On Android Camera2 HAL, rapidly closing one camera stream and immediately acquiring another physical lens frequently causes a hardware busy race (`NotReadableError` / `AbortError` / stalled video surface), triggering the `catch` block (`error` state) while leaving `availableCameras` populated with all 6 raw devices.
2. **Raw Android Camera2 Multi-Lens Explosion & Cryptic Device Labels (`isbn-scanner.ts` L327-L341, `isbn-scanner.html` L88-L100):**
   - Modern Android phones expose 4–8 logical/physical `videoinput` devices via `enumerateDevices()` (primary wide, ultra-wide, macro, telephoto, depth/ToF, monochrome, front wide), with raw OS labels such as `camera2 0, facing back`, `camera2 2, facing back`, `camera2 3, facing back`, `camera2 1, facing front`.
   - `IsbnScannerComponent` renders every raw `videoinput` directly in `<select>` with `device.label || device.id`, without filtering unusable auxiliary sensors, without collapsing same-facing Android lenses, and without syncing `selectedCameraId` to `scanner.getRunningTrackSettings().deviceId` (leaving the dropdown stuck on the disabled placeholder `"Cambiar cámara"`).
3. **Low Video Quality & Missing Autofocus / Responsive Scan Box (`isbn-scanner.ts` L129-L135):**
   - `scanner.start()` passes only `{ facingMode: 'environment' }` and `{ fps: 10, qrbox: { width: 240, height: 120 } }` with **no `videoConstraints`**.
   - Without `width`/`height` constraints, Chromium/WebRTC on Android often defaults to VGA (`640×480` or lower), making fine vertical 1D EAN-13 ISBN bars blurry and slow to decode.
   - Continuous autofocus (`focusMode: 'continuous'`) is never requested on the active track, and `qrbox` uses fixed pixels instead of adapting to the viewfinder dimensions.
4. **Two-Step Activation Friction (`isbn-scanner.ts` L42, L71-L80; `isbn-scanner.html` L21-L39):**
   - Tapping **"Escanear código"** (`BookMetadataLookupComponent`, which mounts `<app-isbn-scanner>` inside `@defer (when isExpanded() && activeTab() === 'scan')`) leaves `IsbnScannerComponent` in `'idle'` state behind an overlay requiring a second tap (**"Activar cámara"**) due to the Phase 12 `sessionCameraConsent` gate.
   - **Resolved UX Decision (1-Tap Direct Start):** Tapping **"Escanear código"** is already an explicit user action (zero camera access occurs on page load or modal open). Mounting `IsbnScannerComponent` MUST start the primary camera immediately in `ngAfterViewInit()`, while displaying the local-only privacy notice (`bookForm.lookup.cameraConsentHint`) inline below the viewfinder. Users can still stop/restart the camera via the controls bar at any time.

---

## 2. Implementation Specification

### 2.1 Pure Camera Classification & Selection Utility (`src/app/features/books/utils/camera-selection.utils.ts`)

Create a pure, framework-free, unit-tested utility module responsible for classifying devices, filtering unusable auxiliary lenses, and generating clean localized labels:

1. **Types:**
   - `CameraFacing = 'environment' | 'user' | 'unknown'`
   - `CameraSwitcherMode = 'none' | 'facing-toggle' | 'device-select'`
   - `NormalizedCameraOption = { id: string; label: string; facing: CameraFacing }`
   - `CameraSwitchPlan = { mode: CameraSwitcherMode; activeFacing: CameraFacing; options: NormalizedCameraOption[] }`
   - `CameraLabelDictionary = { rear: string; front: string; genericPrefix: string }`
2. **Facing Detection (`detectCameraFacing(label: string): CameraFacing`):**
   - Rear patterns (case-insensitive): `/\b(back|rear|environment|trasera|posterior|world)\b/i`
   - Front patterns (case-insensitive): `/\b(front|user|selfie|frontal|facetime)\b/i`
   - Otherwise `'unknown'`.
3. **Auxiliary / Unusable Lens Filtering (`isAuxiliaryLensLabel(label: string): boolean`):**
   - Matches `/\b(depth|tof|infrared|ir|macro|telephoto|tele|ultra[\s-]?wide|wide[\s-]?angle|mono|monochrome|bokeh|virtual|obs)\b/i`.
   - Auxiliary lenses are filtered out whenever a non-auxiliary camera exists; if _all_ cameras match (edge case), preserve the original list so the user is never left with zero cameras.
4. **Clean Label Formatting (`formatCameraLabel(rawLabel: string, index: number, facing: CameraFacing, labels: CameraLabelDictionary): string`):**
   - If `facing === 'environment'`, returns `labels.rear` (`Cámara trasera` / `Rear camera`).
   - If `facing === 'user'`, returns `labels.front` (`Cámara frontal` / `Front camera`).
   - For desktop webcams (`facing === 'unknown'`): strips raw USB VID:PID hex suffixes like ` (046d:082d)` and `camera2 \d+,?\s*` prefixes; if empty/cryptic, falls back to `${labels.genericPrefix} ${index + 1}` (`Cámara 1` / `Camera 1`).
5. **Adaptive Switcher Plan (`buildCameraSwitchPlan(devices, activeTrackSettings, labels): CameraSwitchPlan`):**
   - **0 or 1 usable camera (e.g., laptop webcam or single-camera tablet):**
     - Returns `mode: 'none'` — **hide all camera switching controls**.
   - **Mobile / tablet with both rear (`environment`) and front (`user`) cameras (regardless of whether Android exposes 2 or 6+ `camera2` devices):**
     - Collapses all rear lenses into 1 logical `'environment'` target and all front lenses into 1 logical `'user'` target.
     - Returns `mode: 'facing-toggle'` — UI renders a single clean **1-tap flip button** (`Cambiar a cámara frontal` / `Cambiar a cámara trasera`) instead of a confusing multi-lens `<select>`.
   - **Desktop / multi-webcam setup with 2+ `'unknown'` cameras (no front/rear distinction, e.g., built-in webcam + external USB webcam):**
     - Deduplicates by `deviceId` (and filters out empty IDs) and returns `mode: 'device-select'` with cleaned human-readable labels.

### 2.2 Single-Stream Startup, HD Constraints & Graceful Fallback (`isbn-scanner.ts`)

1. **Eliminate `Html5Qrcode.getCameras()` Before Startup:**
   - Remove the pre-start `await this.refreshAvailableCameras(lib)` call completely.
   - Start `scanner.start(...)` directly in a single `getUserMedia` call.
   - **After** `scanner.start()` succeeds, enumerate devices passively using `navigator.mediaDevices?.enumerateDevices()` (zero extra `getUserMedia()` calls!) and read the active track via `scanner.getRunningTrackSettings?.()` (`deviceId`, `facingMode`) to compute `cameraSwitchPlan`.
2. **HD `videoConstraints` with Safe Fallback Ladder:**
   - Pass `videoConstraints` in the `Html5Qrcode.start()` config (validated by `html5-qrcode`'s `VideoConstraintsUtil`):
     - **Default / auto start (no explicit `deviceId`, no explicit `facingMode`):**
       1. Attempt 1 (HD Rear-preferred, desktop-safe):
          ```ts
          {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
          ```
          On phones/tablets, the OS selects the primary high-res rear lens; on single-camera desktops, `{ ideal: 'environment' }` seamlessly falls back to the sole webcam without throwing `OverconstrainedError`.
       2. Attempt 2 (if Attempt 1 fails with a non-permission constraint/hardware error):
          Retry once with bare `{ facingMode: 'environment' }` (no resolution constraints), and if that also fails with `OverconstrainedError`/`NotFoundError`, retry once with `{ facingMode: 'user' }` so single front-only devices always succeed.
     - **Switching via `facing-toggle` (`'environment' <-> 'user'`):**
       - Request `{ facingMode: { exact: targetFacing }, width: { ideal: 1280 }, height: { ideal: 720 } }`, falling back to `{ facingMode: targetFacing }` if `OverconstrainedError` occurs.
     - **Switching via `device-select` (multi-webcam desktop):**
       - Request `{ deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }`, falling back to `{ deviceId: { exact: cameraId } }`.
3. **Continuous Autofocus & Native `BarcodeDetector`:**
   - Pass `useBarCodeDetectorIfSupported: true` in `new lib.Html5Qrcode(this.scannerElementId, { verbose: false, formatsToSupport: formats, useBarCodeDetectorIfSupported: true })`.
   - Use a responsive `qrbox` callback tailored for 1D ISBN-13 barcodes:
     ```ts
     qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
       width: Math.max(180, Math.min(320, Math.floor(viewfinderWidth * 0.82))),
       height: Math.max(96, Math.min(160, Math.floor(viewfinderHeight * 0.45))),
     });
     ```
   - After `scanner.start()` resolves, if `scanner.getRunningTrackCapabilities?.()` exposes `focusMode` including `'continuous'`, call `scanner.applyVideoConstraints({ advanced: [{ focusMode: 'continuous' }] } as MediaTrackConstraints)` inside a silent `try/catch`.

### 2.3 Direct 1-Tap Startup, Simplified Scanner UI & Bilingual i18n (`isbn-scanner.ts`, `isbn-scanner.html`, `books.i18n.ts`)

1. **Direct 1-Tap Startup on Mount (`isbn-scanner.ts` L42-L80):**
   - Remove the `sessionCameraConsent` gate and `resetSessionConsent()` / `grantCameraConsentAndStart()` indirection.
   - Call `void this.startCamera()` directly inside `ngAfterViewInit()`. Because `BookMetadataLookupComponent` renders `<app-isbn-scanner>` strictly inside `@if (activeTab() === 'scan') @if (isExpanded())`, the camera is **never** initialized until the user explicitly taps **"Escanear código"**.
   - In `isbn-scanner.html`, remove the `'idle'` full-viewport overlay (`enable-camera-consent-btn`). When `scannerState() === 'idle'` (only reached after the user clicks **"Detener cámara"**), show a compact inline restart prompt inside the viewport or let the user tap **"Iniciar cámara"** in the controls bar.
   - Display the local-only privacy notice (`i18n.t().bookForm.lookup.cameraConsentHint`) cleanly as a subtle caption below the controls/hint area so privacy transparency is always visible without blocking the viewfinder.
2. **Controls Bar (`isbn-scanner.html` L66-L120):**
   - Replace the always-shown `<select>` (when `availableCameras().length > 1`) with `@switch (cameraSwitchPlan().mode)`:
     - `'facing-toggle'`: Render a single `>= 44×44px` button (`data-testid="toggle-camera-facing-btn"`) with `LucideSwitchCamera` showing `"Usar cámara frontal"` when rear is active or `"Usar cámara trasera"` when front is active.
     - `'device-select'`: Render the accessible `<select>` (`data-testid="camera-device-select"`) bound to `selectedCameraId()` with cleaned, friendly labels (no cryptic `camera2` strings or USB hex IDs).
     - `'none'`: Render nothing (only Start/Stop + Upload Photo buttons).
3. **i18n Keys (`src/app/core/i18n/domains/books.i18n.ts`):**
   - Add strictly typed keys under `bookForm.lookup` in both `es` and `en`:
     - `rearCamera`: `'Cámara trasera'` / `'Rear camera'`
     - `frontCamera`: `'Cámara frontal'` / `'Front camera'`
     - `genericCameraPrefix`: `'Cámara'` / `'Camera'`
     - `switchToFrontCamera`: `'Usar cámara frontal'` / `'Use front camera'`
     - `switchToRearCamera`: `'Usar cámara trasera'` / `'Use rear camera'`

---

## 3. Target Files & Line Pointers

- **New:** `src/app/features/books/utils/camera-selection.utils.ts` (pure camera classification, auxiliary lens filtering, label sanitization & switch plan builder)
- **New:** `src/app/features/books/utils/camera-selection.utils.spec.ts` (comprehensive unit tests covering Android 6-camera `camera2` lists, single webcam, dual desktop webcams, iOS labels, and auxiliary-only edge cases)
- **Edit:** `src/app/core/i18n/domains/books.i18n.ts` (L142-L190 interface, L377-L427 `es`, L614-L664 `en` — add friendly camera labels and toggle strings)
- **Edit:** `src/app/features/books/components/isbn-scanner/isbn-scanner.ts` (L1-L353 — remove pre-start `getCameras()`, add HD `videoConstraints` + fallback ladder, passive post-start `enumerateDevices()`, continuous autofocus, `cameraSwitchPlan` signal, `toggleFacingMode()`)
- **Edit:** `src/app/features/books/components/isbn-scanner/isbn-scanner.html` (L66-L120 — conditional `facing-toggle` button vs `device-select` dropdown vs hidden for single camera)
- **Edit:** `src/app/features/books/components/isbn-scanner/isbn-scanner.spec.ts` (L1-L310 — update assertions for direct 1-tap HD startup on init without `enable-camera-consent-btn`, add regression tests for: Android 6-camera collapse to 1-tap `[data-testid="toggle-camera-facing-btn"]`, zero `getCameras()` pre-start call, constraint fallback to bare/user camera on `OverconstrainedError`, single-camera hidden switcher, desktop multi-webcam cleaned labels, and inline privacy notice visibility)
- **Edit:** `tests/e2e/isbn-lookup-flow.spec.ts` (L439-L480 — update privacy E2E test to verify zero `getUserMedia` calls before tapping **"Escanear código"**, direct camera initialization upon tapping **"Escanear código"**, inline privacy notice visibility, and zero horizontal overflow at `320px`/`375px`)
- **Version & Docs (Tier 2 on completion):** `package.json`, `package-lock.json` (`2.3.2` -> `2.3.3`), `CONTEXT.md`, `docs/TASKS.md`

---

## 4. Verification & Acceptance Criteria

- [x] Zero camera access occurs before the user taps **"Escanear código"**; tapping **"Escanear código"** immediately starts the primary rear camera in 1 tap (no secondary "Activar cámara" overlay) while showing the local-only privacy notice inline.
- [x] Starting the scanner executes a single `getUserMedia` via `scanner.start()` with HD `{ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }` — never calling `Html5Qrcode.getCameras()` beforehand.
- [x] On Android phones with 6+ `camera2` lenses, the primary rear camera opens automatically in HD and the UI shows a single friendly flip button (`Usar cámara frontal` / `Usar cámara trasera`) instead of a 6-option cryptic dropdown.
- [x] On single-camera devices (laptop webcam or front-only tablet), the sole working camera opens automatically via graceful fallback and no camera switcher control is rendered.
- [x] On multi-webcam desktops, a `<select>` appears with cleaned, human-readable names (`Cámara 1`, `Logitech C920`, etc., with USB hex IDs stripped) and synced active selection.
- [x] `OverconstrainedError` on HD constraints automatically falls back without failing the scan session; `NotAllowedError` still shows the localized permission error and photo-upload fallback.
- [x] All unit/regression specs (`camera-selection.utils.spec.ts`, `isbn-scanner.spec.ts`), `npm run verify:quiet`, and `npm run test:e2e` pass cleanly with zero horizontal overflow at `320px` and `375px`.
