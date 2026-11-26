import { Injectable, computed, inject, signal } from '@angular/core';
import { AppPreferencesService } from '../../../core/services/app-preferences.service';
import { Book } from '../../books/models/book.model';
import { BookMetadataCandidate } from '../../books/models/book-metadata.model';
import { BookMetadataService, mergeCandidates } from '../../books/services/book-metadata.service';
import { BooksService } from '../../books/services/books.service';
import { ImageOptimizerService } from '../../books/services/image-optimizer.service';
import { buildBookSeriesPayload } from '../../books/utils/book-form.utils';
import { isValidIsbn, normalizeIsbn } from '../../books/utils/isbn.utils';
import {
  CoverEnrichmentFailureReason,
  CoverEnrichmentMode,
  CoverEnrichmentSkippedItem,
  CoverEnrichmentState,
  MissingCoverSummary,
} from '../models/cover-enrichment.model';

const ISBN_BATCH_SIZE = 20;
const DOWNLOAD_CONCURRENCY = 2;
const PERSISTENCE_BATCH_SIZE = 5;
const REQUEST_PACING_MS = 250;
const MIN_COVER_WIDTH_PX = 80;
const MIN_COVER_HEIGHT_PX = 120;

const INITIAL_ENRICHMENT_STATE: CoverEnrichmentState = {
  status: 'idle',
  mode: null,
  processedCount: 0,
  totalCount: 0,
  downloadedCount: 0,
  metadataUpdatedCount: 0,
  skippedItems: [],
};

/**
 * Non-destructively merges missing cover and bibliographic fields from a metadata
 * candidate into an existing library book.
 */
export function mergeCandidateIntoBook(
  book: Book,
  candidate: BookMetadataCandidate,
  optimizedCover?: string
): { updatedBook: Book; coverChanged: boolean; metadataChanged: boolean } {
  const nextCover =
    !book.coverUrl?.trim() && optimizedCover?.trim() ? optimizedCover.trim() : undefined;
  const coverChanged = Boolean(nextCover);

  const nextPages =
    book.totalPages <= 1 && candidate.totalPages && candidate.totalPages > 1
      ? Math.max(candidate.totalPages, book.currentPage)
      : undefined;

  const nextYear =
    !book.publicationYear && candidate.publicationYear ? candidate.publicationYear : undefined;

  const trimmedPublisher = candidate.publisher?.trim();
  const nextPublisher = !book.publisher?.trim() && trimmedPublisher ? trimmedPublisher : undefined;

  const canBackfillIsbn =
    (!book.isbn?.trim() || !isValidIsbn(book.isbn)) &&
    Boolean(candidate.isbn && isValidIsbn(candidate.isbn));
  const nextIsbn = canBackfillIsbn
    ? (normalizeIsbn(candidate.isbn ?? '') ?? candidate.isbn)
    : undefined;

  const nextSeries =
    !book.series?.name?.trim() && candidate.seriesName?.trim()
      ? buildBookSeriesPayload({
          enabled: true,
          name: candidate.seriesName,
          volumeNumber: candidate.seriesOrder,
        })
      : undefined;

  const metadataChanged = Boolean(
    nextPages !== undefined ||
    nextYear !== undefined ||
    nextPublisher !== undefined ||
    nextIsbn !== undefined ||
    nextSeries !== undefined
  );

  if (!coverChanged && !metadataChanged) {
    return { updatedBook: book, coverChanged: false, metadataChanged: false };
  }

  return {
    updatedBook: {
      ...book,
      ...(nextCover ? { coverUrl: nextCover } : {}),
      ...(nextPages !== undefined ? { totalPages: nextPages } : {}),
      ...(nextYear !== undefined ? { publicationYear: nextYear } : {}),
      ...(nextPublisher !== undefined ? { publisher: nextPublisher } : {}),
      ...(nextIsbn !== undefined ? { isbn: nextIsbn } : {}),
      ...(nextSeries !== undefined ? { series: nextSeries } : {}),
      updatedAt: new Date().toISOString(),
    },
    coverChanged,
    metadataChanged,
  };
}

/**
 * Returns true when a book still lacks core enrichable fields that the current candidate does not supply.
 */
