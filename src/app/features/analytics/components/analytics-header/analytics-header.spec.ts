import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { Book, ReadingLog } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { StatsPage } from '../../pages/stats-page/stats-page';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsHeaderComponent } from './analytics-header';

describe('AnalyticsHeaderComponent', () => {
  let fixture: ComponentFixture<AnalyticsHeaderComponent>;
  let analyticsService: AnalyticsService;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;

  const createBook = (overrides: Partial<Book> & { id: string; title: string }): Book => ({
    author: 'Default Author',
    totalPages: 250,
    currentPage: 0,
    status: 'pending',
    format: 'Físico',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  });

  beforeEach(async () => {
    localStorage.clear();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);

    await TestBed.configureTestingModule({
      imports: [AnalyticsHeaderComponent],
      providers: [
        AnalyticsService,
        { provide: BooksService, useValue: { books: booksSignal.asReadonly() } },
        { provide: ReadingLogService, useValue: { readingLogs: logsSignal.asReadonly() } },
      ],
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsService);
    analyticsService.setReferenceDate(new Date('2026-11-13T12:00:00'));

    fixture = TestBed.createComponent(AnalyticsHeaderComponent);
    fixture.detectChanges();
  });

  it('renders title, subtitle, and period buttons with aria-pressed states', () => {
    const el = fixture.nativeElement as HTMLElement;
    const h1 = el.querySelector('h1');
    const currentYearBtn = el.querySelector(
      '[data-testid="period-btn-current-year"]'
    ) as HTMLButtonElement;
    const last12Btn = el.querySelector(
      '[data-testid="period-btn-last-12-months"]'
    ) as HTMLButtonElement;
    const allTimeBtn = el.querySelector('[data-testid="period-btn-all-time"]') as HTMLButtonElement;

    expect(h1?.textContent).toContain('Estadísticas');
    expect(currentYearBtn.textContent).toContain('Este año (2026)');
    expect(currentYearBtn.getAttribute('aria-pressed')).toBe('true');
    expect(last12Btn.getAttribute('aria-pressed')).toBe('false');
    expect(allTimeBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('updates periodMode when clicking period pill buttons', () => {
    const el = fixture.nativeElement as HTMLElement;
    const currentYearBtn = el.querySelector(
      '[data-testid="period-btn-current-year"]'
    ) as HTMLButtonElement;
    const last12Btn = el.querySelector(
      '[data-testid="period-btn-last-12-months"]'
    ) as HTMLButtonElement;
    const allTimeBtn = el.querySelector('[data-testid="period-btn-all-time"]') as HTMLButtonElement;

    last12Btn.click();
    fixture.detectChanges();
    expect(analyticsService.periodMode()).toBe('last-12-months');
    expect(last12Btn.getAttribute('aria-pressed')).toBe('true');
    expect(currentYearBtn.getAttribute('aria-pressed')).toBe('false');

    allTimeBtn.click();
    fixture.detectChanges();
    expect(analyticsService.periodMode()).toBe('all-time');
    expect(allTimeBtn.getAttribute('aria-pressed')).toBe('true');

    currentYearBtn.click();
    fixture.detectChanges();
    expect(analyticsService.periodMode()).toBe('current-year');
    expect(currentYearBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('hides year dropdown when only current year is available and shows it when historical years exist', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="period-year-select"]')).toBeNull();

    booksSignal.set([
      createBook({
        id: 'b-2024',
        title: 'Old Book',
        status: 'completed',
        endDate: '2024-06-15',
      }),
    ]);
    fixture.detectChanges();

    const yearSelect = el.querySelector(
      '[data-testid="period-year-select"]'
    ) as HTMLSelectElement | null;
    expect(yearSelect).not.toBeNull();

    const optionValues = Array.from(yearSelect!.options).map((opt) => opt.value);
    expect(optionValues).toEqual(['2026', '2024']);

    yearSelect!.value = '2024';
    yearSelect!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(analyticsService.selectedYear()).toBe(2024);
    expect(analyticsService.periodMode()).toBe('specific-year');
  });
});

describe('StatsPage (Empty State & Header/KPI Integration)', () => {
  let fixture: ComponentFixture<StatsPage>;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;
  let uiOpenCreateSpy: ReturnType<typeof vi.fn>;
  let booksOpenCreateSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    localStorage.clear();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);
    uiOpenCreateSpy = vi.fn();
    booksOpenCreateSpy = vi.fn();

    await TestBed.configureTestingModule({
      imports: [StatsPage],
      providers: [
        AnalyticsService,
        {
          provide: BooksService,
          useValue: {
            books: booksSignal.asReadonly(),
            openCreateModal: booksOpenCreateSpy,
          },
        },
        { provide: ReadingLogService, useValue: { readingLogs: logsSignal.asReadonly() } },
        { provide: UiStateService, useValue: { openCreateModal: uiOpenCreateSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsPage);
    fixture.detectChanges();
  });

  it('renders empty state with CTA invoking UiStateService.openCreateModal() when library is empty', () => {
    const el = fixture.nativeElement as HTMLElement;
    const emptyState = el.querySelector('[data-testid="stats-empty-state"]');
    const ctaBtn = el.querySelector('[data-testid="stats-empty-cta"]') as HTMLButtonElement | null;

    expect(emptyState).not.toBeNull();
    expect(ctaBtn?.textContent).toContain('Añadir primer libro');
    expect(el.querySelector('app-analytics-header')).toBeNull();
    expect(el.querySelector('app-analytics-kpi-grid')).toBeNull();

    ctaBtn?.click();
    expect(uiOpenCreateSpy).toHaveBeenCalledTimes(1);
    expect(booksOpenCreateSpy).toHaveBeenCalledTimes(1);
  });

  it('renders analytics header and KPI grid when at least one book exists', () => {
    booksSignal.set([
      {
        id: 'b-1',
        title: 'Dune',
        author: 'Frank Herbert',
        totalPages: 500,
        currentPage: 500,
        status: 'completed',
        format: 'Físico',
        endDate: '2026-05-01',
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-05-01T10:00:00.000Z',
      },
    ]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="stats-empty-state"]')).toBeNull();
    expect(el.querySelector('app-analytics-header')).not.toBeNull();
    expect(el.querySelector('app-analytics-kpi-grid')).not.toBeNull();
  });
});
