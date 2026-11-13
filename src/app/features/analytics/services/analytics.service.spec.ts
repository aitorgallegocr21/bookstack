import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Book, ReadingLog } from '../../books/models/book.model';
import { BooksService } from '../../books/services/books.service';
import { ReadingLogService } from '../../books/services/reading-log.service';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;
  let i18nService: I18nService;

  const createBook = (overrides: Partial<Book> & { id: string; title: string }): Book => ({
    author: 'Default Author',
    totalPages: 300,
    currentPage: 0,
    status: 'pending',
    format: 'Físico',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  });

  const createLog = (
    overrides: Partial<ReadingLog> & { id: string; bookId: string; date: string; pagesRead: number }
  ): ReadingLog => ({
    createdAt: `${overrides.date}T10:00:00.000Z`,
    ...overrides,
  });

  beforeEach(() => {
    localStorage.clear();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);

    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: BooksService, useValue: { books: booksSignal.asReadonly() } },
        { provide: ReadingLogService, useValue: { readingLogs: logsSignal.asReadonly() } },
      ],
    });

    service = TestBed.inject(AnalyticsService);
    i18nService = TestBed.inject(I18nService);
    service.setReferenceDate(new Date('2026-11-13T12:00:00'));
  });

  it('returns clean empty-library defaults', () => {
    expect(service.periodMode()).toBe('current-year');
    expect(service.trendMetric()).toBe('pages');
    expect(service.availableYears()).toEqual([2026]);

    expect(service.kpiSummary()).toEqual({
      completedBooks: 0,
      completionRatePercent: 0,
      pagesRead: 0,
      averagePagesPerDay: 0,
      totalTimeMinutes: 0,
      averageSpeedPagesPerHour: 0,
      activeDaysCount: 0,
      currentStreak: 0,
      longestStreak: 0,
    });

    expect(service.trendPoints()).toHaveLength(12);
    expect(service.trendPoints().every((point) => point.pages === 0 && point.books === 0)).toBe(
      true
    );
    expect(service.ratingDistribution()).toMatchObject({
      averageRating: 0,
      ratedBooksCount: 0,
    });
    expect(service.topAuthors()).toEqual([]);
    expect(service.weekdayPace().every((item) => item.pages === 0 && !item.isPeakDay)).toBe(true);
    expect(service.highlights()).toEqual({
      bestDay: null,
      longestBookCompleted: null,
      averageDaysToFinishBook: null,
      topRatedBook: null,
    });
  });

  it('computes hybrid pages combining ReadingLogs and unlogged direct book progress', () => {
    booksSignal.set([
      // Logged fully via sessions (200 logged, currentPage 200) -> 0 residual
      createBook({
        id: 'b-logged',
        title: 'Logged Book',
        author: 'Author A',
        totalPages: 200,
        currentPage: 200,
        status: 'completed',
        startDate: '2026-02-01',
        endDate: '2026-02-10',
      }),
      // Marked completed directly without logs (0 logged, currentPage 320) -> 320 residual on endDate
      createBook({
        id: 'b-direct',
        title: 'Direct Completed',
        author: 'Author B',
        totalPages: 320,
        currentPage: 320,
        status: 'completed',
        endDate: '2026-03-15',
      }),
      // Mixed book: 40 logged + 60 unlogged progress -> 60 residual on updatedAt
      createBook({
        id: 'b-mixed',
        title: 'Mixed Progress',
        author: 'Author A',
        totalPages: 400,
        currentPage: 100,
        status: 'reading',
        format: 'Ebook',
        updatedAt: '2026-04-05T15:00:00.000Z',
      }),
      // Legacy completed book with currentPage = 0 -> falls back to totalPages (150)
      createBook({
        id: 'b-legacy',
        title: 'Legacy Completed',
        author: 'Author C',
        totalPages: 150,
        currentPage: 0,
        status: 'completed',
        endDate: '2026-05-02',
      }),
    ]);

    logsSignal.set([
      createLog({
        id: 'l-1',
        bookId: 'b-logged',
        date: '2026-02-02',
        pagesRead: 120,
        timeSpentMinutes: 120,
      }),
      createLog({
        id: 'l-2',
        bookId: 'b-logged',
        date: '2026-02-10',
        pagesRead: 80,
        timeSpentMinutes: 60,
      }),
      createLog({
        id: 'l-3',
        bookId: 'b-mixed',
        date: '2026-04-01',
        pagesRead: 40,
        timeSpentMinutes: 60,
      }),
    ]);

    const kpis = service.kpiSummary();
    expect(kpis.completedBooks).toBe(3);
    expect(kpis.completionRatePercent).toBe(100);
    // 120 + 80 + 320 + 40 + 60 + 150 = 770
    expect(kpis.pagesRead).toBe(770);
    expect(kpis.totalTimeMinutes).toBe(240);
    // Timed logs: 240 pages / 240 minutes = 60 pages/h
    expect(kpis.averageSpeedPagesPerHour).toBe(60);
    // Distinct active dates: Feb 02, Feb 10, Mar 15, Apr 01, Apr 05, May 02 -> 6
    expect(kpis.activeDaysCount).toBe(6);

    const trend = service.trendPoints();
    expect(trend).toHaveLength(12);
    expect(trend.find((p) => p.key === '2026-02')).toMatchObject({
      pages: 200,
      books: 1,
      timeMinutes: 180,
    });
    expect(trend.find((p) => p.key === '2026-03')).toMatchObject({
      pages: 320,
      books: 1,
      timeMinutes: 0,
    });
    expect(trend.find((p) => p.key === '2026-04')).toMatchObject({
      pages: 100,
      books: 0,
      timeMinutes: 60,
    });
    expect(trend.find((p) => p.key === '2026-05')).toMatchObject({
      pages: 150,
      books: 1,
      timeMinutes: 0,
    });
  });

  it('filters periods across current-year, last-12-months, specific-year, and all-time', () => {
    booksSignal.set([
      createBook({
        id: 'b-2024',
        title: 'Old Classic',
        author: 'Author 2024',
        totalPages: 250,
        currentPage: 250,
        status: 'completed',
        endDate: '2024-07-20',
      }),
      createBook({
        id: 'b-2025-dec',
        title: 'December Read',
        author: 'Author 2025',
        totalPages: 180,
        currentPage: 180,
        status: 'completed',
        endDate: '2025-12-12',
      }),
      createBook({
        id: 'b-2026',
        title: 'Current Year Read',
        author: 'Author 2026',
        totalPages: 300,
        currentPage: 300,
        status: 'completed',
        endDate: '2026-06-15',
      }),
    ]);

    logsSignal.set([
      createLog({
        id: 'l-2024',
        bookId: 'b-2024',
        date: '2024-07-10',
        pagesRead: 100,
        timeSpentMinutes: 90,
      }),
      createLog({
        id: 'l-2025',
        bookId: 'b-2025-dec',
        date: '2025-12-10',
        pagesRead: 180,
        timeSpentMinutes: 120,
      }),
      createLog({
        id: 'l-2026',
        bookId: 'b-2026',
        date: '2026-06-15',
        pagesRead: 300,
        timeSpentMinutes: 200,
      }),
    ]);

    expect(service.availableYears()).toEqual([2026, 2025, 2024]);

    // Default: current-year (2026)
    expect(service.kpiSummary().completedBooks).toBe(1);
    expect(service.kpiSummary().pagesRead).toBe(300);

    // Last 12 months from 2026-11 -> 2025-12 through 2026-11
    service.setPeriodMode('last-12-months');
    expect(service.kpiSummary().completedBooks).toBe(2);
    expect(service.kpiSummary().pagesRead).toBe(480);
    const rollingTrend = service.trendPoints();
    expect(rollingTrend).toHaveLength(12);
    expect(rollingTrend[0].key).toBe('2025-12');
    expect(rollingTrend[11].key).toBe('2026-11');

    // Specific year: 2024
    service.selectYear(2024);
    expect(service.periodMode()).toBe('specific-year');
    expect(service.selectedYear()).toBe(2024);
    expect(service.kpiSummary().completedBooks).toBe(1);
    expect(service.kpiSummary().pagesRead).toBe(250);
    expect(service.trendPoints()).toHaveLength(12);
    expect(service.trendPoints().find((p) => p.key === '2024-07')?.pages).toBe(250);

    // All-time with multiple years -> yearly chronological buckets (2024, 2025, 2026)
    service.setPeriodMode('all-time');
    expect(service.kpiSummary().completedBooks).toBe(3);
    expect(service.kpiSummary().pagesRead).toBe(730);
    const allTimeTrend = service.trendPoints();
    expect(allTimeTrend.map((p) => p.key)).toEqual(['2024', '2025', '2026']);
    expect(allTimeTrend.map((p) => p.pages)).toEqual([250, 180, 300]);

    // Switching back to current-year resets selectedYear to referenceDate year
    service.setPeriodMode('current-year');
    expect(service.selectedYear()).toBe(2026);
  });

  it('computes format, status, rating distributions and top authors ranking', () => {
    booksSignal.set([
      createBook({
        id: 'b-1',
        title: 'Dune',
        author: 'Frank Herbert',
        totalPages: 600,
        currentPage: 600,
        status: 'completed',
        format: 'Físico',
        rating: 9.5,
        endDate: '2026-01-20',
      }),
      createBook({
        id: 'b-2',
        title: 'Dune Messiah',
        author: 'Frank Herbert',
        totalPages: 300,
        currentPage: 300,
        status: 'completed',
        format: { id: 'ebook', name: 'Ebook' },
        rating: 8.5,
        endDate: '2026-02-20',
      }),
      createBook({
        id: 'b-3',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        totalPages: 450,
        currentPage: 200,
        status: 'reading',
        format: 'Audiolibro',
        rating: 9,
        updatedAt: '2026-03-01T10:00:00.000Z',
      }),
      createBook({
        id: 'b-4',
        title: 'Slow Start',
        author: 'Author D',
        totalPages: 220,
        currentPage: 50,
        status: 'abandoned',
        format: 'Físico',
        rating: 4,
        endDate: '2026-04-01',
      }),
      createBook({
        id: 'b-5',
        title: 'Queued Book',
        author: 'Author E',
        totalPages: 280,
        currentPage: 0,
        status: 'pending',
        format: 'Ebook',
        rating: 0,
        createdAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-01T10:00:00.000Z',
      }),
    ]);

    expect(service.formatDistribution()).toEqual([
      { formatKey: 'physical', count: 2, percentage: 40, pages: 650 },
      { formatKey: 'ebook', count: 2, percentage: 40, pages: 300 },
      { formatKey: 'audiobook', count: 1, percentage: 20, pages: 200 },
    ]);

    expect(service.statusDistribution()).toEqual({
      items: [
        { status: 'completed', count: 2, percentage: 40 },
        { status: 'reading', count: 1, percentage: 20 },
        { status: 'pending', count: 1, percentage: 20 },
        { status: 'abandoned', count: 1, percentage: 20 },
      ],
      completionRatePercent: 67,
      abandonmentRatePercent: 33,
    });

    const ratings = service.ratingDistribution();
    expect(ratings.ratedBooksCount).toBe(4);
    expect(ratings.averageRating).toBe(7.8);
    expect(ratings.buckets).toEqual([
      { label: '9–10', min: 9, max: 10, count: 2, percentage: 50 },
      { label: '7–8.5', min: 7, max: 8.5, count: 1, percentage: 25 },
      { label: '5–6.5', min: 5, max: 6.5, count: 0, percentage: 0 },
      { label: '< 5', min: 0, max: 4.5, count: 1, percentage: 25 },
    ]);

    expect(service.topAuthors()).toEqual([
      { author: 'Frank Herbert', booksCount: 2, pagesRead: 900 },
      { author: 'Andy Weir', booksCount: 1, pagesRead: 200 },
      { author: 'Author D', booksCount: 1, pagesRead: 50 },
      { author: 'Author E', booksCount: 1, pagesRead: 0 },
    ]);
  });

  it('computes weekday reading pace with peak day detection and period highlights', () => {
    booksSignal.set([
      createBook({
        id: 'b-1',
        title: 'Short Novel',
        author: 'Author One',
        totalPages: 240,
        currentPage: 240,
        status: 'completed',
        rating: 8.5,
        startDate: '2026-03-01',
        endDate: '2026-03-05',
      }),
      createBook({
        id: 'b-2',
        title: 'Epic Tome',
        author: 'Author Two',
        totalPages: 840,
        currentPage: 840,
        status: 'completed',
        rating: 9.5,
        startDate: '2026-04-01',
        endDate: '2026-04-11',
      }),
      createBook({
        id: 'b-3',
        title: 'Undated Read',
        author: 'Author Three',
        totalPages: 300,
        currentPage: 300,
        status: 'completed',
        endDate: '2026-06-01',
      }),
    ]);

    // 2026-03-02 = Monday (50p), 2026-03-04 = Wednesday (120p), 2026-03-07 = Saturday (60p)
    // 2026-03-11 = Wednesday (40p) -> Wednesday total = 160p (peak day)
    logsSignal.set([
      createLog({ id: 'l-1', bookId: 'b-1', date: '2026-03-02', pagesRead: 50 }),
      createLog({ id: 'l-2', bookId: 'b-1', date: '2026-03-04', pagesRead: 120 }),
      createLog({ id: 'l-3', bookId: 'b-1', date: '2026-03-07', pagesRead: 60 }),
      createLog({ id: 'l-4', bookId: 'b-1', date: '2026-03-11', pagesRead: 40 }),
    ]);

    const pace = service.weekdayPace();
    expect(pace).toHaveLength(7);
    expect(pace.find((item) => item.dayKey === 'wed')).toEqual({
      dayKey: 'wed',
      pages: 160,
      sessionsCount: 2,
      percentageOfPeak: 100,
      isPeakDay: true,
    });
    expect(pace.find((item) => item.dayKey === 'mon')).toEqual({
      dayKey: 'mon',
      pages: 50,
      sessionsCount: 1,
      percentageOfPeak: 31,
      isPeakDay: false,
    });
    expect(pace.filter((item) => item.isPeakDay)).toHaveLength(1);

    const highlights = service.highlights();
    // b-2 has 840 residual pages on 2026-04-11 -> bestDay
    expect(highlights.bestDay).toEqual({ date: '2026-04-11', pages: 840 });
    expect(highlights.longestBookCompleted).toEqual({
      title: 'Epic Tome',
      author: 'Author Two',
      pages: 840,
    });
    // b-1: 4 days (Mar 1 -> Mar 5), b-2: 10 days (Apr 1 -> Apr 11) -> average = 7 days
    expect(highlights.averageDaysToFinishBook).toBe(7);
    expect(highlights.topRatedBook).toEqual({
      title: 'Epic Tome',
      author: 'Author Two',
      rating: 9.5,
    });
  });

  it('localizes trend labels when language switches between Spanish and English', () => {
    service.setTrendMetric('time');
    expect(service.trendMetric()).toBe('time');

    i18nService.setLocale('en');
    const enLabels = service.trendPoints().map((point) => point.label);
    expect(enLabels[0]).toBe('Jan');

    i18nService.setLocale('es');
    const esLabels = service.trendPoints().map((point) => point.label);
    expect(esLabels[0]).toBe('Ene');
  });
});