export function bookNeedsMoreFields(book: Book, candidate: BookMetadataCandidate | null): boolean {
  const needsCover = !book.coverUrl?.trim() && !candidate?.coverUrl?.trim();
  const needsPages = book.totalPages <= 1 && !(candidate?.totalPages && candidate.totalPages > 1);
  const needsYear = !book.publicationYear && !candidate?.publicationYear;
  const needsPublisher = !book.publisher?.trim() && !candidate?.publisher?.trim();
  const needsIsbn =
    (!book.isbn?.trim() || !isValidIsbn(book.isbn)) &&
    !(candidate?.isbn && isValidIsbn(candidate.isbn));

  return needsCover || needsPages || needsYear || needsPublisher || needsIsbn;
}

/**
 * Coordinates post-import bulk cover enrichment, rate-limited ISBN/title-author queues,
 * incremental IndexedDB persistence, and the interactive visual cover assistant.
 */
@Injectable({
  providedIn: 'root',
})
export class CoverEnrichmentService {
  private readonly appPreferences = inject(AppPreferencesService);
  private readonly booksService = inject(BooksService);
  private readonly bookMetadataService = inject(BookMetadataService);
  private readonly imageOptimizer = inject(ImageOptimizerService);

  private pauseResolvers: Array<() => void> = [];
  private cancelRequested = false;

  /**
   * Reactive summary of all library books missing a cover image or core bibliographic metadata.
   */
  readonly missingCoverSummary = computed<MissingCoverSummary>(() => {
    const allBooks = this.booksService.books();
    const booksWithoutCovers: Book[] = [];
    const booksWithIsbn: Book[] = [];
    const booksWithoutIsbn: Book[] = [];
    const incompleteBooks: Book[] = [];

    let missingPagesCount = 0;
    let missingYearCount = 0;
    let missingPublisherCount = 0;
    let missingIsbnCount = 0;

    for (const book of allBooks) {
      const missingCover = !book.coverUrl?.trim();
      const hasValidIsbn = Boolean(book.isbn && isValidIsbn(book.isbn));
      const missingPages = book.totalPages <= 1;
      const missingYear = !book.publicationYear;
      const missingPublisher = !book.publisher?.trim();
      const missingIsbn = !hasValidIsbn;

      if (missingCover) {
        booksWithoutCovers.push(book);
        if (hasValidIsbn) {
          booksWithIsbn.push(book);
        } else {
          booksWithoutIsbn.push(book);
        }
      }

      if (missingPages) {
        missingPagesCount++;
      }
      if (missingYear) {
        missingYearCount++;
      }
      if (missingPublisher) {
        missingPublisherCount++;
      }
      if (missingIsbn) {
        missingIsbnCount++;
      }

      if (missingCover || missingPages || missingYear || missingPublisher || missingIsbn) {
        incompleteBooks.push(book);
      }
    }

    return {
      totalMissing: booksWithoutCovers.length,
      withValidIsbnCount: booksWithIsbn.length,
      withoutValidIsbnCount: booksWithoutIsbn.length,
      booksWithIsbn,
      booksWithoutIsbn,
      totalIncomplete: incompleteBooks.length,
      missingCoverCount: booksWithoutCovers.length,
      missingPagesCount,
      missingYearCount,
      missingPublisherCount,
      missingIsbnCount,
      incompleteBooks,
    };
  });

  readonly state = signal<CoverEnrichmentState>({ ...INITIAL_ENRICHMENT_STATE });

  readonly assistantActive = signal<boolean>(false);
  readonly assistantQueue = signal<Book[]>([]);
  readonly assistantCurrentIndex = signal<number>(0);
  readonly assistantCandidates = signal<BookMetadataCandidate[]>([]);
  readonly assistantNotFoundBooks = signal<Book[]>([]);
  readonly assistantLoading = signal<boolean>(false);
  readonly assistantCurrentBook = computed<Book | null>(
    () => this.assistantQueue()[this.assistantCurrentIndex()] ?? null
  );

