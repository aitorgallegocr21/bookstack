import { Injectable, inject, computed } from '@angular/core';
import { ReadingStats, BookStatus } from '../models/book.model';
import { BooksService } from './books.service';
import { ReadingLogService } from './reading-log.service';

@Injectable({ providedIn: 'root' })
export class ReadingStatsService {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);

  readonly stats = computed<ReadingStats>(() => {
    const books = this.booksService.books();
    const logs = this.readingLogService.readingLogs();

    const totalBooks = books.length;
    const completedBooks = books.filter((book) => book.status === 'completed').length;
    const readingBooks = books.filter((book) => book.status === 'reading').length;
    const pendingBooks = books.filter((book) => book.status === 'pending').length;

    const totalPagesRead = books.reduce((total, book) => total + Math.max(book.currentPage, 0), 0);
    const totalTimeSpentMinutes = logs.reduce(
      (total, log) => total + (log.timeSpentMinutes ?? 0),
      0
    );

    const startDates = books
      .map((book) => book.startDate)
      .filter((date): date is string => Boolean(date));

    const daysFromStart = startDates.length > 0
      ? Math.max(1, this.calculateDaySpan(startDates))
      : 1;

    const averagePagesPerDay = Math.round(totalPagesRead / daysFromStart);

    const totalPagesLogged = logs.reduce((total, log) => total + log.pagesRead, 0);
    const totalMinutesLogged = logs.reduce((total, log) => total + (log.timeSpentMinutes ?? 0), 0);
    const averageReadingSpeedPagesPerHour = totalMinutesLogged > 0
      ? Math.round((totalPagesLogged / totalMinutesLogged) * 60)
      : 0;

    const monthlyPages = this.calculateMonthlyPages(logs);
    const statusDistribution = this.calculateStatusDistribution(books);

    return {
      totalBooks,
      completedBooks,
      readingBooks,
      pendingBooks,
      totalPagesRead,
      totalTimeSpentMinutes,
      averagePagesPerDay,
      averageReadingSpeedPagesPerHour,
      monthlyPages,
      statusDistribution
    };
  });

  getStats(): ReadingStats {
    return this.stats();
  }

  private calculateDaySpan(startDates: string[]): number {
    if (startDates.length === 0) {
      return 1;
    }

    const parsedDates = startDates
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()));

    if (parsedDates.length === 0) {
      return 1;
    }

    const earliest = new Date(Math.min(...parsedDates.map((date) => date.getTime())));
    const today = new Date();
    const msInDay = 24 * 60 * 60 * 1000;

    return Math.max(1, Math.round((today.getTime() - earliest.getTime()) / msInDay));
  }

  private calculateMonthlyPages(logs: Array<{ date: string; pagesRead: number }>): Array<{ month: string; pages: number }> {
    const result = new Map<string, number>();

    for (const log of logs) {
      const date = new Date(log.date);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      result.set(key, (result.get(key) ?? 0) + log.pagesRead);
    }

    return Array.from(result.entries()).map(([month, pages]) => ({
      month,
      pages
    }));
  }

  private calculateStatusDistribution(books: Array<{ status: BookStatus }>): Array<{ status: BookStatus; count: number }> {
    return ['pending', 'reading', 'completed', 'abandoned'].map((status) => ({
      status: status as BookStatus,
      count: books.filter((book) => book.status === status).length
    }));
  }
}
