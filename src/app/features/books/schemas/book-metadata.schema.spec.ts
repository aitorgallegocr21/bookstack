import {
  extractPublicationYear,
  parseAppleBooksSearchResponse,
  parseCrossrefWorksResponse,
  parseGoogleBooksVolumesResponse,
  parseInternetArchiveSearchResponse,
  parseOpenLibraryBibkeyBatchResponse,
  parseOpenLibraryBibkeyResponse,
  parseOpenLibrarySearchResponse,
  parseOpenLibraryWorkEditionsResponse,
  parseWikidataSparqlResponse,
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
        workKey: '/works/OL123W',
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

  describe('parseOpenLibraryWorkEditionsResponse', () => {
    it('maps edition entries with fallback work info and ignores invalid cover IDs', () => {
      const payload = {
        entries: [
          {
            key: '/books/OL101M',
            number_of_pages: 544,
            publishers: ['Minotauro'],
            publish_date: '2003',
            isbn_13: ['9788445071403'],
            covers: [-1, 88888],
          },
          {
            key: '/books/OL102M',
            title: 'El señor de los anillos',
            number_of_pages: 0,
            publishers: [{ name: 'Tirant' }],
          },
        ],
      };

      const results = parseOpenLibraryWorkEditionsResponse(payload, {
        title: 'La Comunidad del Anillo',
        author: 'J. R. R. Tolkien',
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: 'openlibrary:/books/OL101M',
        title: 'La Comunidad del Anillo',
        author: 'J. R. R. Tolkien',
        isbn: '9788445071403',
        publisher: 'Minotauro',
        publicationYear: 2003,
        totalPages: 544,
        coverUrl: 'https://covers.openlibrary.org/b/id/88888-L.jpg',
        source: 'openlibrary',
      });
      expect(results[1]).toMatchObject({
        title: 'El señor de los anillos',
        publisher: 'Tirant',
        totalPages: undefined,
        coverUrl: undefined,
      });
    });

    it('returns empty array for malformed editions payload', () => {
      expect(parseOpenLibraryWorkEditionsResponse({ entries: null })).toEqual([]);
    });
  });

  describe('parseGoogleBooksVolumesResponse (subtitle & categories)', () => {
    it('concatenates non-duplicate subtitle and maps categories to genre', () => {
      const payload = {
        items: [
          {
            id: 'vol-sub',
            volumeInfo: {
              title: 'Dune',
              subtitle: 'Edición Aniversario',
              authors: ['Frank Herbert'],
              categories: ['Fiction', 'Science Fiction', 'Fiction'],
            },
          },
          {
            id: 'vol-dup-sub',
            volumeInfo: {
              title: 'Dune: Edición Aniversario',
              subtitle: 'Edición Aniversario',
              authors: ['Frank Herbert'],
            },
          },
        ],
      };

      const results = parseGoogleBooksVolumesResponse(payload);
      expect(results[0]).toMatchObject({
        title: 'Dune: Edición Aniversario',
        genre: ['Fiction', 'Science Fiction'],
      });
      expect(results[1].title).toBe('Dune: Edición Aniversario');
      expect(results[1].genre).toBeUndefined();
    });
  });

  describe('parseWikidataSparqlResponse', () => {
    it('maps SPARQL bindings including series, ordinal, pages, and Wikimedia 400px cover', () => {
      const payload = {
        results: {
          bindings: [
            {
              item: { value: 'http://www.wikidata.org/entity/Q186192' },
              itemLabel: { value: 'El nombre del viento' },
              authorLabel: { value: 'Patrick Rothfuss' },
              isbn13: { value: '978-84-01-33720-8' },
              pages: { value: '872' },
              pubDate: { value: '2007-03-27T00:00:00Z' },
              publisherLabel: { value: 'Plaza & Janés' },
              seriesLabel: { value: 'Crónica del asesino de reyes' },
              seriesOrdinal: { value: '1' },
              image: {
                value: 'http://commons.wikimedia.org/wiki/Special:FilePath/Name_of_the_wind.jpg',
              },
            },
          ],
        },
      };

      const results = parseWikidataSparqlResponse(payload);
      expect(results).toEqual([
        {
          id: 'wikidata:Q186192',
          title: 'El nombre del viento',
          author: 'Patrick Rothfuss',
          isbn: '9788401337208',
          publisher: 'Plaza & Janés',
          publicationYear: 2007,
          totalPages: 872,
          coverUrl:
            'https://commons.wikimedia.org/wiki/Special:FilePath/Name_of_the_wind.jpg?width=400',
          seriesName: 'Crónica del asesino de reyes',
          seriesOrder: 1,
          source: 'wikidata',
        },
      ]);
    });

    it('returns empty array for malformed SPARQL payloads', () => {
      expect(parseWikidataSparqlResponse({ results: {} })).toEqual([]);
    });
  });

  describe('parseAppleBooksSearchResponse', () => {
    it('maps Apple Books results and upgrades artworkUrl100 to 600x600bb.jpg', () => {
      const payload = {
        results: [
          {
            trackId: 987654,
            trackName: 'El imperio final',
            artistName: 'Brandon Sanderson',
            releaseDate: '2016-09-01T07:00:00Z',
            genres: ['Fantasía', 'Ficción'],
            artworkUrl100: 'http://is1-ssl.mzstatic.com/image/thumb/Publication/100x100bb.jpg',
          },
        ],
      };

      const results = parseAppleBooksSearchResponse(payload);
      expect(results).toEqual([
        {
          id: 'applebooks:987654',
          title: 'El imperio final',
          author: 'Brandon Sanderson',
          publicationYear: 2016,
          genre: ['Fantasía', 'Ficción'],
          coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Publication/600x600bb.jpg',
          source: 'applebooks',
        },
      ]);
    });

    it('returns empty array for invalid Apple Books payloads', () => {
      expect(parseAppleBooksSearchResponse(null)).toEqual([]);
    });
  });

  describe('parseInternetArchiveSearchResponse', () => {
    it('maps Internet Archive docs with string or array fields and cover service URL', () => {
      const payload = {
        response: {
          docs: [
            {
              identifier: 'donquijote00cerv',
              title: 'Don Quijote de la Mancha',
              creator: ['Miguel de Cervantes'],
              publisher: ['Imprenta Real'],
              year: '1605',
              imagecount: 680,
              isbn: ['9788420412146'],
            },
          ],
        },
      };

      const results = parseInternetArchiveSearchResponse(payload);
      expect(results).toEqual([
        {
          id: 'archive:donquijote00cerv',
          title: 'Don Quijote de la Mancha',
          author: 'Miguel de Cervantes',
          isbn: '9788420412146',
          publisher: 'Imprenta Real',
          publicationYear: 1605,
          totalPages: 680,
          coverUrl: 'https://archive.org/services/img/donquijote00cerv',
          source: 'archive',
        },
      ]);
    });

    it('returns empty array for malformed Internet Archive payloads', () => {
      expect(parseInternetArchiveSearchResponse({ response: {} })).toEqual([]);
    });
  });

  describe('parseCrossrefWorksResponse', () => {
    it('maps Crossref works items including authors, ISBN, date-parts year, and page count', () => {
      const payload = {
        message: {
          items: [
            {
              DOI: '10.1000/xyz123',
              title: ['Clean Architecture'],
              author: [{ given: 'Robert C.', family: 'Martin' }],
              publisher: 'Prentice Hall',
              'published-print': { 'date-parts': [[2017, 9, 10]] },
              ISBN: ['978-0-13-449416-6'],
              page: '432',
            },
          ],
        },
      };

      const results = parseCrossrefWorksResponse(payload);
      expect(results).toEqual([
        {
          id: 'crossref:10.1000/xyz123',
          title: 'Clean Architecture',
          author: 'Robert C. Martin',
          isbn: '9780134494166',
          publisher: 'Prentice Hall',
          publicationYear: 2017,
          totalPages: 432,
          source: 'crossref',
        },
      ]);
    });

    it('returns empty array for malformed Crossref payloads', () => {
      expect(parseCrossrefWorksResponse({ message: {} })).toEqual([]);
    });
  });
});
