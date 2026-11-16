# Task 10.3: Lazy-Loaded ISBN Barcode Scanner Component (`html5-qrcode` Camera Stream & Image File Upload)

**Phase:** Phase 10: ISBN Barcode Scanner & Public Metadata Auto-Fill  
**Status:** Pending  
**Estimated Impact:** Medium-High (Standalone `IsbnScannerComponent` with dynamic `import('html5-qrcode')`, rear/multi-camera live stream, photo barcode scanning, strict ISBN checksum gate, and guaranteed hardware stream teardown).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `package.json` (`L26-38`): Confirmed `html5-qrcode` (`^2.3.8`) dependency.
- `src/app/features/books/utils/isbn.utils.ts` (`L1-110`): `cleanIsbnInput`, `isValidIsbn`, and `normalizeIsbn` utilities.
- `src/app/core/i18n/i18n.types.ts` (`L215-265`): `bookForm.lookup` translation keys added in Task 10.1.

**Files to Create / Update:**

- `src/app/features/books/components/isbn-scanner/isbn-scanner.ts`
- `src/app/features/books/components/isbn-scanner/isbn-scanner.html`
- `src/app/features/books/components/isbn-scanner/isbn-scanner.spec.ts`

---

## 2. Technical Objectives

1. **Dynamic Library Loading & Clean Hardware Lifecycle (`IsbnScannerComponent`):**
   - Standalone `ChangeDetectionStrategy.OnPush` component (`selector: 'app-isbn-scanner'`).
   - Outputs:
     - `readonly isbnDetected = output<string>();` (emits canonical normalized 13-digit ISBN).
     - `readonly closed = output<void>();`
   - Loads `html5-qrcode` lazily via a protected helper `loadScannerLibrary(): Promise<typeof import('html5-qrcode')>` (`await import('html5-qrcode')`) so `html5-qrcode` is split into a separate async chunk and easily mockable in unit tests.
2. **Live Camera Scanning & Multi-Camera Switcher:**
   - Signals:
     - `scannerState = signal<'idle' | 'starting' | 'scanning' | 'processing-file' | 'error'>('idle')`
     - `availableCameras = signal<{ id: string; label: string }[]>([])`
     - `selectedCameraId = signal<string | null>(null)`
     - `errorMessage = signal<string | null>(null)`
     - `ignoredNonIsbnHint = signal<boolean>(false)`
   - Automatically starts the camera on `ngAfterViewInit()` (or via explicit retry button if permission was denied):
     - Prefers `facingMode: 'environment'` by default; also queries `Html5Qrcode.getCameras()` to populate `availableCameras` so the user can switch cameras (`switchCamera(cameraId: string)`) when multiple devices exist.
     - Configures `fps: 10` and `qrbox: { width: 240, height: 120 }` tailored for horizontal 1D EAN-13 book barcodes.
3. **Strict ISBN Checksum Gate & Instant Stream Shutdown:**
   - When `html5-qrcode` decodes a barcode string:
     - Validates it with `isValidIsbn(decodedText)`.
     - If invalid (e.g., a 5-digit price add-on barcode or non-book product EAN), sets `ignoredNonIsbnHint.set(true)` without stopping the scan so the user knows to point at the `978`/`979` ISBN barcode.
     - Once a valid ISBN is detected, normalizes it via `normalizeIsbn(decodedText)`, **immediately stops and clears the camera stream** (`await this.stopCamera()`), and emits `this.isbnDetected.emit(normalized)`.
   - `ngOnDestroy()` MUST guarantee `stopCamera()` execution so the browser camera indicator light turns off immediately whenever the scanner panel collapses or the modal closes.
4. **Photo / Image File Barcode Fallback (`onFileSelected(event: Event)`):**
   - Provides a secondary button/input (`<input type="file" accept="image/*" capture="environment" />`) allowing users on desktop without a webcam (or on mobile if camera streaming is blocked) to upload or snap a photo of the barcode.
   - Stops any active live stream first, runs `html5QrCode.scanFile(file, false)`, validates `isValidIsbn()`, and either emits `isbnDetected` or shows the localized invalid-barcode error message.

---

## 3. Verification Gate

- [ ] `npm run test:file -- src/app/features/books/components/isbn-scanner/isbn-scanner.spec.ts`
- [ ] `npm run verify:quiet`
