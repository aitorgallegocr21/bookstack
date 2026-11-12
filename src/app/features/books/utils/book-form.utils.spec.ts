import {
  BOOK_STATUS_OPTIONS,
  buildBookSeriesPayload,
  getCompletedAutofillValues,
  normalizeBookFormat,
  normalizeBookRating,
} from './book-form.utils';

describe('book-form.utils', () => {
  it('should expose all four book status options', () => {
    expect(BOOK_STATUS_OPTIONS.map((opt) => opt.value)).toEqual([
      'pending',
      'reading',
      'completed',
      'abandoned',
    ]);
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
});
