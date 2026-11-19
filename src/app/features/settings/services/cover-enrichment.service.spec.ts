import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Book } from '../../books/models/book.model';
import { BookMetadataCandidate } from '../../books/models/book-metadata.model';
import { BookMetadataService } from '../../books/services/book-metadata.service';
import { BooksService } from '../../books/services/books.service';
import { ImageOptimizerService } from '../../books/services/image-optimizer.service';
import { CoverEnrichmentService, mergeCandidateIntoBook } from './cover-enrichment.service';

function makeBook(overrides: Partial<Book> & { id: string; title: string; author: string }): Book {
  return {
    totalPages: 300,
    currentPage: 0,
    status: 'pending',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<BookMetadataCandidate> = {}): BookMetadataCandidate {
  return {
    id: 'cand-1',
    title: 'Dune',
    author: 'Frank Herbert',
    coverUrl: 'https://covers.openlibrary.org/b/id/123-L.jpg',
    source: 'openlibrary',
    ...overrides,
  };
}

describe('CoverEnrichmentService', () => {
  let service: CoverEnrichmentService;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let mockBooksService: {
    books: ReturnType<typeof signal<Book[]>>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  let mockMetadataService: {
    lookupBatchByIsbns: ReturnType<typeof vi.fn>;
    lookupByIsbn: ReturnType<typeof vi.fn>;
    searchByQuery: ReturnType<typeof vi.fn>;
    verifyStrictTitleAuthorCandidate: ReturnType<typeof vi.fn>;
  };
  let mockImageOptimizer: {
    optimizeRemoteUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    booksSignal = signal<Book[]>([]);

    mockBooksService = {
      books: booksSignal,
      update: vi.fn(async (id: string, updated: Book) => {
        booksSignal.update((list) => list.map((b) => (b.id === id ? updated : b)));
      }),
      updateMany: vi.fn(async (updatedBooks: Book[]) => {
        const byId = new Map(updatedBooks.map((b) => [b.id, b]));
        booksSignal.update((list) => list.map((b) => byId.get(b.id) ?? b));
        return true;
      }),
    };

    mockMetadataService = {
      lookupBatchByIsbns: vi.fn(async () => new Map<string, BookMetadataCandidate>()),
      lookupByIsbn: vi.fn(async () => null),
      searchByQuery: vi.fn(async () => []),
      verifyStrictTitleAuthorCandidate: vi.fn(() => null),
    };

    mockImageOptimizer = {
      optimizeRemoteUrl: vi.fn(async () => 'data:image/webp;base64,optimized'),
    };

    TestBed.configureTestingModule({
      providers: [
        CoverEnrichmentService,
        { provide: BooksService, useValue: mockBooksService },
        { provide: BookMetadataService, useValue: mockMetadataService },
        { provide: ImageOptimizerService, useValue: mockImageOptimizer },
      ],
    });

    service = TestBed.inject(CoverEnrichmentService);
  });

  it('computes reactive missingCoverSummary partitioned by valid ISBN', () => {
    booksSignal.set([
      makeBook({
        id: '1',
        title: 'Has Cover',
        author: 'A',
        isbn: '9780441172719',
        coverUrl: 'data:image/webp;base64,abc',
      }),
      makeBook({ id: '2', title: 'Valid ISBN-13', author: 'B', isbn: '9780441172719' }),
      makeBook({ id: '3', title: 'Valid ISBN-10', author: 'C', isbn: '0441172717' }),
      makeBook({ id: '4', title: 'Invalid ISBN', author: 'D', isbn: '12345' }),
      makeBook({ id: '5', title: 'No ISBN', author: 'E' }),
    ]);

    const summary = service.missingCoverSummary();
    expect(summary.totalMissing).toBe(4);
    expect(summary.withValidIsbnCount).toBe(2);
    expect(summary.withoutValidIsbnCount).toBe(2);
    expect(summary.booksWithIsbn.map((b) => b.id)).toEqual(['2', '3']);
    expect(summary.booksWithoutIsbn.map((b) => b.id)).toEqual(['4', '5']);
  });

  it('enriches books via strict ISBN batches of 20, flushes every 5 covers, and enforces min dimensions', async () => {
    // 7 books with valid ISBNs (using 9780441172719 and 0441172717)
    const books = Array.from({ length: 7 }, (_, i) =>
      makeBook({
        id: `book-${i + 1}`,
        title: `Book ${i + 1}`,
        author: 'Frank Herbert',
        isbn: i % 2 === 0 ? '9780441172719' : '0441172717',
      })
    );
    booksSignal.set(books);

    mockMetadataService.lookupBatchByIsbns.mockResolvedValue(
      new Map([['9780441172719', makeCandidate({ isbn: '9780441172719' })]])
    );

    await service.runStrictIsbnEnrichment();

    expect(mockMetadataService.lookupBatchByIsbns).toHaveBeenCalledTimes(1);
    expect(mockImageOptimizer.optimizeRemoteUrl).toHaveBeenCalledWith(
      'https://covers.openlibrary.org/b/id/123-L.jpg',
      { minWidth: 80, minHeight: 120 }
    );
    // 7 covers -> first flush at 5, final flush at 2
    expect(mockBooksService.updateMany).toHaveBeenCalledTimes(2);
    expect(mockBooksService.updateMany.mock.calls[0][0]).toHaveLength(5);
    expect(mockBooksService.updateMany.mock.calls[1][0]).toHaveLength(2);

    const state = service.state();
    expect(state.status).toBe('completed');
    expect(state.mode).toBe('isbn-strict');
    expect(state.totalCount).toBe(7);
    expect(state.processedCount).toBe(7);
    expect(state.downloadedCount).toBe(7);
    expect(state.skippedItems).toEqual([]);
  });

  it('falls back to lookupByIsbn when batch has no cover and records detailed skipped reasons', async () => {
    booksSignal.set([
      makeBook({ id: 'fallback-ok', title: 'Fallback', author: 'A', isbn: '9780441172719' }),
      makeBook({ id: 'no-meta', title: 'No Meta', author: 'B', isbn: '0441172717' }),
      makeBook({ id: 'no-cover', title: 'No Cover', author: 'C', isbn: '9780140449136' }),
      makeBook({ id: 'bad-dims', title: 'Bad Dims', author: 'D', isbn: '9780306406157' }),
      makeBook({ id: 'net-err', title: 'Net Err', author: 'E', isbn: '9780201633610' }),
    ]);

    mockMetadataService.lookupBatchByIsbns.mockResolvedValue(
      new Map([
        ['9780140449136', makeCandidate({ title: 'No Cover', coverUrl: undefined })],
        ['9780306406157', makeCandidate({ title: 'Bad Dims', coverUrl: 'https://img/small.jpg' })],
      ])
    );

    mockMetadataService.lookupByIsbn.mockImplementation(async (isbn: string) => {
      if (isbn === '9780441172719') {
        return makeCandidate({ coverUrl: 'https://books.google.com/cover.jpg' });
      }
      if (isbn === '0441172717') {
        return null;
      }
      if (isbn === '9780140449136') {
        return makeCandidate({ coverUrl: '' });
      }
      if (isbn === '9780201633610') {
        throw new Error('Offline');
      }
      return null;
    });

    mockImageOptimizer.optimizeRemoteUrl.mockImplementation(async (url: string) => {
      if (url === 'https://img/small.jpg') {
        return '';
      }
      return 'data:image/webp;base64,ok';
    });

    await service.runStrictIsbnEnrichment();

    const state = service.state();
    expect(state.status).toBe('completed');
    expect(state.downloadedCount).toBe(1);
    expect(state.skippedItems).toEqual([
      {
        bookId: 'no-meta',
        title: 'No Meta',
        author: 'B',
        isbn: '0441172717',
        reason: 'no_metadata_found',
      },
      {
        bookId: 'no-cover',
        title: 'No Cover',
        author: 'C',
        isbn: '9780140449136',
        reason: 'no_cover_in_provider',
      },
      {
        bookId: 'bad-dims',
        title: 'Bad Dims',
        author: 'D',
        isbn: '9780306406157',
        reason: 'invalid_cover_dimensions',
      },
      {
        bookId: 'net-err',
        title: 'Net Err',
        author: 'E',
        isbn: '9780201633610',
        reason: 'network_error',
      },
    ]);
  });

  it('caps concurrent image downloads to 2 during ISBN enrichment', async () => {
    const books = Array.from({ length: 4 }, (_, i) =>
      makeBook({ id: `b-${i}`, title: `Book ${i}`, author: 'Author', isbn: '9780441172719' })
    );
    booksSignal.set(books);
    mockMetadataService.lookupBatchByIsbns.mockResolvedValue(
      new Map([['9780441172719', makeCandidate()]])
    );

    let activeDownloads = 0;
    let maxObservedConcurrency = 0;
    mockImageOptimizer.optimizeRemoteUrl.mockImplementation(async () => {
      activeDownloads++;
      maxObservedConcurrency = Math.max(maxObservedConcurrency, activeDownloads);
      await new Promise((resolve) => setTimeout(resolve, 15));
      activeDownloads--;
      return 'data:image/webp;base64,ok';
    });

    await service.runStrictIsbnEnrichment();
    expect(maxObservedConcurrency).toBeLessThanOrEqual(2);
    expect(service.state().downloadedCount).toBe(4);
  });

  it('runs strict title+author enrichment and records mismatch_verification for unverified candidates', async () => {
    booksSignal.set([
      makeBook({ id: 'ok', title: 'Dune', author: 'Frank Herbert' }),
      makeBook({ id: 'mismatch', title: 'Dune', author: 'Unknown' }),
      makeBook({ id: 'empty', title: 'Rare Book', author: 'Nobody' }),
    ]);

    const verifiedCandidate = makeCandidate({ title: 'Dune', author: 'Frank Herbert' });
    mockMetadataService.searchByQuery.mockImplementation(async (query: string) => {
      if (query === 'Dune Frank Herbert') {
        return [verifiedCandidate];
      }
      if (query === 'Dune Unknown') {
        return [makeCandidate({ title: 'Dune Messiah', author: 'Frank Herbert' })];
      }
      return [];
    });
    mockMetadataService.verifyStrictTitleAuthorCandidate.mockImplementation(
      (book: Book, candidates: BookMetadataCandidate[]) => (book.id === 'ok' ? candidates[0] : null)
    );

    await service.runStrictTitleAuthorEnrichment();

    const state = service.state();
    expect(state.status).toBe('completed');
    expect(state.mode).toBe('title-author-strict');
    expect(state.downloadedCount).toBe(1);
    expect(state.skippedItems).toEqual([
      { bookId: 'mismatch', title: 'Dune', author: 'Unknown', reason: 'mismatch_verification' },
      { bookId: 'empty', title: 'Rare Book', author: 'Nobody', reason: 'no_metadata_found' },
    ]);
  });

  it('supports pause, resume, and cancel while flushing persisted covers', async () => {
    booksSignal.set([
      makeBook({ id: 'b1', title: 'Book 1', author: 'A', isbn: '9780441172719' }),
      makeBook({ id: 'b2', title: 'Book 2', author: 'A', isbn: '9780441172719' }),
      makeBook({ id: 'b3', title: 'Book 3', author: 'A', isbn: '9780441172719' }),
    ]);
    mockMetadataService.lookupBatchByIsbns.mockResolvedValue(
      new Map([['9780441172719', makeCandidate()]])
    );

    let downloadCalls = 0;
    mockImageOptimizer.optimizeRemoteUrl.mockImplementation(async () => {
      downloadCalls++;
      if (downloadCalls === 1) {
        service.pause();
      }
      return 'data:image/webp;base64,ok';
    });

    const runPromise = service.runStrictIsbnEnrichment();
    await vi.waitFor(() => {
      expect(service.state().status).toBe('paused');
    });

    service.resume();
    await runPromise;
    expect(service.state().status).toBe('completed');
    expect(service.state().downloadedCount).toBe(3);

    // Test cancel when paused
    booksSignal.set([
      makeBook({ id: 'c1', title: 'C1', author: 'A', isbn: '9780441172719' }),
      makeBook({ id: 'c2', title: 'C2', author: 'A', isbn: '9780441172719' }),
      makeBook({ id: 'c3', title: 'C3', author: 'A', isbn: '9780441172719' }),
    ]);
    downloadCalls = 0;
    mockImageOptimizer.optimizeRemoteUrl.mockImplementation(async () => {
      downloadCalls++;
      service.pause();
      return 'data:image/webp;base64,ok';
    });

    const cancelPromise = service.runStrictIsbnEnrichment();
    await vi.waitFor(() => {
      expect(service.state().status).toBe('paused');
    });
    service.cancel();
    await cancelPromise;

    expect(service.state().status).toBe('cancelled');
    service.resetReport();
    expect(service.state().status).toBe('idle');
    expect(service.state().downloadedCount).toBe(0);
    expect(service.state().metadataUpdatedCount).toBe(0);
  });

  it('pauses the visual assistant only on multiple-cover books and summarizes zero-cover books without manual skipping', async () => {
    const b1Single = makeBook({ id: 'v1', title: 'El imperio final', author: 'Brandon Sanderson' });
    const b2Multiple = makeBook({ id: 'v2', title: 'Dune', author: 'Frank Herbert' });
    const b3Empty = makeBook({ id: 'v3', title: 'Rare Book', author: 'Unknown' });
    const b4BrokenSingle = makeBook({ id: 'v4', title: 'Broken Cover Book', author: 'Author' });
    booksSignal.set([b1Single, b2Multiple, b3Empty, b4BrokenSingle]);

    const singleCandidate = makeCandidate({
      id: 'c-single',
      title: 'The Final Empire',
      author: 'Brandon Sanderson',
      isbn: '076531178X',
      coverUrl: 'https://img/mistborn.jpg',
    });
    const brokenSingleCandidate = makeCandidate({
      id: 'c-broken',
      title: 'Broken Cover Book',
      author: 'Author',
      coverUrl: 'https://img/broken.jpg',
    });
    const candidateWithoutCover = makeCandidate({ id: 'c-no-img', title: 'No Img', coverUrl: '' });
    const multiCandidateA = makeCandidate({
      id: 'c-dune-a',
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '0441172717',
      coverUrl: 'https://img/dune-a.jpg',
    });
    const multiCandidateB = makeCandidate({
      id: 'c-dune-b',
      title: 'Dune (Deluxe Edition)',
      author: 'Frank Herbert',
      coverUrl: 'https://img/dune-b.jpg',
    });

    mockMetadataService.searchByQuery.mockImplementation(async (q: string) => {
      if (q.includes('El imperio final')) {
        return [singleCandidate, candidateWithoutCover];
      }
      if (q.includes('Dune')) {
        return [multiCandidateA, multiCandidateB, candidateWithoutCover];
      }
      if (q.includes('Broken Cover Book')) {
        return [brokenSingleCandidate];
      }
      return [];
    });

    mockImageOptimizer.optimizeRemoteUrl.mockImplementation(async (url: string) => {
      if (url === 'https://img/broken.jpg') {
        return '';
      }
      return 'data:image/webp;base64,optimized';
    });

    await service.startVisualAssistant();

    // b1Single had 1 valid cover -> auto-applied and advanced straight to b2Multiple (index 1)
    expect(mockBooksService.update).toHaveBeenCalledWith(
      'v1',
      expect.objectContaining({
        id: 'v1',
        coverUrl: 'data:image/webp;base64,optimized',
        isbn: '9780765311788',
      })
    );
    expect(service.assistantActive()).toBe(true);
    expect(service.assistantCurrentIndex()).toBe(1);
    expect(service.assistantCurrentBook()?.id).toBe('v2');
    expect(service.assistantCandidates()).toEqual([multiCandidateA, multiCandidateB]);

    // Select one of the multiple options for b2Multiple -> automatically skips b3Empty (0 covers)
    // and b4BrokenSingle (invalid cover), finishing with a compact not-found summary
    const selected = await service.selectAssistantCover(multiCandidateA);
    expect(selected).toBe(true);
    expect(mockBooksService.update).toHaveBeenCalledWith(
      'v2',
      expect.objectContaining({
        id: 'v2',
        coverUrl: 'data:image/webp;base64,optimized',
        isbn: '9780441172719',
      })
    );
    expect(service.assistantActive()).toBe(true);
    expect(service.assistantCurrentBook()).toBeNull();
    expect(service.assistantCandidates()).toEqual([]);
    expect(service.assistantNotFoundBooks().map((b) => b.id)).toEqual(['v3', 'v4']);

    service.closeVisualAssistant();
    expect(service.assistantActive()).toBe(false);
    expect(service.assistantQueue()).toEqual([]);
    expect(service.assistantNotFoundBooks()).toEqual([]);
  });

  it('summarizes all zero-cover books immediately when no book has multiple cover candidates', async () => {
    const b1 = makeBook({ id: 'z1', title: 'Obscure Book 1', author: 'Author 1' });
    const b2 = makeBook({ id: 'z2', title: 'Obscure Book 2', author: 'Author 2' });
    booksSignal.set([b1, b2]);
    mockMetadataService.searchByQuery.mockResolvedValue([]);

    await service.startVisualAssistant();

    expect(service.assistantActive()).toBe(true);
    expect(service.assistantLoading()).toBe(false);
    expect(service.assistantCurrentBook()).toBeNull();
    expect(service.assistantNotFoundBooks().map((b) => b.id)).toEqual(['z1', 'z2']);
  });

  it('computes integral incomplete counts across cover, pages, year, publisher, and isbn', () => {
    booksSignal.set([
      makeBook({
        id: 'complete',
        title: 'Complete',
        author: 'Author',
        isbn: '9780441172719',
        coverUrl: 'data:image/webp;base64,abc',
        totalPages: 412,
        publicationYear: 1965,
        publisher: 'Chilton',
      }),
      makeBook({
        id: 'missing-pages-year',
        title: 'Incomplete Metadata',
        author: 'Author',
        isbn: '9780441172719',
        coverUrl: 'data:image/webp;base64,def',
        totalPages: 1,
        publisher: 'Minotauro',
      }),
      makeBook({
        id: 'missing-cover-pub-isbn',
        title: 'Missing Cover & Pub',
        author: 'Author',
        totalPages: 250,
        publicationYear: 2020,
      }),
    ]);

    const summary = service.missingCoverSummary();
    expect(summary.totalIncomplete).toBe(2);
    expect(summary.missingCoverCount).toBe(1);
    expect(summary.missingPagesCount).toBe(1);
    expect(summary.missingYearCount).toBe(1);
    expect(summary.missingPublisherCount).toBe(1);
    expect(summary.missingIsbnCount).toBe(1);
    expect(summary.incompleteBooks.map((b) => b.id)).toEqual([
      'missing-pages-year',
      'missing-cover-pub-isbn',
    ]);
  });

  it('merges candidate metadata non-destructively while respecting existing book values', () => {
    const existingBook = makeBook({
      id: 'b-merge',
      title: 'The Way of Kings',
      author: 'Brandon Sanderson',
      totalPages: 1,
      currentPage: 50,
      publisher: 'Nova',
    });

    const candidate = makeCandidate({
      isbn: '0765326353',
      publisher: 'Tor Books',
      publicationYear: 2010,
      totalPages: 40,
      seriesName: 'The Stormlight Archive',
      seriesOrder: 1,
      coverUrl: 'https://img/way-of-kings.jpg',
    });

    const result = mergeCandidateIntoBook(
      existingBook,
      candidate,
      'data:image/webp;base64,optimized'
    );

    expect(result.coverChanged).toBe(true);
    expect(result.metadataChanged).toBe(true);
    expect(result.updatedBook.coverUrl).toBe('data:image/webp;base64,optimized');
    expect(result.updatedBook.publisher).toBe('Nova');
    expect(result.updatedBook.publicationYear).toBe(2010);
    expect(result.updatedBook.totalPages).toBe(50);
    expect(result.updatedBook.isbn).toBe('9780765326355');
    expect(result.updatedBook.series).toEqual(
      expect.objectContaining({
        name: 'The Stormlight Archive',
        volumeNumber: 1,
      })
    );
  });

  it('cascades from ISBN to strict Title+Author in runIntegralEnrichment and merges both hits', async () => {
    const partialIsbnBook = makeBook({
      id: 'int-1',
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719',
      totalPages: 0,
    });
    const hasCoverNeedsMeta = makeBook({
      id: 'int-2',
      title: 'Elantris',
      author: 'Brandon Sanderson',
      coverUrl: 'data:image/webp;base64,existing',
      totalPages: 1,
    });

    booksSignal.set([partialIsbnBook, hasCoverNeedsMeta]);

    mockMetadataService.lookupBatchByIsbns.mockResolvedValue(
      new Map([
        [
          '9780441172719',
          makeCandidate({
            isbn: '9780441172719',
            publisher: 'Ace Books',
            publicationYear: 1965,
            coverUrl: undefined,
            totalPages: undefined,
          }),
        ],
      ])
    );

    const duneSearchCandidate = makeCandidate({
      id: 'cand-dune-search',
      title: 'Dune',
      author: 'Frank Herbert',
      totalPages: 688,
      coverUrl: 'https://img/dune-full.jpg',
      seriesName: 'Dune Chronicles',
      seriesOrder: 1,
      source: 'googlebooks',
    });
    const elantrisSearchCandidate = makeCandidate({
      id: 'cand-elantris',
      title: 'Elantris',
      author: 'Brandon Sanderson',
      isbn: '0765311771',
      publisher: 'Tor Books',
      publicationYear: 2005,
      totalPages: 615,
      coverUrl: 'https://img/should-not-download.jpg',
    });

    mockMetadataService.searchByQuery.mockImplementation(async (query: string) => {
      if (query.includes('Dune')) {
        return [duneSearchCandidate];
      }
      if (query.includes('Elantris')) {
        return [elantrisSearchCandidate];
      }
      return [];
    });
    mockMetadataService.verifyStrictTitleAuthorCandidate.mockImplementation(
      (_book: Book, candidates: BookMetadataCandidate[]) => candidates[0] ?? null
    );

    await service.runIntegralEnrichment();

    expect(mockMetadataService.searchByQuery).toHaveBeenCalledWith('Dune Frank Herbert', {
      title: 'Dune',
      author: 'Frank Herbert',
    });
    expect(mockMetadataService.searchByQuery).toHaveBeenCalledWith('Elantris Brandon Sanderson', {
      title: 'Elantris',
      author: 'Brandon Sanderson',
    });
    // Cover optimization is only called for int-1, not int-2 which already has a cover
    expect(mockImageOptimizer.optimizeRemoteUrl).toHaveBeenCalledTimes(1);

    const state = service.state();
    expect(state.status).toBe('completed');
    expect(state.mode).toBe('integral-auto');
    expect(state.processedCount).toBe(2);
    expect(state.downloadedCount).toBe(1);
    expect(state.metadataUpdatedCount).toBe(2);
    expect(state.skippedItems).toEqual([]);

    const updatedBooks = booksSignal();
    const updatedDune = updatedBooks.find((b) => b.id === 'int-1');
    const updatedElantris = updatedBooks.find((b) => b.id === 'int-2');

    expect(updatedDune?.publisher).toBe('Ace Books');
    expect(updatedDune?.publicationYear).toBe(1965);
    expect(updatedDune?.totalPages).toBe(688);
    expect(updatedDune?.coverUrl).toBe('data:image/webp;base64,optimized');
    expect(updatedDune?.series?.name).toBe('Dune Chronicles');

    expect(updatedElantris?.coverUrl).toBe('data:image/webp;base64,existing');
    expect(updatedElantris?.totalPages).toBe(615);
    expect(updatedElantris?.publisher).toBe('Tor Books');
    expect(updatedElantris?.publicationYear).toBe(2005);
    expect(updatedElantris?.isbn).toBe('9780765311771');
  });

  it('backfills totalPages, year, publisher, isbn, and series when selecting a candidate in the Visual Assistant', async () => {
    const book = makeBook({
      id: 'va-meta',
      title: 'Mistborn',
      author: 'Brandon Sanderson',
      totalPages: 0,
    });
    booksSignal.set([book]);

    const candA = makeCandidate({
      id: 'va-a',
      title: 'The Final Empire',
      author: 'Brandon Sanderson',
      isbn: '076531178X',
      publisher: 'Tor Fantasy',
      publicationYear: 2006,
      totalPages: 541,
      seriesName: 'Mistborn',
      seriesOrder: 1,
      coverUrl: 'https://img/mistborn-a.jpg',
    });
    const candB = makeCandidate({
      id: 'va-b',
      title: 'El Imperio Final',
      author: 'Brandon Sanderson',
      coverUrl: 'https://img/mistborn-b.jpg',
    });

    mockMetadataService.searchByQuery.mockResolvedValue([candA, candB]);

    await service.startVisualAssistant();
    const applied = await service.selectAssistantCover(candA);

    expect(applied).toBe(true);
    expect(mockBooksService.update).toHaveBeenCalledWith(
      'va-meta',
      expect.objectContaining({
        id: 'va-meta',
        coverUrl: 'data:image/webp;base64,optimized',
        isbn: '9780765311788',
        publisher: 'Tor Fantasy',
        publicationYear: 2006,
        totalPages: 541,
        series: expect.objectContaining({
          name: 'Mistborn',
          volumeNumber: 1,
        }),
      })
    );
  });
});
