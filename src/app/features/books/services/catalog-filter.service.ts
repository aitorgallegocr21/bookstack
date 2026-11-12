import { computed, inject, Injectable, signal } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book, BookFormat, BookStatus } from '../models/book.model';
import {
  CatalogFilterCriteria,
  CatalogSortOption,
  CatalogViewMode,
  DEFAULT_CATALOG_FILTER_CRITERIA,
} from '../models/catalog-filter.model';
import { BooksService } from './books.service';
import { normalizeBookFormat } from '../utils/book-form.utils';

/**
 * Normalizes text for search by trimming, folding diacritics/accents, and converting to lowercase.
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Checks whether a book matches the search query across title, author, and series.
 */
export function matchesSearch(book: Book, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return true;
  }

  const title = normalizeSearchText(book.title);
  if (title.includes(normalizedQuery)) {
    return true;
  }

  const author = normalizeSearchText(book.author);
  if (author.includes(normalizedQuery)) {
    return true;
  }

  const seriesName = normalizeSearchText(book.series?.name ?? book.seriesInfo?.seriesName);
  return seriesName.includes(normalizedQuery);
}

/**
 * Checks whether a book's format matches the selected format filter.
 */
export function matchesFormat(
  bookFormat: BookFormat | string | null | undefined,
  filterFormat: string
): boolean {
  if (!filterFormat || filterFormat === 'all') {
    return true;
  }

  const normalized = normalizeBookFormat(bookFormat).toLowerCase();
  const target = filterFormat.trim().toLowerCase();

  if (normalized === target) {
    return true;
  }

  // Canonical cross-language aliases
  const aliases: Record<string, string[]> = {
    physical: [
      'fisico',
      'físico',
      'physical',
      'hardcover',
      'paperback',
      'tapa blanda',
      'tapa dura',
    ],
    ebook: ['ebook', 'e-book', 'digital'],
    audiobook: ['audiolibro', 'audiobook', 'audio'],
  };

  for (const group of Object.values(aliases)) {
    if (group.includes(target) && group.includes(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a book's rating satisfies the minimum rating requirement.
 * If minRating <= 0, all books match (including unrated).
 * If minRating > 0:
 *   - minRating between 1 and 5 represents minimum stars (1★+ = >=2/10, ..., 5★ = >=10/10).
 *   - minRating > 5 represents a direct 0-10 score threshold.
 *   - Books without a positive numeric rating do NOT match.
 */
export function matchesRating(rating: number | undefined | null, minRating: number): boolean {
  if (minRating <= 0) {
    return true;
  }
  if (rating === undefined || rating === null || Number.isNaN(rating) || rating <= 0) {
    return false;
  }
  const threshold = minRating <= 5 ? minRating * 2 : minRating;
  return rating >= threshold;
}

/**
 * Checks whether a book belongs to a specified series ID or series name.
 */
export function matchesSeries(book: Book, seriesId?: string): boolean {
  if (!seriesId || !seriesId.trim()) {
    return true;
  }
  const target = seriesId.trim().toLowerCase();
  const bookSeriesId = book.series?.id?.toLowerCase();
  const bookSeriesName = (book.series?.name ?? book.seriesInfo?.seriesName)?.toLowerCase();

  return bookSeriesId === target || bookSeriesName === target;
}

/**
 * Filters a list of books by search query, status, format, minRating, and optional series.
 */
export function filterBooks(books: readonly Book[], criteria: CatalogFilterCriteria): Book[] {
  return books.filter((book) => {
    if (criteria.status !== 'all' && book.status !== criteria.status) {
      return false;
    }
    if (!matchesSearch(book, criteria.searchQuery)) {
      return false;
    }
    if (!matchesFormat(book.format, criteria.format)) {
      return false;
    }
    if (!matchesRating(book.rating, criteria.minRating)) {
      return false;
    }
    if (!matchesSeries(book, criteria.seriesId)) {
      return false;
    }
    return true;
  });
}

/**
 * Deterministically sorts a collection of books based on the given sort option.
 */
export function sortBooks(
  books: readonly Book[],
  sortOption: CatalogSortOption,
  locale = 'es-ES'
): Book[] {
  const result = [...books];

  return result.sort((a, b) => {
    switch (sortOption) {
      case 'recent': {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        return a.title.localeCompare(b.title, locale) || a.id.localeCompare(b.id);
      }
      case 'title-asc':
        return (
          a.title.localeCompare(b.title, locale, { sensitivity: 'base' }) ||
          a.id.localeCompare(b.id)
        );
      case 'title-desc':
        return (
          b.title.localeCompare(a.title, locale, { sensitivity: 'base' }) ||
          b.id.localeCompare(a.id)
        );
      case 'author-asc':
        return (
          a.author.localeCompare(b.author, locale, { sensitivity: 'base' }) ||
          a.title.localeCompare(b.title, locale, { sensitivity: 'base' }) ||
          a.id.localeCompare(b.id)
        );
      case 'rating-desc': {
        const hasRatingA =
          a.rating !== undefined && a.rating !== null && !Number.isNaN(a.rating) && a.rating > 0;
        const hasRatingB =
          b.rating !== undefined && b.rating !== null && !Number.isNaN(b.rating) && b.rating > 0;

        if (hasRatingA && !hasRatingB) {
          return -1;
        }
        if (!hasRatingA && hasRatingB) {
          return 1;
        }
        if (hasRatingA && hasRatingB) {
          const diff = (b.rating as number) - (a.rating as number);
          if (diff !== 0) {
            return diff;
          }
        }
        return a.title.localeCompare(b.title, locale) || a.id.localeCompare(b.id);
      }
      case 'progress-desc': {
        const progressA = a.totalPages > 0 ? a.currentPage / a.totalPages : 0;
        const progressB = b.totalPages > 0 ? b.currentPage / b.totalPages : 0;
        if (progressB !== progressA) {
          return progressB - progressA;
        }
        return a.title.localeCompare(b.title, locale) || a.id.localeCompare(b.id);
      }
      case 'pages-desc': {
        if (b.totalPages !== a.totalPages) {
          return b.totalPages - a.totalPages;
        }
        return a.title.localeCompare(b.title, locale) || a.id.localeCompare(b.id);
      }
      default:
        return 0;
    }
  });
}

/**
 * Calculates dynamic counts per book status.
 * Reflects current search query, format, and rating filters so status counts remain context-aware.
 */
export function computeStatusCounts(
  books: readonly Book[],
  criteria?: Omit<CatalogFilterCriteria, 'status'>
): Record<BookStatus | 'all', number> {
  const counts: Record<BookStatus | 'all', number> = {
    all: 0,
    pending: 0,
    reading: 0,
    completed: 0,
    abandoned: 0,
  };

  const candidateBooks = criteria
    ? books.filter(
        (book) =>
          matchesSearch(book, criteria.searchQuery) &&
          matchesFormat(book.format, criteria.format) &&
          matchesRating(book.rating, criteria.minRating) &&
          matchesSeries(book, criteria.seriesId)
      )
    : books;

  counts.all = candidateBooks.length;
  for (const book of candidateBooks) {
    if (book.status in counts) {
      counts[book.status]++;
    }
  }

  return counts;
}

/**
 * Counts secondary filters that are active (non-default): format != 'all', minRating > 0, seriesId set.
 */
export function countActiveSecondaryFilters(criteria: CatalogFilterCriteria): number {
  let count = 0;
  if (criteria.format && criteria.format !== 'all') {
    count++;
  }
  if (criteria.minRating > 0) {
    count++;
  }
  if (criteria.seriesId && criteria.seriesId.trim().length > 0) {
    count++;
  }
  return count;
}

/**
 * Counts all active filters including status (if not 'all') and search query (if non-empty).
 */
export function countActiveFilters(criteria: CatalogFilterCriteria): number {
  let count = countActiveSecondaryFilters(criteria);
  if (criteria.status && criteria.status !== 'all') {
    count++;
  }
  if (criteria.searchQuery && criteria.searchQuery.trim().length > 0) {
    count++;
  }
  return count;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogFilterService {
  private readonly storageAdapter = inject(StorageAdapterService);
  private readonly booksService = inject(BooksService);
  private readonly i18n = inject(I18nService);

  readonly criteria = signal<CatalogFilterCriteria>({ ...DEFAULT_CATALOG_FILTER_CRITERIA });
  readonly viewMode = signal<CatalogViewMode>(this.storageAdapter.getCatalogViewMode());
  readonly sortOption = signal<CatalogSortOption>(this.storageAdapter.getCatalogSort());

  readonly filteredBooks = computed(() => {
    const books = this.booksService.books();
    const criteria = this.criteria();
    const sort = this.sortOption();
    const locale = this.i18n.intlLocale();
    const filtered = filterBooks(books, criteria);
    return sortBooks(filtered, sort, locale);
  });

  readonly statusCounts = computed(() => {
    const books = this.booksService.books();
    const criteria = this.criteria();
    return computeStatusCounts(books, criteria);
  });

  readonly activeSecondaryFilterCount = computed(() => {
    return countActiveSecondaryFilters(this.criteria());
  });

  readonly totalActiveFilterCount = computed(() => {
    return countActiveFilters(this.criteria());
  });

  readonly hasActiveFilters = computed(() => {
    return this.totalActiveFilterCount() > 0;
  });

  readonly totalBooksCount = computed(() => {
    return this.booksService.books().length;
  });

  readonly filteredBooksCount = computed(() => {
    return this.filteredBooks().length;
  });

  setSearchQuery(searchQuery: string): void {
    this.criteria.update((c) => ({ ...c, searchQuery }));
  }

  setStatus(status: BookStatus | 'all'): void {
    this.criteria.update((c) => ({ ...c, status }));
  }

  setFormat(format: BookFormat['name'] | 'all'): void {
    this.criteria.update((c) => ({ ...c, format }));
  }

  setMinRating(minRating: number): void {
    this.criteria.update((c) => ({ ...c, minRating }));
  }

  setSeriesId(seriesId?: string): void {
    this.criteria.update((c) => ({ ...c, seriesId }));
  }

  setCriteria(partial: Partial<CatalogFilterCriteria>): void {
    this.criteria.update((c) => ({ ...c, ...partial }));
  }

  resetFilters(): void {
    this.criteria.set({ ...DEFAULT_CATALOG_FILTER_CRITERIA });
  }

  setViewMode(viewMode: CatalogViewMode): void {
    this.viewMode.set(viewMode);
    this.storageAdapter.setCatalogViewMode(viewMode);
  }

  setSortOption(sortOption: CatalogSortOption): void {
    this.sortOption.set(sortOption);
    this.storageAdapter.setCatalogSort(sortOption);
  }
}
