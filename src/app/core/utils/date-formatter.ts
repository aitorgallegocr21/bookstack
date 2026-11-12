/**
 * Formats an ISO or date-like string using the provided Intl locale (defaults to 'es-ES').
 */
export function formatLocalizedDate(
  dateStr: string | undefined | null,
  includeTime = false,
  locale = 'es-ES',
): string {
  if (!dateStr) {
    return '';
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return new Intl.DateTimeFormat(locale, {
    day: includeTime ? 'numeric' : '2-digit',
    month: includeTime ? 'short' : '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

/**
 * Formats a 'YYYY-MM' month key into a capitalized month and year string.
 */
export function formatLocalizedMonth(
  monthKey: string | undefined | null,
  locale = 'es-ES',
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

  const formattedMonth = new Intl.DateTimeFormat(locale, {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
  const formattedYear = new Intl.DateTimeFormat(locale, {
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
