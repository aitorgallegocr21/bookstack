import { BOOK_STATUS_CONFIG, BookStatus } from '../../features/books/models/book.model';
import { formatRatingBadge, getStatusBadgeClass } from './book-display.utils';

describe('book-display.utils', () => {
  describe('getStatusBadgeClass', () => {
    it('returns the configured badge classes for every BookStatus', () => {
      const statuses: BookStatus[] = ['pending', 'reading', 'completed', 'abandoned'];

      for (const status of statuses) {
        expect(getStatusBadgeClass(status)).toBe(BOOK_STATUS_CONFIG[status].badgeClass);
      }
    });

    it('falls back to neutral slate classes for unknown status values', () => {
      expect(getStatusBadgeClass('unknown' as BookStatus)).toBe('bg-slate-100 text-slate-700');
    });
  });

  describe('formatRatingBadge', () => {
    it('returns empty string by default or custom fallback when rating is missing or NaN', () => {
      expect(formatRatingBadge()).toBe('');
      expect(formatRatingBadge(undefined, 'Sin nota')).toBe('Sin nota');
      expect(formatRatingBadge(Number.NaN, 'N/A')).toBe('N/A');
    });

    it('formats integer and decimal ratings without trailing .0', () => {
      expect(formatRatingBadge(8)).toBe('★ 8/10');
      expect(formatRatingBadge(8.5)).toBe('★ 8.5/10');
      expect(formatRatingBadge(10)).toBe('★ 10/10');
    });

    it('clamps out-of-range ratings between 0 and BOOK_RATING_MAX', () => {
      expect(formatRatingBadge(-2)).toBe('★ 0/10');
      expect(formatRatingBadge(15)).toBe('★ 10/10');
    });
  });
});
