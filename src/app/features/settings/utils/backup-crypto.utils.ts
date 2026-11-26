import {
  EncryptedBackupEnvelope,
  EncryptedBackupPayloadType,
} from '../models/data-portability.model';

export const BACKUP_CRYPTO_FORMAT = 'bookstack-encrypted-backup' as const;
export const BACKUP_CRYPTO_VERSION = 1 as const;
export const BACKUP_CRYPTO_KDF = 'PBKDF2-SHA256' as const;
export const BACKUP_CRYPTO_CIPHER = 'AES-GCM-256' as const;
export const BACKUP_CRYPTO_ITERATIONS = 250_000;
export const BACKUP_CRYPTO_MIN_ITERATIONS = 100_000;
export const BACKUP_CRYPTO_MAX_ITERATIONS = 2_000_000;
export const BACKUP_CRYPTO_SALT_BYTES = 16;
export const BACKUP_CRYPTO_IV_BYTES = 12;
export const BACKUP_MIN_PASSWORD_LENGTH = 8;

export type BackupCryptoErrorCode =
  'CRYPTO_UNAVAILABLE' | 'EMPTY_PASSWORD' | 'UNSUPPORTED_FORMAT' | 'INVALID_PASSWORD_OR_CORRUPTED';

export type PasswordStrengthLevel = 'weak' | 'fair' | 'strong';

export class BackupCryptoError extends Error {
  readonly code: BackupCryptoErrorCode;

  constructor(code: BackupCryptoErrorCode, message: string) {
    super(message);
    this.name = 'BackupCryptoError';
    this.code = code;
  }
}

export function isWebCryptoAvailable(): boolean {
  return (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.subtle !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  );
}

/**
 * Evaluates client-side passphrase strength based on length and character diversity.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthLevel {
  if (password.length < BACKUP_MIN_PASSWORD_LENGTH) {
    return 'weak';
  }

  let classes = 0;
  if (/[a-z]/.test(password)) classes += 1;
  if (/[A-Z]/.test(password)) classes += 1;
  if (/[0-9]/.test(password)) classes += 1;
  if (/[^a-zA-Z0-9]/.test(password)) classes += 1;

  if (password.length >= 14 && classes >= 3) {
    return 'strong';
  }
  if (password.length >= 10 && classes >= 3) {
    return 'strong';
  }
  if (classes >= 2 || password.length >= 12) {
    return 'fair';
  }
  return 'weak';
}

function assertWebCrypto(): SubtleCrypto {
  if (!isWebCryptoAvailable()) {
    throw new BackupCryptoError(
      'CRYPTO_UNAVAILABLE',
      'Web Crypto API (crypto.subtle) is not available in this environment.'
    );
  }
  return globalThis.crypto.subtle;
}

function toArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  const parts: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const slice = bytes.subarray(offset, offset + chunkSize);
    parts.push(String.fromCharCode(...slice));
  }
  return btoa(parts.join(''));
}

function base64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    throw new BackupCryptoError(
      'INVALID_PASSWORD_OR_CORRUPTED',
      'Encrypted payload contains invalid Base64 data.'
    );
  }
}

async function deriveAesGcmKey(
  subtle: SubtleCrypto,
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
  usage: KeyUsage
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    [usage]
  );
}

/**
 * Encrypts a UTF-8 JSON string or binary ZIP byte array with PBKDF2-SHA256 + AES-GCM-256.
 */
export async function encryptBackupPayload(
  plaintext: string | Uint8Array,
  password: string,
  payloadType: EncryptedBackupPayloadType
): Promise<EncryptedBackupEnvelope> {
  if (!password) {
    throw new BackupCryptoError('EMPTY_PASSWORD', 'Encryption password must not be empty.');
  }

  const subtle = assertWebCrypto();
  const salt = new Uint8Array(BACKUP_CRYPTO_SALT_BYTES);
  const iv = new Uint8Array(BACKUP_CRYPTO_IV_BYTES);
  globalThis.crypto.getRandomValues(salt);
  globalThis.crypto.getRandomValues(iv);

  const plaintextBytes =
    typeof plaintext === 'string'
      ? new TextEncoder().encode(plaintext)
      : toArrayBufferView(plaintext);

  const key = await deriveAesGcmKey(subtle, password, salt, BACKUP_CRYPTO_ITERATIONS, 'encrypt');
  const encryptedBuffer = await subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintextBytes);

  return {
    format: BACKUP_CRYPTO_FORMAT,
    version: BACKUP_CRYPTO_VERSION,
    payloadType,
    kdf: BACKUP_CRYPTO_KDF,
    iterations: BACKUP_CRYPTO_ITERATIONS,
    cipher: BACKUP_CRYPTO_CIPHER,
    salt: uint8ArrayToBase64(salt),
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(encryptedBuffer)),
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Decrypts a validated EncryptedBackupEnvelope back into raw bytes (and UTF-8 text for JSON).
 */
export async function decryptBackupPayload(
  envelope: EncryptedBackupEnvelope,
  password: string
): Promise<{ payloadType: EncryptedBackupPayloadType; bytes: Uint8Array; text: string | null }> {
  if (!password) {
    throw new BackupCryptoError('EMPTY_PASSWORD', 'Decryption password must not be empty.');
  }

  if (
    envelope.format !== BACKUP_CRYPTO_FORMAT ||
    envelope.version !== BACKUP_CRYPTO_VERSION ||
    envelope.kdf !== BACKUP_CRYPTO_KDF ||
    envelope.cipher !== BACKUP_CRYPTO_CIPHER ||
    !Number.isInteger(envelope.iterations) ||
    envelope.iterations < BACKUP_CRYPTO_MIN_ITERATIONS ||
    envelope.iterations > BACKUP_CRYPTO_MAX_ITERATIONS
  ) {
    throw new BackupCryptoError(
      'UNSUPPORTED_FORMAT',
      'Unsupported or malformed encrypted backup envelope.'
    );
  }

  const subtle = assertWebCrypto();
  const salt = base64ToUint8Array(envelope.salt);
  const iv = base64ToUint8Array(envelope.iv);
  const ciphertext = base64ToUint8Array(envelope.ciphertext);

  if (salt.byteLength === 0 || iv.byteLength === 0 || ciphertext.byteLength === 0) {
    throw new BackupCryptoError(
      'INVALID_PASSWORD_OR_CORRUPTED',
      'Encrypted payload is missing required cryptographic fields.'
    );
  }

  try {
    const key = await deriveAesGcmKey(subtle, password, salt, envelope.iterations, 'decrypt');
    const decryptedBuffer = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const bytes = new Uint8Array(decryptedBuffer);
    const text = envelope.payloadType === 'json' ? new TextDecoder().decode(bytes) : null;

    return {
      payloadType: envelope.payloadType,
      bytes,
      text,
    };
  } catch (err) {
    if (err instanceof BackupCryptoError) {
      throw err;
    }
    throw new BackupCryptoError(
      'INVALID_PASSWORD_OR_CORRUPTED',
      'Invalid password or corrupted encrypted backup.'
    );
  }
}
