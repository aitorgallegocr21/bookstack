import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Book, ReadingLog } from '../../models/book.model';
import { BooksService } from '../../services/books.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { BooksPage } from './books-page';

describe('BooksPage', () => {
  const booksSignal = signal<Book[]>([]);
  const logsSignal = signal<ReadingLog[]>([]);

  beforeEach(async () => {
    booksSignal.set([]);
    logsSignal.set([]);

    await TestBed.configureTestingModule({
      imports: [BooksPage],
      providers: [
        {
          provide: BooksService,
          useValue: {
            books: booksSignal,
            remove: vi.fn(async () => undefined),
            update: vi.fn(async () => undefined),
          },
        },
        {
          provide: ReadingLogService,
          useValue: {
            readingLogs: logsSignal,
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.classList.remove('overflow-hidden');
    vi.restoreAllMocks();
  });

  it('should render empty state without nested <main> or duplicate create modal', () => {
    const fixture = TestBed.createComponent(BooksPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('main')).toBeNull();
    expect(root.querySelector('app-book-create-modal')).toBeNull();
    expect(root.textContent).toContain('No hay libros todavía.');
  });

  it('should render book cards and open detail/edit modals on interaction', async () => {
    booksSignal.set([
      {
        id: 'book-1',
        title: 'Elantris',
        author: 'Brandon Sanderson',
        totalPages: 600,
        currentPage: 150,
        status: 'reading',
        format: 'Físico',
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    const fixture = TestBed.createComponent(BooksPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Elantris');
    expect(root.textContent).toContain('Brandon Sanderson');
    expect(root.textContent).toContain('150 / 600');

    const detailsButton = root.querySelector(
      'button[aria-label="Ver detalles: Elantris"]'
    ) as HTMLButtonElement;
    detailsButton.click();
    fixture.detectChanges();
    expect(root.querySelector('app-book-detail-modal')).not.toBeNull();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    const editButton = root.querySelector(
      'button[aria-label="Editar Elantris"]'
    ) as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();
    expect(root.querySelector('app-book-edit-modal')).not.toBeNull();
  });

  it('should switch between view modes (grid, detailed, compact) correctly', () => {
    booksSignal.set([
      {
        id: 'book-1',
        title: 'Elantris',
        author: 'Brandon Sanderson',
        totalPages: 600,
        currentPage: 150,
        status: 'reading',
        format: 'Físico',
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    const fixture = TestBed.createComponent(BooksPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Default view mode: detailed
    expect(fixture.nativeElement.querySelector('app-book-detailed-card')).toBeTruthy();

    // Switch to grid view
    component['catalogFilterService'].setViewMode('grid');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-book-grid-card')).toBeTruthy();

    // Switch to compact view
    component['catalogFilterService'].setViewMode('compact');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-book-compact-row')).toBeTruthy();
  });

  it('should display zero-match empty state when search matches nothing and reset on button click', () => {
    booksSignal.set([
      {
        id: 'book-1',
        title: 'Elantris',
        author: 'Brandon Sanderson',
        totalPages: 600,
        currentPage: 150,
        status: 'reading',
        format: 'Físico',
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-02T10:00:00.000Z',
      },
    ]);

    const fixture = TestBed.createComponent(BooksPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // Set search query that does not match
    component['catalogFilterService'].setSearchQuery('NonExistentTitle');
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('No se encontraron libros');

    const allButtons = Array.from(root.querySelectorAll('button'));
    const clearBtn = allButtons.find((b) => b.textContent?.includes('Restablecer filtros'));
    expect(clearBtn).toBeTruthy();

    clearBtn?.click();
    fixture.detectChanges();

    expect(root.textContent).toContain('Elantris');
  });
});
