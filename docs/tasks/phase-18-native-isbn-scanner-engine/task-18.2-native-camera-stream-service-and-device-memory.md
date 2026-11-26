# Task 18.2: Native `CameraStreamService`, Preferred Device Memory & Progressive Track Controls

- **Phase:** [Phase 18: Modern Native ISBN Scanner Engine](index.md)
- **Status:** Pending
- **Estimated Scope:** Finalize `camera-selection.utils.ts` + new `CameraStreamService` + Vitest unit/regression specs.

---

## 1. Objective

Build a dedicated, framework-clean `CameraStreamService` that directly owns `navigator.mediaDevices.getUserMedia()`, `enumerateDevices()`, per-attempt timeouts, last-known-good rear `deviceId` persistence in `localStorage`, progressive `MediaStreamTrack` enhancement (autofocus + HD upgrade after first frame), flashlight (torch) control, and guaranteed track teardown—eliminating the multi-second stalls observed on multi-lens Android Camera2 devices.

---

## 2. Implementation Specification

### 2.1 Consolidate `camera-selection.utils.ts` (`src/app/features/books/utils/camera-selection.utils.ts`)

Ensure the pure utility module includes and exports:

1. `extractCameraIndex(label: string): number` — parses trailing/embedded Android Camera2 numeric indices (`camera 0`, `camera2 1`, etc.) so `filterAndNormalizeCameras()` always ranks primary sensors (`camera 0` rear, `camera 1` front) before higher-indexed auxiliary sensors (`camera 4/5/6`).
2. `filterAndNormalizeCameras()`, `detectCameraFacing()`, `isAuxiliaryLensLabel()`, `formatCameraLabel()`, `buildCameraSwitchPlan()`.
3. Helper `pickPrimaryDeviceId(devices: readonly RawCameraDevice[], facing: 'environment' | 'user', preferredId?: string | null): string | null`:
   - If `preferredId` exists in `devices` and is not an auxiliary lens, return `preferredId` immediately.
   - Otherwise filter/sort via `filterAndNormalizeCameras()` and return the first device matching `facing` (which is guaranteed to be `camera 0` for rear and `camera 1` for front on Android Camera2 devices).

### 2.2 `CameraStreamService` (`src/app/features/books/services/camera-stream.service.ts`)

Create an `@Injectable({ providedIn: 'root' })` service (or component-scoped injectable if preferred; `providedIn: 'root'` with explicit `stop()` cleanup works cleanly and is trivial to test with `TestBed`):

1. **Constants & Persistence:**
   - `PREFERRED_REAR_DEVICE_KEY = 'bookstack.scanner.preferredRearDeviceId'`
   - `ATTEMPT_TIMEOUT_MS = 2500` (fast timeout so dead auxiliary sensors never trap the user for 8–10 seconds).
   - Safe `localStorage` read/write helpers wrapped in `try/catch` (handles private browsing / storage quota gracefully).
2. **Reactive Signals (Read-only public surface):**
   - `readonly activeStream = signal<MediaStream | null>(null)`
   - `readonly activeTrackSettings = signal<ActiveCameraTrackSettings | null>(null)`
   - `readonly availableDevices = signal<RawCameraDevice[]>([])`
   - `readonly torchSupported = signal<boolean>(false)`
   - `readonly torchEnabled = signal<boolean>(false)`