  /**
   * Runs strict ISBN-based bulk enrichment on all books missing covers that have a valid ISBN.
   */
  async runStrictIsbnEnrichment(): Promise<void> {
    if (this.appPreferences.offlineMode() || this.isQueueActive()) {
      return;
    }

    const targets = this.missingCoverSummary().booksWithIsbn;
    this.beginQueue('isbn-strict', targets.length);
    if (targets.length === 0) {
      this.state.update((current) => ({ ...current, status: 'completed' }));
      return;
    }

    const pendingUpdates: Book[] = [];

    try {
      for (let offset = 0; offset < targets.length; offset += ISBN_BATCH_SIZE) {
        if (!(await this.waitIfPausedOrCancelled(pendingUpdates))) {
          break;
        }

        const chunk = targets.slice(offset, offset + ISBN_BATCH_SIZE);
        const batchCandidates = await this.lookupIsbnBatchSafe(chunk);

        await this.processChunkWithConcurrency(chunk, async (book) => {
          if (!(await this.waitIfPausedOrCancelled(pendingUpdates))) {
            return;
          }

          const canonicalIsbn = normalizeIsbn(book.isbn ?? '') ?? '';
          const batchCandidate = canonicalIsbn
            ? (batchCandidates.get(canonicalIsbn) ?? null)
            : null;
          await this.enrichBookFromIsbnCandidate(book, batchCandidate, pendingUpdates);
        });

        if (offset + ISBN_BATCH_SIZE < targets.length && !this.cancelRequested) {
          await this.delay(REQUEST_PACING_MS);
        }
      }
    } finally {
      await this.flushPendingUpdates(pendingUpdates);
      this.finishQueue();
    }
  }

  /**
   * Runs strict Title + Author enrichment for all books still missing covers.
   */
  async runStrictTitleAuthorEnrichment(): Promise<void> {
    if (this.appPreferences.offlineMode() || this.isQueueActive()) {
      return;
    }

    const targets = this.booksService.books().filter((book) => !book.coverUrl?.trim());
    this.beginQueue('title-author-strict', targets.length);
    if (targets.length === 0) {
      this.state.update((current) => ({ ...current, status: 'completed' }));
      return;
    }

    const pendingUpdates: Book[] = [];

    try {
      for (let index = 0; index < targets.length; index++) {
        if (index > 0) {
          await this.delay(REQUEST_PACING_MS);
        }
        if (!(await this.waitIfPausedOrCancelled(pendingUpdates))) {
          break;
        }

        const book = targets[index];
        await this.enrichBookByStrictTitleAuthor(book, pendingUpdates);
      }
    } finally {
      await this.flushPendingUpdates(pendingUpdates);
      this.finishQueue();
    }
  }

  /**
   * Runs integral metadata and cover auto-enrichment across incomplete books using an
   * automatic ISBN -> strict Title+Author cascade and non-destructive field backfilling.
   */
  async runIntegralEnrichment(targetBooks?: readonly Book[]): Promise<void> {
    if (this.appPreferences.offlineMode() || this.isQueueActive()) {
      return;
    }

    const targets = targetBooks ? [...targetBooks] : this.missingCoverSummary().incompleteBooks;
    this.beginQueue('integral-auto', targets.length);
    if (targets.length === 0) {
      this.state.update((current) => ({ ...current, status: 'completed' }));
      return;
    }

    const pendingUpdates: Book[] = [];

    try {
      for (let offset = 0; offset < targets.length; offset += ISBN_BATCH_SIZE) {
        if (!(await this.waitIfPausedOrCancelled(pendingUpdates))) {
          break;
        }

        const chunk = targets.slice(offset, offset + ISBN_BATCH_SIZE);
        const booksWithValidIsbn = chunk.filter((book) =>
          Boolean(book.isbn && isValidIsbn(book.isbn))
        );
        const batchCandidates =
          booksWithValidIsbn.length > 0
            ? await this.lookupIsbnBatchSafe(booksWithValidIsbn)
            : new Map<string, BookMetadataCandidate>();

        await this.processChunkWithConcurrency(chunk, async (book) => {
          if (!(await this.waitIfPausedOrCancelled(pendingUpdates))) {
            return;
          }

          const canonicalIsbn =
            book.isbn && isValidIsbn(book.isbn) ? (normalizeIsbn(book.isbn) ?? '') : '';
          const batchCandidate = canonicalIsbn
            ? (batchCandidates.get(canonicalIsbn) ?? null)
            : null;
          await this.enrichBookIntegrally(book, batchCandidate, pendingUpdates);
        });

        if (offset + ISBN_BATCH_SIZE < targets.length && !this.cancelRequested) {
          await this.delay(REQUEST_PACING_MS);
        }
      }
    } finally {
      await this.flushPendingUpdates(pendingUpdates);
      this.finishQueue();
    }
  }

