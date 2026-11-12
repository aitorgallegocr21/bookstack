import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Book } from '../../models/book.model';
import { BooksService } from '../../services/books.service';
import { BookEditModalComponent } from './book-edit-modal';

describe('BookEditModalComponent', () => {
  const sampleBook: Book = {
    id: 'book-edit-1',
    title: 'Original Title',
    author: 'Original Author',
    totalPages: 320,
    currentPage: 50,
    status: 'reading',
    format: 'Físico',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };

  let updateMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    document.body.classList.remove('overflow-hidden');
    updateMock = vi.fn(async () => undefined);

    await TestBed.configureTestingModule({
      imports: [BookEditModalComponent],
      providers: [
        {
          provide: BooksService,
          useValue: {
            books: signal<Book[]>([sampleBook]),
            update: updateMock,
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

  it('should prefill existing book values and lock body scroll until destroyed', () => {
    const fixture = TestBed.createComponent(BookEditModalComponent);
    fixture.componentRef.setInput('bookId', sampleBook.id);
    fixture.detectChanges();

    expect(document.body.classList.contains('overflow-hidden')).toBe(true);
    const titleInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[formcontrolname="title"]'
    ) as HTMLInputElement;
    expect(titleInput.value).toBe('Original Title');

    fixture.destroy();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('should dismiss on Escape and persist updated book fields', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(BookEditModalComponent);
    fixture.componentRef.setInput('bookId', sampleBook.id);

    const closedSpy = vi.fn();
    const savedSpy = vi.fn<(book: Book) => void>();
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector('input[formcontrolname="title"]') as HTMLInputElement;
    titleInput.value = 'Updated Book Title';
    titleInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await Promise.resolve();

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(savedSpy).toHaveBeenCalledTimes(1);
    expect(savedSpy.mock.calls[0][0].title).toBe('Updated Book Title');
    expect(closedSpy).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    vi.advanceTimersByTime(180);
    expect(closedSpy).toHaveBeenCalledTimes(2);
  });
});
