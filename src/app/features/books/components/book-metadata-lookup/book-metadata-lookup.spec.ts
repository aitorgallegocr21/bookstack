import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookMetadataCandidate, DuplicateLibraryMatch } from '../../models/book-metadata.model';
import { BookMetadataError, BookMetadataService } from '../../services/book-metadata.service';
import { BookMetadataLookupComponent } from './book-metadata-lookup';

function createCandidate(overrides: Partial<BookMetadataCandidate> = {}): BookMetadataCandidate {
  return {
    id: 'ol-1',
    title: 'Dune',
    author: 'Frank Herbert',
    isbn: '9780441172719',
    publisher: 'Ace Books',
    publicationYear: 1965,
    totalPages: 412,
    coverUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
    source: 'openlibrary',
    ...overrides,
  };
}

describe('BookMetadataLookupComponent', () => {
  let fixture: ComponentFixture<BookMetadataLookupComponent>;
  let component: BookMetadataLookupComponent;
  let mockMetadataService: {
    lookupByIsbn: ReturnType<typeof vi.fn>;
    searchByQuery: ReturnType<typeof vi.fn>;
    resolveLocalCover: ReturnType<typeof vi.fn>;
    findDuplicateInLibrary: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockMetadataService = {
      lookupByIsbn: vi.fn().mockResolvedValue(null),
      searchByQuery: vi.fn().mockResolvedValue([]),
      resolveLocalCover: vi.fn().mockResolvedValue('data:image/webp;base64,optimized'),
      findDuplicateInLibrary: vi.fn().mockReturnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [BookMetadataLookupComponent],
      providers: [{ provide: BookMetadataService, useValue: mockMetadataService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BookMetadataLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders collapsed by default with scan and search quick-action buttons', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(component.isExpanded()).toBe(false);
    expect(el.textContent).toContain('Escanear código');
    expect(el.textContent).toContain('Buscar libro');
  });

  it('does not search on input typing and submits unified query on form submit', async () => {
    const candidates = Array.from({ length: 6 }, (_, index) =>
      createCandidate({
        id: `cand-${index}`,
        title: `Edition ${index + 1}`,
        source: index % 2 === 0 ? 'openlibrary' : 'googlebooks',
      })
    );
    mockMetadataService.searchByQuery.mockResolvedValue(candidates);

    component.openTab('search');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#metadata-search-input') as HTMLInputElement;
    input.value = 'Dune';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(mockMetadataService.searchByQuery).not.toHaveBeenCalled();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(mockMetadataService.searchByQuery).toHaveBeenCalledWith('Dune');
    expect(component.results()).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('Edition 1');
    expect(fixture.nativeElement.textContent).toContain('Edition 5');
    expect(fixture.nativeElement.textContent).not.toContain('Edition 6');
  });

  it('shows validation hint when submitted with fewer than 2 characters', async () => {
    component.openTab('search');
    fixture.detectChanges();

    await component.onSearchSubmit();
    fixture.detectChanges();

    expect(mockMetadataService.searchByQuery).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Introduce un título, autor o ISBN para buscar ediciones públicas.'
    );
  });

  it('applies candidate with overwrite-public in create mode and optimizes cover', async () => {
    const candidate = createCandidate({ source: 'merged' });
    mockMetadataService.searchByQuery.mockResolvedValue([candidate]);
    const emitted: Array<{ candidate: BookMetadataCandidate; applyMode: string }> = [];
    component.candidateApplied.subscribe((payload) => emitted.push(payload));

    component.searchQuery.set('Dune');
    await component.onSearchSubmit();
    fixture.detectChanges();

    const applyButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find((btn) => btn.textContent?.includes('Usar edición'));

    expect(applyButton).toBeTruthy();
    applyButton?.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(mockMetadataService.resolveLocalCover).toHaveBeenCalledWith(candidate.coverUrl);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].applyMode).toBe('overwrite-public');
    expect(emitted[0].candidate.coverUrl).toBe('data:image/webp;base64,optimized');
    expect(fixture.nativeElement.textContent).toContain('Datos aplicados al formulario');
    expect(fixture.nativeElement.textContent).toContain('Combinado');
  });

  it('offers fill-empty and overwrite-public actions in edit mode', async () => {
    fixture.componentRef.setInput('mode', 'edit');
    const candidate = createCandidate();
    mockMetadataService.searchByQuery.mockResolvedValue([candidate]);
    const emitted: Array<{ candidate: BookMetadataCandidate; applyMode: string }> = [];
    component.candidateApplied.subscribe((payload) => emitted.push(payload));

    component.searchQuery.set('Dune');
    await component.onSearchSubmit();
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    );
    const fillEmptyBtn = buttons.find((btn) => btn.textContent?.includes('Rellenar campos vacíos'));
    const overwriteBtn = buttons.find((btn) =>
      btn.textContent?.includes('Sobrescribir datos públicos')
    );

    expect(fillEmptyBtn).toBeTruthy();
    expect(overwriteBtn).toBeTruthy();

    fillEmptyBtn?.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(emitted[0]?.applyMode).toBe('fill-empty');

    overwriteBtn?.click();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(emitted[1]?.applyMode).toBe('overwrite-public');
  });

  it('auto-resolves and applies scanned ISBN in create mode while closing scanner tab', async () => {
    const candidate = createCandidate({ source: 'googlebooks' });
    mockMetadataService.lookupByIsbn.mockResolvedValue(candidate);
    const emitted: Array<{ candidate: BookMetadataCandidate; applyMode: string }> = [];
    component.candidateApplied.subscribe((payload) => emitted.push(payload));

    component.openTab('scan');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('scan');

    await component.onIsbnScanned('9780441172719');
    fixture.detectChanges();

    expect(component.activeTab()).toBe('search');
    expect(component.isExpanded()).toBe(true);
    expect(mockMetadataService.lookupByIsbn).toHaveBeenCalledWith('9780441172719');
    expect(mockMetadataService.resolveLocalCover).toHaveBeenCalledWith(candidate.coverUrl);
    expect(emitted).toHaveLength(1);
    expect(emitted[0].applyMode).toBe('overwrite-public');
    expect(fixture.nativeElement.textContent).toContain('Google Books');
  });

  it('expands and looks up ISBN via triggerIsbnLookup without auto-overwriting', async () => {
    const candidate = createCandidate();
    mockMetadataService.lookupByIsbn.mockResolvedValue(candidate);
    const emitted: unknown[] = [];
    component.candidateApplied.subscribe((payload) => emitted.push(payload));

    await component.triggerIsbnLookup('9780441172719');
    fixture.detectChanges();

    expect(component.isExpanded()).toBe(true);
    expect(component.activeTab()).toBe('search');
    expect(component.searchQuery()).toBe('9780441172719');
    expect(component.results()).toHaveLength(1);
    expect(emitted).toHaveLength(0);
  });

  it('renders localized error message when lookup fails', async () => {
    mockMetadataService.searchByQuery.mockRejectedValue(
      new BookMetadataError('LOOKUP_FAILED', 'Network error')
    );

    component.searchQuery.set('Dune');
    await component.onSearchSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo conectar con los catálogos públicos. Revisa tu conexión.'
    );
  });

  it('renders non-blocking duplicate warning banner with localized book status', () => {
    const duplicate: DuplicateLibraryMatch = {
      bookId: 'book-1',
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      status: 'reading',
      matchReason: 'isbn',
    };
    mockMetadataService.findDuplicateInLibrary.mockReturnValue(duplicate);
    fixture.componentRef.setInput('currentIsbn', '9780441172719');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Posible libro duplicado en tu biblioteca');
    expect(banner.textContent).toContain('Coincide por ISBN con:');
    expect(banner.textContent).toContain('Dune');
    expect(banner.textContent).toContain('Leyendo');
  });
});
