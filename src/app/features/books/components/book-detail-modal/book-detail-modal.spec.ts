import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Book, ReadingLog } from '../../models/book.model';
import { BooksService } from '../../services/books.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { BookDetailModalComponent } from './book-detail-modal';

describe('BookDetailModalComponent', () => {
  const sampleBook: Book = {
    id: 'detail-1',
    title: 'Solaris',
    author: 'Stanisław Lem',
    totalPages: 250,
    currentPage: 100,
    status: 'reading',
    format: 'Digital',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-05T10:00:00.000Z',
  };

  const sampleLogs: ReadingLog[] = [
    {
      id: 'log-a',
      bookId: 'detail-1',
      date: '2026-01-02',
      pagesRead: 40,
      timeSpentMinutes: 35,
      createdAt: '2026-01-02T10:00:00.000Z',
    },
    {
      id: 'log-b',
      bookId: 'detail-1',
      date: '2026-01-04',
      pagesRead: 60,
      timeSpentMinutes: 50,
      createdAt: '2026-01-04T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    document.body.classList.remove('overflow-hidden');

    await TestBed.configureTestingModule({
      imports: [BookDetailModalComponent],
      providers: [
        {
          provide: BooksService,
          useValue: {
            books: signal<Book[]>([sampleBook]),
          },
        },
        {
          provide: ReadingLogService,
          useValue: {
            readingLogs: signal<ReadingLog[]>(sampleLogs),
            remove: vi.fn(async () => undefined),
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.classList.remove('overflow-hidden');
    vi.restoreAllMocks();
  });

  it('should display book details, progress, and release body scroll lock on destroy', () => {
    const fixture = TestBed.createComponent(BookDetailModalComponent);
    fixture.componentRef.setInput('bookId', sampleBook.id);
    fixture.detectChanges();

    expect(document.body.classList.contains('overflow-hidden')).toBe(true);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Solaris');
    expect(root.textContent).toContain('Stanisław Lem');
    expect(root.textContent).toContain('40%');

    fixture.destroy();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('should emit editRequested and dismiss on Escape', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(BookDetailModalComponent);
    fixture.componentRef.setInput('bookId', sampleBook.id);

    const editSpy = vi.fn<(id: string) => void>();
    const closedSpy = vi.fn();
    fixture.componentInstance.editRequested.subscribe(editSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const editBtn = Array.from(root.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Editar')
    );
    expect(editBtn).toBeDefined();
    editBtn?.click();
    expect(editSpy).toHaveBeenCalledWith('detail-1');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    vi.advanceTimersByTime(180);
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });
});
