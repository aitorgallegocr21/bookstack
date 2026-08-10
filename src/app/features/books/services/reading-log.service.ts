import { Injectable, signal } from '@angular/core';
import { ReadingLog } from '../models/book.model';
import { READING_LOGS_SEED } from '../data/reading-logs.seed';
import { StorageAdapterService } from './storage-adapter.service';

@Injectable({ providedIn: 'root' })
export class ReadingLogService {
  private readonly storeName = 'readingLogs';

  readonly readingLogs = signal<ReadingLog[]>([]);

  constructor(private storage: StorageAdapterService) {
    this.initReadingLogs();
  }

  private async initReadingLogs(): Promise<void> {
    const storedLogs = await this.storage.getAll<ReadingLog>(this.storeName);
    if (storedLogs.length === 0) {
      for (const log of READING_LOGS_SEED) {
        await this.storage.set(this.storeName, log);
      }
      this.readingLogs.set(READING_LOGS_SEED);
    } else {
      this.readingLogs.set(storedLogs);
    }
  }

  getAll(): ReadingLog[] {
    return this.readingLogs();
  }

  getById(id: string): ReadingLog | undefined {
    return this.readingLogs().find((log) => log.id === id);
  }

  getByBookId(bookId: string): ReadingLog[] {
    return this.readingLogs().filter((log) => log.bookId === bookId);
  }

  async add(log: ReadingLog): Promise<void> {
    await this.storage.set(this.storeName, log);
    this.readingLogs.update((current) => [...current, log]);
  }

  async update(id: string, updatedLog: ReadingLog): Promise<void> {
    await this.storage.set(this.storeName, updatedLog);
    this.readingLogs.update((current) =>
      current.map((log) => (log.id === id ? updatedLog : log))
    );
  }

  async remove(id: string): Promise<void> {
    await this.storage.remove(this.storeName, id);
    this.readingLogs.update((current) => current.filter((log) => log.id !== id));
  }
}
