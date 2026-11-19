# Task 12.2: Legal, Privacy, `/about` Disclosures, Camera Consent & Security/CSP Hardening

**Phase:** Phase 12: Performance, Caching, Architecture & Legal Hardening  
**Status:** Completed  
**Estimated Impact:** High (Updates `/about` with accurate Privacy, Legal, MIT License & Open-Source Attribution sections; adds camera pre-permission consent gate in `IsbnScannerComponent` and external lookup disclosure in `BookMetadataLookupComponent`; hardens `isSafeCoverUrl`, `ImageOptimizerService`, and `index.html` CSP).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `src/index.html` (`L1-27`): `<meta http-equiv="Content-Security-Policy">` (`L11-14`) and `<meta name="referrer">` (`L15`).
- `src/app/features/about/pages/about-page/about-page.ts` (`L1-35`) & `about-page.html` (`L1-120`): Current `/about` page implementation.
- `src/app/core/i18n/domains/about.i18n.ts` (created in Task 12.1) & `src/app/core/i18n/domains/books.i18n.ts`: `about` and `bookForm` dictionary strings.
- `src/app/features/books/components/isbn-scanner/isbn-scanner.ts` (`L45-135`) & `isbn-scanner.html` (`L1-119`): Camera auto-start in `ngAfterViewInit()` (`L65-67`).
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.html` (`L1-170`): Search input and tabs for external metadata lookup.
- `src/app/features/books/schemas/book.schema.ts` (`L25-42`): `isSafeCoverUrl()` validation helper.
- `src/app/features/books/services/image-optimizer.service.ts` (`L50-80`): `optimizeRemoteUrl()` remote cover fetch and fallback logic.
- `LICENSE` (`L1-21`): MIT License text (`Copyright (c) 2026 Aitor Gallego-Casilda Romero`).

**Files to Create / Update:**

- `src/index.html`
- `src/app/core/i18n/domains/about.i18n.ts`
- `src/app/core/i18n/domains/books.i18n.ts`
- `src/app/features/about/pages/about-page/about-page.ts`
- `src/app/features/about/pages/about-page/about-page.html`
- `src/app/features/about/pages/about-page/about-page.spec.ts`
- `src/app/features/books/components/isbn-scanner/isbn-scanner.ts`
- `src/app/features/books/components/isbn-scanner/isbn-scanner.html`
- `src/app/features/books/components/isbn-scanner/isbn-scanner.spec.ts`
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.html`
- `src/app/features/books/components/book-metadata-lookup/book-metadata-lookup.spec.ts`
- `src/app/features/books/schemas/book.schema.ts`
- `src/app/features/books/schemas/book.schema.spec.ts`
- `src/app/features/books/services/image-optimizer.service.ts`
- `src/app/features/books/services/image-optimizer.service.spec.ts`

---

## 2. Technical Objectives

1. **Transparent Legal, Privacy, License & Attribution Sections in `/about` (`about-page.ts`, `about-page.html`, `about.i18n.ts`):**
   - Refine the Local-First manifesto copy so it is 100% accurate: clarify that all library data, reading logs, series, and settings are stored strictly on-device (`IndexedDB` / `LocalStorage`) with zero telemetry or cloud accounts, while **opt-in** ISBN/title searches query **Open Library (Internet Archive)** and **Google Books API** directly from the browser (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`).
   - Add a structured **Privacy & Device Permissions** card detailing:
     - **Local Storage (`IndexedDB` & `LocalStorage`):** Data remains exclusively on the user's device until exported or cleared in `/settings`.
     - **External Metadata Queries (Opt-In):** Triggered only when the user manually executes an ISBN/title search; sends only the search query and standard HTTP request headers (IP address) to Open Library / Google Books.
     - **Camera Access (Opt-In):** Used exclusively in-browser via `html5-qrcode` to decode ISBN barcodes locally; video frames are never transmitted or stored.
   - Add a **Legal Notice, License & Open-Source Attributions** card displaying:
     - **MIT License** (`Copyright © 2026 Aitor Gallego-Casilda Romero`), noting that the software is provided _"as is"_ without warranty and reminding users to export periodic JSON backups in `/settings`.
     - **Third-Party APIs & Open-Source Stack Attributions:** Credit Open Library, Google Books API, Angular, Tailwind CSS, Lucide Icons, Zod, and `html5-qrcode`.
2. **Explicit Camera Consent Gate & External Lookup Disclosure (`isbn-scanner.*`, `book-metadata-lookup.*`):**
   - In `IsbnScannerComponent` (`isbn-scanner.ts#L65-67`), do **not** call `this.startCamera()` automatically inside `ngAfterViewInit()` unless the user has already granted session consent (`private static sessionCameraConsent = false` or an explicit `"Activar cámara"` / `"Enable camera"` button click in the idle state).
   - Add an `idle` state to `ScannerState` (`'idle' | 'starting' | 'scanning' | 'error' | 'permission-denied'`) showing a clear local-privacy message and a primary CTA button (`min-h-[44px]`) to start the camera stream.
   - In `BookMetadataLookupComponent` (`book-metadata-lookup.html`), display a subtle, informative privacy caption noting that searches query Open Library and Google Books and compress covers locally.
3. **URL Validation, Remote Cover Fetch & CSP Hardening (`book.schema.ts`, `image-optimizer.service.ts`, `src/index.html`):**
   - In `isSafeCoverUrl()` (`book.schema.ts#L25-37`):
     - Reject plain `http://` URLs (require `https://` for remote URLs).
     - Restrict `data:` URLs to raster formats only: `/^data:image\/(webp|jpeg|jpg|png|gif|avif);base64,[a-z0-9+/=\s]+$/i` (blocking `data:image/svg+xml`).
   - In `ImageOptimizerService.optimizeRemoteUrl()` (`image-optimizer.service.ts#L52-77`):
     - Enforce an `AbortController` timeout (`timeoutMs = 6000`).
     - Validate that `blob.type` starts with `image/` and is not `image/svg+xml`.
     - On network/CORS/decode failure, return `''` instead of returning the raw unverified remote `https://` URL—guaranteeing that persisted covers are always self-contained local `data:image/*` strings and preventing third-party IP tracking on catalog renders.
   - In `src/index.html` (`L13`), tighten `img-src` from `img-src 'self' data: blob: https:;` to `img-src 'self' data: blob: https://covers.openlibrary.org https://books.google.com https://*.googleusercontent.com;`.

---

## 3. Verification Gate

- [x] `npm run test:file -- src/app/features/about/pages/about-page/about-page.spec.ts`
- [x] `npm run test:file -- src/app/features/books/components/isbn-scanner/isbn-scanner.spec.ts`
- [x] `npm run test:file -- src/app/features/books/schemas/book.schema.spec.ts`
- [x] `npm run test:file -- src/app/features/books/services/image-optimizer.service.spec.ts`
- [x] `npm run verify:quiet`
