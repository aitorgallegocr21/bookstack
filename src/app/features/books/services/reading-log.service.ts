import { Injectable, signal } from '@angular/core';
import { ReadingLog } from '../models/book.model';
import { READING_LOGS_SEED } from '../data/reading-logs.seed';

@Injectable({ providedIn: 'root' })
export class ReadingLogService {
  private readonly storageKey = 'bookstack.reading-logs';

  readonly readingLogs = signal<ReadingLog[]>(this.loadReadingLogs());

  getAll(): ReadingLog[] {
    return this.readingLogs();
  }

  getById(id: string): ReadingLog | undefined {
    return this.readingLogs().find((log) => log.id === id);
  }

  getByBookId(bookId: string): ReadingLog[] {
    return this.readingLogs().filter((log) => log.bookId === bookId);
  }

  add(log: ReadingLog): void {
    this.readingLogs.update((current) => {
      const next = [...current, log];
      this.persistReadingLogs(next);
      return next;
    });
  }

  update(id: string, updatedLog: ReadingLog): void {
    this.readingLogs.update((current) => {
      const next = current.map((log) => (log.id === id ? updatedLog : log));
      this.persistReadingLogs(next);
      return next;
    });
  }

  remove(id: string): void {
    this.readingLogs.update((current) => {
      const next = current.filter((log) => log.id !== id);
      this.persistReadingLogs(next);
      return next;
    });
  }

  private loadReadingLogs(): ReadingLog[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return READING_LOGS_SEED;
    }

    const rawValue = window.localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return READING_LOGS_SEED;
    }

    try {
      const parsed = JSON.parse(rawValue) as ReadingLog[];
      return parsed;
    } catch {
      return READING_LOGS_SEED;
    }
  }

  private persistReadingLogs(readingLogs: ReadingLog[]): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(readingLogs));
  }
}
