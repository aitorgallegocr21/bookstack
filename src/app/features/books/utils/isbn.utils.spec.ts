import {
  areIsbnsEquivalent,
  cleanIsbnInput,
  convertIsbn10To13,
  isValidIsbn,
  isValidIsbn10,
  isValidIsbn13,
  normalizeIsbn,
} from './isbn.utils';

describe('isbn.utils', () => {
  describe('cleanIsbnInput', () => {
    it('strips prefixes, spaces, and hyphens and uppercases trailing x', () => {
      expect(cleanIsbnInput('ISBN-13: 978-84-376-0494-7')).toBe('9788437604947');
      expect(cleanIsbnInput(' 0-439-42089-x ')).toBe('043942089X');
      expect(cleanIsbnInput('isbn 0-306-40615-2')).toBe('0306406152');
    });
  });

  describe('isValidIsbn10', () => {
    it('accepts valid ISBN-10 values including trailing X', () => {
      expect(isValidIsbn10('0-306-40615-2')).toBe(true);
      expect(isValidIsbn10('043942089X')).toBe(true);
      expect(isValidIsbn10('0-439-42089-x')).toBe(true);
    });

    it('rejects invalid checksums and malformed lengths', () => {
      expect(isValidIsbn10('0-306-40615-3')).toBe(false);
      expect(isValidIsbn10('123456789')).toBe(false);
      expect(isValidIsbn10('9780306406157')).toBe(false);
      expect(isValidIsbn10('0439X20891')).toBe(false);
    });
  });

  describe('isValidIsbn13', () => {
    it('accepts valid 978 and 979 ISBN-13 values', () => {
      expect(isValidIsbn13('978-0-306-40615-7')).toBe(true);
      expect(isValidIsbn13('9788437604947')).toBe(true);
      expect(isValidIsbn13('979-10-90636-07-1')).toBe(true);
    });

    it('rejects non-Bookland prefixes, invalid checksums, and non-13-digit values', () => {
      expect(isValidIsbn13('977-0-306-40615-0')).toBe(false);
      expect(isValidIsbn13('978-0-306-40615-8')).toBe(false);
      expect(isValidIsbn13('0306406152')).toBe(false);
    });
  });

  describe('isValidIsbn', () => {
    it('accepts either valid ISBN-10 or valid ISBN-13', () => {
      expect(isValidIsbn('0-306-40615-2')).toBe(true);
      expect(isValidIsbn('978-0-306-40615-7')).toBe(true);
      expect(isValidIsbn('not-an-isbn')).toBe(false);
    });
  });

  describe('convertIsbn10To13', () => {
    it('converts a valid ISBN-10 to its canonical ISBN-13', () => {
      expect(convertIsbn10To13('0-306-40615-2')).toBe('9780306406157');
      expect(convertIsbn10To13('043942089X')).toBe('9780439420891');
    });

    it('returns null for invalid ISBN-10 inputs', () => {
      expect(convertIsbn10To13('0306406153')).toBeNull();
      expect(convertIsbn10To13('9780306406157')).toBeNull();
    });
  });

  describe('normalizeIsbn', () => {
    it('normalizes both ISBN-10 and ISBN-13 to canonical 13-digit strings', () => {
      expect(normalizeIsbn('0-306-40615-2')).toBe('9780306406157');
      expect(normalizeIsbn('978-0-306-40615-7')).toBe('9780306406157');
      expect(normalizeIsbn('invalid')).toBeNull();
    });
  });

  describe('areIsbnsEquivalent', () => {
    it('treats matching ISBN-10 and ISBN-13 pairs as equivalent', () => {
      expect(areIsbnsEquivalent('0-306-40615-2', '9780306406157')).toBe(true);
      expect(areIsbnsEquivalent('ISBN 978-0-306-40615-7', '0306406152')).toBe(true);
    });

    it('returns false for different ISBNs or empty values', () => {
      expect(areIsbnsEquivalent('9780306406157', '9788437604947')).toBe(false);
      expect(areIsbnsEquivalent('', '9780306406157')).toBe(false);
      expect(areIsbnsEquivalent(null, undefined)).toBe(false);
    });

    it('falls back to cleaned comparison when both inputs are non-standard identifiers', () => {
      expect(areIsbnsEquivalent('123-45', '12345')).toBe(true);
      expect(areIsbnsEquivalent('12345', '9780306406157')).toBe(false);
    });
  });
});
