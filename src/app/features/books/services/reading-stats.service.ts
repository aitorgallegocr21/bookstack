import { Injectable, inject, computed, signal } from '@angular/core';
import {
  ReadingStats,
  BookStatus,
  Book,
  ReadingLog,
  ReadingGoals,
  StreakInfo,
  AnnualProgress,
  DayActivity,
} from '../models/book.model';
import { BooksService } from './books.service';
import { ReadingLogService } from './reading-log.service';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { parseStoredReadingGoals } from '../schemas/reading-goals.schema';

@Injectable({ providedIn: 'root' })
export class ReadingStatsService {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  private readonly storageAdapter = inject(StorageAdapterService);

  readonly goals = signal<ReadingGoals>(
    parseStoredReadingGoals(this.storageAdapter.getReadingGoals())
  );

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

    const daysFromStart =
      startDates.length > 0 ? Math.max(1, this.calculateDaySpan(startDates)) : 1;

    const averagePagesPerDay = Math.round(totalPagesRead / daysFromStart);

    const totalPagesLogged = logs.reduce((total, log) => total + log.pagesRead, 0);
    const totalMinutesLogged = logs.reduce((total, log) => total + (log.timeSpentMinutes ?? 0), 0);
    const averageReadingSpeedPagesPerHour =
      totalMinutesLogged > 0 ? Math.round((totalPagesLogged / totalMinutesLogged) * 60) : 0;

    const monthlyPages = this.calculateMonthlyPages(logs);
    const statusDistribution = this.calculateStatusDistribution(books);
    const streakInfo = this.calculateStreakInfo(logs);
    const annualProgress = this.calculateAnnualProgress(books, logs);

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
      statusDistribution,
      streakInfo,
      annualProgress,
    };
  });

  getStats(): ReadingStats {
    return this.stats();
  }

  saveGoals(newGoals: ReadingGoals): boolean {
    const parsed = parseStoredReadingGoals(newGoals, newGoals.year);
    const success = this.storageAdapter.saveReadingGoals(parsed);
    if (success) {
      this.goals.set(parsed);
    }
    return success;
  }

  calculateStreakInfo(logs: ReadingLog[], referenceDate = new Date()): StreakInfo {
    const validLogs = logs.filter((log) => log.pagesRead > 0);
    const activeDatesSet = new Set<string>();

    for (const log of validLogs) {
      const dateStr = this.extractIsoDate(log.date);
      if (dateStr) {
        activeDatesSet.add(dateStr);
      }
    }

    const todayStr = this.formatLocalDate(referenceDate);
    const hasReadToday = activeDatesSet.has(todayStr);

    const yesterday = new Date(referenceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = this.formatLocalDate(yesterday);
    const hasReadYesterday = activeDatesSet.has(yesterdayStr);

    let currentStreak = 0;

    if (hasReadToday) {
      currentStreak = 1;
      const cursor = new Date(referenceDate);
      while (true) {
        cursor.setDate(cursor.getDate() - 1);
        const cursorStr = this.formatLocalDate(cursor);
        if (activeDatesSet.has(cursorStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else if (hasReadYesterday) {
      // Grace period: today has no logs yet, but streak from yesterday is active
      currentStreak = 1;
      const cursor = new Date(yesterday);
      while (true) {
        cursor.setDate(cursor.getDate() - 1);
        const cursorStr = this.formatLocalDate(cursor);
        if (activeDatesSet.has(cursorStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    const longestStreak = this.calculateLongestStreak(activeDatesSet);
    const weeklyActivity = this.calculateWeeklyActivity(activeDatesSet, referenceDate, todayStr);

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      hasReadToday,
      weeklyActivity,
    };
  }

  calculateAnnualProgress(
    books: Book[],
    logs: ReadingLog[],
    referenceDate = new Date()
  ): AnnualProgress {
    const currentYear = referenceDate.getFullYear();

    const completedBooks = books.filter((book) => {
      if (book.status !== 'completed') {
        return false;
      }
      const rawDate = book.endDate || book.updatedAt || book.createdAt;
      const year = this.extractYear(rawDate);
      return year === currentYear;
    }).length;

    const pagesRead = logs.reduce((total, log) => {
      if (log.pagesRead <= 0) {
        return total;
      }
      const year = this.extractYear(log.date);
      return year === currentYear ? total + log.pagesRead : total;
    }, 0);

    return {
      year: currentYear,
      completedBooks,
      pagesRead,
    };
  }

  private calculateLongestStreak(datesSet: Set<string>): number {
    if (datesSet.size === 0) {
      return 0;
    }

    const sortedDates = Array.from(datesSet).sort();
    let maxStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        currentRun++;
        if (currentRun > maxStreak) {
          maxStreak = currentRun;
        }
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }

    return maxStreak;
  }

  private calculateWeeklyActivity(
    datesSet: Set<string>,
    referenceDate: Date,
    todayStr: string
  ): DayActivity[] {
    const dayOfWeek = referenceDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(referenceDate);
    monday.setDate(referenceDate.getDate() + diffToMonday);

    const dayKeys: DayActivity['dayKey'][] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    return dayKeys.map((dayKey, index) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + index);
      const dateStr = this.formatLocalDate(dayDate);

      return {
        dayIndex: index,
        dayKey,
        date: dateStr,
        active: datesSet.has(dateStr),
        isToday: dateStr === todayStr,
      };
    });
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

  private calculateMonthlyPages(
    logs: Array<{ date: string; pagesRead: number }>
  ): Array<{ month: string; pages: number }> {
    const result = new Map<string, number>();

    for (const log of logs) {
      const date = new Date(log.date);
      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      result.set(key, (result.get(key) ?? 0) + log.pagesRead);
    }

    return Array.from(result.entries())
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .map(([month, pages]) => ({
        month,
        pages,
      }));
  }

  private calculateStatusDistribution(
    books: Array<{ status: BookStatus }>
  ): Array<{ status: BookStatus; count: number }> {
    return ['pending', 'reading', 'completed', 'abandoned'].map((status) => ({
      status: status as BookStatus,
      count: books.filter((book) => book.status === status).length,
    }));
  }

  private extractIsoDate(rawDate?: string): string | null {
    if (!rawDate) {
      return null;
    }
    const match = rawDate.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return this.formatLocalDate(parsed);
    }
    return null;
  }

  private extractYear(rawDate?: string): number | null {
    if (!rawDate) {
      return null;
    }
    const match = rawDate.match(/^(\d{4})/);
    if (match) {
      return parseInt(match[1], 10);
    }
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getFullYear();
    }
    return null;
  }

  private formatLocalDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
