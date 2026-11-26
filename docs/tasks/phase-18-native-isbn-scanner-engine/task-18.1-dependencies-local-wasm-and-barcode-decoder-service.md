# Task 18.1: Local ZXing-WASM Asset Bundling, CSP Update & `BarcodeDecoderService`

- **Phase:** [Phase 18: Modern Native ISBN Scanner Engine](index.md)
- **Status:** Completed
- **Estimated Scope:** Dependencies, build/CSP config, 1 new Angular service + 1 new Vitest spec.

---

## 1. Objective

Remove the legacy `html5-qrcode` dependency, install `barcode-detector` (W3C `BarcodeDetector` ponyfill backed by `zxing-wasm`), bundle `zxing_reader.wasm` strictly as a local offline-cached Angular asset (zero external CDN requests), permit WebAssembly compilation in CSP via `'wasm-unsafe-eval'`, and create `BarcodeDecoderService` supporting both native browser `BarcodeDetector` and lazy local WASM fallback for live video frames and static image uploads.

---

## 2. Implementation Specification

### 2.1 Dependency & Build Configuration

1. **Dependencies (`package.json` / `package-lock.json`):**
   - Uninstall `html5-qrcode`: `npm uninstall html5-qrcode`
   - Install `barcode-detector`: `npm install barcode-detector`
2. **Local WASM Asset Bundling (`angular.json`):**
   - Under `projects.bookstack.architect.build.options.assets`, add:
     ```json
     {
       "glob": "zxing_reader.wasm",
       "input": "node_modules/zxing-wasm/dist/reader",
       "output": "assets/wasm"
     }
     ```
   - Verify `ngsw-config.json` already covers `/assets/**` in its lazy `assets` group so `assets/wasm/zxing_reader.wasm` is cached offline by the Angular Service Worker without bloating initial prefetch.
3. **CSP Hardening (`src/index.html`):**
   - Update `script-src` in the `<meta http-equiv="Content-Security-Policy">` tag from:
     `script-src 'self' 'unsafe-inline';`
     to:
     `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';`
   - Do **not** add `'unsafe-eval'` or any external CDN domain to `connect-src`.

### 2.2 `BarcodeDecoderService` (`src/app/features/books/services/barcode-decoder.service.ts`)

Create an `@Injectable({ providedIn: 'root' })` service with strict TypeScript typing (zero `any`):

1. **Public Types & Engine Introspection:**
   - `export type BarcodeEngineKind = 'native' | 'wasm';`
   - `export interface BarcodeDetectionResult { rawValue: string; normalizedIsbn: string; format: string; }`
   - `readonly activeEngine = signal<BarcodeEngineKind | null>(null);`
   - Define local structural interfaces `BarcodeDetectorLike` (`detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string; format: string }>>`) and `BarcodeDetectorCtorLike` (`getSupportedFormats(): Promise<string[]>`, `new (options?: { formats: string[] }): BarcodeDetectorLike`).
2. **Supported ISBN Formats:**
   - Constant `ISBN_BARCODE_FORMATS = ['ean_13', 'ean_8'] as const`.
3. **Lazy Engine Resolution (`ensureDetector()`):**
   - Memoize initialization via a cached `Promise<BarcodeDetectorLike>` so concurrent calls share one setup.
   - **Step A (Native First):** Check if `typeof globalThis !== 'undefined' && 'BarcodeDetector' in globalThis`. If present, call `await NativeCtor.getSupportedFormats()` inside a `try/catch`; if both `'ean_13'` and `'ean_8'` are supported, instantiate `new NativeCtor({ formats: ['ean_13', 'ean_8'] })`, set `activeEngine.set('native')`, and return it.
   - **Step B (Local WASM Ponyfill Fallback):** Dynamically `import('barcode-detector/ponyfill')`. Call `prepareZXingModule({ overrides: { locateFile: (path: string) => (path.endsWith('.wasm') ? resolveLocalWasmUrl() : path) } })`, where `resolveLocalWasmUrl()` resolves `'assets/wasm/zxing_reader.wasm'` against `document.baseURI` (falling back to `'/assets/wasm/zxing_reader.wasm'`) so GitHub Pages subpaths work seamlessly. Instantiate `new PonyfillBarcodeDetector({ formats: ['ean_13', 'ean_8'] })`, set `activeEngine.set('wasm')`, and return it.
   - Expose an injectable/overridable factory hook or internal seam so unit tests can verify both `'native'` and `'wasm'` paths deterministically without loading real WASM binaries in JSDOM.
