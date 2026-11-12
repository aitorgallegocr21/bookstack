import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book, ReadingLog } from '../models/book.model';
import { BooksService } from './books.service';
import { ReadingLogService } from './reading-log.service';
import { ReadingStatsService } from './reading-stats.service';

describe('ReadingStatsService', () => {
  const sampleBooks: Book[] = [
    {
      id: 'b-1',
      title: 'Book 1',
      author: 'Author 1',
      totalPages: 200,
      currentPage: 200,
      status: 'completed',
      startDate: '2026-01-01',
      createdAt: '2026-01-01T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'b-2',
      title: 'Book 2',
      author: 'Author 2',
      totalPages: 400,
      currentPage: 100,
      status: 'reading',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-05T10:00:00.000Z',
    },
    {
      id: 'b-3',
      title: 'Book 3',
      author: 'Author 3',
      totalPages: 300,
      currentPage: 0,
      status: 'pending',
      createdAt: '2026-03-01T10:00:00.000Z',
      updatedAt: '2026-03-01T10:00:00.000Z',
    },
  ];

  // Intentionally out of chronological order to guard month sorting regression
  const sampleLogs: ReadingLog[] = [
    {
      id: 'l-3',
      bookId: 'b-2',
      date: '2026-03-10',
      pagesRead: 60,
      timeSpentMinutes: 60,
      createdAt: '2026-03-10T10:00:00.000Z',
    },
    {
      id: 'l-1',
      bookId: 'b-1',
      date: '2026-01-15',
      pagesRead: 120,
      timeSpentMinutes: 120,
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'l-2',
      bookId: 'b-1',
      date: '2026-02-05',
      pagesRead: 80,
      timeSpentMinutes: 60,
      createdAt: '2026-02-05T10:00:00.000Z',
    },
    {
      id: 'l-4',
      bookId: 'b-2',
      date: '2026-01-20',
      pagesRead: 40,
      timeSpentMinutes: 60,
      createdAt: '2026-01-20T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    const storageMock: Pick<StorageAdapterService, 'getAll' | 'set' | 'remove'> = {
      getAll: async <T>(storeName: string): Promise<T[]> => {
        if (storeName === 'books') {
          return sampleBooks as T[];
        }
        return sampleLogs as T[];
      },
      set: vi.fn(async () => true),
      remove: vi.fn(async () => undefined),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: StorageAdapterService, useValue: storageMock }],
    });

    await TestBed.inject(BooksService).getAll();
    await TestBed.inject(ReadingLogService).getAll();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should compute accurate totals, reading speed, and status distribution', () => {
    const statsService = TestBed.inject(ReadingStatsService);
    const stats = statsService.getStats();

    expect(stats.totalBooks).toBe(3);
    expect(stats.completedBooks).toBe(1);
    expect(stats.readingBooks).toBe(1);
    expect(stats.pendingBooks).toBe(1);
    expect(stats.totalPagesRead).toBe(300);
    expect(stats.totalTimeSpentMinutes).toBe(300);
    // 300 logged pages over 300 logged minutes => 60 pages/hour
    expect(stats.averageReadingSpeedPagesPerHour).toBe(60);
    expect(stats.statusDistribution).toEqual([
      { status: 'pending', count: 1 },
      { status: 'reading', count: 1 },
      { status: 'completed', count: 1 },
      { status: 'abandoned', count: 0 },
    ]);
  });

  it('should aggregate monthlyPages in chronological YYYY-MM order (regression)', () => {
    const statsService = TestBed.inject(ReadingStatsService);
    const stats = statsService.stats();

    expect(stats.monthlyPages).toEqual([
      { month: '2026-01', pages: 160 },
      { month: '2026-02', pages: 80 },
      { month: '2026-03', pages: 60 },
    ]);
  });
});
