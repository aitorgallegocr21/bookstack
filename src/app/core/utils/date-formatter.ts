const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const numberFormatterCache = new Map<string, Intl.NumberFormat>();
const collatorCache = new Map<string, Intl.Collator>();

function buildIntlCacheKey(locale: string, options?: object): string {
  if (!options) {
    return locale;
  }

  const record = options as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length === 0) {
    return locale;
  }

  const parts = [locale];
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined) {
      parts.push(`${key}=${String(value)}`);
    }
  }
  return parts.join('|');
}

/**
 * Returns a memoized `Intl.DateTimeFormat` instance for the given locale and options.
 */
export function getDateTimeFormatter(
  locale = 'es-ES',
  options: Intl.DateTimeFormatOptions = {}
): Intl.DateTimeFormat {
  const key = buildIntlCacheKey(locale, options);
  let formatter = dateTimeFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Returns a memoized `Intl.NumberFormat` instance for the given locale and options.
 */
export function getNumberFormatter(
  locale = 'es-ES',
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const key = buildIntlCacheKey(locale, options);
  let formatter = numberFormatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Returns a memoized `Intl.Collator` instance for the given locale and options.
 */
export function getLocaleCollator(locale = 'es-ES', options?: Intl.CollatorOptions): Intl.Collator {
  const key = buildIntlCacheKey(locale, options);
  let collator = collatorCache.get(key);
  if (!collator) {
    collator = new Intl.Collator(locale, options);
    collatorCache.set(key, collator);
  }
  return collator;
}

/**
 * Formats a number using a cached `Intl.NumberFormat` instance.
 */
export function formatLocalizedNumber(
  value: number,
  locale = 'es-ES',
  options?: Intl.NumberFormatOptions
): string {
  return getNumberFormatter(locale, options).format(value);
}

/**
 * Formats a `Date` or `'YYYY-MM'` month key into a capitalized short month name in UTC.
 */
export function formatShortMonth(input: Date | string, locale = 'es-ES'): string {
  const date = typeof input === 'string' ? new Date(`${input}-01T00:00:00Z`) : input;
  if (Number.isNaN(date.getTime())) {
    return typeof input === 'string' ? input : '';
  }

  const raw = getDateTimeFormatter(locale, { month: 'short', timeZone: 'UTC' }).format(date);
  const cleaned = raw.replace(/\.$/, '');
  return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

/**
 * Formats an ISO or date-like string using the provided Intl locale (defaults to 'es-ES').
 */
export function formatLocalizedDate(
  dateStr: string | undefined | null,
  includeTime = false,
  locale = 'es-ES'
): string {
  if (!dateStr) {
    return '';
  }

  const hasTime = dateStr.includes('T') || dateStr.includes(' ');
  const shouldFormatTime = includeTime && hasTime;

  const date = hasTime ? new Date(dateStr) : new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return getDateTimeFormatter(locale, {
    day: shouldFormatTime ? 'numeric' : '2-digit',
    month: shouldFormatTime ? 'short' : '2-digit',
    year: 'numeric',
    ...(shouldFormatTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

/**
 * Returns current date and time as YYYY-MM-DDTHH:mm using local device time.
 */
export function getCurrentLocalDateTime(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a 'YYYY-MM' month key into a capitalized month and year string.
 */
export function formatLocalizedMonth(
  monthKey: string | undefined | null,
  locale = 'es-ES'
): string {
  if (!monthKey) {
    return '';
  }

  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) {
    return monthKey;
  }

  const date = new Date(`${monthKey}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  const formattedMonth = getDateTimeFormatter(locale, {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
  const formattedYear = getDateTimeFormatter(locale, {
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

  return `${formattedMonth.charAt(0).toUpperCase()}${formattedMonth.slice(1)} ${formattedYear}`;
}

export function formatSpanishDate(dateStr: string | undefined | null, includeTime = false): string {
  return formatLocalizedDate(dateStr, includeTime, 'es-ES');
}

export function formatSpanishMonth(monthKey: string | undefined | null): string {
  return formatLocalizedMonth(monthKey, 'es-ES');
}
