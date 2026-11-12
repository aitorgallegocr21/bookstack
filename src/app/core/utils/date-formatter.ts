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

  return new Intl.DateTimeFormat(locale, {
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
