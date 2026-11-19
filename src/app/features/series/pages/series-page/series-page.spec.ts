import { signal } from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Book } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import {
  SagaAggregation,
  SagaFilterStatus,
  SagaSortOption,
  SagaStatusCounts,
} from '../../models/series.model';
import { SeriesService } from '../../services/series.service';
import { SeriesPage } from './series-page';

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: overrides.id ?? 'b1',
    title: overrides.title ?? 'El imperio final',
    author: overrides.author ?? 'Brandon Sanderson',
    status: overrides.status ?? 'reading',
    totalPages: overrides.totalPages ?? 600,
    currentPage: overrides.currentPage ?? 120,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    series: { id: 's1', name: 'Nacidos de la bruma', volumeNumber: 1 },
    ...overrides,
  };
}

function makeSaga(book: Book): SagaAggregation {
  return {
    id: 's1',
    normalizedKey: 'nacidos de la bruma',
    name: 'Nacidos de la bruma',
    authors: ['Brandon Sanderson'],
    books: [book],
    timelineSlots: [{ volumeNumber: 1, kind: 'owned', book }],
    ownedCount: 1,
    totalTargetVolumes: 1,
    completedCount: 0,
    readingCount: 1,
    pendingCount: 0,
    abandonedCount: 0,
    missingVolumes: [],
    totalPages: 600,
    readPages: 120,
    progressPercent: 20,
    totalReadingMinutes: 45,
    nextBookToRead: book,
    statusCategory: 'reading',
    bentoScale: 'compact',
    lastActivityAt: '2026-01-02T00:00:00.000Z',
  };
}

