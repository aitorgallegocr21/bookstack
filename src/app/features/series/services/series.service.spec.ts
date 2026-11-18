import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book, ReadingLog } from '../../books/models/book.model';
import { BooksService } from '../../books/services/books.service';
import { ReadingLogService } from '../../books/services/reading-log.service';
import { SeriesMetadata } from '../models/series.model';
import { SeriesService } from './series.service';

function makeBook(overrides: Partial<Book> & { id: string; title: string }): Book {
  return {
    author: 'Brandon Sanderson',
    totalPages: 400,
    currentPage: 0,
    status: 'pending',
    format: 'physical',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('SeriesService', () => {
  let seriesService: SeriesService;
  let booksService: BooksService;
  let readingLogService: ReadingLogService;
  let storage: StorageAdapterService;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageAdapterService);
    booksService = TestBed.inject(BooksService);
    readingLogService = TestBed.inject(ReadingLogService);
    seriesService = TestBed.inject(SeriesService);

    await booksService.clearAll();
    await readingLogService.replaceAll([]);
    await seriesService.clearAllMetadata();
    seriesService.resetFilters();
    seriesService.setSortOption('recent');
  });

  it('groups books with normalized keys, excludes standalone books, and computes saga metrics', async () => {
    const books: Book[] = [
      makeBook({
        id: 'b1',
        title: 'El camino de los reyes',
        totalPages: 1000,
        currentPage: 1000,
        status: 'completed',
        rating: 10,
        updatedAt: '2026-02-01T10:00:00.000Z',
        series: { id: 's-storm', name: 'El Archivo de las Tormentas', volumeNumber: 1 },
      }),
      makeBook({
        id: 'b2',
        title: 'Juramentada',
        totalPages: 1200,
        currentPage: 600,
        status: 'reading',
        rating: 8,
        updatedAt: '2026-02-10T10:00:00.000Z',
        series: { id: 's-storm', name: 'el  archivo  de las tormentas', volumeNumber: 3 },
      }),
      makeBook({
        id: 'b3',
        title: 'Standalone Book',
        totalPages: 250,
        status: 'pending',
      }),
    ];
    await booksService.replaceAll(books);

    const logs: ReadingLog[] = [
      {
        id: 'log-1',
        bookId: 'b1',
        date: '2026-02-01',
        pagesRead: 50,
        timeSpentMinutes: 90,
        createdAt: '2026-02-01T10:00:00.000Z',
      },
      {
        id: 'log-2',
        bookId: 'b2',
        date: '2026-02-10',
        pagesRead: 30,
        timeSpentMinutes: 45,
        createdAt: '2026-02-10T10:00:00.000Z',
      },
    ];
    await readingLogService.replaceAll(logs);

    const meta: SeriesMetadata = {
      id: 's-storm',
      normalizedKey: 'el archivo de las tormentas',
      name: 'El Archivo de las Tormentas',
      expectedVolumes: 4,
      publicationStatus: 'ongoing',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-10T10:00:00.000Z',
    };
    await seriesService.replaceAllMetadata([meta]);

    const sagas = seriesService.sagas();
    expect(sagas).toHaveLength(1);

    const storm = sagas[0];
    expect(storm.id).toBe('s-storm');
    expect(storm.name).toBe('El Archivo de las Tormentas');
    expect(storm.authors).toEqual(['Brandon Sanderson']);
    expect(storm.ownedCount).toBe(2);
    expect(storm.expectedVolumes).toBe(4);
    expect(storm.totalTargetVolumes).toBe(4);
    expect(storm.missingVolumes).toEqual([2, 4]);
    expect(storm.timelineSlots.map((s) => `${s.kind}:${s.volumeNumber}`)).toEqual([
      'owned:1',
      'missing:2',
      'owned:3',
      'missing:4',
    ]);
    expect(storm.completedCount).toBe(1);
    expect(storm.readingCount).toBe(1);
    expect(storm.totalPages).toBe(2200);
    expect(storm.readPages).toBe(1600);
    expect(storm.progressPercent).toBe(73);
    expect(storm.averageRating).toBe(9);
    expect(storm.totalReadingMinutes).toBe(135);
    expect(storm.nextBookToRead?.id).toBe('b2');
    expect(storm.statusCategory).toBe('reading');
    expect(storm.bentoScale).toBe('medium');
    expect(storm.lastActivityAt).toBe('2026-02-10T10:00:00.000Z');
  });

  it('computes statusCategory as completed only when all owned are completed and there are no missing volumes', async () => {
    await booksService.replaceAll([
      makeBook({
        id: 'd1',
        title: 'Dune',
        totalPages: 500,
        currentPage: 500,
        status: 'completed',
        series: { id: 's-dune', name: 'Dune', volumeNumber: 1 },
      }),
      makeBook({
        id: 'd2',
        title: 'El mesías de Dune',
        totalPages: 300,
        currentPage: 300,
        status: 'completed',
        series: { id: 's-dune', name: 'Dune', volumeNumber: 2 },
      }),
    ]);

    expect(seriesService.sagas()[0].statusCategory).toBe('completed');

    // Adding expectedVolumes: 3 introduces a missing volume, so no longer completed
    await seriesService.upsertSeriesMetadata({
      id: 's-dune',
      name: 'Dune',
      expectedVolumes: 3,
    });
    expect(seriesService.sagas()[0].missingVolumes).toEqual([3]);
    expect(seriesService.sagas()[0].statusCategory).toBe('pending');
  });

  it('filters by searchQuery, statusFilter (including has-gaps), computes statusCounts, and sorts', async () => {
    await booksService.replaceAll([
      makeBook({
        id: 'a1',
        title: 'Book A1',
        author: 'Author Alpha',
        totalPages: 200,
        currentPage: 200,
        status: 'completed',
        rating: 9,
        updatedAt: '2026-01-10T00:00:00.000Z',
        series: { id: 'sa', name: 'Alpha Saga', volumeNumber: 1 },
      }),
      makeBook({
        id: 'b1',
        title: 'Book B1',
        author: 'Author Beta',
        totalPages: 200,
        currentPage: 100,
        status: 'reading',
        rating: 7,
        updatedAt: '2026-02-15T00:00:00.000Z',
        series: { id: 'sb', name: 'Beta Saga', volumeNumber: 2 },
      }),
      makeBook({
        id: 'c1',
        title: 'Book C1',
        author: 'Author Gamma',
        totalPages: 200,
        currentPage: 0,
        status: 'pending',
        updatedAt: '2026-01-05T00:00:00.000Z',
        series: { id: 'sc', name: 'Gamma Saga', volumeNumber: 1 },
      }),
    ]);

    expect(seriesService.statusCounts()).toEqual({
      all: 3,
      reading: 1,
      completed: 1,
      pending: 1,
      hasGaps: 1,
    });

    // Default sort: recent
    expect(seriesService.filteredSagas().map((s) => s.name)).toEqual([
      'Beta Saga',
      'Alpha Saga',
      'Gamma Saga',
    ]);

    seriesService.setSortOption('rating-desc');
    expect(seriesService.filteredSagas().map((s) => s.name)).toEqual([
      'Alpha Saga',
      'Beta Saga',
      'Gamma Saga',
    ]);

    seriesService.setStatusFilter('has-gaps');
    expect(seriesService.hasActiveFilters()).toBe(true);
    expect(seriesService.filteredSagas().map((s) => s.name)).toEqual(['Beta Saga']);

    seriesService.resetFilters();
    expect(seriesService.hasActiveFilters()).toBe(false);

    seriesService.setSearchQuery('gamma');
    expect(seriesService.filteredSagas().map((s) => s.name)).toEqual(['Gamma Saga']);
  });

  it('upsertSeriesMetadata persists metadata and propagates renamed series to member books', async () => {
    await booksService.replaceAll([
      makeBook({
        id: 'm1',
        title: 'El imperio final',
        series: { id: 'old-id', name: 'Nacidos de la Bruma', volumeNumber: 1 },
      }),
      makeBook({
        id: 'm2',
        title: 'El pozo de la ascensión',
        series: { id: 'other-id', name: 'nacidos de la bruma', volumeNumber: 2 },
      }),
    ]);

    const saved = await seriesService.upsertSeriesMetadata({
      normalizedKey: 'nacidos de la bruma',
      name: 'Mistborn: Era 1',
      expectedVolumes: 3,
      publicationStatus: 'completed',
      notes: 'First trilogy',
    });

    expect(saved.name).toBe('Mistborn: Era 1');
    expect(saved.normalizedKey).toBe('mistborn: era 1');
    expect(saved.expectedVolumes).toBe(3);

    const updatedBooks = await booksService.getAll();
    expect(updatedBooks[0].series?.name).toBe('Mistborn: Era 1');
    expect(updatedBooks[1].series?.name).toBe('Mistborn: Era 1');
    expect(updatedBooks[0].series?.id).toBe(saved.id);
    expect(updatedBooks[1].series?.id).toBe(saved.id);

    // Verify persisted in IndexedDB
    const storedMeta = await storage.getAll<SeriesMetadata>('seriesMetadata');
    expect(storedMeta).toHaveLength(1);
    expect(storedMeta[0].name).toBe('Mistborn: Era 1');
  });

  it('links standalone books sequentially, updates volume numbers, and unlinks books cleanly', async () => {
    await booksService.replaceAll([
      makeBook({
        id: 'u1',
        title: 'Vol 1',
        series: { id: 's-witcher', name: 'The Witcher', volumeNumber: 1 },
      }),
      makeBook({ id: 'u2', title: 'Vol 2' }),
      makeBook({ id: 'u3', title: 'Vol 3' }),
    ]);

    const optionsBefore = seriesService.existingSeriesOptions();
    expect(optionsBefore).toEqual([
      {
        id: 's-witcher',
        normalizedKey: 'the witcher',
        name: 'The Witcher',
        count: 1,
        nextVolumeNumber: 2,
      },
    ]);

    await seriesService.linkBooksToSeries('the witcher', ['u2', 'u3']);

    let u2 = await booksService.getById('u2');
    let u3 = await booksService.getById('u3');
    expect(u2?.series).toEqual({ id: 's-witcher', name: 'The Witcher', volumeNumber: 2 });
    expect(u3?.series).toEqual({ id: 's-witcher', name: 'The Witcher', volumeNumber: 3 });

    await seriesService.updateBookVolumeNumber('u3', 4);
    u3 = await booksService.getById('u3');
    expect(u3?.series?.volumeNumber).toBe(4);

    await seriesService.unlinkBookFromSeries('u2');
    u2 = await booksService.getById('u2');
    expect(u2?.series).toBeUndefined();
  });

  it('batches book updates into a single BooksService.updateMany call for upsertSeriesMetadata and linkBooksToSeries', async () => {
    await booksService.replaceAll([
      makeBook({
        id: 'b1',
        title: 'Book 1',
        series: { id: 's-old', name: 'Old Saga', volumeNumber: 1 },
      }),
      makeBook({
        id: 'b2',
        title: 'Book 2',
        series: { id: 's-old', name: 'Old Saga', volumeNumber: 2 },
      }),
      makeBook({ id: 'b3', title: 'Standalone 1' }),
      makeBook({ id: 'b4', title: 'Standalone 2' }),
    ]);

    const updateManySpy = vi.spyOn(booksService, 'updateMany');
    const updateSpy = vi.spyOn(booksService, 'update');

    await seriesService.upsertSeriesMetadata({
      normalizedKey: 'old saga',
      name: 'Renamed Saga',
      expectedVolumes: 4,
    });

    expect(updateManySpy).toHaveBeenCalledTimes(1);
    expect(updateManySpy.mock.calls[0][0]).toHaveLength(2);
    expect(updateSpy).not.toHaveBeenCalled();

    updateManySpy.mockClear();

    await seriesService.linkBooksToSeries('Renamed Saga', ['b3', 'b4']);
    expect(updateManySpy).toHaveBeenCalledTimes(1);
    expect(updateManySpy.mock.calls[0][0]).toHaveLength(2);
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('preserves statusCounts object reference when counts remain structurally equal', async () => {
    await booksService.replaceAll([
      makeBook({
        id: 'b1',
        title: 'Saga Book 1',
        status: 'reading',
        series: { id: 's1', name: 'Mistborn', volumeNumber: 1 },
      }),
    ]);

    const initialCounts = seriesService.statusCounts();
    seriesService.setStatusFilter('reading');
    expect(seriesService.statusCounts()).toBe(initialCounts);
  });
});