  /**
   * Pauses an active enrichment queue before processing the next item.
   */
  pause(): void {
    if (this.state().status !== 'running') {
      return;
    }
    this.state.update((current) => ({ ...current, status: 'paused' }));
  }

  /**
   * Resumes a paused enrichment queue.
   */
  resume(): void {
    if (this.state().status !== 'paused') {
      return;
    }
    this.state.update((current) => ({ ...current, status: 'running' }));
    this.resolvePauseGate();
  }

  /**
   * Cancels an active or paused enrichment queue cleanly without losing persisted covers.
   */
  cancel(): void {
    const status = this.state().status;
    if (status !== 'running' && status !== 'paused') {
      return;
    }
    this.cancelRequested = true;
    this.state.update((current) => ({ ...current, status: 'cancelled' }));
    this.resolvePauseGate();
  }

  /**
   * Resets the verification report and queue state back to idle.
   */
  resetReport(): void {
    if (this.isQueueActive()) {
      this.cancel();
    }
    this.state.set({ ...INITIAL_ENRICHMENT_STATE });
  }

  /**
   * Initializes the interactive step-by-step visual cover assistant for books missing covers.
   * Only pauses for manual selection on books with multiple candidate covers; books with no
   * covers are collected into `assistantNotFoundBooks` without requiring manual skipping.
   */
  async startVisualAssistant(books?: readonly Book[]): Promise<void> {
    if (this.appPreferences.offlineMode()) {
      return;
    }
    const queue = (books ?? this.booksService.books()).filter((book) => !book.coverUrl?.trim());
    this.assistantQueue.set(queue);
    this.assistantCurrentIndex.set(0);
    this.assistantCandidates.set([]);
    this.assistantNotFoundBooks.set([]);
    this.assistantActive.set(true);

    if (queue.length === 0) {
      this.assistantLoading.set(false);
      return;
    }

    await this.loadAssistantCandidatesForCurrentBook();
  }

  /**
   * Downloads, validates, and persists the user-selected cover candidate, then advances the queue.
   */
  async selectAssistantCover(candidate: BookMetadataCandidate): Promise<boolean> {
    const currentBook = this.assistantCurrentBook();
    if (!currentBook || !candidate.coverUrl?.trim()) {
      return false;
    }

    this.assistantLoading.set(true);
    try {
      const applied = await this.applyAssistantCandidateToBook(currentBook, candidate);
      if (!applied) {
        return false;
      }

      await this.advanceAssistantQueue();
      return true;
    } finally {
      if (this.assistantActive()) {
        this.assistantLoading.set(false);
      }
    }
  }

  /**
   * Skips the current book in the visual cover assistant and loads candidates for the next one.
   */
  async skipAssistantBook(): Promise<void> {
    await this.advanceAssistantQueue();
  }

  /**
   * Closes the interactive visual cover assistant and clears temporary suggestion state.
   */
  closeVisualAssistant(): void {
    this.assistantActive.set(false);
    this.assistantQueue.set([]);
    this.assistantCurrentIndex.set(0);
    this.assistantCandidates.set([]);
    this.assistantNotFoundBooks.set([]);
    this.assistantLoading.set(false);
  }

  private isQueueActive(): boolean {
    const status = this.state().status;
    return status === 'running' || status === 'paused';
  }

  private beginQueue(mode: CoverEnrichmentMode, totalCount: number): void {
    this.cancelRequested = false;
    this.resolvePauseGate();
    this.state.set({
      status: 'running',
      mode,
      processedCount: 0,
      totalCount,
      downloadedCount: 0,
      metadataUpdatedCount: 0,
      skippedItems: [],
    });
  }

