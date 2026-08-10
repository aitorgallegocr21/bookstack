import { Injectable, signal } from '@angular/core';
import { ReadingLog } from '../models/book.model';
import { READING_LOGS_SEED } from '../data/reading-logs.seed';

@Injectable({ providedIn: 'root' })
export class ReadingLogService {
  readonly readingLogs = signal<ReadingLog[]>(READING_LOGS_SEED);

  getByBookId(bookId: string): ReadingLog[] {
    return this.readingLogs().filter((log) => log.bookId === bookId);
  }

  add(log: ReadingLog): void {
    this.readingLogs.update((current) => [...current, log]);
  }
}
