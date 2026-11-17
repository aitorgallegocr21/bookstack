import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { Book } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { SagaAggregation } from '../../models/series.model';
import { SeriesService } from '../../services/series.service';
import { SagaDetailModalComponent } from './saga-detail-modal.component';

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: overrides.id ?? 'b1',
    title: overrides.title ?? 'El imperio final',
    author: overrides.author ?? 'Brandon Sanderson',
    status: overrides.status ?? 'reading',
    totalPages: overrides.totalPages ?? 600,
    currentPage: overrides.currentPage ?? 150,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

function makeSaga(overrides: Partial<SagaAggregation> = {}): SagaAggregation {
  const book1 = makeBook({
    id: 'b1',
    title: 'El imperio final',
    series: { id: 's1', name: 'Nacidos de la bruma', volumeNumber: 1 },
  });
  const book3 = makeBook({
    id: 'b3',
    title: 'El héroe de las eras',
    status: 'pending',
    currentPage: 0,
    series: { id: 's1', name: 'Nacidos de la bruma', volumeNumber: 3 },
  });

  return {
    id: 's1',
    normalizedKey: 'nacidos de la bruma',
    name: 'Nacidos de la bruma',
    authors: ['Brandon Sanderson'],
    books: [book1, book3],
    timelineSlots: [
      { volumeNumber: 1, kind: 'owned', book: book1 },
      { volumeNumber: 2, kind: 'missing' },
      { volumeNumber: 3, kind: 'owned', book: book3 },
    ],
    metadata: {
      id: 's1',
      normalizedKey: 'nacidos de la bruma',
      name: 'Nacidos de la bruma',
      expectedVolumes: 3,
      publicationStatus: 'completed',
      notes: 'Trilogía original',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
    ownedCount: 2,
    expectedVolumes: 3,
    totalTargetVolumes: 3,
    completedCount: 0,
    readingCount: 1,
    pendingCount: 1,
    abandonedCount: 0,
    missingVolumes: [2],
    totalPages: 1200,
    readPages: 150,
    progressPercent: 13,
    averageRating: 4.5,
    totalReadingMinutes: 90,
    nextBookToRead: book1,
    statusCategory: 'reading',
    bentoScale: 'medium',
    lastActivityAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('SagaDetailModalComponent', () => {
  let fixture: ComponentFixture<SagaDetailModalComponent>;
  let component: SagaDetailModalComponent;

  const booksSig = signal<Book[]>([]);

  const mockUiState = {
    acquireScrollLock: vi.fn(),
    releaseScrollLock: vi.fn(),
  };

  const mockSeriesService = {
    upsertSeriesMetadata: vi.fn().mockResolvedValue(undefined),
    linkBooksToSeries: vi.fn().mockResolvedValue(undefined),
    unlinkBookFromSeries: vi.fn().mockResolvedValue(undefined),
    updateBookVolumeNumber: vi.fn().mockResolvedValue(undefined),
  };

  const mockBooksService = {
    books: booksSig.asReadonly(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    booksSig.set([
      makeBook({
        id: 'b1',
        title: 'El imperio final',
        series: { id: 's1', name: 'Nacidos de la bruma', volumeNumber: 1 },
      }),
      makeBook({
        id: 'standalone-1',
        title: 'Elantris',
        author: 'Brandon Sanderson',
      }),
      makeBook({
        id: 'other-series',
        title: 'El camino de los reyes',
        series: { id: 's2', name: 'El archivo de las tormentas', volumeNumber: 1 },
      }),
    ]);

    await TestBed.configureTestingModule({
      imports: [SagaDetailModalComponent],
      providers: [
        { provide: UiStateService, useValue: mockUiState },
        { provide: SeriesService, useValue: mockSeriesService },
        { provide: BooksService, useValue: mockBooksService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SagaDetailModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('saga', makeSaga());
    fixture.detectChanges();
  });

  it('acquires scroll lock on init and releases on destroy', () => {
    expect(mockUiState.acquireScrollLock).toHaveBeenCalledTimes(1);
    fixture.destroy();
    expect(mockUiState.releaseScrollLock).toHaveBeenCalledTimes(1);
  });

  it('emits closed on Escape key and backdrop click, but not on inner panel click', () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const panel = fixture.nativeElement.querySelector('.modal-panel') as HTMLElement;
    panel.click();
    expect(closedSpy).not.toHaveBeenCalled();

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.click();
    expect(closedSpy).toHaveBeenCalledTimes(1);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closedSpy).toHaveBeenCalledTimes(2);
  });

  it('renders saga metadata, metrics strip, owned timeline rows, and ghost missing slots', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Nacidos de la bruma');
    expect(text).toContain('Brandon Sanderson');
    expect(text).toContain('150');
    expect(text).toContain('1200');
    expect(text).toContain('1.5h');
    expect(text).toContain('4.5');
    expect(text).toContain('El imperio final');
    expect(text).toContain('El héroe de las eras');
    expect(text).toContain('+ Añadir Vol. 2');
  });

  it('saves updated saga metadata via SeriesService.upsertSeriesMetadata', async () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const editToggle = buttons.find((b) =>
      b.textContent?.includes('Metadatos de la colección')
    ) as HTMLButtonElement;
    editToggle.click();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('#saga-edit-name') as HTMLInputElement;
    nameInput.value = 'Mistborn Era 1';
    nameInput.dispatchEvent(new Event('input'));

    const expectedInput = fixture.nativeElement.querySelector(
      '#saga-edit-expected'
    ) as HTMLInputElement;
    expectedInput.value = '4';
    expectedInput.dispatchEvent(new Event('input'));

    const statusSelect = fixture.nativeElement.querySelector(
      '#saga-edit-status'
    ) as HTMLSelectElement;
    statusSelect.value = 'ongoing';
    statusSelect.dispatchEvent(new Event('change'));

    const notesInput = fixture.nativeElement.querySelector(
      '#saga-edit-notes'
    ) as HTMLTextAreaElement;
    notesInput.value = 'Lectura recomendada';
    notesInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const saveBtn = Array.from(fixture.nativeElement.querySelectorAll('button')).find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Guardar saga')
    ) as HTMLButtonElement;
    saveBtn.click();
    await fixture.whenStable();

    expect(mockSeriesService.upsertSeriesMetadata).toHaveBeenCalledWith({
      id: 's1',
      normalizedKey: 'nacidos de la bruma',
      name: 'Mistborn Era 1',
      expectedVolumes: 4,
      publicationStatus: 'ongoing',
      notes: 'Lectura recomendada',
    });
  });

  it('updates volume number inline, unlinks books, opens book detail, and emits addMissingVolume', async () => {
    const openBookSpy = vi.fn();
    const addMissingSpy = vi.fn();
    component.openBook.subscribe(openBookSpy);
    component.addMissingVolume.subscribe(addMissingSpy);

    const volInput = fixture.nativeElement.querySelector('#vol-input-b1') as HTMLInputElement;
    volInput.value = '5';
    volInput.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(mockSeriesService.updateBookVolumeNumber).toHaveBeenCalledWith('b1', 5);

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];

    const detailBtn = buttons.find((b) =>
      b.textContent?.includes('Ver ficha del libro')
    ) as HTMLButtonElement;
    detailBtn.click();
    expect(openBookSpy).toHaveBeenCalledWith('b1');

    const unlinkBtn = buttons.find((b) =>
      b.textContent?.includes('Desvincular')
    ) as HTMLButtonElement;
    unlinkBtn.click();
    await fixture.whenStable();
    expect(mockSeriesService.unlinkBookFromSeries).toHaveBeenCalledWith('b1');

    const addMissingBtn = buttons.find((b) =>
      b.textContent?.includes('+ Añadir Vol. 2')
    ) as HTMLButtonElement;
    addMissingBtn.click();
    expect(addMissingSpy).toHaveBeenCalledWith({
      seriesName: 'Nacidos de la bruma',
      volumeNumber: 2,
    });
  });

  it('filters standalone books in bulk linker and links selected book in 1 click', async () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ) as HTMLButtonElement[];
    const linkerToggle = buttons.find((b) =>
      b.textContent?.includes('Vincular libros existentes')
    ) as HTMLButtonElement;
    linkerToggle.click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Elantris');
    expect(text).not.toContain('El camino de los reyes');

    const linkBtn = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (b) => (b as HTMLButtonElement).textContent?.trim() === 'Vincular'
    ) as HTMLButtonElement;
    linkBtn.click();
    await fixture.whenStable();

    expect(mockSeriesService.linkBooksToSeries).toHaveBeenCalledWith('Nacidos de la bruma', [
      'standalone-1',
    ]);
  });
});
