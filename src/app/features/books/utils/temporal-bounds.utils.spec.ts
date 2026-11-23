import {
  MANUAL_ANTIQUE_YEAR_WARN_THRESHOLD,
  MIN_HISTORICAL_PUBLICATION_YEAR,
  MIN_READING_ACTIVITY_YEAR,
  extractYearFromIsoPrefix,
  getMaxAllowedIsoDate,
  getMaxAllowedYear,
  isValidPublicationYear,
  isValidReadingActivityYear,
  requiresManualAntiqueYearConfirmation,
  sanitizeFutureIsoDate,
  suggestCorrectedYear,
} from './temporal-bounds.utils';

describe('temporal-bounds.utils', () => {
  const refDate = new Date('2026-06-15T12:00:00.000Z');

  it('computes max allowed year and ISO date from referenceDate', () => {
    expect(MIN_READING_ACTIVITY_YEAR).toBe(1900);
    expect(MIN_HISTORICAL_PUBLICATION_YEAR).toBe(1);
    expect(MANUAL_ANTIQUE_YEAR_WARN_THRESHOLD).toBe(1900);
    expect(getMaxAllowedYear(refDate)).toBe(2027);
    expect(getMaxAllowedIsoDate(refDate)).toBe('2027-12-31');
  });

  it('validates reading activity years within [1900..currentYear + 1]', () => {
    expect(isValidReadingActivityYear(1900, refDate)).toBe(true);
    expect(isValidReadingActivityYear(2026, refDate)).toBe(true);
    expect(isValidReadingActivityYear(2027, refDate)).toBe(true);
    expect(isValidReadingActivityYear(1899, refDate)).toBe(false);
    expect(isValidReadingActivityYear(2925, refDate)).toBe(false);
    expect(isValidReadingActivityYear(2026.5, refDate)).toBe(false);
  });

  it('validates publication years within [1..currentYear + 1]', () => {
    expect(isValidPublicationYear(1, refDate)).toBe(true);
    expect(isValidPublicationYear(1605, refDate)).toBe(true);
    expect(isValidPublicationYear(2027, refDate)).toBe(true);
    expect(isValidPublicationYear(0, refDate)).toBe(false);
    expect(isValidPublicationYear(-50, refDate)).toBe(false);
    expect(isValidPublicationYear(2925, refDate)).toBe(false);
  });

  it('extracts 4-digit year from ISO date prefixes', () => {
    expect(extractYearFromIsoPrefix('2026-05-10')).toBe(2026);
    expect(extractYearFromIsoPrefix('2925-05-10T10:00:00Z')).toBe(2925);
    expect(extractYearFromIsoPrefix('0025-01-01')).toBe(25);
    expect(extractYearFromIsoPrefix('')).toBeNull();
    expect(extractYearFromIsoPrefix(null)).toBeNull();
    expect(extractYearFromIsoPrefix('invalid-date')).toBeNull();
  });

  it('skips antique publicationYear confirmation when sourced from an external provider', () => {
    const result = requiresManualAntiqueYearConfirmation({
      publicationYear: 1605,
      isFromExternalProvider: true,
    });

    expect(result).toEqual({
      required: false,
      anomalousYears: [],
    });
  });

  it('requires confirmation when antique publicationYear or reading dates are entered manually', () => {
    const pubResult = requiresManualAntiqueYearConfirmation({
      publicationYear: 1605,
      isFromExternalProvider: false,
    });
    expect(pubResult).toEqual({
      required: true,
      anomalousYears: [1605],
    });

    const dateResult = requiresManualAntiqueYearConfirmation({
      publicationYear: 2020,
      startDate: '1850-01-01',
      endDate: '0025-03-10',
      isFromExternalProvider: false,
    });
    expect(dateResult).toEqual({
      required: true,
      anomalousYears: [1850, 25],
    });

    const normalResult = requiresManualAntiqueYearConfirmation({
      publicationYear: 1984,
      startDate: '2025-01-01',
      endDate: '2025-02-01',
      isFromExternalProvider: false,
    });
    expect(normalResult).toEqual({
      required: false,
      anomalousYears: [],
    });
  });

  it('suggests corrected years for typo years like 2925, 3024, 0025, and clamps overflow', () => {
    expect(suggestCorrectedYear(2925, refDate)).toBe(2025);
    expect(suggestCorrectedYear(3024, refDate)).toBe(2024);
    expect(suggestCorrectedYear(2927, refDate)).toBe(2027);
    expect(suggestCorrectedYear(2999, refDate)).toBe(2026);
    expect(suggestCorrectedYear(25, refDate)).toBe(2025);
    expect(suggestCorrectedYear(2025, refDate)).toBe(2025);
    expect(suggestCorrectedYear(Number.NaN, refDate)).toBe(2026);
  });

  it('rewrites future typo years in ISO date strings while preserving valid dates', () => {
    expect(sanitizeFutureIsoDate('2925-05-10', refDate)).toBe('2025-05-10');
    expect(sanitizeFutureIsoDate('2925-05-10T14:30:00.000Z', refDate)).toBe(
      '2025-05-10T14:30:00.000Z'
    );
    expect(sanitizeFutureIsoDate('2026-05-10', refDate)).toBe('2026-05-10');
    expect(sanitizeFutureIsoDate('1998-12-01', refDate)).toBe('1998-12-01');
  });
});
