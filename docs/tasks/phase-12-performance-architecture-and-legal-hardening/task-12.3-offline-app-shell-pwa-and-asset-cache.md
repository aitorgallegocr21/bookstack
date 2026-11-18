# Task 12.3: Offline App Shell Cache (PWA Manifest & Static Asset Caching Strategy)

**Phase:** Phase 12: Performance, Caching, Architecture & Legal Hardening  
**Status:** Completed  
**Estimated Impact:** Medium (Configures `@angular/service-worker`, `ngsw-config.json`, and `public/manifest.webmanifest` so BookStack loads and operates 100% offline upon reload).

---

## 1. Target Files & Line Pointers

Read ONLY these specific file ranges before implementing:

- `package.json` (`L20-56`): Dependencies and Angular version (`^21.2.0` / build tooling).
- `angular.json` (`L17-55`): Build options (`assets`, `configurations.production`).
- `src/app/app.config.ts` (`L1-15`): Root `ApplicationConfig` providers.
- `src/index.html` (`L1-27`): `<head>` meta tags, `<meta name="theme-color">`, and manifest link.

**Files to Create / Update:**

- `package.json` & `package-lock.json` (install `@angular/service-worker` matching `@angular/core`)
- `ngsw-config.json`
- `public/manifest.webmanifest`
- `angular.json`
- `src/app/app.config.ts`
- `src/index.html`

---

## 2. Technical Objectives

1. **Web App Manifest (`public/manifest.webmanifest` & `src/index.html`):**
   - Create `public/manifest.webmanifest` with `name: "BookStack"`, `short_name: "BookStack"`, `start_url: "./"`, `display: "standalone"`, `background_color: "#09090b"`, `theme_color: "#4f46e5"`, and icon definitions (`favicon.ico`).
   - Link `<link rel="manifest" href="manifest.webmanifest" />` and `<meta name="theme-color" content="#4f46e5" />` in `src/index.html`.
2. **Angular Service Worker Configuration (`ngsw-config.json`, `angular.json`, `src/app/app.config.ts`):**
   - Install `@angular/service-worker` aligned with the installed Angular major/minor version.
   - Create `ngsw-config.json`:
     - `app` assetGroup with `installMode: "prefetch"`, `updateMode: "prefetch"` caching `/index.html`, `/manifest.webmanifest`, `/favicon.ico`, `/*.css`, and `/*.js`.
     - `assets` assetGroup with `installMode: "lazy"`, `updateMode: "prefetch"` for static media under `/assets/**` or `/icons/**`.
     - Do **not** cache external metadata endpoints (`openlibrary.org`, `googleapis.com`), keeping external API behavior purely on-demand.
   - Enable `"serviceWorker": "ngsw-config.json"` inside `angular.json` under `projects.bookstack.architect.build.configurations.production`.
   - Register `provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' })` in `src/app/app.config.ts`.

---

## 3. Verification Gate

- [x] `npm run verify:quiet` (verifying production build outputs `dist/bookstack/browser/ngsw.json` and `ngsw-worker.js`)
