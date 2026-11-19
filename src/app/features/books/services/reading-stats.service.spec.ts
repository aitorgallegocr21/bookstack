import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book, ReadingLog, ReadingGoals } from '../models/book.model';
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
      endDate: '2026-01-10',
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

  let storageMock: {
    getAll: <T>(storeName: string) => Promise<T[]>;
    set: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    getReadingGoals: ReturnType<typeof vi.fn>;
    saveReadingGoals: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    storageMock = {
      getAll: async <T>(storeName: string): Promise<T[]> => {
        if (storeName === 'books') {
          return sampleBooks as T[];
        }
        return sampleLogs as T[];
      },
      set: vi.fn(async () => true),
      remove: vi.fn(async () => undefined),
      getReadingGoals: vi.fn(() => null),
      saveReadingGoals: vi.fn(() => true),
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

  it('should calculate consecutive streak accurately when reading today', () => {
    const statsService = TestBed.inject(ReadingStatsService);

    // Reference date: Wednesday, March 11, 2026
    const refDate = new Date('2026-03-11T12:00:00');
    const logs: ReadingLog[] = [
      { id: '1', bookId: 'b-1', date: '2026-03-09', pagesRead: 20, createdAt: '' },
      { id: '2', bookId: 'b-1', date: '2026-03-10', pagesRead: 30, createdAt: '' },
      { id: '3', bookId: 'b-1', date: '2026-03-11', pagesRead: 15, createdAt: '' },
    ];

    const streak = statsService.calculateStreakInfo(logs, refDate);
    expect(streak.currentStreak).toBe(3);
    expect(streak.hasReadToday).toBe(true);
    expect(streak.longestStreak).toBe(3);
  });

  it('should preserve streak with grace period when yesterday was read but today is not logged yet', () => {
    const statsService = TestBed.inject(ReadingStatsService);

    // Reference date: Wednesday, March 11, 2026 (no log for March 11 yet)
    const refDate = new Date('2026-03-11T12:00:00');
    const logs: ReadingLog[] = [
      { id: '1', bookId: 'b-1', date: '2026-03-09', pagesRead: 20, createdAt: '' },
      { id: '2', bookId: 'b-1', date: '2026-03-10', pagesRead: 30, createdAt: '' },
    ];

    const streak = statsService.calculateStreakInfo(logs, refDate);
    expect(streak.currentStreak).toBe(2);
    expect(streak.hasReadToday).toBe(false);
    expect(streak.longestStreak).toBe(2);
  });

  it('should reset current streak to 0 when neither today nor yesterday was logged', () => {
    const statsService = TestBed.inject(ReadingStatsService);

    // Reference date: Friday, March 13, 2026 (last log was March 10)
    const refDate = new Date('2026-03-13T12:00:00');
    const logs: ReadingLog[] = [
      { id: '1', bookId: 'b-1', date: '2026-03-08', pagesRead: 20, createdAt: '' },
      { id: '2', bookId: 'b-1', date: '2026-03-09', pagesRead: 20, createdAt: '' },
      { id: '3', bookId: 'b-1', date: '2026-03-10', pagesRead: 20, createdAt: '' },
    ];

    const streak = statsService.calculateStreakInfo(logs, refDate);
    expect(streak.currentStreak).toBe(0);
    expect(streak.hasReadToday).toBe(false);
    expect(streak.longestStreak).toBe(3);
  });

  it('should compute weekly activity indicators with correct Monday-Sunday alignment', () => {
    const statsService = TestBed.inject(ReadingStatsService);

    // Wednesday, March 11, 2026. Current ISO week runs from Mon March 9 to Sun March 15.
    const refDate = new Date('2026-03-11T12:00:00');
    const logs: ReadingLog[] = [
      { id: '1', bookId: 'b-1', date: '2026-03-09', pagesRead: 20, createdAt: '' }, // Mon
      { id: '2', bookId: 'b-1', date: '2026-03-11', pagesRead: 35, createdAt: '' }, // Wed
    ];

    const streak = statsService.calculateStreakInfo(logs, refDate);
    expect(streak.weeklyActivity).toHaveLength(7);

    // Monday (index 0)
    expect(streak.weeklyActivity[0].dayKey).toBe('mon');
    expect(streak.weeklyActivity[0].active).toBe(true);
    expect(streak.weeklyActivity[0].isToday).toBe(false);

    // Tuesday (index 1)
    expect(streak.weeklyActivity[1].dayKey).toBe('tue');
    expect(streak.weeklyActivity[1].active).toBe(false);

    // Wednesday (index 2 - Today)
    expect(streak.weeklyActivity[2].dayKey).toBe('wed');
    expect(streak.weeklyActivity[2].active).toBe(true);
    expect(streak.weeklyActivity[2].isToday).toBe(true);

    // Sunday (index 6)
    expect(streak.weeklyActivity[6].dayKey).toBe('sun');
    expect(streak.weeklyActivity[6].active).toBe(false);
  });

  it('should compute annual progress accurately for books and pages in target year', () => {
    const statsService = TestBed.inject(ReadingStatsService);
    const refDate = new Date('2026-06-15T12:00:00');

    const progress = statsService.calculateAnnualProgress(sampleBooks, sampleLogs, refDate);
    expect(progress.year).toBe(2026);
    expect(progress.completedBooks).toBe(1);
    // Sum of logs in 2026: 60 + 120 + 80 + 40 = 300
    expect(progress.pagesRead).toBe(300);
  });

  it('should manage and persist reading goals reactively', () => {
    const statsService = TestBed.inject(ReadingStatsService);
    const initialGoals = statsService.goals();

    expect(initialGoals.year).toBe(new Date().getFullYear());
    expect(initialGoals.targetBooks).toBe(12);

    const updatedGoals: ReadingGoals = {
      year: new Date().getFullYear(),
      targetBooks: 25,
      targetPages: 6500,
    };

    const saved = statsService.saveGoals(updatedGoals);
    expect(saved).toBe(true);
    expect(storageMock.saveReadingGoals).toHaveBeenCalledWith(updatedGoals);
    expect(statsService.goals()).toEqual(updatedGoals);
  });
});
