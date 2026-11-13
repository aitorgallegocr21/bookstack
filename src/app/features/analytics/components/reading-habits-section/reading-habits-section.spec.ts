import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Book, ReadingLog } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ReadingHabitsSectionComponent } from './reading-habits-section';

describe('ReadingHabitsSectionComponent', () => {
  let fixture: ComponentFixture<ReadingHabitsSectionComponent>;
  let analyticsService: AnalyticsService;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;

  const createBook = (overrides: Partial<Book> & { id: string; title: string }): Book => ({
    author: 'Default Author',
    totalPages: 300,
    currentPage: 0,
    status: 'pending',
    format: 'Físico',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
    ...overrides,
  });

  const createLog = (
    overrides: Partial<ReadingLog> & { id: string; date: string }
  ): ReadingLog => ({
    bookId: 'book-1',
    pagesRead: 25,
    createdAt: '2026-06-01T10:00:00.000Z',
    ...overrides,
  });

  const textOf = (el: Element | null): string =>
    (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    localStorage.clear();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);

    await TestBed.configureTestingModule({
      imports: [ReadingHabitsSectionComponent],
      providers: [
        AnalyticsService,
        { provide: BooksService, useValue: { books: booksSignal.asReadonly() } },
        { provide: ReadingLogService, useValue: { readingLogs: logsSignal.asReadonly() } },
      ],
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsService);
    analyticsService.setReferenceDate(new Date('2026-06-15T12:00:00'));

    fixture = TestBed.createComponent(ReadingHabitsSectionComponent);
    fixture.detectChanges();
  });

  it('renders empty weekday sessions and empty highlight states when no activity exists', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="weekday-pace-empty-state"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="weekday-peak-badge"]')).toBeNull();
    expect(textOf(el.querySelector('[data-testid="highlight-best-day"]'))).toContain(
      'Sin sesiones o registros diarios en el período.'
    );
    expect(textOf(el.querySelector('[data-testid="highlight-longest-book"]'))).toContain(
      'Aún no has completado libros en este período.'
    );
    expect(textOf(el.querySelector('[data-testid="highlight-avg-days"]'))).toContain(
      'Añade fecha de inicio y fin al completar libros para calcularlo.'
    );
    expect(textOf(el.querySelector('[data-testid="highlight-top-rated"]'))).toContain(
      'Sin libros puntuados en este período.'
    );
  });

  it('renders Monday-Sunday pace bars, peak day badge, and scales bar heights relative to peak', () => {
    // 2026-06-08 is Monday, 2026-06-10 is Wednesday, 2026-06-14 is Sunday
    logsSignal.set([
      createLog({ id: 'l1', date: '2026-06-08', pagesRead: 40 }),
      createLog({ id: 'l2', date: '2026-06-10', pagesRead: 50 }),
      createLog({ id: 'l3', date: '2026-06-10', pagesRead: 30 }),
      createLog({ id: 'l4', date: '2026-06-14', pagesRead: 20 }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="weekday-pace-empty-state"]')).toBeNull();

    const peakBadge = el.querySelector('[data-testid="weekday-peak-badge"]');
    expect(textOf(peakBadge)).toContain('Día estrella');
    expect(textOf(peakBadge)).toContain('X');

    const monBar = el.querySelector('[data-testid="weekday-bar-fill-mon"]') as HTMLElement;
    const tueBar = el.querySelector('[data-testid="weekday-bar-fill-tue"]') as HTMLElement;
    const wedBar = el.querySelector('[data-testid="weekday-bar-fill-wed"]') as HTMLElement;
    const sunBar = el.querySelector('[data-testid="weekday-bar-fill-sun"]') as HTMLElement;

    expect(wedBar.style.height).toBe('100%');
    expect(monBar.style.height).toBe('50%');
    expect(sunBar.style.height).toBe('25%');
    expect(tueBar.style.height).toBe('0%');
    expect(wedBar.className).toContain('bg-amber-500');
  });

  it('renders all 4 period highlight cards with complete metadata', () => {
    booksSignal.set([
      createBook({
        id: 'b1',
        title: 'Dune',
        author: 'Frank Herbert',
        totalPages: 688,
        currentPage: 688,
        status: 'completed',
        rating: 9.5,
        startDate: '2026-06-01',
        endDate: '2026-06-11',
      }),
      createBook({
        id: 'b2',
        title: 'El Hobbit',
        author: 'J.R.R. Tolkien',
        totalPages: 310,
        currentPage: 310,
        status: 'completed',
        rating: 8.5,
        startDate: '2026-06-11',
        endDate: '2026-06-15',
      }),
    ]);

    logsSignal.set([
      createLog({ id: 'l1', bookId: 'b1', date: '2026-06-05', pagesRead: 400 }),
      createLog({ id: 'l2', bookId: 'b2', date: '2026-06-13', pagesRead: 45 }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;

    expect(textOf(el.querySelector('[data-testid="highlight-best-day"]'))).toContain('05/06/2026');
    expect(textOf(el.querySelector('[data-testid="highlight-best-day"]'))).toContain('400 págs');

    expect(textOf(el.querySelector('[data-testid="highlight-longest-book"]'))).toContain('Dune');
    expect(textOf(el.querySelector('[data-testid="highlight-longest-book"]'))).toContain(
      'Frank Herbert'
    );
    expect(textOf(el.querySelector('[data-testid="highlight-longest-book"]'))).toContain(
      '688 págs'
    );

    // Average of 10 days (June 1 -> June 11) and 4 days (June 12 -> June 16) = 7 days
    expect(textOf(el.querySelector('[data-testid="highlight-avg-days"]'))).toContain('7 días');

    expect(textOf(el.querySelector('[data-testid="highlight-top-rated"]'))).toContain('Dune');
    expect(textOf(el.querySelector('[data-testid="highlight-top-rated-badge"]'))).toBe('9.5 / 10');
  });

  it('keeps average days fallback when completed books lack startDate or endDate', () => {
    booksSignal.set([
      createBook({
        id: 'b1',
        title: 'Sin Fechas',
        author: 'Autora Test',
        totalPages: 240,
        currentPage: 240,
        status: 'completed',
        updatedAt: '2026-06-10T12:00:00.000Z',
      }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(textOf(el.querySelector('[data-testid="highlight-longest-book"]'))).toContain(
      'Sin Fechas'
    );
    expect(textOf(el.querySelector('[data-testid="highlight-avg-days"]'))).toContain(
      'Añade fecha de inicio y fin al completar libros para calcularlo.'
    );
  });
});