describe('SeriesPage', () => {
  let fixture: ComponentFixture<SeriesPage>;

  const sagasSig = signal<SagaAggregation[]>([]);
  const filteredSagasSig = signal<SagaAggregation[]>([]);
  const searchQuerySig = signal<string>('');
  const statusFilterSig = signal<SagaFilterStatus>('all');
  const sortOptionSig = signal<SagaSortOption>('recent');
  const statusCountsSig = signal<SagaStatusCounts>({
    all: 0,
    reading: 0,
    completed: 0,
    pending: 0,
    hasGaps: 0,
  });
  const hasActiveFiltersSig = signal<boolean>(false);

  const booksSig = signal<Book[]>([]);

  const mockSeriesService = {
    sagas: sagasSig.asReadonly(),
    filteredSagas: filteredSagasSig.asReadonly(),
    searchQuery: searchQuerySig.asReadonly(),
    statusFilter: statusFilterSig.asReadonly(),
    sortOption: sortOptionSig.asReadonly(),
    statusCounts: statusCountsSig.asReadonly(),
    hasActiveFilters: hasActiveFiltersSig.asReadonly(),
    setSearchQuery: vi.fn((q: string) => searchQuerySig.set(q)),
    setStatusFilter: vi.fn((s: SagaFilterStatus) => statusFilterSig.set(s)),
    setSortOption: vi.fn((o: SagaSortOption) => sortOptionSig.set(o)),
    resetFilters: vi.fn(() => {
      searchQuerySig.set('');
      statusFilterSig.set('all');
    }),
    upsertSeriesMetadata: vi.fn(),
    linkBooksToSeries: vi.fn(),
    unlinkBookFromSeries: vi.fn(),
    updateBookVolumeNumber: vi.fn(),
  };

  const mockBooksService = {
    books: booksSig.asReadonly(),
    openCreateModal: vi.fn(),
    getById: vi.fn((id: string) => booksSig().find((b) => b.id === id)),
    remove: vi.fn(),
    update: vi.fn(),
  };

  const mockReadingLogService = {
    readingLogs: signal([]).asReadonly(),
    getLogsForBook: vi.fn(() => []),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    sagasSig.set([]);
    filteredSagasSig.set([]);
    searchQuerySig.set('');
    statusFilterSig.set('all');
    hasActiveFiltersSig.set(false);
    booksSig.set([]);

    await TestBed.configureTestingModule({
      imports: [SeriesPage],
      providers: [
        provideRouter([]),
        { provide: SeriesService, useValue: mockSeriesService },
        { provide: BooksService, useValue: mockBooksService },
        { provide: ReadingLogService, useValue: mockReadingLogService },
      ],
      deferBlockBehavior: DeferBlockBehavior.Playthrough,
    }).compileComponents();

    fixture = TestBed.createComponent(SeriesPage);
    fixture.detectChanges();
  });

  it('should render empty library state and call openCreateModal when clicking add book to series', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Todavía no tienes sagas registradas');

    const addBtn = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find((b) => b.textContent?.includes('Añadir libro a una saga'));
    expect(addBtn).toBeTruthy();
    addBtn!.click();

    expect(mockBooksService.openCreateModal).toHaveBeenCalledWith();
  });

  it('should render zero-match filter empty state and reset filters on click', () => {
    const book = makeBook();
    const saga = makeSaga(book);
    sagasSig.set([saga]);
    filteredSagasSig.set([]);
    hasActiveFiltersSig.set(true);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ninguna saga coincide con los filtros');

    const resetBtns = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).filter((b) => b.textContent?.includes('Restablecer filtros'));
    expect(resetBtns.length).toBeGreaterThan(0);
    resetBtns[resetBtns.length - 1].click();

    expect(mockSeriesService.resetFilters).toHaveBeenCalledOnce();
  });

  it('should render Bento grid cards when filteredSagas has items and handle addMissingVolume', () => {
    const book = makeBook();
    const saga = makeSaga(book);
    booksSig.set([book]);
    sagasSig.set([saga]);
    filteredSagasSig.set([saga]);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-saga-bento-card');
    expect(cards.length).toBe(1);

    const grid = fixture.nativeElement.querySelector('section.grid') as HTMLElement;
    expect(grid.className).toContain('md:grid-cols-12');

    // Trigger addMissingVolume via component method
    (
      fixture.componentInstance as unknown as {
        handleAddMissingVolume: (p: { seriesName: string; volumeNumber: number }) => void;
      }
    ).handleAddMissingVolume({ seriesName: 'Nacidos de la bruma', volumeNumber: 2 });

    expect(mockBooksService.openCreateModal).toHaveBeenCalledWith({
      seriesName: 'Nacidos de la bruma',
      seriesVolumeNumber: 2,
    });
  });

  it('should open BookDetailModalComponent when openDetailModal is triggered', async () => {
    const book = makeBook();
    const saga = makeSaga(book);
    booksSig.set([book]);
    sagasSig.set([saga]);
    filteredSagasSig.set([saga]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-book-detail-modal')).toBeNull();

    (
      fixture.componentInstance as unknown as { openDetailModal: (id: string) => void }
    ).openDetailModal('b1');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-book-detail-modal')).toBeTruthy();
  });

  it('should open ReadingLogEditorComponent when openReadingLogForBook is triggered', async () => {
    const book = makeBook();
    const saga = makeSaga(book);
    booksSig.set([book]);
    sagasSig.set([saga]);
    filteredSagasSig.set([saga]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-reading-log-editor')).toBeNull();

    (
      fixture.componentInstance as unknown as { openReadingLogForBook: (b: Book) => void }
    ).openReadingLogForBook(book);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('app-reading-log-editor')).toBeTruthy();
  });

  it('should open SagaDetailModalComponent reactively and close it', async () => {
    const book = makeBook();
    const saga = makeSaga(book);
    booksSig.set([book]);
    sagasSig.set([saga]);
    filteredSagasSig.set([saga]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-saga-detail-modal')).toBeNull();

    (
      fixture.componentInstance as unknown as { openSagaModal: (s: SagaAggregation) => void }
    ).openSagaModal(saga);
    fixture.detectChanges();
    await fixture.whenStable();

    const modalEl = fixture.nativeElement.querySelector('app-saga-detail-modal') as HTMLElement;
    expect(modalEl).toBeTruthy();
    expect(modalEl.textContent).toContain('Nacidos de la bruma');

    // Live update when sagas signal changes
    const updatedSaga: SagaAggregation = {
      ...saga,
      expectedVolumes: 3,
      missingVolumes: [2, 3],
      timelineSlots: [
        { volumeNumber: 1, kind: 'owned', book },
        { volumeNumber: 2, kind: 'missing' },
        { volumeNumber: 3, kind: 'missing' },
      ],
    };
    sagasSig.set([updatedSaga]);
    fixture.detectChanges();
    expect(modalEl.textContent).toContain('+ Añadir Vol. 2');

    (fixture.componentInstance as unknown as { closeSagaModal: () => void }).closeSagaModal();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-saga-detail-modal')).toBeNull();
  });
});
