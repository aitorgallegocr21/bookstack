export function formatSpanishDate(
  dateStr: string | undefined | null,
  includeTime = false
): string {
  if (!dateStr) {
    return '';
  }

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: includeTime ? 'numeric' : '2-digit',
    month: includeTime ? 'short' : '2-digit',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(date);
}

export function formatSpanishMonth(monthKey: string | undefined | null): string {
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

  const formattedMonth = new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    timeZone: 'UTC'
  }).format(date);
  const formattedYear = new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);

  return `${formattedMonth.charAt(0).toUpperCase()}${formattedMonth.slice(1)} ${formattedYear}`;
}
