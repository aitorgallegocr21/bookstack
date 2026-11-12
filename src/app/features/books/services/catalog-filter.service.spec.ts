import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book } from '../models/book.model';
import {
  CatalogFilterCriteria,
  CatalogSortOption,
  DEFAULT_CATALOG_FILTER_CRITERIA,
} from '../models/catalog-filter.model';
import { BooksService } from './books.service';
import {
  CatalogFilterService,
  computeStatusCounts,
  countActiveFilters,
  countActiveSecondaryFilters,
  filterBooks,
  matchesFormat,
  matchesRating,
  matchesSearch,
  matchesSeries,
  normalizeSearchText,
  sortBooks,
} from './catalog-filter.service';

describe('CatalogFilter Engine & Utility Functions', () => {
  const sampleBooks: Book[] = [
    {
      id: 'book-1',
      title: 'El Quijote',
      author: 'Miguel de Cervantes',
      totalPages: 800,
      currentPage: 200, // 25%
      status: 'reading',
      format: 'Físico',
      rating: 9,
      series: { id: 'classics', name: 'Clásicos Universales' },
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'book-2',
      title: 'Cien Años de Soledad',
      author: 'Gabriel García Márquez',
      totalPages: 450,
      currentPage: 450, // 100%
      status: 'completed',
      format: 'Ebook',
      rating: 10,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-03-05T10:00:00.000Z',
    },
    {
      id: 'book-3',
      title: 'Dune: Frank Herbert',
      author: 'Frank Herbert',
      totalPages: 600,
      currentPage: 0, // 0%
      status: 'pending',
      format: 'Audiolibro',
      rating: undefined,
      series: { id: 'dune-series', name: 'Dune Chronicles' },
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
    },
    {
      id: 'book-4',
      title: 'La Metamorfosis',
      author: 'Franz Kafka',
      totalPages: 120,
      currentPage: 60, // 50%
      status: 'abandoned',
      format: 'Físico',
      rating: 6,
      createdAt: '2025-12-01T10:00:00.000Z',
      updatedAt: '2025-12-15T10:00:00.000Z',
    },
    {
      id: 'book-5',
      title: 'Ángeles y Demonios',
      author: 'Dan Brown',
      totalPages: 550,
      currentPage: 0,
      status: 'pending',
      format: 'Ebook',
      rating: 0, // 0 treated as unrated
      createdAt: '2026-03-10T10:00:00.000Z',
      updatedAt: '2026-03-10T10:00:00.000Z',
    },
  ];

  describe('normalizeSearchText', () => {
    it('should return empty string for null, undefined, or empty input', () => {
      expect(normalizeSearchText(null)).toBe('');
      expect(normalizeSearchText(undefined)).toBe('');
      expect(normalizeSearchText('   ')).toBe('');
    });

    it('should fold accents, convert to lowercase, and trim whitespace', () => {
      expect(normalizeSearchText('  Ángeles y Demonios  ')).toBe('angeles y demonios');
      expect(normalizeSearchText('Cien AÑOS de Soledad')).toBe('cien anos de soledad');
      expect(normalizeSearchText('García Márquez')).toBe('garcia marquez');
    });
  });

  describe('matchesSearch', () => {
    const testBook = sampleBooks[0]; // El Quijote by Miguel de Cervantes, series 'Clásicos Universales'

    it('should return true when query is empty', () => {
      expect(matchesSearch(testBook, '')).toBe(true);
      expect(matchesSearch(testBook, '   ')).toBe(true);
    });

    it('should match title with accent-insensitive search', () => {
      expect(matchesSearch(testBook, 'quijote')).toBe(true);
      expect(matchesSearch(testBook, 'QUIJOTE')).toBe(true);
      expect(matchesSearch(testBook, 'quíjote')).toBe(true);
    });

    it('should match author with accent-insensitive search', () => {
      expect(matchesSearch(testBook, 'cervantes')).toBe(true);
      expect(matchesSearch(testBook, 'miguel')).toBe(true);
    });

    it('should match series name', () => {
      expect(matchesSearch(testBook, 'clasicos')).toBe(true);
      expect(matchesSearch(testBook, 'universales')).toBe(true);
    });

    it('should return false when query is not contained anywhere', () => {
      expect(matchesSearch(testBook, 'harry potter')).toBe(false);
    });
  });

  describe('matchesFormat', () => {
    it('should return true when filter is "all"', () => {
      expect(matchesFormat('Físico', 'all')).toBe(true);
      expect(matchesFormat(undefined, 'all')).toBe(true);
    });

    it('should match standard formats and their cross-language aliases', () => {
      expect(matchesFormat('Físico', 'Físico')).toBe(true);
      expect(matchesFormat('Físico', 'physical')).toBe(true);
      expect(matchesFormat('Ebook', 'ebook')).toBe(true);
      expect(matchesFormat('Audiolibro', 'audiobook')).toBe(true);
      expect(matchesFormat('Tapa blanda', 'physical')).toBe(true);
    });

    it('should return false for mismatched formats', () => {
      expect(matchesFormat('Ebook', 'Audiolibro')).toBe(false);
      expect(matchesFormat('Físico', 'Ebook')).toBe(false);
    });
  });

  describe('matchesRating', () => {
    it('should return true for minRating <= 0 regardless of book rating', () => {
      expect(matchesRating(undefined, 0)).toBe(true);
      expect(matchesRating(0, 0)).toBe(true);
      expect(matchesRating(8, 0)).toBe(true);
    });

    it('should reject unrated or 0-rating books when minRating > 0', () => {
      expect(matchesRating(undefined, 1)).toBe(false);
      expect(matchesRating(null, 1)).toBe(false);
      expect(matchesRating(0, 1)).toBe(false);
      expect(matchesRating(NaN, 1)).toBe(false);
    });

    it('should match star scale (1-5 stars mapped to 2-10 score threshold)', () => {
      // 1★+ -> rating >= 2
      expect(matchesRating(2, 1)).toBe(true);
      expect(matchesRating(1.5, 1)).toBe(false);

      // 3★+ -> rating >= 6
      expect(matchesRating(6, 3)).toBe(true);
      expect(matchesRating(5.5, 3)).toBe(false);

      // 4★+ -> rating >= 8
      expect(matchesRating(8, 4)).toBe(true);
      expect(matchesRating(9, 4)).toBe(true);
      expect(matchesRating(7.5, 4)).toBe(false);

      // 5★ -> rating >= 10
      expect(matchesRating(10, 5)).toBe(true);
      expect(matchesRating(9.5, 5)).toBe(false);
    });

    it('should handle direct score thresholds if minRating > 5', () => {
      expect(matchesRating(8.5, 8)).toBe(true);
      expect(matchesRating(7, 8)).toBe(false);
    });
  });

  describe('matchesSeries', () => {
    const bookWithSeries = sampleBooks[0];
    const bookWithoutSeries = sampleBooks[1];

    it('should return true if seriesId filter is empty or undefined', () => {
      expect(matchesSeries(bookWithSeries, undefined)).toBe(true);
      expect(matchesSeries(bookWithSeries, '')).toBe(true);
    });

    it('should match by series ID or series name', () => {
      expect(matchesSeries(bookWithSeries, 'classics')).toBe(true);
      expect(matchesSeries(bookWithSeries, 'Clásicos Universales')).toBe(true);
    });

    it('should return false if series does not match or book has no series', () => {
      expect(matchesSeries(bookWithSeries, 'other-series')).toBe(false);
      expect(matchesSeries(bookWithoutSeries, 'classics')).toBe(false);
    });
  });

  describe('filterBooks', () => {
    it('should return all books when default criteria is applied', () => {
      const result = filterBooks(sampleBooks, DEFAULT_CATALOG_FILTER_CRITERIA);
      expect(result.length).toBe(sampleBooks.length);
    });

    it('should filter strictly by status', () => {
      const result = filterBooks(sampleBooks, {
        ...DEFAULT_CATALOG_FILTER_CRITERIA,
        status: 'reading',
      });
      expect(result.map((b) => b.id)).toEqual(['book-1']);
    });

    it('should combine multiple criteria: format, search query, and minRating', () => {
      const criteria: CatalogFilterCriteria = {
        searchQuery: 'soledad',
        status: 'all',
        format: 'Ebook',
        minRating: 4, // 4★+ (>=8/10)
      };
      const result = filterBooks(sampleBooks, criteria);
      expect(result.map((b) => b.id)).toEqual(['book-2']);
    });

    it('should return empty array if criteria matches no books', () => {
      const result = filterBooks(sampleBooks, {
        ...DEFAULT_CATALOG_FILTER_CRITERIA,
        searchQuery: 'LibroInexistenteXYZ',
      });
      expect(result).toEqual([]);
    });
  });

  describe('sortBooks (7 deterministic sorting options)', () => {
    it('should sort by "recent" descending (updatedAt ?? createdAt)', () => {
      const sorted = sortBooks(sampleBooks, 'recent');
      expect(sorted[0].id).toBe('book-5'); // 2026-03-10
      expect(sorted[1].id).toBe('book-2'); // 2026-03-05
      expect(sorted[2].id).toBe('book-1'); // 2026-03-01
      expect(sorted[3].id).toBe('book-3'); // 2026-02-01
      expect(sorted[4].id).toBe('book-4'); // 2025-12-15
    });

    it('should sort by "title-asc" alphabetically', () => {
      const sorted = sortBooks(sampleBooks, 'title-asc');
      expect(sorted[0].title).toBe('Ángeles y Demonios');
      expect(sorted[1].title).toBe('Cien Años de Soledad');
      expect(sorted[2].title).toBe('Dune: Frank Herbert');
      expect(sorted[3].title).toBe('El Quijote');
      expect(sorted[4].title).toBe('La Metamorfosis');
    });

    it('should sort by "title-desc" reverse alphabetically', () => {
      const sorted = sortBooks(sampleBooks, 'title-desc');
      expect(sorted[0].title).toBe('La Metamorfosis');
      expect(sorted[sorted.length - 1].title).toBe('Ángeles y Demonios');
    });

    it('should sort by "author-asc" alphabetically', () => {
      const sorted = sortBooks(sampleBooks, 'author-asc');
      expect(sorted[0].author).toBe('Dan Brown');
      expect(sorted[1].author).toBe('Frank Herbert');
      expect(sorted[2].author).toBe('Franz Kafka');
      expect(sorted[3].author).toBe('Gabriel García Márquez');
      expect(sorted[4].author).toBe('Miguel de Cervantes');
    });

    it('should sort by "rating-desc" with unrated books placed last', () => {
      const sorted = sortBooks(sampleBooks, 'rating-desc');
      expect(sorted[0].id).toBe('book-2'); // rating: 10
      expect(sorted[1].id).toBe('book-1'); // rating: 9
      expect(sorted[2].id).toBe('book-4'); // rating: 6
      // unrated books (undefined and 0) at the end:
      const lastTwoIds = [sorted[3].id, sorted[4].id];
      expect(lastTwoIds).toContain('book-3');
      expect(lastTwoIds).toContain('book-5');
    });

    it('should sort by "progress-desc" based on percentage', () => {
      const sorted = sortBooks(sampleBooks, 'progress-desc');
      expect(sorted[0].id).toBe('book-2'); // 100% (450/450)
      expect(sorted[1].id).toBe('book-4'); // 50% (60/120)
      expect(sorted[2].id).toBe('book-1'); // 25% (200/800)
      // 0% books at the end
      expect(sorted[3].currentPage / sorted[3].totalPages).toBe(0);
      expect(sorted[4].currentPage / sorted[4].totalPages).toBe(0);
    });

    it('should sort by "pages-desc" based on totalPages', () => {
      const sorted = sortBooks(sampleBooks, 'pages-desc');
      expect(sorted.map((b) => b.totalPages)).toEqual([800, 600, 550, 450, 120]);
    });
  });

  describe('computeStatusCounts', () => {
    it('should count all statuses across the whole collection without criteria', () => {
      const counts = computeStatusCounts(sampleBooks);
      expect(counts.all).toBe(5);
      expect(counts.reading).toBe(1);
      expect(counts.completed).toBe(1);
      expect(counts.pending).toBe(2);
      expect(counts.abandoned).toBe(1);
    });

    it('should dynamically reflect search and format filters across status counts', () => {
      const counts = computeStatusCounts(sampleBooks, {
        searchQuery: '',
        format: 'Ebook',
        minRating: 0,
      });
      // book-2 (completed, Ebook) and book-5 (pending, Ebook)
      expect(counts.all).toBe(2);
      expect(counts.completed).toBe(1);
      expect(counts.pending).toBe(1);
      expect(counts.reading).toBe(0);
      expect(counts.abandoned).toBe(0);
    });
  });

  describe('countActiveSecondaryFilters & countActiveFilters', () => {
    it('should return 0 for default criteria', () => {
      expect(countActiveSecondaryFilters(DEFAULT_CATALOG_FILTER_CRITERIA)).toBe(0);
      expect(countActiveFilters(DEFAULT_CATALOG_FILTER_CRITERIA)).toBe(0);
    });

    it('should count secondary filters (format, minRating, seriesId)', () => {
      const criteria: CatalogFilterCriteria = {
        searchQuery: '',
        status: 'all',
        format: 'Ebook',
        minRating: 3,
        seriesId: 'some-id',
      };
      expect(countActiveSecondaryFilters(criteria)).toBe(3);
      expect(countActiveFilters(criteria)).toBe(3);
    });

    it('should include status and search in countActiveFilters', () => {
      const criteria: CatalogFilterCriteria = {
        searchQuery: 'Dune',
        status: 'reading',
        format: 'all',
        minRating: 0,
      };
      expect(countActiveSecondaryFilters(criteria)).toBe(0);
      expect(countActiveFilters(criteria)).toBe(2);
    });
  });

  describe('CatalogFilterService Angular Service', () => {
    let service: CatalogFilterService;
    let mockStorageAdapter: {
      getCatalogViewMode: () => string;
      setCatalogViewMode: (val: string) => boolean;
      getCatalogSort: () => string;
      setCatalogSort: (val: string) => boolean;
    };
    const mockBooksSignal = signal<Book[]>(sampleBooks);

    beforeEach(() => {
      mockStorageAdapter = {
        getCatalogViewMode: vi.fn().mockReturnValue('detailed'),
        setCatalogViewMode: vi.fn().mockReturnValue(true),
        getCatalogSort: vi.fn().mockReturnValue('recent'),
        setCatalogSort: vi.fn().mockReturnValue(true),
      };

      TestBed.configureTestingModule({
        providers: [
          CatalogFilterService,
          { provide: StorageAdapterService, useValue: mockStorageAdapter },
          { provide: BooksService, useValue: { books: mockBooksSignal } },
        ],
      });

      service = TestBed.inject(CatalogFilterService);
    });

    it('should initialize signals with defaults and storage preferences', () => {
      expect(service.viewMode()).toBe('detailed');
      expect(service.sortOption()).toBe('recent');
      expect(service.criteria()).toEqual(DEFAULT_CATALOG_FILTER_CRITERIA);
      expect(service.totalBooksCount()).toBe(5);
      expect(service.filteredBooksCount()).toBe(5);
      expect(service.hasActiveFilters()).toBe(false);
    });

    it('should reactively filter and sort books when criteria signals update', () => {
      service.setSearchQuery('Quijote');
      expect(service.filteredBooks().length).toBe(1);
      expect(service.filteredBooks()[0].title).toBe('El Quijote');
      expect(service.filteredBooksCount()).toBe(1);
      expect(service.hasActiveFilters()).toBe(true);

      service.resetFilters();
      expect(service.filteredBooks().length).toBe(5);
      expect(service.hasActiveFilters()).toBe(false);
    });

    it('should update status and format filters cleanly', () => {
      service.setStatus('pending');
      expect(service.filteredBooks().every((b) => b.status === 'pending')).toBe(true);
      expect(service.filteredBooks().length).toBe(2);

      service.setFormat('Audiolibro');
      expect(service.filteredBooks().length).toBe(1);
      expect(service.filteredBooks()[0].id).toBe('book-3');
    });

    it('should update minRating and seriesId', () => {
      service.setMinRating(4); // 4★+
      expect(service.filteredBooks().every((b) => (b.rating ?? 0) >= 8)).toBe(true);

      service.setSeriesId('dune-series');
      // No book has Dune series AND rating >= 8
      expect(service.filteredBooks().length).toBe(0);
    });

    it('should update viewMode and persist it in StorageAdapter', () => {
      service.setViewMode('grid');
      expect(service.viewMode()).toBe('grid');
      expect(mockStorageAdapter.setCatalogViewMode).toHaveBeenCalledWith('grid');

      service.setViewMode('compact');
      expect(service.viewMode()).toBe('compact');
      expect(mockStorageAdapter.setCatalogViewMode).toHaveBeenCalledWith('compact');
    });

    it('should update sortOption and persist it in StorageAdapter', () => {
      const newSort: CatalogSortOption = 'rating-desc';
      service.setSortOption(newSort);
      expect(service.sortOption()).toBe(newSort);
      expect(mockStorageAdapter.setCatalogSort).toHaveBeenCalledWith(newSort);
    });

    it('should allow partial criteria update with setCriteria', () => {
      service.setCriteria({ searchQuery: 'Kafka', status: 'abandoned' });
      expect(service.criteria().searchQuery).toBe('Kafka');
      expect(service.criteria().status).toBe('abandoned');
      expect(service.filteredBooks().length).toBe(1);
      expect(service.filteredBooks()[0].id).toBe('book-4');
    });
  });
});
