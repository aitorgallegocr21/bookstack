import { Injectable, inject, signal } from '@angular/core';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { ReadingLog } from '../models/book.model';
import { parseStoredReadingLogs } from '../schemas/book.schema';
import { BooksService } from './books.service';

@Injectable({ providedIn: 'root' })
export class ReadingLogService {
  private readonly storage = inject(StorageAdapterService);
  private readonly booksService = inject(BooksService);
  private readonly storeName = 'readingLogs';
  private initPromise: Promise<void> | null = null;

  readonly readingLogs = signal<ReadingLog[]>([]);

  constructor() {
    void this.ensureInitialized();
  }

  private ensureInitialized(): Promise<void> {
    this.initPromise ??= this.storage
      .getAll<unknown>(this.storeName)
      .then((storedLogs) => {
        this.readingLogs.set(parseStoredReadingLogs(storedLogs));
      })
      .catch((error: unknown) => {
        console.error('[ReadingLogService] Failed to initialize reading logs:', error);
        this.readingLogs.set([]);
      });
    return this.initPromise;
  }

  async getAll(): Promise<ReadingLog[]> {
    await this.ensureInitialized();
    return this.readingLogs();
  }

  async getById(id: string): Promise<ReadingLog | undefined> {
    await this.ensureInitialized();
    return this.readingLogs().find((log) => log.id === id);
  }

  async getByBookId(bookId: string): Promise<ReadingLog[]> {
    await this.ensureInitialized();
    return this.readingLogs().filter((log) => log.bookId === bookId);
  }

  async add(log: ReadingLog): Promise<void> {
    await this.ensureInitialized();
    await this.storage.set(this.storeName, log);
    this.readingLogs.update((current) => [...current, log]);
    await this.booksService.applyReadingDelta(log.bookId, log.pagesRead);
  }

  async update(id: string, updatedLog: ReadingLog): Promise<void> {
    await this.ensureInitialized();
    const previousLog = this.readingLogs().find((log) => log.id === id);
    await this.storage.set(this.storeName, updatedLog);
    this.readingLogs.update((current) => current.map((log) => (log.id === id ? updatedLog : log)));

    if (previousLog) {
      if (previousLog.bookId === updatedLog.bookId) {
        await this.booksService.applyReadingDelta(
          updatedLog.bookId,
          updatedLog.pagesRead - previousLog.pagesRead
        );
      } else {
        await this.booksService.applyReadingDelta(previousLog.bookId, -previousLog.pagesRead);
        await this.booksService.applyReadingDelta(updatedLog.bookId, updatedLog.pagesRead);
      }
    }
  }

  async remove(id: string): Promise<void> {
    await this.ensureInitialized();
    const log = this.readingLogs().find((currentLog) => currentLog.id === id);
    await this.storage.remove(this.storeName, id);
    this.readingLogs.update((current) => current.filter((l) => l.id !== id));
    if (log) {
      await this.booksService.applyReadingDelta(log.bookId, -log.pagesRead);
    }
  }
}
