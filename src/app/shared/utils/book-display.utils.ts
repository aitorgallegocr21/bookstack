import {
  BOOK_RATING_MAX,
  BOOK_STATUS_CONFIG,
  BookStatus,
} from '../../features/books/models/book.model';

const FALLBACK_STATUS_BADGE_CLASS = 'bg-slate-100 text-slate-700';

/**
 * Returns the Tailwind CSS badge utility classes for a given reading status.
 */
export function getStatusBadgeClass(status: BookStatus): string {
  return BOOK_STATUS_CONFIG[status]?.badgeClass ?? FALLBACK_STATUS_BADGE_CLASS;
}

/**
 * Formats a numeric book rating into a compact `★ X/10` badge string.
 * Returns `fallback` when the score is missing or `NaN`.
 */
export function formatRatingBadge(score?: number, fallback = ''): string {
  if (score === undefined || score === null || Number.isNaN(score)) {
    return fallback;
  }

  const normalized = Math.min(BOOK_RATING_MAX, Math.max(0, score));
  return `★ ${normalized.toFixed(1).replace(/\.0$/, '')}/10`;
}
