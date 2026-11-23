import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { Book } from '../../models/book.model';
import { BookMetadataCandidate } from '../../models/book-metadata.model';
import { BookMetadataService } from '../../services/book-metadata.service';
import { BooksService } from '../../services/books.service';
import { ExistingSeriesOption, SeriesService } from '../../../series/services/series.service';
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
    rating: 8.5,
    notes: 'Personal reading notes',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };

  let updateMock: ReturnType<typeof vi.fn>;
  let lookupByIsbnMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    document.body.classList.remove('overflow-hidden');
    updateMock = vi.fn(async () => undefined);
    lookupByIsbnMock = vi.fn(async () => null);

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
        {
          provide: SeriesService,
          useValue: {
            existingSeriesOptions: signal<ExistingSeriesOption[]>([
              {
                id: 'series-dune-1',
                normalizedKey: 'dune',
                name: 'Dune',
                count: 2,
                nextVolumeNumber: 3,
              },
            ]),
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

  it('should fill only empty public fields and protect existing title and personal fields in edit mode', async () => {
    const candidate: BookMetadataCandidate = {
      id: 'ol:9780141036144',
      title: '1984 (External Title)',
      author: 'George Orwell',
      isbn: '9780141036144',
      publisher: 'Penguin Books',
      publicationYear: 2008,
      totalPages: 999,
      coverUrl: 'data:image/webp;base64,abc',
      source: 'openlibrary',
    };
    lookupByIsbnMock.mockResolvedValueOnce(candidate);

    const fixture = TestBed.createComponent(BookEditModalComponent);
    fixture.componentRef.setInput('bookId', sampleBook.id);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const isbnInput = root.querySelector('#edit-book-isbn') as HTMLInputElement;
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

    const fillEmptyBtn = Array.from(root.querySelectorAll('app-book-metadata-lookup button')).find(
      (btn) => btn.textContent?.includes('Rellenar campos vacíos')
    ) as HTMLButtonElement;
    expect(fillEmptyBtn).toBeTruthy();
    fillEmptyBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    // Existing non-empty public & personal fields are preserved
    expect((root.querySelector('#edit-book-title') as HTMLInputElement).value).toBe(
      'Original Title'
    );
    expect((root.querySelector('#edit-book-author') as HTMLInputElement).value).toBe(
      'Original Author'
    );
    expect((root.querySelector('#edit-book-total-pages') as HTMLInputElement).value).toBe('320');
    expect((root.querySelector('#edit-book-current-pages') as HTMLInputElement).value).toBe('50');
    expect((root.querySelector('#edit-book-rating') as HTMLInputElement).value).toBe('8.5');
    expect(
      (root.querySelector('textarea[formcontrolname="notes"]') as HTMLTextAreaElement).value
    ).toBe('Personal reading notes');

    // Missing public fields are populated
    expect((root.querySelector('#edit-book-publisher') as HTMLInputElement).value).toBe(
      'Penguin Books'
    );
    expect((root.querySelector('#edit-book-publication-year') as HTMLInputElement).value).toBe(
      '2008'
    );
  });

  it('should suggest next volume and reuse canonical series ID when linking to an existing saga', async () => {
    const fixture = TestBed.createComponent(BookEditModalComponent);
    fixture.componentRef.setInput('bookId', sampleBook.id);
    const savedSpy = vi.fn<(book: Book) => void>();
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const seriesToggle = root.querySelector(
      'input[formcontrolname="seriesEnabled"]'
    ) as HTMLInputElement;
    seriesToggle.click();
    fixture.detectChanges();

    const seriesNameInput = root.querySelector('#edit-book-series-name') as HTMLInputElement;
    seriesNameInput.value = 'dune';
    seriesNameInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const seriesVolumeInput = root.querySelector('#edit-book-series-volume') as HTMLInputElement;
    expect(seriesVolumeInput.value).toBe('3');

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await Promise.resolve();

    expect(savedSpy).toHaveBeenCalledTimes(1);
    expect(savedSpy.mock.calls[0][0].series).toEqual({
      id: 'series-dune-1',
      name: 'dune',
      volumeNumber: 3,
    });
  });

  it('should hard-block 2925 and prompt only when manually changing to an unapproved antique year', async () => {
    const fixture = TestBed.createComponent(BookEditModalComponent);
    fixture.componentRef.setInput('bookId', sampleBook.id);
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const savedSpy = vi.fn<(book: Book) => void>();
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const yearInput = root.querySelector('#edit-book-publication-year') as HTMLInputElement;

    yearInput.value = '2925';
    yearInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance['editForm'].invalid).toBe(true);

    yearInput.value = '1605';
    yearInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance['editForm'].valid).toBe(true);

    const savePromise = fixture.componentInstance['save']();
    expect(confirmDialogService.activeDialog()?.suppressibleKey).toBe('manualAntiqueYear');
    confirmDialogService.accept();
    await savePromise;
    expect(savedSpy).toHaveBeenCalledTimes(1);
  });
});
