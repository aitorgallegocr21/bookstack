import { describe, expect, it } from 'vitest';
import { Book } from '../../books/models/book.model';
import {
  buildTimelineSlots,
  computeMissingVolumes,
  normalizeSeriesKey,
  resolveSagaBentoScale,
  sortSagaBooksChronologically,
} from './series.utils';

function createBook(overrides: Partial<Book> = {}): Book {
  return {
    id: overrides.id ?? 'book-1',
    title: overrides.title ?? 'Book Title',
    author: overrides.author ?? 'Author Name',
    totalPages: overrides.totalPages ?? 300,
    currentPage: overrides.currentPage ?? 0,
    status: overrides.status ?? 'pending',
    format: overrides.format ?? 'physical',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('series.utils', () => {
  describe('normalizeSeriesKey', () => {
    it('trims, collapses whitespace, strips diacritics, and lowercases', () => {
      expect(normalizeSeriesKey('  El  Archivo   de las Tormentas  ')).toBe(
        'el archivo de las tormentas'
      );
      expect(normalizeSeriesKey('Crónica del Asesino de Reyes')).toBe(
        'cronica del asesino de reyes'
      );
      expect(normalizeSeriesKey('EL ARCHIVO DE LAS TORMENTAS')).toBe('el archivo de las tormentas');
    });

    it('returns empty string for nullish or blank inputs', () => {
      expect(normalizeSeriesKey('')).toBe('');
      expect(normalizeSeriesKey('   ')).toBe('');
      expect(normalizeSeriesKey(null)).toBe('');
      expect(normalizeSeriesKey(undefined)).toBe('');
    });
  });

  describe('computeMissingVolumes', () => {
    it('detects internal gaps up to highest owned volume', () => {
      expect(computeMissingVolumes([1, 3, 5])).toEqual([2, 4]);
    });

    it('extends missing volumes up to expectedVolumes when higher than highestOwned', () => {
      expect(computeMissingVolumes([1, 2], 4)).toEqual([3, 4]);
      expect(computeMissingVolumes([], 3)).toEqual([1, 2, 3]);
    });

    it('ignores non-positive or non-integer volume numbers', () => {
      expect(computeMissingVolumes([0, -1, 1.5, 2], 3)).toEqual([1, 3]);
    });

    it('returns empty array when all volumes 1..maxVolume are owned', () => {
      expect(computeMissingVolumes([1, 2, 3], 3)).toEqual([]);
      expect(computeMissingVolumes([])).toEqual([]);
    });
  });

  describe('resolveSagaBentoScale', () => {
    it('maps <=2 to compact, 3..5 to medium, and >=6 to showcase', () => {
      expect(resolveSagaBentoScale(0)).toBe('compact');
      expect(resolveSagaBentoScale(1)).toBe('compact');
      expect(resolveSagaBentoScale(2)).toBe('compact');
      expect(resolveSagaBentoScale(3)).toBe('medium');
      expect(resolveSagaBentoScale(5)).toBe('medium');
      expect(resolveSagaBentoScale(6)).toBe('showcase');
      expect(resolveSagaBentoScale(10)).toBe('showcase');
    });
  });

  describe('sortSagaBooksChronologically', () => {
    it('sorts by volumeNumber, then publicationYear, then createdAt, then title', () => {
      const b1 = createBook({
        id: 'b1',
        title: 'Zeta',
        publicationYear: 2015,
        createdAt: '2026-01-03T00:00:00.000Z',
        series: { id: 's1', name: 'Saga', volumeNumber: 2 },
      });
      const b2 = createBook({
        id: 'b2',
        title: 'Alpha',
        publicationYear: 2010,
        createdAt: '2026-01-02T00:00:00.000Z',
        series: { id: 's1', name: 'Saga', volumeNumber: 1 },
      });
      const b3 = createBook({
        id: 'b3',
        title: 'Unnumbered Older',
        publicationYear: 2005,
        createdAt: '2026-01-05T00:00:00.000Z',
        series: { id: 's1', name: 'Saga' },
      });
      const b4 = createBook({
        id: 'b4',
        title: 'Unnumbered Newer',
        publicationYear: 2005,
        createdAt: '2026-01-01T00:00:00.000Z',
        series: { id: 's1', name: 'Saga' },
      });

      const sorted = sortSagaBooksChronologically([b1, b3, b2, b4]);
      expect(sorted.map((b) => b.id)).toEqual(['b2', 'b1', 'b4', 'b3']);
    });
  });

  describe('buildTimelineSlots', () => {
    it('interleaves owned and missing volumes in order and appends unnumbered books at the end', () => {
      const v1 = createBook({
        id: 'v1',
        title: 'Vol 1',
        series: { id: 's1', name: 'Saga', volumeNumber: 1 },
      });
      const v3 = createBook({
        id: 'v3',
        title: 'Vol 3',
        series: { id: 's1', name: 'Saga', volumeNumber: 3 },
      });
      const novella = createBook({
        id: 'nov',
        title: 'Novella',
        series: { id: 's1', name: 'Saga' },
      });

      const slots = buildTimelineSlots([v1, v3, novella], [2, 4]);
      expect(slots.map((s) => `${s.kind}:${s.volumeNumber ?? 'none'}`)).toEqual([
        'owned:1',
        'missing:2',
        'owned:3',
        'missing:4',
        'owned:none',
      ]);
      expect(slots[0].book?.id).toBe('v1');
      expect(slots[1].book).toBeUndefined();
      expect(slots[4].book?.id).toBe('nov');
    });
  });
});