4. **Live Video Frame Decoding (`decodeFromVideo(video: HTMLVideoElement): Promise<BarcodeDetectionResult | null>`):**
   - Return `null` immediately if `video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0`.
   - Run `const detections = await detector.detect(video)`.
   - Iterate `detections`, normalize each `rawValue` with `normalizeIsbn()`, and return the first detection where `isValidIsbn(normalized)` is `true`.
   - If detections exist but none are valid ISBNs (e.g., non-ISBN EAN-13), return `null` (or let caller distinguish via an optional helper `detectRawBarcodes()` so photo upload can report `invalidBarcodeError` vs `noBarcodeInImageError`).
5. **Static Image File Decoding (`decodeFromImageFile(file: File): Promise<{ status: 'isbn'; isbn: string } | { status: 'invalid-barcode'; rawValue: string } | { status: 'no-barcode' }>`):**
   - Decode `file` into an `ImageBitmap` via `createImageBitmap(file)` (closing it in `finally`) or fall back to an offscreen `HTMLImageElement` loaded via `URL.createObjectURL(file)` (revoking the object URL in `finally`).
   - Run `detector.detect(imageSource)`.
   - If empty $\to$ `{ status: 'no-barcode' }`.
   - If any detected `rawValue` satisfies `isValidIsbn(normalizeIsbn(rawValue))` $\to$ `{ status: 'isbn', isbn: normalizeIsbn(rawValue) }`.
   - Otherwise $\to$ `{ status: 'invalid-barcode', rawValue: detections[0].rawValue }`.

---

## 3. Target Files

- **Edit:** `package.json`, `package-lock.json`
- **Edit:** `angular.json` (L22-L28 — add `zxing_reader.wasm` asset copy)
- **Edit:** `src/index.html` (L11-L14 — add `'wasm-unsafe-eval'` to `script-src`)
- **New:** `src/app/features/books/services/barcode-decoder.service.ts`
- **New:** `src/app/features/books/services/barcode-decoder.service.spec.ts`

---

## 4. Verification & Acceptance Criteria

- [ ] `html5-qrcode` is completely removed from `package.json` and `package-lock.json`; `barcode-detector` is installed.
- [ ] `angular.json` copies `zxing_reader.wasm` to `assets/wasm/zxing_reader.wasm` and `src/index.html` CSP includes `'wasm-unsafe-eval'` without `'unsafe-eval'` or CDN domains.
- [ ] `BarcodeDecoderService` unit tests (`npm run test:file -- src/app/features/books/services/barcode-decoder.service.spec.ts`) verify:
  - Native `window.BarcodeDetector` is selected when `ean_13` & `ean_8` are supported (`activeEngine() === 'native'`).
  - Local WASM ponyfill is selected when native `BarcodeDetector` is absent or lacks `ean_13` (`activeEngine() === 'wasm'`), and `locateFile` resolves to local `assets/wasm/zxing_reader.wasm`.
  - `decodeFromVideo()` skips unready frames (`videoWidth === 0`) and returns valid normalized ISBN-13/10 values.
  - `decodeFromImageFile()` distinguishes `'isbn'`, `'invalid-barcode'`, and `'no-barcode'` outcomes and cleans up object URLs / `ImageBitmap`s.
- [ ] Note: Because `isbn-scanner.ts` still imports `html5-qrcode` until Task 18.3, remove `html5-qrcode` either in Task 18.3 or keep `npm run check` green at each atomic step (prefer installing `barcode-detector` in Task 18.1 and running `npm uninstall html5-qrcode` in Task 18.3 right after rewriting `isbn-scanner.ts` so every commit passes `npm run verify:quiet`!).
