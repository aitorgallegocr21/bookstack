import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Book, ReadingLog } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { AnalyticsService } from '../../services/analytics.service';
import { LibraryCompositionSectionComponent } from './library-composition-section';

describe('LibraryCompositionSectionComponent', () => {
  let fixture: ComponentFixture<LibraryCompositionSectionComponent>;
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

  const textOf = (el: Element | null): string =>
    (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    localStorage.clear();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);

    await TestBed.configureTestingModule({
      imports: [LibraryCompositionSectionComponent],
      providers: [
        AnalyticsService,
        { provide: BooksService, useValue: { books: booksSignal.asReadonly() } },
        { provide: ReadingLogService, useValue: { readingLogs: logsSignal.asReadonly() } },
      ],
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsService);
    analyticsService.setReferenceDate(new Date('2026-06-15T12:00:00'));

    fixture = TestBed.createComponent(LibraryCompositionSectionComponent);
    fixture.detectChanges();
  });

  it('renders empty and unrated states cleanly when no books exist in the period', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(textOf(el.querySelector('[data-testid="format-donut-total"]'))).toBe('0');
    expect(el.querySelectorAll('[data-testid^="format-donut-segment-"]').length).toBe(0);
    expect(el.querySelectorAll('[data-testid^="status-bar-segment-"]').length).toBe(0);
    expect(textOf(el.querySelector('[data-testid="status-completion-rate"]'))).toContain('0%');
    expect(textOf(el.querySelector('[data-testid="status-abandonment-rate"]'))).toContain('0%');
    expect(textOf(el.querySelector('[data-testid="ratings-average-badge"]'))).toContain('0.0 / 10');
    expect(el.querySelector('[data-testid="ratings-empty-state"]')).not.toBeNull();
    expect(el.querySelector('[data-testid="top-authors-empty-state"]')).not.toBeNull();
  });

  it('renders SVG donut segments and legend with counts, percentages, and pages', () => {
    booksSignal.set([
      createBook({
        id: 'b1',
        title: 'Physical 1',
        format: 'Físico',
        status: 'completed',
        totalPages: 400,
        currentPage: 400,
        endDate: '2026-03-01',
      }),
      createBook({
        id: 'b2',
        title: 'Physical 2',
        format: 'Físico',
        status: 'reading',
        totalPages: 200,
        currentPage: 100,
      }),
      createBook({
        id: 'b3',
        title: 'Ebook 1',
        format: 'Ebook',
        status: 'completed',
        totalPages: 300,
        currentPage: 300,
        endDate: '2026-04-01',
      }),
      createBook({
        id: 'b4',
        title: 'Audio 1',
        format: 'Audiolibro',
        status: 'pending',
        totalPages: 150,
        currentPage: 0,
      }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(textOf(el.querySelector('[data-testid="format-donut-total"]'))).toBe('4');

    const physicalSeg = el.querySelector('[data-testid="format-donut-segment-physical"]');
    const ebookSeg = el.querySelector('[data-testid="format-donut-segment-ebook"]');
    const audioSeg = el.querySelector('[data-testid="format-donut-segment-audiobook"]');

    expect(physicalSeg).not.toBeNull();
    expect(ebookSeg).not.toBeNull();
    expect(audioSeg).not.toBeNull();

    expect(physicalSeg?.getAttribute('stroke-dashoffset')).toBe('0');
    expect(Number(ebookSeg?.getAttribute('stroke-dashoffset'))).toBeLessThan(0);
    expect(Number(audioSeg?.getAttribute('stroke-dashoffset'))).toBeLessThan(
      Number(ebookSeg?.getAttribute('stroke-dashoffset'))
    );

    const physicalLegend = textOf(el.querySelector('[data-testid="format-legend-item-physical"]'));
    expect(physicalLegend).toContain('2');
    expect(physicalLegend).toContain('50%');
    expect(physicalLegend).toContain('500');
  });

  it('renders status stacked bar segments and completion vs abandonment rates', () => {
    booksSignal.set([
      createBook({ id: 'b1', title: 'C1', status: 'completed', endDate: '2026-02-10' }),
      createBook({ id: 'b2', title: 'C2', status: 'completed', endDate: '2026-03-10' }),
      createBook({ id: 'b3', title: 'C3', status: 'completed', endDate: '2026-04-10' }),
      createBook({ id: 'b4', title: 'A1', status: 'abandoned' }),
      createBook({ id: 'b5', title: 'R1', status: 'reading' }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const completedSeg = el.querySelector(
      '[data-testid="status-bar-segment-completed"]'
    ) as HTMLElement | null;
    const pendingSeg = el.querySelector('[data-testid="status-bar-segment-pending"]');

    expect(completedSeg).not.toBeNull();
    expect(completedSeg?.style.width).toBe('60%');
    expect(pendingSeg).toBeNull();

    expect(textOf(el.querySelector('[data-testid="status-completion-rate"]'))).toContain('75%');
    expect(textOf(el.querySelector('[data-testid="status-abandonment-rate"]'))).toContain('25%');
  });

  it('renders rating histogram buckets and top 5 authors with truncation', () => {
    booksSignal.set([
      createBook({
        id: 'b1',
        title: 'B1',
        author: 'Author One With A Very Long Name That Should Truncate Gracefully',
        status: 'completed',
        totalPages: 500,
        currentPage: 500,
        rating: 9.5,
        endDate: '2026-02-10',
      }),
      createBook({
        id: 'b2',
        title: 'B2',
        author: 'Author One With A Very Long Name That Should Truncate Gracefully',
        status: 'completed',
        totalPages: 300,
        currentPage: 300,
        rating: 8,
        endDate: '2026-03-10',
      }),
      createBook({
        id: 'b3',
        title: 'B3',
        author: 'Author Two',
        status: 'completed',
        totalPages: 250,
        currentPage: 250,
        rating: 6,
        endDate: '2026-03-15',
      }),
      createBook({
        id: 'b4',
        title: 'B4',
        author: 'Author Three',
        status: 'abandoned',
        totalPages: 200,
        currentPage: 50,
        rating: 4,
      }),
      createBook({ id: 'b5', title: 'B5', author: 'Author Four', status: 'pending' }),
      createBook({ id: 'b6', title: 'B6', author: 'Author Five', status: 'pending' }),
      createBook({ id: 'b7', title: 'B7', author: 'Author Six', status: 'pending' }),
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="ratings-empty-state"]')).toBeNull();
    expect(textOf(el.querySelector('[data-testid="ratings-average-badge"]'))).toContain('6.9 / 10');
    expect(textOf(el.querySelector('[data-testid="rating-bucket-9–10"]'))).toContain('1 (25%)');
    expect(textOf(el.querySelector('[data-testid="rating-bucket-7–8.5"]'))).toContain('1 (25%)');
    expect(textOf(el.querySelector('[data-testid="rating-bucket-5–6.5"]'))).toContain('1 (25%)');
    expect(textOf(el.querySelector('[data-testid="rating-bucket-< 5"]'))).toContain('1 (25%)');

    const authorItems = el.querySelectorAll('[data-testid^="top-author-item-"]');
    expect(authorItems.length).toBe(5);
    expect(textOf(authorItems[0])).toContain('Author One');
    expect(textOf(authorItems[0])).toContain('2');
    expect(textOf(authorItems[0])).toContain('800');
    expect(authorItems[0].querySelector('.truncate')).not.toBeNull();
  });
});
