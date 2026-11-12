import {
  formatLocalizedDate,
  formatLocalizedMonth,
  formatSpanishDate,
  formatSpanishMonth,
} from './date-formatter';

describe('date-formatter utilities', () => {
  describe('formatLocalizedDate & formatSpanishDate', () => {
    it('should return an empty string for null, undefined, or empty inputs', () => {
      expect(formatLocalizedDate(undefined)).toBe('');
      expect(formatLocalizedDate(null)).toBe('');
      expect(formatLocalizedDate('')).toBe('');
    });

    it('should return the original string when input cannot be parsed as a date', () => {
      expect(formatLocalizedDate('not-a-date')).toBe('not-a-date');
    });

    it('should format valid ISO dates cleanly with and without time', () => {
      const dateOnly = formatSpanishDate('2026-03-15T14:30:00.000Z');
      expect(dateOnly).toMatch(/\d{2}\/\d{2}\/2026/);

      const withTime = formatSpanishDate('2026-03-15T14:30:00.000Z', true);
      expect(withTime).toContain('2026');
      expect(withTime).toContain(':');
    });
  });

  describe('formatLocalizedMonth & formatSpanishMonth', () => {
    it('should return an empty string for empty inputs and preserve invalid month keys', () => {
      expect(formatLocalizedMonth('')).toBe('');
      expect(formatLocalizedMonth(null)).toBe('');
      expect(formatLocalizedMonth('2026/03')).toBe('2026/03');
    });

    it('should format YYYY-MM keys with a capitalized month name and year', () => {
      const esMonth = formatSpanishMonth('2026-01');
      expect(esMonth).toBe('Enero 2026');

      const enMonth = formatLocalizedMonth('2026-01', 'en-US');
      expect(enMonth).toBe('January 2026');
    });
  });
});
