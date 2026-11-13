import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Book, ReadingLog } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsKpiGridComponent } from './analytics-kpi-grid';

describe('AnalyticsKpiGridComponent', () => {
  let fixture: ComponentFixture<AnalyticsKpiGridComponent>;
  let analyticsService: AnalyticsService;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;

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

  const textOf = (el: Element | null): string =>
    (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    localStorage.clear();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);

    await TestBed.configureTestingModule({
      imports: [AnalyticsKpiGridComponent],
      providers: [
        AnalyticsService,
        { provide: BooksService, useValue: { books: booksSignal.asReadonly() } },
        { provide: ReadingLogService, useValue: { readingLogs: logsSignal.asReadonly() } },
      ],
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsService);
    analyticsService.setReferenceDate(new Date('2026-01-10T12:00:00'));

    fixture = TestBed.createComponent(AnalyticsKpiGridComponent);
    fixture.detectChanges();
  });

  it('renders clean zero-state fallbacks when no reading activity exists', () => {
    const el = fixture.nativeElement as HTMLElement;
    const completedCard = el.querySelector('[data-testid="kpi-card-completed-books"]');
    const pagesCard = el.querySelector('[data-testid="kpi-card-pages-read"]');
    const timeCard = el.querySelector('[data-testid="kpi-card-reading-time"]');
    const streakCard = el.querySelector('[data-testid="kpi-card-streak"]');

    expect(textOf(completedCard)).toContain('0');
    expect(textOf(completedCard)).toContain('0%');
    expect(textOf(pagesCard)).toContain('0');
    expect(textOf(pagesCard)).toContain('0 págs/día');
    expect(textOf(timeCard)).toContain('0h 0m');
    expect(textOf(timeCard)).toContain('0 págs/h');
    expect(textOf(streakCard)).toContain('0 días activos');
  });

  it('displays populated KPI values, formatted hours/minutes, speed, and streaks', () => {
    booksSignal.set([
      createBook({
        id: 'b-1',
        title: 'Book One',
        totalPages: 120,
        currentPage: 120,
        status: 'completed',
        endDate: '2026-01-10',
      }),
      createBook({
        id: 'b-2',
        title: 'Book Two',
        totalPages: 200,
        currentPage: 50,
        status: 'abandoned',
        endDate: '2026-01-08',
      }),
    ]);

    logsSignal.set([
      createLog({
        id: 'l-1',
        bookId: 'b-1',
        date: '2026-01-09',
        pagesRead: 60,
        timeSpentMinutes: 60,
      }),
      createLog({
        id: 'l-2',
        bookId: 'b-1',
        date: '2026-01-10',
        pagesRead: 60,
        timeSpentMinutes: 60,
      }),
      createLog({
        id: 'l-3',
        bookId: 'b-2',
        date: '2026-01-08',
        pagesRead: 50,
        timeSpentMinutes: 25,
      }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const completedCard = el.querySelector('[data-testid="kpi-card-completed-books"]');
    const pagesCard = el.querySelector('[data-testid="kpi-card-pages-read"]');
    const timeCard = el.querySelector('[data-testid="kpi-card-reading-time"]');
    const streakCard = el.querySelector('[data-testid="kpi-card-streak"]');

    // 1 completed out of (1 completed + 1 abandoned) = 50%
    expect(textOf(completedCard)).toContain('1');
    expect(textOf(completedCard)).toContain('50%');

    // 170 pages over 10 days (Jan 1 - Jan 10) = 17 págs/día
    expect(textOf(pagesCard)).toContain('170');
    expect(textOf(pagesCard)).toContain('17 págs/día');

    // 145 total minutes = 2h 25m; 170 pages / 145 min * 60 = 70 págs/h
    expect(textOf(timeCard)).toContain('2h 25m');
    expect(textOf(timeCard)).toContain('70 págs/h');

    // 3 active days (Jan 8, 9, 10), 3-day current and best streak
    expect(textOf(streakCard)).toContain('3 días activos');
    expect(textOf(streakCard)).toContain('Mejor racha: 3 días');
    expect(textOf(streakCard)).toContain('Racha actual: 3 días');
  });
});
