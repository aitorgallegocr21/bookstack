# Task 19.6: Zero-Dependency Web Crypto Encrypted Backups (`PBKDF2` + `AES-GCM-256`)

## Objective

Implement zero-dependency, browser-native authenticated encryption (`PBKDF2` + `AES-GCM-256` via Web Crypto API `crypto.subtle`) so users can export password-encrypted `.JSON` and `.ZIP` backups suitable for untrusted cloud drives, and import them transparently with inline password decryption before entering BookStack's standard validation preview.

---

## Target Files & Line Pointers

- **Create:**
  - `src/app/features/settings/utils/backup-crypto.utils.ts`
  - `src/app/features/settings/utils/backup-crypto.utils.spec.ts`
- **Read & Edit:**
  - `src/app/features/settings/schemas/backup.schema.ts` (`L1-L120` — add `EncryptedBackupEnvelopeSchema` & `isEncryptedBackupPayload()`)
  - `src/app/features/settings/models/data-portability.model.ts` (`L1-L71` — add `EncryptedBackupEnvelope`, `EncryptedBackupPayloadType = 'json' | 'zip'`, and `BackupExportEncryptionOptions`)
  - `src/app/features/settings/services/data-portability.service.ts` (`L250-L600` — add `exportEncryptedJsonBackup(password)`, `exportEncryptedZipBackup(password)`, `detectEncryptedBackup(file)`, and `decryptBackupFile(file, password)` feeding directly into the existing JSON / `.ZIP` import preview pipelines)
  - `src/app/features/settings/components/data-portability-section/data-portability-section.ts` (`L1-L278`) & `.html` (add optional encryption toggle + password / confirm-password fields + strength indicator on Export, and inline password prompt card when an encrypted backup file is selected on Import)
  - `src/app/core/i18n/domains/settings.i18n.ts` (bilingual `es`/`en` keys for encryption controls, password strength, mismatch validation, and wrong-password / corrupted-file errors)

---

## Functional & Technical Requirements

1. **Cryptographic Design (`src/app/features/settings/utils/backup-crypto.utils.ts`):**
   - **Zero external packages** — strictly uses `globalThis.crypto.subtle` and `globalThis.crypto.getRandomValues()`.
   - **Parameters:**
     - KDF: `PBKDF2` with `SHA-256`, `250_000` iterations, random `16`-byte (`128`-bit) salt.
     - Cipher: `AES-GCM` with `256`-bit derived key, random `12`-byte (`96`-bit) IV/nonce.
   - **Envelope Format (`EncryptedBackupEnvelope`):**
     ```ts
     {
       format: 'bookstack-encrypted-backup',
       version: 1,
       payloadType: 'json' | 'zip',
       kdf: 'PBKDF2-SHA256',
       iterations: 250000,
       cipher: 'AES-GCM-256',
       salt: '<base64>',
       iv: '<base64>',
       ciphertext: '<base64>',
       exportedAt: '<ISO-8601>'
     }
     ```
   - **Typed Error Handling:**
     - `BackupCryptoError` with `code: 'CRYPTO_UNAVAILABLE' | 'EMPTY_PASSWORD' | 'UNSUPPORTED_FORMAT' | 'INVALID_PASSWORD_OR_CORRUPTED'`.
     - Enforce minimum iterations floor (`>= 100_000`) and cap (`<= 2_000_000`) in `EncryptedBackupEnvelopeSchema` to prevent DoS from malformed files.
   - **Memory Hygiene:** Never persist or log the passphrase anywhere (`localStorage`, IndexedDB, console, or signals after operation completes; clear password input signals immediately after export/import finishes).
2. **Export UX (`DataPortabilitySectionComponent`):**
   - Toggle: **"Protect backup with a password (AES-256)"** (`pref-backup-encryption`).
   - When enabled, reveals password + confirm-password inputs (with show/hide eye buttons `>= 44×44px`), a lightweight client-side strength indicator (Weak / Fair / Strong based on length & character classes, minimum 8 chars required), and a clear warning that forgotten passwords cannot be recovered (100% Local-First).
   - Full JSON export downloads `bookstack-backup-encrypted-YYYY-MM-DD.enc.json`; `.ZIP` bundle export encrypts the generated `.ZIP` bytes and downloads `bookstack-bundle-encrypted-YYYY-MM-DD.enc.json` (carrying `payloadType: 'zip'`).
3. **Transparent Import UX (`DataPortabilitySectionComponent`):**
   - When the user selects any `.json` / `.enc.json` file, `DataPortabilityService` inspects whether it matches `bookstack-encrypted-backup`.
   - If encrypted, displays a clean inline decryption card (_"This backup is encrypted — enter your password to unlock"_) without showing an error.
   - On submit:
     - Decrypts in memory; if `payloadType === 'json'`, parses via `previewJsonImport()`; if `payloadType === 'zip'`, passes decrypted `Uint8Array` into `previewZipImport()`.
     - Wrong password or tampered ciphertext displays a clear, friendly bilingual error allowing immediate retry.

---

## Verification & Acceptance Criteria

- [ ] `npm run test:file -- src/app/features/settings/utils/backup-crypto.utils.spec.ts` passes:
  - Round-trip encryption/decryption for UTF-8 JSON strings and arbitrary binary `.ZIP` bytes.
  - Verifies different salt/IV are generated for identical plaintext + password.
  - Rejects wrong password with `INVALID_PASSWORD_OR_CORRUPTED`.
  - Rejects tampered ciphertext (flipped byte) with `INVALID_PASSWORD_OR_CORRUPTED`.
  - Rejects malformed envelope / out-of-range iterations.
- [ ] Updated `data-portability.service.spec.ts` and `data-portability-section.spec.ts` pass.
- [ ] `npm run verify:quiet` passes cleanly.
