export const MIN_READING_ACTIVITY_YEAR = 1900;
export const MIN_HISTORICAL_PUBLICATION_YEAR = 1;
export const MANUAL_ANTIQUE_YEAR_WARN_THRESHOLD = 1900;

/**
 * Maximum allowed year for reading activity and publication dates (`currentYear + 1`).
 */
export function getMaxAllowedYear(referenceDate: Date = new Date()): number {
  return referenceDate.getFullYear() + 1;
}

/**
 * Maximum allowed ISO date string (`YYYY-12-31`) for reading activity inputs.
 */
export function getMaxAllowedIsoDate(referenceDate: Date = new Date()): string {
  return `${getMaxAllowedYear(referenceDate)}-12-31`;
}

/**
 * Validates whether a year is within standard personal reading activity bounds `[1900..currentYear + 1]`.
 */
export function isValidReadingActivityYear(
  year: number,
  referenceDate: Date = new Date()
): boolean {
  return (
    Number.isInteger(year) &&
    year >= MIN_READING_ACTIVITY_YEAR &&
    year <= getMaxAllowedYear(referenceDate)
  );
}

/**
 * Validates whether a book's publication year is within `[1..currentYear + 1]`.
 */
export function isValidPublicationYear(year: number, referenceDate: Date = new Date()): boolean {
  return (
    Number.isInteger(year) &&
    year >= MIN_HISTORICAL_PUBLICATION_YEAR &&
    year <= getMaxAllowedYear(referenceDate)
  );
}

/**
 * Extracts the 4-digit year from an ISO date prefix (`YYYY-MM-DD...`), or `null` if not parseable.
 */
export function extractYearFromIsoPrefix(rawDate?: string | null): number | null {
  if (!rawDate) {
    return null;
  }
  const match = rawDate.trim().match(/^(\d{4})-/);
  if (!match) {
    return null;
  }
  const year = Number.parseInt(match[1], 10);
  return Number.isFinite(year) ? year : null;
}

export interface AntiqueYearCheckParams {
  publicationYear?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isFromExternalProvider: boolean;
}

export interface AntiqueYearCheckResult {
  required: boolean;
  anomalousYears: number[];
}

/**
 * Source-aware check for antique/historical years (`< 1900`).
 * External metadata providers (Open Library, Google Books, Wikidata, etc.) may legitimately
 * return historical publication years without triggering a user confirmation warning.
 * Manual entries with years `< 1900` return `required: true` so the UI can confirm it is not a typo.
 */
export function requiresManualAntiqueYearConfirmation(
  params: AntiqueYearCheckParams
): AntiqueYearCheckResult {
  const anomalousYears: number[] = [];

  if (!params.isFromExternalProvider && params.publicationYear != null) {
    const pubYear = Number(params.publicationYear);
    if (
      Number.isInteger(pubYear) &&
      pubYear >= MIN_HISTORICAL_PUBLICATION_YEAR &&
      pubYear < MANUAL_ANTIQUE_YEAR_WARN_THRESHOLD
    ) {
      anomalousYears.push(pubYear);
    }
  }

  for (const rawDate of [params.startDate, params.endDate]) {
    const year = extractYearFromIsoPrefix(rawDate);
    if (year !== null && year < MANUAL_ANTIQUE_YEAR_WARN_THRESHOLD) {
      anomalousYears.push(year);
    }
  }

  const uniqueYears = Array.from(new Set(anomalousYears));
  return {
    required: uniqueYears.length > 0,
    anomalousYears: uniqueYears,
  };
}

/**
 * Suggests a corrected 4-digit year for typo years (e.g. `2925 -> 2025`, `3024 -> 2024`, `0025 -> 2025`),
 * clamping to `referenceDate.getFullYear()` when the heuristic exceeds `getMaxAllowedYear()`.
 */
export function suggestCorrectedYear(
  anomalousYear: number,
  referenceDate: Date = new Date()
): number {
  const currentYear = referenceDate.getFullYear();
  const maxAllowed = getMaxAllowedYear(referenceDate);

  if (!Number.isFinite(anomalousYear)) {
    return currentYear;
  }

  const truncated = Math.trunc(anomalousYear);
  if (truncated >= MIN_READING_ACTIVITY_YEAR && truncated <= maxAllowed) {
    return truncated;
  }

  if (truncated > maxAllowed && truncated <= 9999) {
    const candidate20xx = 2000 + (truncated % 100);
    if (candidate20xx <= maxAllowed) {
      return candidate20xx;
    }
    return currentYear;
  }

  if (truncated >= 0 && truncated < 100) {
    const candidate20xx = 2000 + truncated;
    if (candidate20xx <= maxAllowed) {
      return candidate20xx;
    }
  }

  return currentYear;
}

/**
 * Rewrites the 4-digit year prefix of an ISO date string when it exceeds `getMaxAllowedYear()`
 * (e.g. `2925-05-10 -> 2025-05-10`), preserving the rest of the date/timestamp.
 */
export function sanitizeFutureIsoDate(rawDate: string, referenceDate: Date = new Date()): string {
  const trimmed = rawDate.trim();
  const match = trimmed.match(/^(\d{4})(-.*)$/);
  if (!match) {
    return rawDate;
  }

  const year = Number.parseInt(match[1], 10);
  if (!Number.isFinite(year) || year <= getMaxAllowedYear(referenceDate)) {
    return rawDate;
  }

  const correctedYear = String(suggestCorrectedYear(year, referenceDate)).padStart(4, '0');
  return `${correctedYear}${match[2]}`;
}
