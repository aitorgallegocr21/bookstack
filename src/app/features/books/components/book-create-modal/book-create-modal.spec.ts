import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Book } from '../../models/book.model';
import { BookMetadataCandidate } from '../../models/book-metadata.model';
import { BookMetadataService } from '../../services/book-metadata.service';
import { BooksService } from '../../services/books.service';
import { BookCreateModalComponent } from './book-create-modal';

describe('BookCreateModalComponent', () => {
  let addMock: ReturnType<typeof vi.fn>;
  let lookupByIsbnMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    document.body.classList.remove('overflow-hidden');
    addMock = vi.fn(async () => undefined);
    lookupByIsbnMock = vi.fn(async () => null);

    await TestBed.configureTestingModule({
      imports: [BookCreateModalComponent],
      providers: [
        {
          provide: BooksService,
          useValue: {
            books: signal<Book[]>([]),
            add: addMock,
          },
        },
        {
          provide: BookMetadataService,
          useValue: {
            lookupByIsbn: lookupByIsbnMock,
            searchByQuery: vi.fn(async () => []),
            resolveLocalCover: vi.fn(async (url: string) => url),
            findDuplicateInLibrary: vi.fn(() => null),
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

  it('should acquire body scroll lock on mount and release it on destroy', () => {
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    fixture.detectChanges();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    fixture.destroy();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('should dismiss on Escape key after closing animation delay', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    const closedSpy = vi.fn();
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(180);
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should validate required fields and emit saved/closed when creating a book', async () => {
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    const savedSpy = vi.fn<(book: Book) => void>();
    const closedSpy = vi.fn();
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.componentInstance.closed.subscribe(closedSpy);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector('input[formcontrolname="title"]') as HTMLInputElement;
    const authorInput = root.querySelector('input[formcontrolname="author"]') as HTMLInputElement;
    const totalPagesInput = root.querySelector(
      'input[formcontrolname="totalPages"]'
    ) as HTMLInputElement;

    // Submit while required fields are empty
    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(addMock).not.toHaveBeenCalled();

    titleInput.value = 'Fundación';
    titleInput.dispatchEvent(new Event('input'));
    authorInput.value = 'Isaac Asimov';
    authorInput.dispatchEvent(new Event('input'));
    totalPagesInput.value = '256';
    totalPagesInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(addMock).toHaveBeenCalledTimes(1);
    expect(savedSpy).toHaveBeenCalledTimes(1);
    expect(savedSpy.mock.calls[0][0].title).toBe('Fundación');
    expect(savedSpy.mock.calls[0][0].author).toBe('Isaac Asimov');
    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger inline ISBN lookup and apply metadata candidate into form controls', async () => {
    const candidate: BookMetadataCandidate = {
      id: 'ol:9780141036144',
      title: '1984',
      author: 'George Orwell',
      isbn: '9780141036144',
      publisher: 'Penguin Books',
      publicationYear: 2008,
      totalPages: 336,
      coverUrl: 'data:image/webp;base64,abc',
      source: 'merged',
    };
    lookupByIsbnMock.mockResolvedValueOnce(candidate);

    const fixture = TestBed.createComponent(BookCreateModalComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const isbnInput = root.querySelector('#create-book-isbn') as HTMLInputElement;
    isbnInput.value = '9780141036144';
    isbnInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const lookupBtn = root.querySelector(
      'button[aria-label="Buscar metadatos para este ISBN"]'
    ) as HTMLButtonElement;
    lookupBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(lookupByIsbnMock).toHaveBeenCalledWith('9780141036144');

    const applyBtn = root.querySelector(
      'app-book-metadata-lookup button[data-testid="apply-candidate-btn"], app-book-metadata-lookup ul button'
    ) as HTMLButtonElement | null;
    // Click the "Usar edición" button rendered inside the result card
    const useEditionBtn = Array.from(root.querySelectorAll('app-book-metadata-lookup button')).find(
      (btn) => btn.textContent?.includes('Usar edición')
    ) as HTMLButtonElement;
    expect(useEditionBtn ?? applyBtn).toBeTruthy();
    (useEditionBtn ?? applyBtn)!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((root.querySelector('#create-book-title') as HTMLInputElement).value).toBe('1984');
    expect((root.querySelector('#create-book-author') as HTMLInputElement).value).toBe(
      'George Orwell'
    );
    expect((root.querySelector('#create-book-publisher') as HTMLInputElement).value).toBe(
      'Penguin Books'
    );
    expect((root.querySelector('#create-book-publication-year') as HTMLInputElement).value).toBe(
      '2008'
    );
    expect((root.querySelector('#create-book-total-pages') as HTMLInputElement).value).toBe('336');
  });
});