  private finishQueue(): void {
    this.resolvePauseGate();
    const finalStatus = this.cancelRequested ? 'cancelled' : 'completed';
    this.state.update((current) => ({
      ...current,
      status: finalStatus,
    }));
  }

  private resolvePauseGate(): void {
    const resolvers = this.pauseResolvers.splice(0, this.pauseResolvers.length);
    for (const resolve of resolvers) {
      resolve();
    }
  }

  private async waitIfPausedOrCancelled(pendingUpdates: Book[]): Promise<boolean> {
    if (this.cancelRequested) {
      return false;
    }

    if (this.state().status === 'paused') {
      await this.flushPendingUpdates(pendingUpdates);
      await new Promise<void>((resolve) => {
        this.pauseResolvers.push(resolve);
      });
    }

    return !this.cancelRequested;
  }

  private async lookupIsbnBatchSafe(
    chunk: readonly Book[]
  ): Promise<Map<string, BookMetadataCandidate>> {
    const rawIsbns = chunk.map((book) => book.isbn ?? '').filter((isbn) => Boolean(isbn.trim()));
    try {
      return await this.bookMetadataService.lookupBatchByIsbns(rawIsbns);
    } catch {
      return new Map<string, BookMetadataCandidate>();
    }
  }

  private async processChunkWithConcurrency<T>(
    items: readonly T[],
    worker: (item: T) => Promise<void>
  ): Promise<void> {
    let cursor = 0;
    const workerCount = Math.min(DOWNLOAD_CONCURRENCY, items.length);
    const workers = Array.from({ length: workerCount }, async () => {
      while (cursor < items.length && !this.cancelRequested) {
        const index = cursor++;
        await worker(items[index]);
      }
    });
    await Promise.all(workers);
  }

  private async enrichBookIntegrally(
    book: Book,
    batchCandidate: BookMetadataCandidate | null,
    pendingUpdates: Book[]
  ): Promise<void> {
    let candidate = batchCandidate;
    let hadNetworkError = false;
    const hasValidIsbn = Boolean(book.isbn && isValidIsbn(book.isbn));

    if (hasValidIsbn && (!candidate?.coverUrl?.trim() || bookNeedsMoreFields(book, candidate))) {
      try {
        const isbnFallback = await this.bookMetadataService.lookupByIsbn(book.isbn ?? '');
        if (isbnFallback) {
          candidate = candidate ? mergeCandidates(candidate, isbnFallback) : isbnFallback;
        }
      } catch {
        hadNetworkError = true;
      }
    }

    if (!hasValidIsbn || !candidate?.coverUrl?.trim() || bookNeedsMoreFields(book, candidate)) {
      try {
        const searchResults = await this.bookMetadataService.searchByQuery(
          `${book.title} ${book.author}`,
          { title: book.title, author: book.author }
        );
        const verified = this.bookMetadataService.verifyStrictTitleAuthorCandidate(
          book,
          searchResults
        );
        if (verified) {
          candidate = candidate ? mergeCandidates(candidate, verified) : verified;
        }
      } catch {
        hadNetworkError = true;
      }
    }

    if (!candidate) {
      this.recordSkipped(book, hadNetworkError ? 'network_error' : 'no_metadata_found');
      return;
    }

    const { optimizedCover, coverFailureReason } = await this.optimizeCoverIfNeeded(
      book,
      candidate
    );
    const { updatedBook, coverChanged, metadataChanged } = mergeCandidateIntoBook(
      book,
      candidate,
      optimizedCover
    );

    if (coverChanged || metadataChanged) {
      await this.stageUpdatedBook(updatedBook, coverChanged, metadataChanged, pendingUpdates);
      return;
    }

    const fallbackReason: CoverEnrichmentFailureReason =
      coverFailureReason ??
      (!book.coverUrl?.trim() && !candidate.coverUrl?.trim()
        ? 'no_cover_in_provider'
        : 'no_metadata_found');
    this.recordSkipped(book, fallbackReason);
  }

