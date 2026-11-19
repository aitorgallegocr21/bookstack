import {
  formatLocalizedDate,
  formatLocalizedMonth,
  formatLocalizedNumber,
  formatShortMonth,
  formatSpanishDate,
  formatSpanishMonth,
  getCurrentLocalDateTime,
  getDateTimeFormatter,
  getLocaleCollator,
  getNumberFormatter,
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

    it('should return formatted local date-time string from getCurrentLocalDateTime', () => {
      const fixedDate = new Date(2026, 10, 12, 14, 5); // month index 10 = November
      const result = getCurrentLocalDateTime(fixedDate);
      expect(result).toBe('2026-11-12T14:05');
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

  describe('memoized Intl registries and helpers', () => {
    it('should return identical cached Intl instances for matching locale and options', () => {
      const dtf1 = getDateTimeFormatter('es-ES', { month: 'short', timeZone: 'UTC' });
      const dtf2 = getDateTimeFormatter('es-ES', { timeZone: 'UTC', month: 'short' });
      const dtf3 = getDateTimeFormatter('en-US', { month: 'short', timeZone: 'UTC' });
      expect(dtf1).toBe(dtf2);
      expect(dtf1).not.toBe(dtf3);

      const nf1 = getNumberFormatter('es-ES', { maximumFractionDigits: 1 });
      const nf2 = getNumberFormatter('es-ES', { maximumFractionDigits: 1 });
      const nf3 = getNumberFormatter('en-US', { maximumFractionDigits: 1 });
      expect(nf1).toBe(nf2);
      expect(nf1).not.toBe(nf3);

      const col1 = getLocaleCollator('es-ES', { sensitivity: 'base' });
      const col2 = getLocaleCollator('es-ES', { sensitivity: 'base' });
      const col3 = getLocaleCollator('en-US', { sensitivity: 'base' });
      expect(col1).toBe(col2);
      expect(col1).not.toBe(col3);
    });

    it('should format numbers using formatLocalizedNumber', () => {
      expect(formatLocalizedNumber(1234.5, 'en-US', { maximumFractionDigits: 1 })).toBe('1,234.5');
    });

    it('should format both YYYY-MM strings and Date instances with formatShortMonth', () => {
      expect(formatShortMonth('2026-01', 'en-US')).toBe('Jan');
      expect(formatShortMonth(new Date('2026-03-01T00:00:00Z'), 'en-US')).toBe('Mar');
      expect(formatShortMonth('invalid-key', 'en-US')).toBe('invalid-key');
    });
  });
});
