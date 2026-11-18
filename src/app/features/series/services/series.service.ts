import { computed, inject, Injectable, signal } from '@angular/core';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book } from '../../books/models/book.model';
import { BooksService } from '../../books/services/books.service';
import { ReadingLogService } from '../../books/services/reading-log.service';
import {
  SagaAggregation,
  SagaFilterStatus,
  SagaSortOption,
  SagaStatusCounts,
  SeriesMetadata,
  SeriesPublicationStatus,
} from '../models/series.model';
import { parseStoredSeriesMetadata } from '../schemas/series.schema';
import {
  buildTimelineSlots,
  computeMissingVolumes,
  matchesSagaSearch,
  matchesSagaStatusFilter,
  normalizeSeriesKey,
  resolveSagaBentoScale,
  sortSagaBooksChronologically,
  sortSagas,
} from '../utils/series.utils';

export interface ExistingSeriesOption {
  id: string;
  normalizedKey: string;
  name: string;
  count: number;
  nextVolumeNumber: number;
}

export interface UpsertSeriesMetadataPayload {
  normalizedKey?: string;
  id?: string;
  name: string;
  expectedVolumes?: number | null;
  publicationStatus?: SeriesPublicationStatus | null;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SeriesService {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  private readonly storage = inject(StorageAdapterService);
  private readonly storeName = 'seriesMetadata';
  private initPromise: Promise<void> | null = null;

  readonly metadata = signal<SeriesMetadata[]>([]);
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<SagaFilterStatus>('all');
  readonly sortOption = signal<SagaSortOption>('recent');

  constructor() {
    void this.ensureInitialized();
  }

  ensureInitialized(): Promise<void> {
    this.initPromise ??= this.storage
      .getAll<unknown>(this.storeName)
      .then((stored) => {
        this.metadata.set(parseStoredSeriesMetadata(stored));
      })
      .catch((error: unknown) => {
        console.error('[SeriesService] Failed to initialize series metadata:', error);
        this.metadata.set([]);
      });
    return this.initPromise;
  }

  readonly sagas = computed<SagaAggregation[]>(() => {
    const books = this.booksService.books();
    const metadataList = this.metadata();
    const logs = this.readingLogService.readingLogs();

    const minutesByBookId = new Map<string, number>();
    for (const log of logs) {
      if (log.timeSpentMinutes && log.timeSpentMinutes > 0) {
        minutesByBookId.set(
          log.bookId,
          (minutesByBookId.get(log.bookId) ?? 0) + log.timeSpentMinutes
        );
      }
    }

    const metadataByKey = new Map<string, SeriesMetadata>();
    const metadataById = new Map<string, SeriesMetadata>();
    for (const item of metadataList) {
      metadataByKey.set(item.normalizedKey, item);
      metadataById.set(item.id, item);
    }

    const groupedBooks = new Map<string, Book[]>();
    for (const book of books) {
      const rawName = book.series?.name?.trim();
      if (!rawName) {
        continue;
      }
      const key = normalizeSeriesKey(rawName);
      if (!key) {
        continue;
      }
      const group = groupedBooks.get(key);
      if (group) {
        group.push(book);
      } else {
        groupedBooks.set(key, [book]);
      }
    }

    const result: SagaAggregation[] = [];

    for (const [normalizedKey, groupBooks] of groupedBooks.entries()) {
      const sortedBooks = sortSagaBooksChronologically(groupBooks);
      const firstBookSeriesId = sortedBooks.find((b) => b.series?.id)?.series?.id;
      const attachedMetadata =
        metadataByKey.get(normalizedKey) ??
        (firstBookSeriesId ? metadataById.get(firstBookSeriesId) : undefined);

      const canonicalId = attachedMetadata?.id ?? firstBookSeriesId ?? normalizedKey;
      const canonicalName =
        attachedMetadata?.name ?? sortedBooks[0]?.series?.name?.trim() ?? normalizedKey;

      const authors: string[] = [];
      const seenAuthors = new Set<string>();
      for (const book of sortedBooks) {
        const author = book.author?.trim();
        if (author && !seenAuthors.has(author)) {
          seenAuthors.add(author);
          authors.push(author);
        }
      }

      const ownedVolumes: number[] = [];
      let completedCount = 0;
      let readingCount = 0;
      let pendingCount = 0;
      let abandonedCount = 0;
      let totalPages = 0;
      let readPages = 0;
      let ratingSum = 0;
      let ratedCount = 0;
      let totalReadingMinutes = 0;
      let lastActivityAt = attachedMetadata?.updatedAt ?? '';

      for (const book of sortedBooks) {
        const vol = book.series?.volumeNumber;
        if (typeof vol === 'number' && Number.isInteger(vol) && vol > 0) {
          ownedVolumes.push(vol);
        }

        switch (book.status) {
          case 'completed':
            completedCount++;
            break;
          case 'reading':
            readingCount++;
            break;
          case 'pending':
            pendingCount++;
            break;
          case 'abandoned':
            abandonedCount++;
            break;
        }

        const bookTotalPages = Math.max(0, book.totalPages);
        const bookReadPages =
          book.status === 'completed'
            ? bookTotalPages
            : Math.min(Math.max(0, book.currentPage), bookTotalPages);
        totalPages += bookTotalPages;
        readPages += bookReadPages;

        if (typeof book.rating === 'number' && book.rating > 0) {
          ratingSum += book.rating;
          ratedCount++;
        }

        totalReadingMinutes += minutesByBookId.get(book.id) ?? 0;

        const bookActivity = book.updatedAt || book.createdAt || '';
        if (bookActivity && (!lastActivityAt || bookActivity > lastActivityAt)) {
          lastActivityAt = bookActivity;
        }
      }

      const ownedCount = sortedBooks.length;
      const expectedVolumes = attachedMetadata?.expectedVolumes;
      const missingVolumes = computeMissingVolumes(ownedVolumes, expectedVolumes);
      const totalTargetVolumes = Math.max(ownedCount + missingVolumes.length, expectedVolumes ?? 0);

      const progressPercent =
        totalPages > 0
          ? Math.round((readPages / totalPages) * 100)
          : ownedCount > 0
            ? Math.round((completedCount / ownedCount) * 100)
            : 0;

      const averageRating =
        ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : undefined;

      const timelineSlots = buildTimelineSlots(sortedBooks, missingVolumes);

      const nextBookToRead =
        sortedBooks.find((b) => b.status === 'reading') ??
        sortedBooks.find((b) => b.status === 'pending') ??
        null;

      const statusCategory: SagaAggregation['statusCategory'] =
        readingCount > 0 || (completedCount > 0 && completedCount < ownedCount)
          ? 'reading'
          : ownedCount > 0 && completedCount === ownedCount && missingVolumes.length === 0
            ? 'completed'
            : 'pending';

      const bentoScale = resolveSagaBentoScale(totalTargetVolumes);

      result.push({
        id: canonicalId,
        normalizedKey,
        name: canonicalName,
        authors,
        books: sortedBooks,
        timelineSlots,
        metadata: attachedMetadata,
        ownedCount,
        expectedVolumes,
        totalTargetVolumes,
        completedCount,
        readingCount,
        pendingCount,
        abandonedCount,
        missingVolumes,
        totalPages,
        readPages,
        progressPercent,
        averageRating,
        totalReadingMinutes,
        nextBookToRead,
        statusCategory,
        bentoScale,
        lastActivityAt: lastActivityAt || new Date(0).toISOString(),
      });
    }

    return result;
  });

  readonly existingSeriesOptions = computed<ExistingSeriesOption[]>(() => {
    const sagas = this.sagas();
    const metadataList = this.metadata();
    const options: ExistingSeriesOption[] = [];
    const seenKeys = new Set<string>();

    for (const saga of sagas) {
      seenKeys.add(saga.normalizedKey);
      const maxOwnedVolume = saga.books.reduce((max, book) => {
        const vol = book.series?.volumeNumber;
        return typeof vol === 'number' && Number.isInteger(vol) && vol > max ? vol : max;
      }, 0);

      options.push({
        id: saga.id,
        normalizedKey: saga.normalizedKey,
        name: saga.name,
        count: saga.ownedCount,
        nextVolumeNumber: maxOwnedVolume + 1,
      });
    }

    for (const meta of metadataList) {
      if (!seenKeys.has(meta.normalizedKey)) {
        seenKeys.add(meta.normalizedKey);
        options.push({
          id: meta.id,
          normalizedKey: meta.normalizedKey,
          name: meta.name,
          count: 0,
          nextVolumeNumber: 1,
        });
      }
    }

    return options.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  });

  readonly statusCounts = computed<SagaStatusCounts>(() => {
    const query = this.searchQuery();
    const candidateSagas = this.sagas().filter((saga) => matchesSagaSearch(saga, query));

    const counts: SagaStatusCounts = {
      all: candidateSagas.length,
      reading: 0,
      completed: 0,
      pending: 0,
      hasGaps: 0,
    };

    for (const saga of candidateSagas) {
      counts[saga.statusCategory]++;
      if (saga.missingVolumes.length > 0) {
        counts.hasGaps++;
      }
    }

    return counts;
  });

  readonly filteredSagas = computed<SagaAggregation[]>(() => {
    const query = this.searchQuery();
    const status = this.statusFilter();
    const sort = this.sortOption();

    const filtered = this.sagas().filter(
      (saga) => matchesSagaSearch(saga, query) && matchesSagaStatusFilter(saga, status)
    );

    return sortSagas(filtered, sort);
  });

  readonly hasActiveFilters = computed<boolean>(() => {
    return this.searchQuery().trim().length > 0 || this.statusFilter() !== 'all';
  });

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setStatusFilter(status: SagaFilterStatus): void {
    this.statusFilter.set(status);
  }

  setSortOption(sort: SagaSortOption): void {
    this.sortOption.set(sort);
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
  }

  async upsertSeriesMetadata(payload: UpsertSeriesMetadataPayload): Promise<SeriesMetadata> {
    await this.ensureInitialized();

    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      throw new Error('Series name cannot be empty.');
    }

    const targetNormalizedKey = normalizeSeriesKey(trimmedName);
    const lookupKeys = new Set<string>(
      [payload.normalizedKey, targetNormalizedKey].filter((k): k is string => Boolean(k))
    );

    const existing = this.metadata().find(
      (item) => (payload.id && item.id === payload.id) || lookupKeys.has(item.normalizedKey)
    );

    const matchingBooks = this.booksService.books().filter((book) => {
      const bookKey = normalizeSeriesKey(book.series?.name);
      return (
        (payload.id && book.series?.id === payload.id) ||
        (existing && book.series?.id === existing.id) ||
        (bookKey && lookupKeys.has(bookKey))
      );
    });

    const canonicalId =
      existing?.id ??
      payload.id ??
      matchingBooks.find((b) => b.series?.id)?.series?.id ??
      crypto.randomUUID();

    const now = new Date().toISOString();
    const expectedVolumes =
      payload.expectedVolumes === null
        ? undefined
        : typeof payload.expectedVolumes === 'number' &&
            Number.isInteger(payload.expectedVolumes) &&
            payload.expectedVolumes > 0
          ? payload.expectedVolumes
          : existing?.expectedVolumes;

    const publicationStatus =
      payload.publicationStatus === null
        ? undefined
        : payload.publicationStatus !== undefined
          ? payload.publicationStatus
          : existing?.publicationStatus;

    const notes =
      payload.notes === null
        ? undefined
        : typeof payload.notes === 'string'
          ? payload.notes.trim() || undefined
          : existing?.notes;

    const nextMetadata: SeriesMetadata = {
      id: canonicalId,
      normalizedKey: targetNormalizedKey,
      name: trimmedName,
      expectedVolumes,
      publicationStatus,
      notes,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await this.storage.set(this.storeName, nextMetadata);

    this.metadata.update((current) => {
      const filtered = current.filter(
        (item) =>
          item.id !== nextMetadata.id &&
          item.normalizedKey !== targetNormalizedKey &&
          (!payload.normalizedKey || item.normalizedKey !== payload.normalizedKey)
      );
      return [...filtered, nextMetadata];
    });

    // Propagate canonical name and id across all member books in a single batch if changed
    const modifiedBooks: Book[] = [];
    for (const book of matchingBooks) {
      if (book.series?.name !== trimmedName || book.series?.id !== canonicalId) {
        modifiedBooks.push({
          ...book,
          series: {
            ...book.series,
            id: canonicalId,
            name: trimmedName,
          },
          updatedAt: now,
        });
      }
    }

    if (modifiedBooks.length > 0) {
      await this.booksService.updateMany(modifiedBooks);
    }

    return nextMetadata;
  }

  async linkBooksToSeries(
    seriesName: string,
    bookIds: readonly string[],
    startingVolume?: number
  ): Promise<void> {
    await this.ensureInitialized();

    const trimmedName = seriesName.trim();
    if (!trimmedName || bookIds.length === 0) {
      return;
    }

    const normalizedKey = normalizeSeriesKey(trimmedName);
    const existingOption = this.existingSeriesOptions().find(
      (opt) => opt.normalizedKey === normalizedKey
    );
    const canonicalId = existingOption?.id ?? crypto.randomUUID();
    const canonicalName = existingOption?.name ?? trimmedName;

    let nextVolume =
      typeof startingVolume === 'number' && Number.isInteger(startingVolume) && startingVolume > 0
        ? startingVolume
        : (existingOption?.nextVolumeNumber ?? 1);

    const now = new Date().toISOString();
    const currentBooks = this.booksService.books();
    const modifiedBooks: Book[] = [];

    for (const bookId of bookIds) {
      const book = currentBooks.find((b) => b.id === bookId);
      if (!book) {
        continue;
      }

      modifiedBooks.push({
        ...book,
        series: {
          ...book.series,
          id: canonicalId,
          name: canonicalName,
          volumeNumber: nextVolume,
        },
        updatedAt: now,
      });
      nextVolume++;
    }

    if (modifiedBooks.length > 0) {
      await this.booksService.updateMany(modifiedBooks);
    }
  }

  async unlinkBookFromSeries(bookId: string): Promise<void> {
    await this.ensureInitialized();

    const book = this.booksService.books().find((b) => b.id === bookId);
    if (!book || !book.series) {
      return;
    }

    const updatedBook: Book = {
      ...book,
      series: undefined,
      updatedAt: new Date().toISOString(),
    };
    await this.booksService.update(book.id, updatedBook);
  }

  async updateBookVolumeNumber(bookId: string, volumeNumber?: number | null): Promise<void> {
    await this.ensureInitialized();

    const book = this.booksService.books().find((b) => b.id === bookId);
    if (!book || !book.series) {
      return;
    }

    const normalizedVolume =
      typeof volumeNumber === 'number' && Number.isInteger(volumeNumber) && volumeNumber > 0
        ? volumeNumber
        : undefined;

    const updatedBook: Book = {
      ...book,
      series: {
        ...book.series,
        volumeNumber: normalizedVolume,
      },
      updatedAt: new Date().toISOString(),
    };
    await this.booksService.update(book.id, updatedBook);
  }

  async replaceAllMetadata(items: SeriesMetadata[]): Promise<void> {
    await this.ensureInitialized();
    const persisted = await this.storage.replaceStore(this.storeName, items);
    if (!persisted) {
      throw new Error('Failed to persist replaced series metadata collection.');
    }
    this.metadata.set([...items]);
  }

  async clearAllMetadata(): Promise<void> {
    await this.ensureInitialized();
    await this.storage.clearStore(this.storeName);
    this.metadata.set([]);
  }
}