  private async enrichBookFromIsbnCandidate(
    book: Book,
    batchCandidate: BookMetadataCandidate | null,
    pendingUpdates: Book[]
  ): Promise<void> {
    let candidate = batchCandidate;

    if (!candidate?.coverUrl?.trim()) {
      try {
        const fallback = await this.bookMetadataService.lookupByIsbn(book.isbn ?? '');
        if (fallback) {
          candidate = candidate ? mergeCandidates(candidate, fallback) : fallback;
        }
      } catch {
        this.recordSkipped(book, 'network_error');
        return;
      }
    }

    if (!candidate) {
      this.recordSkipped(book, 'no_metadata_found');
      return;
    }

    const { optimizedCover, coverFailureReason } = await this.optimizeCoverIfNeeded(
      book,
      candidate
    );
    const { updatedBook, coverChanged, metadataChanged } = mergeCandidateIntoBook(
      book,
      candidate,
      optimizedCover
    );

    if (!coverChanged) {
      if (metadataChanged) {
        pendingUpdates.push(updatedBook);
        this.state.update((current) => ({
          ...current,
          metadataUpdatedCount: current.metadataUpdatedCount + 1,
        }));
        if (pendingUpdates.length >= PERSISTENCE_BATCH_SIZE) {
          await this.flushPendingUpdates(pendingUpdates);
        }
      }
      this.recordSkipped(book, coverFailureReason ?? 'no_cover_in_provider');
      return;
    }

    await this.stageUpdatedBook(updatedBook, coverChanged, metadataChanged, pendingUpdates);
  }

  private async enrichBookByStrictTitleAuthor(book: Book, pendingUpdates: Book[]): Promise<void> {
    let candidates: BookMetadataCandidate[];
    try {
      candidates = await this.bookMetadataService.searchByQuery(`${book.title} ${book.author}`, {
        title: book.title,
        author: book.author,
      });
    } catch {
      this.recordSkipped(book, 'network_error');
      return;
    }

    if (candidates.length === 0) {
      this.recordSkipped(book, 'no_metadata_found');
      return;
    }

    const verified = this.bookMetadataService.verifyStrictTitleAuthorCandidate(book, candidates);
    if (!verified) {
      const reason: CoverEnrichmentFailureReason = candidates.some((c) =>
        Boolean(c.coverUrl?.trim())
      )
        ? 'mismatch_verification'
        : 'no_cover_in_provider';
      this.recordSkipped(book, reason);
      return;
    }

    const { optimizedCover, coverFailureReason } = await this.optimizeCoverIfNeeded(book, verified);
    const { updatedBook, coverChanged, metadataChanged } = mergeCandidateIntoBook(
      book,
      verified,
      optimizedCover
    );

    if (!coverChanged) {
      if (metadataChanged) {
        pendingUpdates.push(updatedBook);
        this.state.update((current) => ({
          ...current,
          metadataUpdatedCount: current.metadataUpdatedCount + 1,
        }));
        if (pendingUpdates.length >= PERSISTENCE_BATCH_SIZE) {
          await this.flushPendingUpdates(pendingUpdates);
        }
      }
      this.recordSkipped(book, coverFailureReason ?? 'no_cover_in_provider');
      return;
    }

    await this.stageUpdatedBook(updatedBook, coverChanged, metadataChanged, pendingUpdates);
  }

  private async optimizeCoverIfNeeded(
    book: Book,
    candidate: BookMetadataCandidate
  ): Promise<{ optimizedCover?: string; coverFailureReason?: CoverEnrichmentFailureReason }> {
    const coverUrl = candidate.coverUrl?.trim();
    if (book.coverUrl?.trim() || !coverUrl) {
      return {
        coverFailureReason:
          !book.coverUrl?.trim() && !coverUrl ? 'no_cover_in_provider' : undefined,
      };
    }

    try {
      const optimized = await this.imageOptimizer.optimizeRemoteUrl(coverUrl, {
        minWidth: MIN_COVER_WIDTH_PX,
        minHeight: MIN_COVER_HEIGHT_PX,
      });
      if (!optimized) {
        return { coverFailureReason: 'invalid_cover_dimensions' };
      }
      return { optimizedCover: optimized };
    } catch {
      return { coverFailureReason: 'network_error' };
    }
  }

