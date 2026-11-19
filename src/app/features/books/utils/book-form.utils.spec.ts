import { EN_TRANSLATIONS } from '../../../core/i18n/en';
import { ES_TRANSLATIONS } from '../../../core/i18n/es';
import { BookMetadataCandidate } from '../models/book-metadata.model';
import {
  BOOK_STATUS_VALUES,
  buildBookSeriesPayload,
  buildMetadataFormPatch,
  getCompletedAutofillValues,
  normalizeBookFormat,
  normalizeBookRating,
  translateBookFormat,
} from './book-form.utils';

describe('book-form.utils', () => {
  it('should expose all four book status values in order', () => {
    expect(BOOK_STATUS_VALUES).toEqual(['pending', 'reading', 'completed', 'abandoned']);
  });

  it('should compute completion autofill defaults only when status is completed', () => {
    expect(
      getCompletedAutofillValues({
        status: 'reading',
        totalPages: 300,
        currentPage: 50,
        totalChapters: 12,
        currentChapter: 2,
        endDate: '',
      })
    ).toEqual({});

    const completed = getCompletedAutofillValues({
      status: 'completed',
      totalPages: 300,
      currentPage: 50,
      totalChapters: 12,
      currentChapter: 2,
      endDate: '',
    });
    expect(completed.currentPage).toBe(300);
    expect(completed.currentChapter).toBe(12);
    expect(completed.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should normalize format strings and BookFormat objects safely', () => {
    expect(normalizeBookFormat(undefined)).toBe('Físico');
    expect(normalizeBookFormat('  ')).toBe('Físico');
    expect(normalizeBookFormat('Audiolibro')).toBe('Audiolibro');
    expect(normalizeBookFormat({ id: 'digital', name: 'Digital' })).toBe('Digital');
  });

  it('should translate standard stored book formats into active locale labels', () => {
    expect(translateBookFormat('Físico', EN_TRANSLATIONS.bookForm.formats)).toBe('Physical');
    expect(translateBookFormat('Audiolibro', EN_TRANSLATIONS.bookForm.formats)).toBe('Audiobook');
    expect(translateBookFormat('Ebook', ES_TRANSLATIONS.bookForm.formats)).toBe('Ebook');
    expect(translateBookFormat('Custom', EN_TRANSLATIONS.bookForm.formats)).toBe('Custom');
    expect(translateBookFormat(undefined, EN_TRANSLATIONS.bookForm.formats)).toBe('');
  });

  it('should clamp rating values into valid bounds and reject non-numbers', () => {
    expect(normalizeBookRating(undefined)).toBeUndefined();
    expect(normalizeBookRating(Number.NaN)).toBeUndefined();
    expect(normalizeBookRating(-4)).toBe(0);
    expect(normalizeBookRating(14)).toBe(10);
    expect(normalizeBookRating(8.5)).toBe(8.5);
  });

  it('should build BookSeries payload cleanly when enabled with a non-empty name', () => {
    expect(
      buildBookSeriesPayload({ enabled: false, name: 'Cosmere', volumeNumber: 1 })
    ).toBeUndefined();
    expect(buildBookSeriesPayload({ enabled: true, name: '   ', volumeNumber: 1 })).toBeUndefined();

    const created = buildBookSeriesPayload({
      enabled: true,
      name: '  El Archivo de las Tormentas ',
      volumeNumber: 2,
      existingSeriesId: 'series-123',
    });
    expect(created).toEqual({
      id: 'series-123',
      name: 'El Archivo de las Tormentas',
      volumeNumber: 2,
    });
  });

  describe('buildMetadataFormPatch', () => {
    const candidate: BookMetadataCandidate = {
      id: 'ol:9780141036144',
      title: '1984',
      author: 'George Orwell',
      isbn: '9780141036144',
      publisher: 'Penguin Books',
      publicationYear: 2008,
      totalPages: 336,
      coverUrl: 'data:image/webp;base64,abc',
      source: 'merged',
    };

    it('should overwrite all non-empty public fields in overwrite-public mode', () => {
      const patch = buildMetadataFormPatch(
        {
          title: 'Old Title',
          author: 'Old Author',
          isbn: '111',
          publisher: 'Old Pub',
          publicationYear: 1990,
          totalPages: 100,
          coverUrl: 'https://example.com/old.jpg',
        },
        candidate,
        'overwrite-public'
      );

      expect(patch).toEqual({
        title: '1984',
        author: 'George Orwell',
        isbn: '9780141036144',
        publisher: 'Penguin Books',
        publicationYear: 2008,
        totalPages: 336,
        coverUrl: 'data:image/webp;base64,abc',
      });
    });

    it('should preserve existing values and only populate empty or zero fields in fill-empty mode', () => {
      const patch = buildMetadataFormPatch(
        {
          title: 'Mi edición anotada de 1984',
          author: 'George Orwell',
          isbn: '',
          publisher: '   ',
          publicationYear: null,
          totalPages: 0,
          coverUrl: '',
        },
        candidate,
        'fill-empty'
      );

      expect(patch).toEqual({
        isbn: '9780141036144',
        publisher: 'Penguin Books',
        publicationYear: 2008,
        totalPages: 336,
        coverUrl: 'data:image/webp;base64,abc',
      });
      expect(patch.title).toBeUndefined();
      expect(patch.author).toBeUndefined();
    });

    it('should omit undefined or empty candidate fields even in overwrite-public mode', () => {
      const patch = buildMetadataFormPatch(
        {
          title: 'Existing',
          author: 'Existing Author',
          publisher: 'Existing Pub',
        },
        {
          id: 'gb:1',
          title: 'New Title',
          author: 'New Author',
          source: 'googlebooks',
        },
        'overwrite-public'
      );

      expect(patch).toEqual({
        title: 'New Title',
        author: 'New Author',
      });
    });
  });
});
