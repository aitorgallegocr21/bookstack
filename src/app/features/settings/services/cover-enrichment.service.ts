import { Injectable, computed, inject, signal } from '@angular/core';
import { Book } from '../../books/models/book.model';
import { BookMetadataCandidate } from '../../books/models/book-metadata.model';
import { BookMetadataService } from '../../books/services/book-metadata.service';
import { BooksService } from '../../books/services/books.service';
import { ImageOptimizerService } from '../../books/services/image-optimizer.service';
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
  skippedItems: [],
};

/**
 * Coordinates post-import bulk cover enrichment, rate-limited ISBN/title-author queues,
 * incremental IndexedDB persistence, and the interactive visual cover assistant.
 */
@Injectable({
  providedIn: 'root',
})
export class CoverEnrichmentService {
  private readonly booksService = inject(BooksService);
  private readonly bookMetadataService = inject(BookMetadataService);
  private readonly imageOptimizer = inject(ImageOptimizerService);

  private pauseResolvers: Array<() => void> = [];
  private cancelRequested = false;

  /**
   * Reactive summary of all library books missing a cover image, partitioned by valid ISBN.
   */
  readonly missingCoverSummary = computed<MissingCoverSummary>(() => {
    const booksWithoutCovers = this.booksService.books().filter((book) => !book.coverUrl?.trim());
    const booksWithIsbn: Book[] = [];
    const booksWithoutIsbn: Book[] = [];

    for (const book of booksWithoutCovers) {
      if (book.isbn && isValidIsbn(book.isbn)) {
        booksWithIsbn.push(book);
      } else {
        booksWithoutIsbn.push(book);
      }
    }

    return {
      totalMissing: booksWithoutCovers.length,
      withValidIsbnCount: booksWithIsbn.length,
      withoutValidIsbnCount: booksWithoutIsbn.length,
      booksWithIsbn,
      booksWithoutIsbn,
    };
  });

  readonly state = signal<CoverEnrichmentState>({ ...INITIAL_ENRICHMENT_STATE });

  readonly assistantActive = signal<boolean>(false);
  readonly assistantQueue = signal<Book[]>([]);
  readonly assistantCurrentIndex = signal<number>(0);
  readonly assistantCandidates = signal<BookMetadataCandidate[]>([]);
  readonly assistantLoading = signal<boolean>(false);
  readonly assistantCurrentBook = computed<Book | null>(
    () => this.assistantQueue()[this.assistantCurrentIndex()] ?? null
  );

  /**
   * Runs strict ISBN-based bulk enrichment on all books missing covers that have a valid ISBN.
   */
  async runStrictIsbnEnrichment(): Promise<void> {
    if (this.isQueueActive()) {
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
    if (this.isQueueActive()) {
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
   */
  async startVisualAssistant(books?: readonly Book[]): Promise<void> {
    const queue = (books ?? this.booksService.books()).filter((book) => !book.coverUrl?.trim());
    this.assistantQueue.set(queue);
    this.assistantCurrentIndex.set(0);
    this.assistantCandidates.set([]);
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
      const optimizedCover = await this.imageOptimizer.optimizeRemoteUrl(candidate.coverUrl, {
        minWidth: MIN_COVER_WIDTH_PX,
        minHeight: MIN_COVER_HEIGHT_PX,
      });
      if (!optimizedCover) {
        return false;
      }

      const shouldBackfillIsbn =
        (!currentBook.isbn?.trim() || !isValidIsbn(currentBook.isbn)) &&
        Boolean(candidate.isbn && isValidIsbn(candidate.isbn));
      const resolvedIsbn = shouldBackfillIsbn
        ? (normalizeIsbn(candidate.isbn ?? '') ?? candidate.isbn)
        : currentBook.isbn;

      await this.booksService.update(currentBook.id, {
        ...currentBook,
        coverUrl: optimizedCover,
        ...(resolvedIsbn ? { isbn: resolvedIsbn } : {}),
        updatedAt: new Date().toISOString(),
      });

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
          candidate = fallback;
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

    const coverUrl = candidate.coverUrl?.trim();
    if (!coverUrl) {
      this.recordSkipped(book, 'no_cover_in_provider');
      return;
    }

    await this.downloadAndStageCover(book, coverUrl, pendingUpdates);
  }

  private async enrichBookByStrictTitleAuthor(book: Book, pendingUpdates: Book[]): Promise<void> {
    let candidates: BookMetadataCandidate[];
    try {
      candidates = await this.bookMetadataService.searchByQuery(`${book.title} ${book.author}`);
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

    const coverUrl = verified.coverUrl?.trim();
    if (!coverUrl) {
      this.recordSkipped(book, 'no_cover_in_provider');
      return;
    }

    await this.downloadAndStageCover(book, coverUrl, pendingUpdates);
  }

  private async downloadAndStageCover(
    book: Book,
    coverUrl: string,
    pendingUpdates: Book[]
  ): Promise<void> {
    let optimizedCover = '';
    try {
      optimizedCover = await this.imageOptimizer.optimizeRemoteUrl(coverUrl, {
        minWidth: MIN_COVER_WIDTH_PX,
        minHeight: MIN_COVER_HEIGHT_PX,
      });
    } catch {
      this.recordSkipped(book, 'network_error');
      return;
    }

    if (!optimizedCover) {
      this.recordSkipped(book, 'invalid_cover_dimensions');
      return;
    }

    pendingUpdates.push({
      ...book,
      coverUrl: optimizedCover,
      updatedAt: new Date().toISOString(),
    });

    this.state.update((current) => ({
      ...current,
      processedCount: current.processedCount + 1,
      downloadedCount: current.downloadedCount + 1,
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

  private async loadAssistantCandidatesForCurrentBook(): Promise<void> {
    const currentBook = this.assistantCurrentBook();
    if (!currentBook) {
      this.assistantCandidates.set([]);
      this.assistantLoading.set(false);
      return;
    }

    this.assistantLoading.set(true);
    try {
      const results = await this.bookMetadataService.searchByQuery(
        `${currentBook.title} ${currentBook.author}`
      );
      this.assistantCandidates.set(
        results.filter((candidate) => Boolean(candidate.coverUrl?.trim()))
      );
    } catch {
      this.assistantCandidates.set([]);
    } finally {
      this.assistantLoading.set(false);
    }
  }

  private async advanceAssistantQueue(): Promise<void> {
    const nextIndex = this.assistantCurrentIndex() + 1;
    if (nextIndex >= this.assistantQueue().length) {
      this.closeVisualAssistant();
      return;
    }

    this.assistantCurrentIndex.set(nextIndex);
    await this.loadAssistantCandidatesForCurrentBook();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
