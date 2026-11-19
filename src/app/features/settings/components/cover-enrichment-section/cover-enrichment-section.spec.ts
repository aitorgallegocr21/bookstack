import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BookMetadataCandidate } from '../../../books/models/book-metadata.model';
import { Book } from '../../../books/models/book.model';
import { CoverEnrichmentState, MissingCoverSummary } from '../../models/cover-enrichment.model';
import { CoverEnrichmentService } from '../../services/cover-enrichment.service';
import { CoverEnrichmentSectionComponent } from './cover-enrichment-section';

function makeBook(id: string, title: string, author: string, isbn?: string): Book {
  return {
    id,
    title,
    author,
    isbn,
    publisher: 'Minotauro',
    publicationYear: 1954,
    status: 'pending',
    totalPages: 400,
    currentPage: 0,
    format: 'physical',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeCandidate(id: string, title: string): BookMetadataCandidate {
  return {
    id,
    source: 'openlibrary',
    title,
    author: 'J.R.R. Tolkien',
    coverUrl: `https://covers.openlibrary.org/b/id/${id}-M.jpg`,
  };
}

describe('CoverEnrichmentSectionComponent', () => {
  let fixture: ComponentFixture<CoverEnrichmentSectionComponent>;
  let i18n: I18nService;

  let summarySignal: ReturnType<typeof signal<MissingCoverSummary>>;
  let stateSignal: ReturnType<typeof signal<CoverEnrichmentState>>;
  let assistantActiveSignal: ReturnType<typeof signal<boolean>>;
  let assistantQueueSignal: ReturnType<typeof signal<Book[]>>;
  let assistantCurrentIndexSignal: ReturnType<typeof signal<number>>;
  let assistantCurrentBookSignal: ReturnType<typeof signal<Book | null>>;
  let assistantCandidatesSignal: ReturnType<typeof signal<BookMetadataCandidate[]>>;
  let assistantNotFoundBooksSignal: ReturnType<typeof signal<Book[]>>;
  let assistantLoadingSignal: ReturnType<typeof signal<boolean>>;

  let mockService: {
    missingCoverSummary: ReturnType<typeof signal<MissingCoverSummary>>;
    state: ReturnType<typeof signal<CoverEnrichmentState>>;
    assistantActive: ReturnType<typeof signal<boolean>>;
    assistantQueue: ReturnType<typeof signal<Book[]>>;
    assistantCurrentIndex: ReturnType<typeof signal<number>>;
    assistantCurrentBook: ReturnType<typeof signal<Book | null>>;
    assistantCandidates: ReturnType<typeof signal<BookMetadataCandidate[]>>;
    assistantNotFoundBooks: ReturnType<typeof signal<Book[]>>;
    assistantLoading: ReturnType<typeof signal<boolean>>;
    runStrictIsbnEnrichment: ReturnType<typeof vi.fn>;
    runStrictTitleAuthorEnrichment: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    startVisualAssistant: ReturnType<typeof vi.fn>;
    selectAssistantCover: ReturnType<typeof vi.fn>;
    skipAssistantBook: ReturnType<typeof vi.fn>;
    closeVisualAssistant: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const isbnBook = makeBook('b-1', 'Dune', 'Frank Herbert', '9780441172719');
    const noIsbnBook = makeBook('b-2', 'El Hobbit', 'J.R.R. Tolkien');

    summarySignal = signal<MissingCoverSummary>({
      totalMissing: 2,
      withValidIsbnCount: 1,
      withoutValidIsbnCount: 1,
      booksWithIsbn: [isbnBook],
      booksWithoutIsbn: [noIsbnBook],
    });

    stateSignal = signal<CoverEnrichmentState>({
      status: 'idle',
      mode: null,
      processedCount: 0,
      totalCount: 0,
      downloadedCount: 0,
      skippedItems: [],
    });

    assistantActiveSignal = signal<boolean>(false);
    assistantQueueSignal = signal<Book[]>([]);
    assistantCurrentIndexSignal = signal<number>(0);
    assistantCurrentBookSignal = signal<Book | null>(null);
    assistantCandidatesSignal = signal<BookMetadataCandidate[]>([]);
    assistantNotFoundBooksSignal = signal<Book[]>([]);
    assistantLoadingSignal = signal<boolean>(false);

    mockService = {
      missingCoverSummary: summarySignal,
      state: stateSignal,
      assistantActive: assistantActiveSignal,
      assistantQueue: assistantQueueSignal,
      assistantCurrentIndex: assistantCurrentIndexSignal,
      assistantCurrentBook: assistantCurrentBookSignal,
      assistantCandidates: assistantCandidatesSignal,
      assistantNotFoundBooks: assistantNotFoundBooksSignal,
      assistantLoading: assistantLoadingSignal,
      runStrictIsbnEnrichment: vi.fn().mockResolvedValue(undefined),
      runStrictTitleAuthorEnrichment: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      resume: vi.fn(),
      cancel: vi.fn(),
      startVisualAssistant: vi.fn().mockResolvedValue(undefined),
      selectAssistantCover: vi.fn().mockResolvedValue(true),
      skipAssistantBook: vi.fn().mockResolvedValue(undefined),
      closeVisualAssistant: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CoverEnrichmentSectionComponent],
      providers: [{ provide: CoverEnrichmentService, useValue: mockService }],
    }).compileComponents();

    i18n = TestBed.inject(I18nService);
    i18n.setLocale('es');

    fixture = TestBed.createComponent(CoverEnrichmentSectionComponent);
    fixture.detectChanges();
  });

  it('renders all-complete banner when no books are missing covers', () => {
    summarySignal.set({
      totalMissing: 0,
      withValidIsbnCount: 0,
      withoutValidIsbnCount: 0,
      booksWithIsbn: [],
      booksWithoutIsbn: [],
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="cover-enrichment-all-complete"]')
        ?.textContent
    ).toContain(i18n.t().settings.coverEnrichment.allCoversComplete);
    expect(
      fixture.nativeElement.querySelector('[data-testid="start-isbn-enrichment-btn"]')
    ).toBeNull();
  });

  it('renders KPI badges and triggers strict ISBN enrichment on click', () => {
    const withIsbnBadge = fixture.nativeElement.querySelector(
      '[data-testid="missing-with-isbn-badge"]'
    ) as HTMLElement;
    const withoutIsbnBadge = fixture.nativeElement.querySelector(
      '[data-testid="missing-without-isbn-badge"]'
    ) as HTMLElement;
    const startBtn = fixture.nativeElement.querySelector(
      '[data-testid="start-isbn-enrichment-btn"]'
    ) as HTMLButtonElement;

    expect(withIsbnBadge.textContent).toContain('1');
    expect(withoutIsbnBadge.textContent).toContain('1');
    expect(startBtn.disabled).toBe(false);

    startBtn.click();
    expect(mockService.runStrictIsbnEnrichment).toHaveBeenCalledTimes(1);
  });

  it('disables ISBN enrichment button when withValidIsbnCount is 0', () => {
    summarySignal.set({
      totalMissing: 1,
      withValidIsbnCount: 0,
      withoutValidIsbnCount: 1,
      booksWithIsbn: [],
      booksWithoutIsbn: [makeBook('b-2', 'El Hobbit', 'J.R.R. Tolkien')],
    });
    fixture.detectChanges();

    const startBtn = fixture.nativeElement.querySelector(
      '[data-testid="start-isbn-enrichment-btn"]'
    ) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
  });

  it('renders live progress bar and handles pause, resume, and cancel controls', () => {
    stateSignal.set({
      status: 'running',
      mode: 'isbn-strict',
      processedCount: 2,
      totalCount: 5,
      downloadedCount: 1,
      skippedItems: [],
    });
    fixture.detectChanges();

    const progressPanel = fixture.nativeElement.querySelector(
      '[data-testid="enrichment-progress-panel"]'
    ) as HTMLElement;
    expect(progressPanel.textContent).toContain('2 / 5');

    const pauseResumeBtn = fixture.nativeElement.querySelector(
      '[data-testid="enrichment-pause-resume-btn"]'
    ) as HTMLButtonElement;
    pauseResumeBtn.click();
    expect(mockService.pause).toHaveBeenCalledTimes(1);

    stateSignal.update((prev) => ({ ...prev, status: 'paused' }));
    fixture.detectChanges();
    pauseResumeBtn.click();
    expect(mockService.resume).toHaveBeenCalledTimes(1);

    const cancelBtn = fixture.nativeElement.querySelector(
      '[data-testid="enrichment-cancel-btn"]'
    ) as HTMLButtonElement;
    cancelBtn.click();
    expect(mockService.cancel).toHaveBeenCalledTimes(1);
  });

  it('gates strict title+author search behind warning confirmation', () => {
    expect(
      fixture.nativeElement.querySelector('[data-testid="strict-title-search-warning"]')
    ).toBeNull();

    const openWarningBtn = fixture.nativeElement.querySelector(
      '[data-testid="open-strict-title-search-btn"]'
    ) as HTMLButtonElement;
    openWarningBtn.click();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="strict-title-search-warning"]')
    ).not.toBeNull();

    const confirmBtn = fixture.nativeElement.querySelector(
      '[data-testid="confirm-strict-title-search-btn"]'
    ) as HTMLButtonElement;
    confirmBtn.click();
    fixture.detectChanges();

    expect(mockService.runStrictTitleAuthorEnrichment).toHaveBeenCalledTimes(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="strict-title-search-warning"]')
    ).toBeNull();
  });

  it('renders visual assistant card with up to 3 lazy-loaded candidates and handles select/skip/close', () => {
    const startAssistantBtn = fixture.nativeElement.querySelector(
      '[data-testid="start-visual-assistant-btn"]'
    ) as HTMLButtonElement;
    startAssistantBtn.click();
    expect(mockService.startVisualAssistant).toHaveBeenCalledTimes(1);

    const book = makeBook('b-2', 'El Hobbit', 'J.R.R. Tolkien');
    const c1 = makeCandidate('101', 'El Hobbit');
    const c2 = makeCandidate('102', 'The Hobbit');
    const c3 = makeCandidate('103', 'Hobbit Illustrated');
    const c4 = makeCandidate('104', 'Extra Candidate');

    assistantActiveSignal.set(true);
    assistantQueueSignal.set([book]);
    assistantCurrentIndexSignal.set(0);
    assistantCurrentBookSignal.set(book);
    assistantCandidatesSignal.set([c1, c2, c3, c4]);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector(
      '[data-testid="visual-assistant-card"]'
    ) as HTMLElement;
    expect(card.textContent).toContain('El Hobbit');
    expect(card.textContent).toContain('1 / 1');

    const images = card.querySelectorAll('img');
    expect(images.length).toBe(3);
    expect(images[0].getAttribute('loading')).toBe('lazy');
    expect(images[0].getAttribute('decoding')).toBe('async');

    const selectBtns = card.querySelectorAll('[data-testid="visual-assistant-select-btn"]');
    (selectBtns[0] as HTMLButtonElement).click();
    expect(mockService.selectAssistantCover).toHaveBeenCalledWith(c1);

    const skipBtn = card.querySelector(
      '[data-testid="visual-assistant-skip-btn"]'
    ) as HTMLButtonElement;
    skipBtn.click();
    expect(mockService.skipAssistantBook).toHaveBeenCalledTimes(1);

    const closeBtn = card.querySelector(
      '[data-testid="visual-assistant-close-btn"]'
    ) as HTMLButtonElement;
    closeBtn.click();
    expect(mockService.closeVisualAssistant).toHaveBeenCalledTimes(1);
  });

  it('renders empty state in visual assistant when no candidate covers are found', () => {
    const book = makeBook('b-2', 'Unknown Book', 'Unknown Author');
    assistantActiveSignal.set(true);
    assistantQueueSignal.set([book]);
    assistantCurrentIndexSignal.set(0);
    assistantCurrentBookSignal.set(book);
    assistantCandidatesSignal.set([]);
    assistantLoadingSignal.set(false);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="visual-assistant-empty"]')?.textContent
    ).toContain(i18n.t().settings.coverEnrichment.visualAssistantNoSuggestions);
  });

  it('renders compact not-found summary list when visual assistant finishes with zero-cover books', () => {
    const missingBook = makeBook('b-3', 'Libro Raro', 'Autor Desconocido');
    assistantActiveSignal.set(true);
    assistantCurrentBookSignal.set(null);
    assistantNotFoundBooksSignal.set([missingBook]);
    assistantLoadingSignal.set(false);
    fixture.detectChanges();

    const notFoundCard = fixture.nativeElement.querySelector(
      '[data-testid="visual-assistant-not-found-card"]'
    ) as HTMLElement;
    expect(notFoundCard).not.toBeNull();
    expect(notFoundCard.textContent).toContain(
      i18n.t().settings.coverEnrichment.visualAssistantNotFoundTitle
    );

    const notFoundList = fixture.nativeElement.querySelector(
      '[data-testid="visual-assistant-not-found-list"]'
    ) as HTMLElement;
    expect(notFoundList.textContent).toContain('Libro Raro');
    expect(notFoundList.textContent).toContain('Autor Desconocido');

    const closeBtn = notFoundCard.querySelector(
      '[data-testid="visual-assistant-close-btn"]'
    ) as HTMLButtonElement;
    closeBtn.click();
    expect(mockService.closeVisualAssistant).toHaveBeenCalledTimes(1);
  });

  it('expands verification report showing skipped books and localized reason badges', () => {
    stateSignal.set({
      status: 'completed',
      mode: 'isbn-strict',
      processedCount: 2,
      totalCount: 2,
      downloadedCount: 1,
      skippedItems: [
        {
          bookId: 'b-9',
          title: 'Foundation',
          author: 'Isaac Asimov',
          isbn: '9780553293357',
          reason: 'no_cover_in_provider',
        },
      ],
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="enrichment-skipped-report"]')
    ).toBeNull();

    const toggleBtn = fixture.nativeElement.querySelector(
      '[data-testid="toggle-enrichment-report-btn"]'
    ) as HTMLButtonElement;
    toggleBtn.click();
    fixture.detectChanges();

    const report = fixture.nativeElement.querySelector(
      '[data-testid="enrichment-skipped-report"]'
    ) as HTMLElement;
    expect(report).not.toBeNull();
    expect(report.textContent).toContain('Foundation');
    expect(report.textContent).toContain(i18n.t().settings.coverEnrichment.reasonNoCover);
  });
});