  private async stageUpdatedBook(
    updatedBook: Book,
    coverChanged: boolean,
    metadataChanged: boolean,
    pendingUpdates: Book[]
  ): Promise<void> {
    pendingUpdates.push(updatedBook);

    this.state.update((current) => ({
      ...current,
      processedCount: current.processedCount + 1,
      downloadedCount: current.downloadedCount + (coverChanged ? 1 : 0),
      metadataUpdatedCount: current.metadataUpdatedCount + (metadataChanged ? 1 : 0),
    }));

    if (pendingUpdates.length >= PERSISTENCE_BATCH_SIZE) {
      await this.flushPendingUpdates(pendingUpdates);
    }
  }

  private recordSkipped(book: Book, reason: CoverEnrichmentFailureReason): void {
    const item: CoverEnrichmentSkippedItem = {
      bookId: book.id,
      title: book.title,
      author: book.author,
      ...(book.isbn ? { isbn: book.isbn } : {}),
      reason,
    };

    this.state.update((current) => ({
      ...current,
      processedCount: current.processedCount + 1,
      skippedItems: [...current.skippedItems, item],
    }));
  }

  private async flushPendingUpdates(pendingUpdates: Book[]): Promise<void> {
    if (pendingUpdates.length === 0) {
      return;
    }

    const batch = pendingUpdates.splice(0, pendingUpdates.length);
    await this.booksService.updateMany(batch);
  }

  private async applyAssistantCandidateToBook(
    book: Book,
    candidate: BookMetadataCandidate
  ): Promise<boolean> {
    if (!candidate.coverUrl?.trim()) {
      return false;
    }

    try {
      const optimizedCover = await this.imageOptimizer.optimizeRemoteUrl(candidate.coverUrl, {
        minWidth: MIN_COVER_WIDTH_PX,
        minHeight: MIN_COVER_HEIGHT_PX,
      });
      if (!optimizedCover) {
        return false;
      }

      const { updatedBook, coverChanged, metadataChanged } = mergeCandidateIntoBook(
        book,
        candidate,
        optimizedCover
      );

      if (!coverChanged && !metadataChanged) {
        return false;
      }

      await this.booksService.update(book.id, updatedBook);

      return true;
    } catch {
      return false;
    }
  }

  private async loadAssistantCandidatesForCurrentBook(): Promise<void> {
    this.assistantLoading.set(true);
    try {
      while (this.assistantActive()) {
        const currentBook = this.assistantCurrentBook();
        if (!currentBook) {
          this.assistantCandidates.set([]);
          if (this.assistantNotFoundBooks().length === 0) {
            this.closeVisualAssistant();
          }
          return;
        }

        let candidatesWithCover: BookMetadataCandidate[] = [];
        try {
          const results = await this.bookMetadataService.searchByQuery(
            `${currentBook.title} ${currentBook.author}`,
            { title: currentBook.title, author: currentBook.author }
          );
          candidatesWithCover = results.filter((candidate) => Boolean(candidate.coverUrl?.trim()));
        } catch {
          candidatesWithCover = [];
        }

        if (!this.assistantActive()) {
          return;
        }

        if (candidatesWithCover.length === 0) {
          this.assistantNotFoundBooks.update((list) => [...list, currentBook]);
          this.assistantCurrentIndex.set(this.assistantCurrentIndex() + 1);
          continue;
        }

        if (candidatesWithCover.length === 1) {
          const applied = await this.applyAssistantCandidateToBook(
            currentBook,
            candidatesWithCover[0]
          );
          if (!this.assistantActive()) {
            return;
          }
          if (!applied) {
            this.assistantNotFoundBooks.update((list) => [...list, currentBook]);
          }
          this.assistantCurrentIndex.set(this.assistantCurrentIndex() + 1);
          continue;
        }

        this.assistantCandidates.set(candidatesWithCover);
        return;
      }
    } finally {
      if (this.assistantActive()) {
        this.assistantLoading.set(false);
      }
    }
  }

  private async advanceAssistantQueue(): Promise<void> {
    const nextIndex = this.assistantCurrentIndex() + 1;
    this.assistantCurrentIndex.set(nextIndex);
    if (nextIndex >= this.assistantQueue().length) {
      this.assistantCandidates.set([]);
      if (this.assistantNotFoundBooks().length === 0) {
        this.closeVisualAssistant();
      }
      return;
    }

    await this.loadAssistantCandidatesForCurrentBook();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
