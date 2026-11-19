/**
 * Pure ISBN-10 / ISBN-13 validation, checksum, and normalization utilities.
 */

const ISBN_10_PATTERN = /^\d{9}[\dX]$/;
const ISBN_13_PATTERN = /^(978|979)\d{10}$/;

/**
 * Strips hyphens, spaces, and non-ISBN prefixes, uppercasing trailing 'x' to 'X'.
 */
export function cleanIsbnInput(raw: string): string {
  return raw
    .replace(/^\s*isbn(?:[-_\s]?(?:10|13))?[:\s-]*/i, '')
    .replace(/[^0-9xX]/g, '')
    .toUpperCase();
}

/**
 * Validates a 10-character ISBN using the Modulo-11 positional checksum.
 */
export function isValidIsbn10(raw: string): boolean {
  const cleaned = cleanIsbnInput(raw);
  if (!ISBN_10_PATTERN.test(cleaned)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const char = cleaned[i];
    const digit = char === 'X' ? 10 : Number(char);
    sum += (10 - i) * digit;
  }

  return sum % 11 === 0;
}

/**
 * Validates a 13-digit Bookland ISBN (978/979 prefix) using the Modulo-10 alternating weights (1, 3) checksum.
 */
export function isValidIsbn13(raw: string): boolean {
  const cleaned = cleanIsbnInput(raw);
  if (!ISBN_13_PATTERN.test(cleaned)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const digit = Number(cleaned[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  return sum % 10 === 0;
}

/**
 * Returns true if the input is a mathematically valid ISBN-13 or ISBN-10.
 */
export function isValidIsbn(raw: string): boolean {
  return isValidIsbn13(raw) || isValidIsbn10(raw);
}

/**
 * Converts a valid ISBN-10 to its canonical 13-digit ISBN-13 equivalent.
 * Returns null if the input is not a valid ISBN-10.
 */
export function convertIsbn10To13(isbn10: string): string | null {
  if (!isValidIsbn10(isbn10)) {
    return null;
  }

  const cleaned = cleanIsbnInput(isbn10);
  const prefix12 = `978${cleaned.slice(0, 9)}`;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(prefix12[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return `${prefix12}${checkDigit}`;
}

/**
 * Normalizes a valid ISBN-10 or ISBN-13 into its canonical 13-digit ISBN-13 string.
 * Returns null if the input is invalid.
 */
export function normalizeIsbn(raw: string): string | null {
  const cleaned = cleanIsbnInput(raw);

  if (isValidIsbn13(cleaned)) {
    return cleaned;
  }

  if (isValidIsbn10(cleaned)) {
    return convertIsbn10To13(cleaned);
  }

  return null;
}

/**
 * Compares two raw ISBN strings by their canonical normalized ISBN-13 values,
 * falling back to cleaned string comparison only when both are non-standard identifiers.
 */
export function areIsbnsEquivalent(a?: string | null, b?: string | null): boolean {
  if (!a || !b) {
    return false;
  }

  const cleanA = cleanIsbnInput(a);
  const cleanB = cleanIsbnInput(b);
  if (!cleanA || !cleanB) {
    return false;
  }

  const normA = normalizeIsbn(cleanA);
  const normB = normalizeIsbn(cleanB);

  if (normA && normB) {
    return normA === normB;
  }

  if (!normA && !normB) {
    return cleanA === cleanB;
  }

  return false;
}
