import { describe, expect, it } from 'vitest';
import {
  BACKUP_CRYPTO_CIPHER,
  BACKUP_CRYPTO_FORMAT,
  BACKUP_CRYPTO_ITERATIONS,
  BACKUP_CRYPTO_KDF,
  BACKUP_CRYPTO_VERSION,
  BackupCryptoError,
  decryptBackupPayload,
  encryptBackupPayload,
  evaluatePasswordStrength,
  isWebCryptoAvailable,
} from './backup-crypto.utils';

describe('backup-crypto.utils', () => {
  it('detects Web Crypto API availability in test environment', () => {
    expect(isWebCryptoAvailable()).toBe(true);
  });

  it('evaluates password strength levels accurately', () => {
    expect(evaluatePasswordStrength('short')).toBe('weak');
    expect(evaluatePasswordStrength('abcdefgh')).toBe('weak');
    expect(evaluatePasswordStrength('Abcdefgh')).toBe('fair');
    expect(evaluatePasswordStrength('Abcdef12!@')).toBe('strong');
  });

  it('round-trips UTF-8 JSON strings with PBKDF2-SHA256 + AES-GCM-256', async () => {
    const payload = JSON.stringify({
      app: 'BookStack',
      title: 'Cien años de soledad — Gabriel García Márquez 📚',
      books: [{ id: '1', pages: 471 }],
    });

    const envelope = await encryptBackupPayload(payload, 'S3cur3-Passphrase!', 'json');

    expect(envelope.format).toBe(BACKUP_CRYPTO_FORMAT);
    expect(envelope.version).toBe(BACKUP_CRYPTO_VERSION);
    expect(envelope.payloadType).toBe('json');
    expect(envelope.kdf).toBe(BACKUP_CRYPTO_KDF);
    expect(envelope.iterations).toBe(BACKUP_CRYPTO_ITERATIONS);
    expect(envelope.cipher).toBe(BACKUP_CRYPTO_CIPHER);
    expect(envelope.ciphertext).not.toContain('Cien años');

    const decrypted = await decryptBackupPayload(envelope, 'S3cur3-Passphrase!');
    expect(decrypted.payloadType).toBe('json');
    expect(decrypted.text).toBe(payload);
  });

  it('round-trips arbitrary binary ZIP byte arrays', async () => {
    const zipBytes = new Uint8Array([80, 75, 3, 4, 0, 255, 128, 64, 32, 16, 8, 4, 2, 1]);
    const envelope = await encryptBackupPayload(zipBytes, 'ZipPassw0rd!', 'zip');

    expect(envelope.payloadType).toBe('zip');

    const decrypted = await decryptBackupPayload(envelope, 'ZipPassw0rd!');
    expect(decrypted.payloadType).toBe('zip');
    expect(decrypted.text).toBeNull();
    expect(decrypted.bytes).toEqual(zipBytes);
  });

  it('generates distinct random salt and IV for identical plaintext and password', async () => {
    const first = await encryptBackupPayload('same-content', 'SamePassword1!', 'json');
    const second = await encryptBackupPayload('same-content', 'SamePassword1!', 'json');

    expect(first.salt).not.toBe(second.salt);
    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('rejects empty password on encrypt and decrypt', async () => {
    await expect(encryptBackupPayload('data', '', 'json')).rejects.toMatchObject({
      code: 'EMPTY_PASSWORD',
    } satisfies Partial<BackupCryptoError>);

    const envelope = await encryptBackupPayload('data', 'ValidPass1!', 'json');
    await expect(decryptBackupPayload(envelope, '')).rejects.toMatchObject({
      code: 'EMPTY_PASSWORD',
    } satisfies Partial<BackupCryptoError>);
  });

  it('rejects wrong password with INVALID_PASSWORD_OR_CORRUPTED', async () => {
    const envelope = await encryptBackupPayload('{"secret":true}', 'CorrectPass1!', 'json');

    await expect(decryptBackupPayload(envelope, 'WrongPass1!')).rejects.toMatchObject({
      code: 'INVALID_PASSWORD_OR_CORRUPTED',
    } satisfies Partial<BackupCryptoError>);
  });

  it('rejects tampered ciphertext (flipped byte) with INVALID_PASSWORD_OR_CORRUPTED', async () => {
    const envelope = await encryptBackupPayload('{"secret":true}', 'CorrectPass1!', 'json');
    const rawCipher = atob(envelope.ciphertext);
    const bytes = new Uint8Array(rawCipher.length);
    for (let i = 0; i < rawCipher.length; i += 1) {
      bytes[i] = rawCipher.charCodeAt(i);
    }
    bytes[0] = bytes[0] ^ 0xff;
    const tamperedCiphertext = btoa(String.fromCharCode(...bytes));

    await expect(
      decryptBackupPayload({ ...envelope, ciphertext: tamperedCiphertext }, 'CorrectPass1!')
    ).rejects.toMatchObject({
      code: 'INVALID_PASSWORD_OR_CORRUPTED',
    } satisfies Partial<BackupCryptoError>);
  });

  it('rejects malformed envelopes or out-of-range iterations with UNSUPPORTED_FORMAT', async () => {
    const envelope = await encryptBackupPayload('{"secret":true}', 'CorrectPass1!', 'json');

    await expect(
      decryptBackupPayload({ ...envelope, iterations: 1000 }, 'CorrectPass1!')
    ).rejects.toMatchObject({
      code: 'UNSUPPORTED_FORMAT',
    } satisfies Partial<BackupCryptoError>);

    await expect(
      decryptBackupPayload({ ...envelope, iterations: 5_000_000 }, 'CorrectPass1!')
    ).rejects.toMatchObject({
      code: 'UNSUPPORTED_FORMAT',
    } satisfies Partial<BackupCryptoError>);
  });
});
