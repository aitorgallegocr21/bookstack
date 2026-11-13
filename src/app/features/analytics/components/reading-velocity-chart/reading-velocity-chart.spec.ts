import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Book, ReadingLog } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ReadingVelocityChartComponent } from './reading-velocity-chart';

describe('ReadingVelocityChartComponent', () => {
  let fixture: ComponentFixture<ReadingVelocityChartComponent>;
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
      imports: [ReadingVelocityChartComponent],
      providers: [
        AnalyticsService,
        { provide: BooksService, useValue: { books: booksSignal.asReadonly() } },
        { provide: ReadingLogService, useValue: { readingLogs: logsSignal.asReadonly() } },
      ],
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsService);
    analyticsService.setReferenceDate(new Date('2026-06-15T12:00:00'));

    fixture = TestBed.createComponent(ReadingVelocityChartComponent);
    fixture.detectChanges();
  });

  it('shows baseline tracks and empty-period notice when there is no activity', () => {
    const el = fixture.nativeElement as HTMLElement;
    const emptyNotice = el.querySelector('[data-testid="velocity-empty-notice"]');
    const averageLine = el.querySelector('[data-testid="velocity-average-line"]');
    const bars = el.querySelectorAll('[data-testid^="velocity-bar-2026-"]');

    expect(emptyNotice).not.toBeNull();
    expect(averageLine).toBeNull();
    expect(bars.length).toBe(12);
  });

  it('switches metrics (pages, books, time) and updates total and average pills', () => {
    booksSignal.set([
      createBook({
        id: 'b1',
        title: 'Dune',
        status: 'completed',
        totalPages: 400,
        currentPage: 400,
        endDate: '2026-03-20',
      }),
      createBook({
        id: 'b2',
        title: 'Foundation',
        status: 'completed',
        totalPages: 250,
        currentPage: 250,
        endDate: '2026-03-28',
      }),
    ]);

    logsSignal.set([
      createLog({
        id: 'l1',
        bookId: 'b1',
        date: '2026-01-10',
        pagesRead: 120,
        timeSpentMinutes: 90,
      }),
      createLog({
        id: 'l2',
        bookId: 'b2',
        date: '2026-03-15',
        pagesRead: 240,
        timeSpentMinutes: 150,
      }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(textOf(el.querySelector('[data-testid="velocity-period-total"]'))).toContain('650');
    expect(textOf(el.querySelector('[data-testid="velocity-period-average"]'))).toContain('54,2');
    expect(el.querySelector('[data-testid="velocity-empty-notice"]')).toBeNull();

    const booksBtn = el.querySelector('[data-testid="velocity-metric-books"]') as HTMLButtonElement;
    booksBtn.click();
    fixture.detectChanges();

    expect(analyticsService.trendMetric()).toBe('books');
    expect(booksBtn.getAttribute('aria-pressed')).toBe('true');
    expect(textOf(el.querySelector('[data-testid="velocity-period-total"]'))).toContain('2');

    const timeBtn = el.querySelector('[data-testid="velocity-metric-time"]') as HTMLButtonElement;
    timeBtn.click();
    fixture.detectChanges();

    expect(analyticsService.trendMetric()).toBe('time');
    expect(timeBtn.getAttribute('aria-pressed')).toBe('true');
    expect(textOf(el.querySelector('[data-testid="velocity-period-total"]'))).toContain('4h');
  });

  it('scales bar heights proportionally and renders dashed average line', () => {
    logsSignal.set([
      createLog({ id: 'l1', bookId: 'b1', date: '2026-01-05', pagesRead: 100 }),
      createLog({ id: 'l2', bookId: 'b1', date: '2026-02-05', pagesRead: 200 }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const janFill = el.querySelector(
      '[data-testid="velocity-bar-2026-01"] [data-testid="velocity-bar-fill"]'
    ) as HTMLElement | null;
    const febFill = el.querySelector(
      '[data-testid="velocity-bar-2026-02"] [data-testid="velocity-bar-fill"]'
    ) as HTMLElement | null;
    const avgLine = el.querySelector('[data-testid="velocity-average-line"]') as HTMLElement | null;

    expect(janFill?.style.height).toBe('50%');
    expect(febFill?.style.height).toBe('100%');
    expect(avgLine).not.toBeNull();
    // 300 total / 12 months = 25 avg; 25 / 200 max = 12.5% -> rounded 13%
    expect(avgLine?.style.bottom).toBe('13%');
  });

  it('selects a bar on click and updates the accessible inline detail strip', () => {
    booksSignal.set([
      createBook({
        id: 'b1',
        title: 'Book 1',
        status: 'completed',
        totalPages: 205,
        currentPage: 205,
        endDate: '2026-01-22',
      }),
    ]);
    logsSignal.set([
      createLog({
        id: 'l1',
        bookId: 'b1',
        date: '2026-01-12',
        pagesRead: 145,
        timeSpentMinutes: 75,
      }),
      createLog({
        id: 'l2',
        bookId: 'b1',
        date: '2026-04-12',
        pagesRead: 60,
        timeSpentMinutes: 40,
      }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const janBar = el.querySelector('[data-testid="velocity-bar-2026-01"]') as HTMLButtonElement;
    expect(janBar.getAttribute('aria-label')).toContain('145');

    janBar.click();
    fixture.detectChanges();

    expect(janBar.getAttribute('aria-pressed')).toBe('true');
    const detailText = textOf(el.querySelector('[data-testid="velocity-selected-detail"]'));
    expect(detailText).toContain('145');
    expect(detailText).toContain('1');
    expect(detailText).toContain('1h 15m');
  });
});
