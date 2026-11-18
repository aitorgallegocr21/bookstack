import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Book } from '../models/book.model';
import { BookMetadataError, BookMetadataService } from './book-metadata.service';
import { BooksService } from './books.service';
import { ImageOptimizerService } from './image-optimizer.service';

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'Cien años de soledad',
    author: 'Gabriel García Márquez',
    isbn: '9780307474728',
    totalPages: 496,
    currentPage: 100,
    status: 'reading',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('BookMetadataService', () => {
  let service: BookMetadataService;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let optimizeRemoteUrlSpy: ReturnType<typeof vi.fn>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    booksSignal = signal<Book[]>([makeBook()]);
    optimizeRemoteUrlSpy = vi
      .fn<(url: string) => Promise<string>>()
      .mockImplementation(async (url: string) => `data:image/webp;base64,optimized(${url})`);

    TestBed.configureTestingModule({
      providers: [
        BookMetadataService,
        {
          provide: BooksService,
          useValue: {
            books: booksSignal.asReadonly(),
          },
        },
        {
          provide: ImageOptimizerService,
          useValue: {
            optimizeRemoteUrl: optimizeRemoteUrlSpy,
          },
        },
      ],
    });

    service = TestBed.inject(BookMetadataService);
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lookupByIsbn', () => {
    it('throws INVALID_ISBN when ISBN checksum or format is invalid', async () => {
      await expect(service.lookupByIsbn('12345')).rejects.toMatchObject({
        name: 'BookMetadataError',
        code: 'INVALID_ISBN',
      } satisfies Partial<BookMetadataError>);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('uses Open Library primary with privacy flags and caches complete hits', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse({
          'ISBN:9780141036144': {
            title: '1984',
            authors: [{ name: 'George Orwell' }],
            publishers: [{ name: 'Penguin Books' }],
            publish_date: '2008',
            number_of_pages: 336,
            cover: { large: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' },
          },
        })
      );

      const first = await service.lookupByIsbn('0-141-03614-1');
      expect(first).toEqual({
        id: 'openlibrary:9780141036144',
        title: '1984',
        author: 'George Orwell',
        isbn: '9780141036144',
        publisher: 'Penguin Books',
        publicationYear: 2008,
        totalPages: 336,
        coverUrl: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
        source: 'openlibrary',
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, init] = fetchSpy.mock.calls[0];
      expect(String(calledUrl)).toContain('openlibrary.org/api/books');
      expect(String(calledUrl)).toContain('ISBN:9780141036144');
      expect(init).toMatchObject({
        method: 'GET',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
      });

      const cached = await service.lookupByIsbn('9780141036144');
      expect(cached).toEqual(first);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('enriches incomplete Open Library records from Google Books and marks source as merged', async () => {
      fetchSpy
        .mockResolvedValueOnce(
          jsonResponse({
            'ISBN:9780141036144': {
              title: '1984',
              authors: [{ name: 'George Orwell' }],
              publish_date: '2008',
            },
          })
        )
        .mockResolvedValueOnce(
          jsonResponse({
            items: [
              {
                id: 'gb-1984',
                volumeInfo: {
                  title: 'Nineteen Eighty-Four',
                  authors: ['George Orwell'],
                  publisher: 'Penguin Classics',
                  publishedDate: '2008-05-01',
                  pageCount: 336,
                  industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780141036144' }],
                  imageLinks: {
                    thumbnail: 'http://books.google.com/books/content?id=1984&zoom=1',
                  },
                },
              },
            ],
          })
        );

      const result = await service.lookupByIsbn('9780141036144');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        id: 'openlibrary:9780141036144',
        title: '1984',
        author: 'George Orwell',
        isbn: '9780141036144',
        publisher: 'Penguin Classics',
        publicationYear: 2008,
        totalPages: 336,
        coverUrl: 'https://books.google.com/books/content?id=1984&zoom=1',
        source: 'merged',
      });
    });

    it('falls back to Google Books when Open Library fails or returns empty', async () => {
      fetchSpy.mockRejectedValueOnce(new Error('Open Library timeout')).mockResolvedValueOnce(
        jsonResponse({
          items: [
            {
              id: 'gb-dune',
              volumeInfo: {
                title: 'Dune',
                authors: ['Frank Herbert'],
                publisher: 'Ace',
                publishedDate: '1990',
                pageCount: 896,
                industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780441172719' }],
              },
            },
          ],
        })
      );

      const result = await service.lookupByIsbn('9780441172719');
      expect(result).toMatchObject({
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '9780441172719',
        totalPages: 896,
        source: 'googlebooks',
      });
    });

    it('throws LOOKUP_FAILED when both providers fail', async () => {
      fetchSpy
        .mockRejectedValueOnce(new Error('OL network error'))
        .mockResolvedValueOnce(jsonResponse({ error: 'rate limit' }, 503));

      await expect(service.lookupByIsbn('9780441172719')).rejects.toMatchObject({
        name: 'BookMetadataError',
        code: 'LOOKUP_FAILED',
      });
    });
  });

  describe('searchByQuery', () => {
    it('returns empty array for queries shorter than 2 characters', async () => {
      expect(await service.searchByQuery(' a ')).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('delegates valid ISBN search directly to lookupByIsbn', async () => {
      fetchSpy.mockResolvedValueOnce(
        jsonResponse({
          'ISBN:9780141036144': {
            title: '1984',
            authors: [{ name: 'George Orwell' }],
            publishers: [{ name: 'Penguin' }],
            publish_date: '2008',
            number_of_pages: 336,
            cover: { medium: 'https://covers.openlibrary.org/b/id/7222246-M.jpg' },
          },
        })
      );

      const results = await service.searchByQuery('978-0-141-03614-4');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('1984');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(String(fetchSpy.mock.calls[0][0])).toContain('openlibrary.org/api/books');
    });

    it('merges and deduplicates Open Library and Google Books results, ranks by completeness, and caches', async () => {
      fetchSpy.mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('openlibrary.org/search.json')) {
          return jsonResponse({
            docs: [
              {
                key: '/works/OL1W',
                title: 'El Hobbit',
                author_name: ['J. R. R. Tolkien'],
                isbn: ['9788445000656'],
                first_publish_year: 1937,
              },
              {
                key: '/works/OL2W',
                title: 'El Silmarillion',
                author_name: ['J. R. R. Tolkien'],
              },
            ],
          });
        }
        return jsonResponse({
          items: [
            {
              id: 'gb-hobbit',
              volumeInfo: {
                title: 'El Hobbit',
                authors: ['J. R. R. Tolkien'],
                publisher: 'Minotauro',
                publishedDate: '2012',
                pageCount: 320,
                industryIdentifiers: [{ type: 'ISBN_13', identifier: '9788445000656' }],
                imageLinks: {
                  thumbnail: 'https://books.google.com/books/content?id=hobbit&zoom=1',
                },
              },
            },
            {
              id: 'gb-lotr',
              volumeInfo: {
                title: 'El Señor de los Anillos',
                authors: ['J. R. R. Tolkien'],
                publisher: 'Minotauro',
                publishedDate: '2001',
                pageCount: 1200,
                industryIdentifiers: [{ type: 'ISBN_13', identifier: '9788445071403' }],
                imageLinks: {
                  thumbnail: 'https://books.google.com/books/content?id=lotr&zoom=1',
                },
              },
            },
          ],
        });
      });

      const results = await service.searchByQuery('Tolkien');
      expect(results).toHaveLength(3);

      const hobbit = results.find((item) => item.title === 'El Hobbit');
      expect(hobbit).toMatchObject({
        source: 'merged',
        publisher: 'Minotauro',
        totalPages: 320,
        coverUrl: 'https://books.google.com/books/content?id=hobbit&zoom=1',
      });

      // Least complete candidate ('El Silmarillion') is ranked last
      expect(results[results.length - 1].title).toBe('El Silmarillion');

      // Second call uses session cache
      const cached = await service.searchByQuery('tolkien');
      expect(cached).toEqual(results);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('evicts the least-recently-used queryCache entry when exceeding MAX_CACHE_ENTRIES (50)', async () => {
      fetchSpy.mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('openlibrary.org/search.json')) {
          return jsonResponse({
            docs: [{ key: `/works/${url}`, title: `Book ${url}`, author_name: ['Author'] }],
          });
        }
        return jsonResponse({ items: [] });
      });

      for (let i = 0; i < 50; i++) {
        await service.searchByQuery(`query-${i}`);
      }
      expect(fetchSpy).toHaveBeenCalledTimes(100);

      // Refresh query-0 so query-1 becomes the least recently used entry
      await service.searchByQuery('query-0');
      expect(fetchSpy).toHaveBeenCalledTimes(100);

      // Inserting a 51st entry should evict query-1, keeping query-0 cached
      await service.searchByQuery('query-50');
      expect(fetchSpy).toHaveBeenCalledTimes(102);

      await service.searchByQuery('query-0');
      expect(fetchSpy).toHaveBeenCalledTimes(102);

      await service.searchByQuery('query-1');
      expect(fetchSpy).toHaveBeenCalledTimes(104);
    });
  });

  describe('resolveLocalCover', () => {
    it('returns undefined when coverUrl is blank and delegates non-empty URLs', async () => {
      expect(await service.resolveLocalCover(undefined)).toBeUndefined();
      expect(await service.resolveLocalCover('   ')).toBeUndefined();
      expect(optimizeRemoteUrlSpy).not.toHaveBeenCalled();

      const optimized = await service.resolveLocalCover('https://example.com/cover.jpg');
      expect(optimizeRemoteUrlSpy).toHaveBeenCalledWith('https://example.com/cover.jpg');
      expect(optimized).toBe('data:image/webp;base64,optimized(https://example.com/cover.jpg)');
    });

    it('returns undefined when optimizeRemoteUrl fails and returns an empty string', async () => {
      optimizeRemoteUrlSpy.mockResolvedValueOnce('');

      const result = await service.resolveLocalCover('https://books.google.com/books/content?id=1');
      expect(optimizeRemoteUrlSpy).toHaveBeenCalledWith(
        'https://books.google.com/books/content?id=1'
      );
      expect(result).toBeUndefined();
    });
  });

  describe('findDuplicateInLibrary', () => {
    it('detects ISBN-10 / ISBN-13 equivalent duplicates', () => {
      const match = service.findDuplicateInLibrary({
        isbn: '0307474720',
        title: 'Other title',
        author: 'Other author',
      });

      expect(match).toEqual({
        bookId: 'book-1',
        title: 'Cien años de soledad',
        author: 'Gabriel García Márquez',
        isbn: '9780307474728',
        status: 'reading',
        matchReason: 'isbn',
      });
    });

    it('detects case-insensitive and diacritic-insensitive title + author duplicates', () => {
      const match = service.findDuplicateInLibrary({
        title: 'cien anos de soledad',
        author: 'gabriel garcia marquez',
      });

      expect(match).toMatchObject({
        bookId: 'book-1',
        matchReason: 'title-author',
      });
    });

    it('excludes the book being edited and returns null when no duplicate exists', () => {
      expect(
        service.findDuplicateInLibrary(
          {
            isbn: '9780307474728',
            title: 'Cien años de soledad',
            author: 'Gabriel García Márquez',
          },
          'book-1'
        )
      ).toBeNull();

      expect(
        service.findDuplicateInLibrary({
          isbn: '9780141036144',
          title: '1984',
          author: 'George Orwell',
        })
      ).toBeNull();
    });
  });
});
