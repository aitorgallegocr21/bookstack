import { Injectable, signal } from '@angular/core';
import { from } from 'rxjs';
import { ReadingLog } from '../models/book.model';
import { BooksService } from './books.service';
import { StorageAdapterService } from './storage-adapter.service';

@Injectable({ providedIn: 'root' })
export class ReadingLogService {
  private readonly storeName = 'readingLogs';
  private initPromise: Promise<void> | null = null;

  readonly readingLogs = signal<ReadingLog[]>([]);

  constructor(
    private readonly storage: StorageAdapterService,
    private readonly booksService: BooksService
  ) {
    this.initDataStream();
  }

  private initDataStream(): void {
    from(this.storage.getAll<ReadingLog>(this.storeName)).subscribe({
      next: (storedLogs) => this.readingLogs.set(storedLogs),
      error: (error) => {
        console.error('Error inicializando los registros de lectura:', error);
        this.readingLogs.set([]);
      }
    });
  }

  private ensureInitialized(): Promise<void> {
    this.initPromise ??= this.storage
      .getAll<ReadingLog>(this.storeName)
      .then((storedLogs) => {
        this.readingLogs.set(storedLogs);
      })
      .catch((error) => {
        console.error('Error inicializando los registros de lectura:', error);
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
    this.readingLogs.update((current) =>
      current.map((log) => (log.id === id ? updatedLog : log))
    );

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
    this.readingLogs.update((current) => current.filter((log) => log.id !== id));
    if (log) {
      await this.booksService.applyReadingDelta(log.bookId, -log.pagesRead);
    }
  }
}
