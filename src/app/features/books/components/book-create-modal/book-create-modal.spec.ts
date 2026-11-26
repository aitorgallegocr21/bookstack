import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { Book } from '../../models/book.model';
import { BookMetadataCandidate } from '../../models/book-metadata.model';
import { BookMetadataService } from '../../services/book-metadata.service';
import { BooksService, CreateBookPrefill } from '../../services/books.service';
import { ExistingSeriesOption, SeriesService } from '../../../series/services/series.service';
import { BookCreateModalComponent } from './book-create-modal';

describe('BookCreateModalComponent', () => {
  let addMock: ReturnType<typeof vi.fn>;
  let lookupByIsbnMock: ReturnType<typeof vi.fn>;
  let createModalPrefillSignal: ReturnType<typeof signal<CreateBookPrefill | null>>;
  let existingSeriesOptionsSignal: ReturnType<typeof signal<ExistingSeriesOption[]>>;

  beforeEach(async () => {
    document.body.classList.remove('overflow-hidden');
    addMock = vi.fn(async () => undefined);
    lookupByIsbnMock = vi.fn(async () => null);
    createModalPrefillSignal = signal<CreateBookPrefill | null>(null);
    existingSeriesOptionsSignal = signal<ExistingSeriesOption[]>([
      {
        id: 'series-cosmere-1',
        normalizedKey: 'el archivo de las tormentas',
        name: 'El Archivo de las Tormentas',
        count: 2,
        nextVolumeNumber: 3,
      },
    ]);

    await TestBed.configureTestingModule({
      imports: [BookCreateModalComponent],
      providers: [
        {
          provide: BooksService,
          useValue: {
            books: signal<Book[]>([]),
            createModalPrefill: createModalPrefillSignal,
            add: addMock,
          },
        },
        {
          provide: SeriesService,
          useValue: {
            existingSeriesOptions: existingSeriesOptionsSignal,
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

  it('should prefill series fields when createModalPrefill is set', () => {
    createModalPrefillSignal.set({
      seriesName: 'El Archivo de las Tormentas',
      seriesVolumeNumber: 4,
    });

    const fixture = TestBed.createComponent(BookCreateModalComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const toggle = root.querySelector('input[formcontrolname="seriesEnabled"]') as HTMLInputElement;
    const nameInput = root.querySelector('#create-book-series-name') as HTMLInputElement;
    const volumeInput = root.querySelector('#create-book-series-volume') as HTMLInputElement;

    expect(toggle.checked).toBe(true);
    expect(nameInput.value).toBe('El Archivo de las Tormentas');
    expect(volumeInput.value).toBe('4');
  });

  it('should suggest next volume and reuse canonical series ID when matching an existing saga', async () => {
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    const savedSpy = vi.fn<(book: Book) => void>();
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    (root.querySelector('#create-book-title') as HTMLInputElement).value = 'Juramentada';
    root.querySelector('#create-book-title')!.dispatchEvent(new Event('input'));
    (root.querySelector('#create-book-author') as HTMLInputElement).value = 'Brandon Sanderson';
    root.querySelector('#create-book-author')!.dispatchEvent(new Event('input'));
    (root.querySelector('#create-book-total-pages') as HTMLInputElement).value = '1408';
    root.querySelector('#create-book-total-pages')!.dispatchEvent(new Event('input'));

    const seriesToggle = root.querySelector(
      'input[formcontrolname="seriesEnabled"]'
    ) as HTMLInputElement;
    seriesToggle.click();
    fixture.detectChanges();

    // Quick-pick chip should appear when seriesName is empty
    const quickPickBtn = Array.from(root.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('El Archivo de las Tormentas')
    ) as HTMLButtonElement;
    expect(quickPickBtn).toBeTruthy();
    quickPickBtn.click();
    fixture.detectChanges();

    const seriesNameInput = root.querySelector('#create-book-series-name') as HTMLInputElement;
    const seriesVolumeInput = root.querySelector('#create-book-series-volume') as HTMLInputElement;
    expect(seriesNameInput.value).toBe('El Archivo de las Tormentas');
    expect(seriesVolumeInput.value).toBe('3');

    const form = root.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await Promise.resolve();

    expect(savedSpy).toHaveBeenCalledTimes(1);
    expect(savedSpy.mock.calls[0][0].series).toEqual({
      id: 'series-cosmere-1',
      name: 'El Archivo de las Tormentas',
      volumeNumber: 3,
    });
  });

  it('should apply modal-scroll-area and no-scrollbar to the scrollable form body', () => {
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const scrollBody = root.querySelector('form > div.overflow-y-auto');
    expect(scrollBody).not.toBeNull();
    expect(scrollBody?.classList.contains('modal-scroll-area')).toBe(true);
    expect(scrollBody?.classList.contains('no-scrollbar')).toBe(true);
  });

  it('should hard-block future typo year 2925 and prompt confirmation for manual antique year 1605', async () => {
    const fixture = TestBed.createComponent(BookCreateModalComponent);
    const confirmDialogService = TestBed.inject(ConfirmDialogService);
    const savedSpy = vi.fn<(book: Book) => void>();
    fixture.componentInstance.saved.subscribe(savedSpy);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const titleInput = root.querySelector('#create-book-title') as HTMLInputElement;
    const authorInput = root.querySelector('#create-book-author') as HTMLInputElement;
    const pagesInput = root.querySelector('#create-book-total-pages') as HTMLInputElement;
    const yearInput = root.querySelector('#create-book-publication-year') as HTMLInputElement;

    titleInput.value = 'Don Quijote';
    titleInput.dispatchEvent(new Event('input'));
    authorInput.value = 'Miguel de Cervantes';
    authorInput.dispatchEvent(new Event('input'));
    pagesInput.value = '900';
    pagesInput.dispatchEvent(new Event('input'));

    // Hard block future typo 2925
    yearInput.value = '2925';
    yearInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance['createForm'].invalid).toBe(true);

    // Manual antique year 1605 triggers warning confirmation
    yearInput.value = '1605';
    yearInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance['createForm'].valid).toBe(true);

    const savePromise = fixture.componentInstance['save']();
    const dialog = confirmDialogService.activeDialog();
    expect(dialog).not.toBeNull();
    expect(dialog?.severity).toBe('warning');
    expect(dialog?.suppressibleKey).toBe('manualAntiqueYear');

    confirmDialogService.cancel();
    await savePromise;
    expect(addMock).not.toHaveBeenCalled();

    const confirmSavePromise = fixture.componentInstance['save']();
    confirmDialogService.accept();
    await confirmSavePromise;
    expect(addMock).toHaveBeenCalledTimes(1);
    expect(savedSpy).toHaveBeenCalledTimes(1);
  });

  it('should initialize format and status from AppPreferencesService defaults', () => {
    const appPreferences = TestBed.inject(AppPreferencesService);
    appPreferences.updatePreferences({
      defaultBookFormat: 'audiobook',
      defaultBookStatus: 'reading',
    });

    const fixture = TestBed.createComponent(BookCreateModalComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance['createForm'].get('format')?.value).toBe('Audiolibro');
    expect(fixture.componentInstance['createForm'].get('status')?.value).toBe('reading');
  });
});
