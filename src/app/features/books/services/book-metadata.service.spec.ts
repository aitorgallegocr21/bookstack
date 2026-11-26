import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppPreferencesService } from '../../../core/services/app-preferences.service';
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
      fetchSpy
        .mockResolvedValueOnce(
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
        )
        .mockResolvedValueOnce(jsonResponse({ items: [] }));

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

      expect(fetchSpy).toHaveBeenCalledTimes(2);
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
      expect(fetchSpy).toHaveBeenCalledTimes(2);
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
        sources: ['openlibrary', 'googlebooks'],
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
      fetchSpy
        .mockResolvedValueOnce(
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
        )
        .mockResolvedValueOnce(jsonResponse({ items: [] }));

      const results = await service.searchByQuery('978-0-141-03614-4');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('1984');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
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
        sources: ['openlibrary', 'googlebooks'],
        publisher: 'Minotauro',
        totalPages: 320,
        coverUrl: 'https://books.google.com/books/content?id=hobbit&zoom=1',
      });

      // Least complete candidate ('El Silmarillion') is ranked last
      expect(results[results.length - 1].title).toBe('El Silmarillion');

      // Second call uses session cache without additional fetches
      const callsBeforeCache = fetchSpy.mock.calls.length;
      const cached = await service.searchByQuery('tolkien');
      expect(cached).toEqual(results);
      expect(fetchSpy).toHaveBeenCalledTimes(callsBeforeCache);
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
      const callsAfter50 = fetchSpy.mock.calls.length;
      expect(callsAfter50).toBeGreaterThan(0);

      // Refresh query-0 so query-1 becomes the least recently used entry
      await service.searchByQuery('query-0');
      expect(fetchSpy).toHaveBeenCalledTimes(callsAfter50);

      // Inserting a 51st entry should evict query-1, keeping query-0 cached
      await service.searchByQuery('query-50');
      const callsAfter51 = fetchSpy.mock.calls.length;
      expect(callsAfter51).toBeGreaterThan(callsAfter50);

      await service.searchByQuery('query-0');
      expect(fetchSpy).toHaveBeenCalledTimes(callsAfter51);

      await service.searchByQuery('query-1');
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(callsAfter51);
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

  describe('lookupBatchByIsbns', () => {
    it('deduplicates, normalizes, queries Open Library in chunks of 20, and populates cache', async () => {
      const validIsbns = [
        '0-141-03614-1', // normalizes to 9780141036144
        '9780141036144', // duplicate
        '9780140328721',
        'invalid-isbn',
      ];

      fetchSpy.mockResolvedValueOnce(
        jsonResponse({
          'ISBN:9780141036144': {
            title: '1984',
            authors: [{ name: 'George Orwell' }],
            number_of_pages: 336,
            cover: { large: 'https://covers.openlibrary.org/b/id/1-L.jpg' },
          },
          'ISBN:9780140328721': {
            title: 'Fantastic Mr. Fox',
            authors: [{ name: 'Roald Dahl' }],
            number_of_pages: 96,
            cover: { large: 'https://covers.openlibrary.org/b/id/2-L.jpg' },
          },
        })
      );

      const firstBatch = await service.lookupBatchByIsbns(validIsbns);
      expect(firstBatch.size).toBe(2);
      expect(firstBatch.get('9780141036144')?.title).toBe('1984');
      expect(firstBatch.get('9780140328721')?.title).toBe('Fantastic Mr. Fox');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const calledUrl = String(fetchSpy.mock.calls[0][0]);
      expect(calledUrl).toContain('bibkeys=ISBN:9780141036144,ISBN:9780140328721');

      // Second call with already-cached ISBNs should not trigger fetch
      const cachedBatch = await service.lookupBatchByIsbns(['9780141036144']);
      expect(cachedBatch.get('9780141036144')?.title).toBe('1984');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('chunks more than 20 unique valid ISBNs into multiple requests', async () => {
      // Generate 21 valid ISBN-13 numbers with valid check digits
      const isbns: string[] = [];
      for (let i = 0; i < 21; i++) {
        const prefix12 = `9780000000${String(i).padStart(2, '0')}`;
        let sum = 0;
        for (let j = 0; j < 12; j++) {
          sum += Number(prefix12[j]) * (j % 2 === 0 ? 1 : 3);
        }
        const check = (10 - (sum % 10)) % 10;
        isbns.push(`${prefix12}${check}`);
      }

      fetchSpy.mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('openlibrary.org/api/books?bibkeys=')) {
          const bibkeysParam = new URL(url).searchParams.get('bibkeys') ?? '';
          const payload: Record<string, unknown> = {};
          for (const key of bibkeysParam.split(',')) {
            payload[key] = {
              title: `Book ${key}`,
              authors: [{ name: 'Author' }],
              number_of_pages: 200,
              cover: { large: `https://covers.openlibrary.org/b/id/1-L.jpg` },
            };
          }
          return jsonResponse(payload);
        }
        return jsonResponse({});
      });

      const batch = await service.lookupBatchByIsbns(isbns);
      expect(batch.size).toBe(21);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyStrictTitleAuthorCandidate', () => {
    it('rejects candidates without coverUrl or with mismatched title/author', () => {
      const result = service.verifyStrictTitleAuthorCandidate(
        {
          title: 'Dune',
          author: 'Frank Herbert',
        },
        [
          {
            id: '1',
            title: 'Dune',
            author: 'Frank Herbert',
            source: 'openlibrary',
          },
          {
            id: '2',
            title: 'Dune Messiah',
            author: 'Frank Herbert',
            coverUrl: 'https://covers.openlibrary.org/b/id/2-L.jpg',
            source: 'openlibrary',
          },
          {
            id: '3',
            title: 'Dune',
            author: 'Brian Herbert',
            coverUrl: 'https://covers.openlibrary.org/b/id/3-L.jpg',
            source: 'openlibrary',
          },
        ]
      );

      expect(result).toBeNull();
    });

    it('matches primary title before subtitle and ranks by publisher and publicationYear', () => {
      const result = service.verifyStrictTitleAuthorCandidate(
        {
          title: 'El nombre del viento',
          author: 'Patrick Rothfuss',
          publisher: 'Plaza & Janés',
          publicationYear: 2009,
        },
        [
          {
            id: 'generic',
            title: 'El nombre del viento: Crónica del asesino de reyes',
            author: 'Patrick Rothfuss',
            publisher: 'DAW Books',
            publicationYear: 2007,
            coverUrl: 'https://covers.openlibrary.org/b/id/10-L.jpg',
            source: 'openlibrary',
          },
          {
            id: 'exact-edition',
            title: 'El nombre del viento',
            author: 'Patrick Rothfuss',
            publisher: 'Plaza & Janes',
            publicationYear: 2009,
            coverUrl: 'https://covers.openlibrary.org/b/id/11-L.jpg',
            source: 'googlebooks',
          },
        ]
      );

      expect(result?.id).toBe('exact-edition');
    });

    it('accepts a single cover candidate even when title is translated or author spelling differs', () => {
      const result = service.verifyStrictTitleAuthorCandidate(
        {
          title: 'Crimen y castigo',
          author: 'Fiódor Dostoyevski',
        },
        [
          {
            id: 'en-single',
            title: 'Crime and Punishment',
            author: 'Fyodor Dostoevsky',
            coverUrl: 'https://covers.openlibrary.org/b/id/55-L.jpg',
            source: 'openlibrary',
          },
          {
            id: 'no-cover',
            title: 'Other Result Without Cover',
            author: 'Fyodor Dostoevsky',
            source: 'openlibrary',
          },
        ]
      );

      expect(result?.id).toBe('en-single');
    });
  });

  describe('Phase 15.2 multi-source fusion, edition fallback, and balanced quota', () => {
    it('uses structured title/author hints and enriches top Open Library hit from Work Editions', async () => {
      fetchSpy.mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('openlibrary.org/search.json')) {
          return jsonResponse({
            docs: [
              {
                key: '/works/OL82563W',
                title: 'Dune',
                author_name: ['Frank Herbert'],
                first_publish_year: 1965,
              },
            ],
          });
        }
        if (url.includes('openlibrary.org/works/OL82563W/editions.json')) {
          return jsonResponse({
            entries: [
              {
                key: '/books/OL1M',
                title: 'Dune',
                number_of_pages: 412,
                publishers: ['Chilton Books'],
                publish_date: '1965',
                isbn_13: ['9780441172719'],
                covers: [12345],
              },
            ],
          });
        }
        if (url.includes('googleapis.com/books/v1/volumes')) {
          return jsonResponse({ items: [] });
        }
        return jsonResponse({});
      });

      const results = await service.searchByQuery('Dune', {
        title: 'Dune',
        author: 'Frank Herbert',
      });

      const olCall = fetchSpy.mock.calls.find((call: unknown[]) =>
        String(call[0]).includes('openlibrary.org/search.json')
      );
      expect(String(olCall?.[0])).toContain('title=Dune');
      expect(String(olCall?.[0])).toContain('author=Frank%20Herbert');

      const gbCall = fetchSpy.mock.calls.find((call: unknown[]) =>
        String(call[0]).includes('googleapis.com/books/v1/volumes')
      );
      expect(decodeURIComponent(String(gbCall?.[0]))).toContain(
        'intitle:"Dune" inauthor:"Frank Herbert"'
      );

      expect(results[0]).toMatchObject({
        title: 'Dune',
        author: 'Frank Herbert',
        totalPages: 412,
        publisher: 'Chilton Books',
        coverUrl: 'https://covers.openlibrary.org/b/id/12345-L.jpg',
      });
    });

    it('fuses cross-edition candidates across 5 sources and balances up to 8 results with Google Books preserved', async () => {
      fetchSpy.mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('openlibrary.org/search.json')) {
          return jsonResponse({
            docs: Array.from({ length: 6 }, (_, i) => ({
              key: `/works/OL${i}W`,
              title: i === 0 ? 'El camino de los reyes' : `OL Book ${i}`,
              author_name: [i === 0 ? 'Brandon Sanderson' : `Author ${i}`],
              isbn: [i === 0 ? '9788466657662' : `978000000000${i}`],
              publisher: ['Nova'],
              first_publish_year: 2015,
              number_of_pages_median: 1200,
              cover_i: 100 + i,
            })),
          });
        }
        if (url.includes('googleapis.com/books/v1/volumes')) {
          return jsonResponse({
            items: [
              {
                id: 'gb-way-of-kings',
                volumeInfo: {
                  title: 'El camino de los reyes: El Archivo de las Tormentas 1',
                  authors: ['Brandon Sanderson'],
                  publisher: 'B de Bolsillo',
                  publishedDate: '2018',
                  pageCount: 1200,
                  categories: ['Fantasy'],
                  industryIdentifiers: [{ type: 'ISBN_13', identifier: '9788490665008' }],
                  imageLinks: { thumbnail: 'https://books.google.com/books/content?id=gb1&zoom=1' },
                },
              },
            ],
          });
        }
        if (url.includes('itunes.apple.com/search')) {
          return jsonResponse({
            results: [
              {
                trackId: 9001,
                trackName: 'Palabras radiantes',
                artistName: 'Brandon Sanderson',
                artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/100x100bb.jpg',
                releaseDate: '2015-01-01T00:00:00Z',
                genres: ['Fantasía'],
              },
            ],
          });
        }
        if (url.includes('query.wikidata.org/sparql')) {
          return jsonResponse({
            results: {
              bindings: [
                {
                  item: { value: 'http://www.wikidata.org/entity/Q1' },
                  itemLabel: { value: 'El camino de los reyes' },
                  authorLabel: { value: 'Brandon Sanderson' },
                  seriesLabel: { value: 'El archivo de las tormentas' },
                  seriesOrdinal: { value: '1' },
                },
                {
                  item: { value: 'http://www.wikidata.org/entity/Q2' },
                  itemLabel: { value: 'Juramentada' },
                  authorLabel: { value: 'Brandon Sanderson' },
                  seriesLabel: { value: 'El archivo de las tormentas' },
                  seriesOrdinal: { value: '3' },
                },
              ],
            },
          });
        }
        if (url.includes('archive.org/advancedsearch.php')) {
          return jsonResponse({
            response: {
              docs: [
                {
                  identifier: 'archive-way-of-kings',
                  title: 'Way of Kings Study Guide',
                  creator: 'Reader Guild',
                  year: '2020',
                },
              ],
            },
          });
        }
        if (url.includes('api.crossref.org/works')) {
          return jsonResponse({
            message: {
              items: [
                {
                  DOI: '10.1000/test-1',
                  title: ['Sanderson Cosmology Paper'],
                  author: [{ given: 'Jane', family: 'Doe' }],
                  publisher: 'Academic Press',
                },
              ],
            },
          });
        }
        return jsonResponse({});
      });

      const results = await service.searchByQuery('El camino de los reyes');
      expect(results.length).toBeLessThanOrEqual(8);
      expect(results[0].source).toBe('merged');
      expect(results[0].seriesName).toBe('El archivo de las tormentas');
      expect(results[0].genre).toContain('Fantasy');

      const sources = results.map((r) => r.source);
      expect(sources).toContain('googlebooks');
      expect(sources).toContain('openlibrary');
      expect(sources).toContain('applebooks');
      expect(sources).toContain('wikidata');
    });

    it('probes direct Open Library ISBN cover and queries Wikidata/Crossref when key fields are missing', async () => {
      fetchSpy.mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('openlibrary.org/api/books')) {
          return jsonResponse({
            'ISBN:9780141036144': {
              title: '1984',
              authors: [{ name: 'George Orwell' }],
            },
          });
        }
        if (url.includes('googleapis.com/books/v1/volumes')) {
          return jsonResponse({ items: [] });
        }
        if (url.includes('query.wikidata.org/sparql')) {
          return jsonResponse({
            results: {
              bindings: [
                {
                  item: { value: 'http://www.wikidata.org/entity/Q208460' },
                  itemLabel: { value: 'Nineteen Eighty-Four' },
                  authorLabel: { value: 'George Orwell' },
                  pages: { value: '328' },
                  pubDate: { value: '1949-06-08T00:00:00Z' },
                  publisherLabel: { value: 'Secker & Warburg' },
                },
              ],
            },
          });
        }
        if (url.includes('api.crossref.org/works')) {
          return jsonResponse({ message: { items: [] } });
        }
        if (url.includes('covers.openlibrary.org/b/isbn/9780141036144-L.jpg')) {
          return new Response(null, { status: 200 });
        }
        return jsonResponse({});
      });

      const result = await service.lookupByIsbn('9780141036144');
      expect(result).toMatchObject({
        title: '1984',
        totalPages: 328,
        publisher: 'Secker & Warburg',
        publicationYear: 1949,
        coverUrl: 'https://covers.openlibrary.org/b/isbn/9780141036144-L.jpg?default=false',
        source: 'merged',
      });
    });

    it('falls back to lookupByIsbn for incomplete records inside lookupBatchByIsbns', async () => {
      fetchSpy.mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('bibkeys=ISBN:9780141036144')) {
          return jsonResponse({
            'ISBN:9780141036144': {
              title: '1984',
              authors: [{ name: 'George Orwell' }],
              // Missing cover and totalPages
            },
          });
        }
        if (url.includes('googleapis.com/books/v1/volumes?q=isbn:9780141036144')) {
          return jsonResponse({
            items: [
              {
                id: 'gb-1984',
                volumeInfo: {
                  title: '1984',
                  authors: ['George Orwell'],
                  publisher: 'Penguin',
                  publishedDate: '2008',
                  pageCount: 336,
                  industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780141036144' }],
                  imageLinks: {
                    thumbnail: 'https://books.google.com/books/content?id=1984&zoom=1',
                  },
                },
              },
            ],
          });
        }
        return jsonResponse({});
      });

      const batch = await service.lookupBatchByIsbns(['9780141036144']);
      const enriched = batch.get('9780141036144');
      expect(enriched).toMatchObject({
        title: '1984',
        totalPages: 336,
        coverUrl: 'https://books.google.com/books/content?id=1984&zoom=1',
        source: 'merged',
      });
    });
  });

  describe('100% Offline Mode & Granular 5-Provider Privacy Controls', () => {
    it('issues zero fetch() calls and throws OFFLINE_MODE across all lookup methods when offlineMode is true', async () => {
      const prefs = TestBed.inject(AppPreferencesService);
      prefs.updatePreferences({ offlineMode: true });

      await expect(service.lookupByIsbn('9780141036144')).rejects.toMatchObject({
        code: 'OFFLINE_MODE',
      });
      await expect(service.searchByQuery('Dune')).rejects.toMatchObject({
        code: 'OFFLINE_MODE',
      });
      await expect(service.lookupBatchByIsbns(['9780141036144'])).rejects.toMatchObject({
        code: 'OFFLINE_MODE',
      });
      await expect(
        service.resolveLocalCover('https://example.com/cover.jpg')
      ).rejects.toMatchObject({
        code: 'OFFLINE_MODE',
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(optimizeRemoteUrlSpy).not.toHaveBeenCalled();
    });

    it('never queries disabled providers and respects priority order & metadataSearchQuota', async () => {
      const prefs = TestBed.inject(AppPreferencesService);
      prefs.updatePreferences({
        offlineMode: false,
        metadataSearchQuota: 4,
        metadataProviders: [
          { id: 'googlebooks', enabled: false },
          { id: 'openlibrary', enabled: true },
          { id: 'applebooks', enabled: false },
          { id: 'wikidata', enabled: false },
          { id: 'archive', enabled: false },
        ],
      });

      fetchSpy.mockImplementation(async (input: string | URL | Request) => {
        const url = String(input);
        if (url.includes('openlibrary.org/search.json')) {
          return jsonResponse({
            docs: [
              { key: '/works/OL1W', title: 'Dune 1', author_name: ['Frank Herbert'], cover_i: 1 },
              { key: '/works/OL2W', title: 'Dune 2', author_name: ['Frank Herbert'], cover_i: 2 },
              { key: '/works/OL3W', title: 'Dune 3', author_name: ['Frank Herbert'], cover_i: 3 },
              { key: '/works/OL4W', title: 'Dune 4', author_name: ['Frank Herbert'], cover_i: 4 },
              { key: '/works/OL5W', title: 'Dune 5', author_name: ['Frank Herbert'], cover_i: 5 },
            ],
          });
        }
        return jsonResponse({});
      });

      const results = await service.searchByQuery('Dune');

      expect(results.length).toBeLessThanOrEqual(4);
      const calledUrls = fetchSpy.mock.calls.map((call: unknown[]) => String(call[0]));
      expect(calledUrls.some((url: string) => url.includes('googleapis.com'))).toBe(false);
      expect(calledUrls.some((url: string) => url.includes('itunes.apple.com'))).toBe(false);
      expect(calledUrls.some((url: string) => url.includes('wikidata.org'))).toBe(false);
      expect(calledUrls.some((url: string) => url.includes('archive.org'))).toBe(false);
      expect(calledUrls.some((url: string) => url.includes('openlibrary.org/search.json'))).toBe(
        true
      );
    });
  });
});