3. **Smart Startup & Fallback Ladder (`startStream(options?: { deviceId?: string; facingMode?: 'environment' | 'user' }): Promise<MediaStream>`):**
   - Always stop any existing active stream first (`stopStream()`) before opening a new one, and maintain an incrementing `sessionToken` so stale async resolutions are immediately stopped and discarded if the user closes the scanner mid-startup.
   - Validate `navigator.mediaDevices?.getUserMedia` availability (throw typed `'unavailable'` error if missing).
   - **Pre-Enumeration (Passive, Zero Extra Streams):** Call `navigator.mediaDevices.enumerateDevices()` once to inspect already-unlocked labels (instant on returning visits).
   - **Candidate Order (Default Auto-Start):**
     1. If a remembered `preferredRearDeviceId` exists in `enumerateDevices()` $\to$ try `{ deviceId: { exact: preferredRearDeviceId } }` **first** (opens `camera 0` in ~350–450 ms!).
     2. Else if labeled rear devices are already visible $\to$ try each ranked rear `deviceId` in ascending Camera2 index order (`camera 0`, then `camera 2`, etc.) with bare `{ deviceId: { exact: id } }` (fast open without blocking HAL on rigid HD constraints).
     3. Else (first-time visit with blank labels):
        - Try `{ facingMode: { ideal: 'environment' } }` (with `ATTEMPT_TIMEOUT_MS`).
        - If that fails or times out (non-permission error), try `{ facingMode: 'user' }` to unlock device labels, passively `enumerateDevices()`, and if a primary rear sensor (`camera 0`) is now discovered, immediately switch to it once so the user lands on the rear camera automatically.
        - Final fallback: `{ video: true }`.
   - **Explicit `facingMode` Switch (`facing-toggle`):**
     - Prefer ranked `deviceId` for that facing (`camera 0` for rear, `camera 1` for front) when labels are known; fall back to `{ facingMode: { exact: target } }` $\to$ `{ facingMode: target }`.
   - **Explicit `deviceId` Switch (`device-select`):**
     - Open `{ deviceId: { exact: deviceId } }` directly.
   - **Permission Error Short-Circuit:** If any attempt throws `NotAllowedError` / `PermissionDeniedError` / `SecurityError`, abort the ladder immediately and rethrow so the UI shows `permissionError` without useless retries.
   - **Persistence on Success:** Once a rear stream is verified active, save its `track.getSettings().deviceId` to `PREFERRED_REAR_DEVICE_KEY`.
4. **Progressive Track Enhancement (`enhanceActiveTrack(track: MediaStreamTrack)`):**
   - Executed asynchronously _after_ the stream is attached and playing (never blocks first frame):
     - Inspect `track.getCapabilities?.()` (typed safely via a dedicated extended `ExtendedMediaTrackCapabilities` interface—no `any`).
     - Update `torchSupported.set(Boolean(capabilities?.torch))` and reset `torchEnabled.set(false)`.
     - If `focusMode` includes `'continuous'` or resolution can be upgraded (`width.max >= 1280`), call `await track.applyConstraints(...)` inside a silent `try/catch`.
5. **Torch Control (`toggleTorch(): Promise<boolean>`):**
   - No-op returning `false` if `!torchSupported()` or no active video track.
   - Calls `await track.applyConstraints({ advanced: [{ torch: nextState }] } as MediaTrackConstraints)`, updates `torchEnabled`, and silently reverts on hardware failure.
6. **Guaranteed Cleanup (`stopStream()`):**
   - Increments `sessionToken`, calls `track.stop()` on every track in `activeStream()`, resets `activeStream`, `activeTrackSettings`, `torchSupported`, and `torchEnabled`.

---

## 3. Target Files

- **Edit:** `src/app/features/books/utils/camera-selection.utils.ts`
- **Edit:** `src/app/features/books/utils/camera-selection.utils.spec.ts`
- **New:** `src/app/features/books/services/camera-stream.service.ts`
- **New:** `src/app/features/books/services/camera-stream.service.spec.ts`

---

## 4. Verification & Acceptance Criteria

- [ ] `camera-selection.utils.spec.ts` passes all unit tests including POCO 7-camera Camera2 index ranking and `pickPrimaryDeviceId()` preference logic.
- [ ] `camera-stream.service.spec.ts` passes unit/regression tests covering:
  - Returning visit with remembered `preferredRearDeviceId` opens directly on Attempt 0 (1 `getUserMedia` call, zero timeouts).
  - Dead auxiliary sensor timeout automatically skips to the next working sensor and stops any late-resolving stale streams.
  - First-visit `environment` hang falls back to `user`, unlocks labels, and auto-upgrades to `camera 0` rear.
  - `NotAllowedError` short-circuits immediately without retrying.
  - `torchSupported` detection & `toggleTorch()` constraint application.
  - `stopStream()` stops all tracks and resets signals cleanly.
- [ ] `npm run verify:fast:quiet` passes cleanly with zero TypeScript/ESLint errors.
