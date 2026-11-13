import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { Book, ReadingLog } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { AnalyticsService } from '../../services/analytics.service';
import { StatsPage } from './stats-page';

describe('StatsPage Integration', () => {
  let fixture: ComponentFixture<StatsPage>;
  let booksSignal: WritableSignal<Book[]>;
  let logsSignal: WritableSignal<ReadingLog[]>;
  let uiOpenCreateSpy: ReturnType<typeof vi.fn>;
  let booksOpenCreateSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
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

  it('renders the empty state when library has no books and opens create modal on CTA click', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-testid="stats-empty-state"]')).not.toBeNull();
    expect(el.querySelector('app-analytics-header')).toBeNull();
    expect(el.querySelector('app-analytics-kpi-grid')).toBeNull();
    expect(el.querySelector('app-reading-velocity-chart')).toBeNull();
    expect(el.querySelector('app-library-composition-section')).toBeNull();
    expect(el.querySelector('app-reading-habits-section')).toBeNull();

    const ctaBtn = el.querySelector('[data-testid="stats-empty-cta"]') as HTMLButtonElement | null;
    expect(ctaBtn).not.toBeNull();
    ctaBtn?.click();

    expect(uiOpenCreateSpy).toHaveBeenCalledTimes(1);
    expect(booksOpenCreateSpy).toHaveBeenCalledTimes(1);
  });

  it('coordinates all analytics child sections and updates reactively when period filter changes', () => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    booksSignal.set([
      {
        id: 'book-current',
        title: 'Dune',
        author: 'Frank Herbert',
        totalPages: 500,
        currentPage: 500,
        status: 'completed',
        format: 'Físico',
        rating: 9.5,
        startDate: `${currentYear}-02-01`,
        endDate: `${currentYear}-02-10`,
        createdAt: `${currentYear}-02-01T10:00:00.000Z`,
        updatedAt: `${currentYear}-02-10T10:00:00.000Z`,
      },
      {
        id: 'book-prev',
        title: 'Foundation',
        author: 'Isaac Asimov',
        totalPages: 300,
        currentPage: 300,
        status: 'completed',
        format: 'Ebook',
        rating: 8,
        startDate: `${prevYear}-05-01`,
        endDate: `${prevYear}-05-06`,
        createdAt: `${prevYear}-05-01T10:00:00.000Z`,
        updatedAt: `${prevYear}-05-06T10:00:00.000Z`,
      },
    ]);

    logsSignal.set([
      {
        id: 'log-1',
        bookId: 'book-current',
        date: `${currentYear}-02-05T19:00:00.000Z`,
        pagesRead: 120,
        timeSpentMinutes: 60,
        createdAt: `${currentYear}-02-05T19:00:00.000Z`,
      },
      {
        id: 'log-2',
        bookId: 'book-prev',
        date: `${prevYear}-05-03T18:00:00.000Z`,
        pagesRead: 300,
        timeSpentMinutes: 150,
        createdAt: `${prevYear}-05-03T18:00:00.000Z`,
      },
    ]);

    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="stats-empty-state"]')).toBeNull();
    expect(el.querySelector('app-analytics-header')).not.toBeNull();
    expect(el.querySelector('app-analytics-kpi-grid')).not.toBeNull();
    expect(el.querySelector('app-reading-velocity-chart')).not.toBeNull();
    expect(el.querySelector('app-library-composition-section')).not.toBeNull();
    expect(el.querySelector('app-reading-habits-section')).not.toBeNull();

    // Default is current year: only 1 book completed & 500 hybrid pages
    const completedCard = el.querySelector('[data-testid="kpi-card-completed-books"]');
    expect(completedCard?.textContent).toContain('1');

    // Switch to all-time via header button
    const allTimeBtn = el.querySelector(
      '[data-testid="period-btn-all-time"]'
    ) as HTMLButtonElement | null;
    expect(allTimeBtn).not.toBeNull();
    allTimeBtn?.click();
    fixture.detectChanges();

    expect(completedCard?.textContent).toContain('2');
    expect(el.querySelector('[data-testid="format-donut-total"]')?.textContent?.trim()).toBe('2');
    expect(el.querySelector('[data-testid="highlight-longest-book"]')?.textContent).toContain(
      'Dune'
    );
  });
});
