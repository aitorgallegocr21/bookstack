import {
  extractPublicationYear,
  parseGoogleBooksVolumesResponse,
  parseOpenLibraryBibkeyBatchResponse,
  parseOpenLibraryBibkeyResponse,
  parseOpenLibrarySearchResponse,
  sanitizeExternalCoverUrl,
} from './book-metadata.schema';

describe('book-metadata.schema', () => {
  describe('sanitizeExternalCoverUrl', () => {
    it('upgrades http:// to https://, strips edge=curl, and trims whitespace', () => {
      expect(
        sanitizeExternalCoverUrl(
          '  http://books.google.com/books/content?id=abc&printsec=frontcover&edge=curl  '
        )
      ).toBe('https://books.google.com/books/content?id=abc&printsec=frontcover');

      expect(
        sanitizeExternalCoverUrl('http://books.google.com/books/content?edge=curl&id=abc')
      ).toBe('https://books.google.com/books/content?id=abc');
    });

    it('rejects unsafe schemes and empty values', () => {
      expect(sanitizeExternalCoverUrl('javascript:alert(1)')).toBeUndefined();
      expect(sanitizeExternalCoverUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined();
      expect(sanitizeExternalCoverUrl('   ')).toBeUndefined();
      expect(sanitizeExternalCoverUrl(null)).toBeUndefined();
    });
  });

  describe('extractPublicationYear', () => {
    it('extracts 4-digit years within 1000..2100 from strings and numbers', () => {
      expect(extractPublicationYear('2021-05-14')).toBe(2021);
      expect(extractPublicationYear('May 2019')).toBe(2019);
      expect(extractPublicationYear('1998')).toBe(1998);
      expect(extractPublicationYear(1984)).toBe(1984);
    });

    it('returns undefined for out-of-range or invalid dates', () => {
      expect(extractPublicationYear('unknown')).toBeUndefined();
      expect(extractPublicationYear(999)).toBeUndefined();
      expect(extractPublicationYear(2150)).toBeUndefined();
      expect(extractPublicationYear(null)).toBeUndefined();
    });
  });

  describe('parseOpenLibraryBibkeyResponse', () => {
    it('maps valid Open Library bibkey response and strips HTML tags', () => {
      const payload = {
        'ISBN:9780140328721': {
          title: '<b>Fantastic Mr. Fox</b>',
          authors: [{ name: 'Roald Dahl' }],
          publishers: [{ name: 'Puffin Books' }],
          publish_date: 'October 1, 1988',
          number_of_pages: 96,
          identifiers: {
            isbn_13: ['9780140328721'],
            isbn_10: ['0140328725'],
          },
          cover: {
            large: 'http://covers.openlibrary.org/b/id/12345-L.jpg',
          },
        },
      };

      const candidate = parseOpenLibraryBibkeyResponse(payload, '978-0-14-032872-1');

      expect(candidate).toEqual({
        id: 'openlibrary:9780140328721',
        title: 'Fantastic Mr. Fox',
        author: 'Roald Dahl',
        isbn: '9780140328721',
        publisher: 'Puffin Books',
        publicationYear: 1988,
        totalPages: 96,
        coverUrl: 'https://covers.openlibrary.org/b/id/12345-L.jpg',
        source: 'openlibrary',
      });
    });

    it('returns null for empty or malformed payloads', () => {
      expect(parseOpenLibraryBibkeyResponse({}, '9780140328721')).toBeNull();
      expect(parseOpenLibraryBibkeyResponse('invalid', '9780140328721')).toBeNull();
    });
  });

  describe('parseOpenLibrarySearchResponse', () => {
    it('maps search docs into normalized candidates', () => {
      const payload = {
        docs: [
          {
            key: '/works/OL123W',
            title: 'Dune',
            author_name: ['Frank Herbert'],
            isbn: ['0441172717', '9780441172719'],
            publisher: ['Ace Books'],
            first_publish_year: 1965,
            number_of_pages_median: 412,
            cover_i: 999,
          },
          {
            key: '/works/OL_NO_TITLE',
          },
        ],
      };

      const results = parseOpenLibrarySearchResponse(payload);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: 'openlibrary:/works/OL123W',
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '9780441172719',
        publisher: 'Ace Books',
        publicationYear: 1965,
        totalPages: 412,
        coverUrl: 'https://covers.openlibrary.org/b/id/999-L.jpg',
        source: 'openlibrary',
      });
    });

    it('returns empty array for malformed search payloads', () => {
      expect(parseOpenLibrarySearchResponse({ docs: 'bad' })).toEqual([]);
    });
  });

  describe('parseGoogleBooksVolumesResponse', () => {
    it('maps Google Books volume items, normalizes ISBN-10, and sanitizes cover URLs', () => {
      const payload = {
        items: [
          {
            id: 'vol-1',
            volumeInfo: {
              title: 'The <i>Hobbit</i>',
              authors: ['J. R. R. Tolkien'],
              publisher: 'Allen & Unwin',
              publishedDate: '1937-09-21',
              pageCount: 310,
              industryIdentifiers: [{ type: 'ISBN_10', identifier: '0-306-40615-2' }],
              imageLinks: {
                thumbnail: 'http://books.google.com/books/content?id=vol1&zoom=1&edge=curl',
              },
            },
          },
        ],
      };

      const results = parseGoogleBooksVolumesResponse(payload);
      expect(results).toEqual([
        {
          id: 'googlebooks:vol-1',
          title: 'The Hobbit',
          author: 'J. R. R. Tolkien',
          isbn: '9780306406157',
          publisher: 'Allen & Unwin',
          publicationYear: 1937,
          totalPages: 310,
          coverUrl: 'https://books.google.com/books/content?id=vol1&zoom=1',
          source: 'googlebooks',
        },
      ]);
    });

    it('returns empty array when items are missing or malformed', () => {
      expect(parseGoogleBooksVolumesResponse({ totalItems: 0 })).toEqual([]);
      expect(parseGoogleBooksVolumesResponse(null)).toEqual([]);
    });
  });

  describe('parseOpenLibraryBibkeyBatchResponse', () => {
    it('maps multiple requested ISBNs to normalized ISBN-13 keys and skips missing entries', () => {
      const payload = {
        'ISBN:9780140328721': {
          title: 'Fantastic Mr. Fox',
          authors: [{ name: 'Roald Dahl' }],
          cover: { medium: 'http://covers.openlibrary.org/b/id/12345-M.jpg' },
        },
        'ISBN:0141036141': {
          title: '1984',
          authors: [{ name: 'George Orwell' }],
          cover: { large: 'https://covers.openlibrary.org/b/id/7222246-L.jpg' },
        },
      };

      const result = parseOpenLibraryBibkeyBatchResponse(payload, [
        '978-0-14-032872-1',
        '0-141-03614-1',
        '9780306406157',
        'invalid-isbn',
      ]);

      expect(result.size).toBe(2);
      expect(result.get('9780140328721')).toMatchObject({
        title: 'Fantastic Mr. Fox',
        author: 'Roald Dahl',
        coverUrl: 'https://covers.openlibrary.org/b/id/12345-M.jpg',
      });
      expect(result.get('9780141036144')).toMatchObject({
        title: '1984',
        author: 'George Orwell',
        coverUrl: 'https://covers.openlibrary.org/b/id/7222246-L.jpg',
      });
      expect(result.has('9780306406157')).toBe(false);
    });

    it('returns an empty map for malformed payloads', () => {
      expect(parseOpenLibraryBibkeyBatchResponse('bad-payload', ['9780140328721']).size).toBe(0);
    });
  });
});
