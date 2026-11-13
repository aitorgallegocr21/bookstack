import { Injectable, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Book, BookStatus, ReadingLog } from '../../books/models/book.model';
import { BooksService } from '../../books/services/books.service';
import { ReadingLogService } from '../../books/services/reading-log.service';
import { ReadingStatsService } from '../../books/services/reading-stats.service';
import { normalizeBookFormat, normalizeBookRating } from '../../books/utils/book-form.utils';
import {
  AnalyticsFormatKey,
  AnalyticsHighlights,
  AnalyticsKpiSummary,
  AnalyticsPeriodMode,
  AnalyticsTrendMetric,
  AnalyticsTrendPoint,
  AuthorRankItem,
  FormatDistributionItem,
  RatingDistributionSummary,
  StatusDistributionSummary,
  WeekdayKey,
  WeekdayPaceItem,
} from '../models/analytics.model';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_KEYS: readonly WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const FORMAT_KEYS: readonly AnalyticsFormatKey[] = ['physical', 'ebook', 'audiobook'];
const STATUS_ORDER: readonly BookStatus[] = ['completed', 'reading', 'pending', 'abandoned'];

interface HybridPageEntry {
  bookId: string;
  date: string;
  monthKey: string;
  year: number;
  pages: number;
}

interface ParsedLogEntry {
  log: ReadingLog;
  isoDate: string;
  monthKey: string;
  year: number;
}

interface PeriodWindow {
  mode: AnalyticsPeriodMode;
  targetYear: number;
  startMonthKey: string | null;
  endMonthKey: string | null;
  rollingMonths: string[];
  spanDays: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  private readonly readingStatsService = inject(ReadingStatsService);
  private readonly i18n = inject(I18nService);

  readonly referenceDate = signal<Date>(new Date());
  readonly periodMode = signal<AnalyticsPeriodMode>('current-year');
  readonly selectedYear = signal<number>(new Date().getFullYear());
  readonly trendMetric = signal<AnalyticsTrendMetric>('pages');

  readonly availableYears = computed<number[]>(() => {
    const years = new Set<number>([this.referenceDate().getFullYear()]);

    for (const book of this.booksService.books()) {
      for (const rawDate of [book.startDate, book.endDate, book.createdAt, book.updatedAt]) {
        const isoDate = this.extractIsoDate(rawDate);
        if (isoDate) {
          years.add(this.extractYearFromIso(isoDate));
        }
      }
    }

    for (const log of this.readingLogService.readingLogs()) {
      const isoDate = this.extractIsoDate(log.date);
      if (isoDate) {
        years.add(this.extractYearFromIso(isoDate));
      }
    }

    return Array.from(years).sort((a, b) => b - a);
  });

  private readonly periodWindow = computed<PeriodWindow>(() => {
    const mode = this.periodMode();
    const refDate = this.referenceDate();
    const refYear = refDate.getFullYear();

    if (mode === 'current-year') {
      const startOfYear = new Date(refYear, 0, 1);
      const spanDays = this.inclusiveDaysBetween(startOfYear, refDate);
      return {
        mode,
        targetYear: refYear,
        startMonthKey: `${refYear}-01`,
        endMonthKey: `${refYear}-12`,
        rollingMonths: [],
        spanDays,
      };
    }

    if (mode === 'specific-year') {
      const year = this.selectedYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = year === refYear ? refDate : new Date(year, 11, 31);
      const spanDays = year > refYear ? 1 : this.inclusiveDaysBetween(startOfYear, endOfYear);

      return {
        mode,
        targetYear: year,
        startMonthKey: `${year}-01`,
        endMonthKey: `${year}-12`,
        rollingMonths: [],
        spanDays,
      };
    }

    if (mode === 'last-12-months') {
      const rollingMonths: string[] = [];
      const startMonthDate = new Date(refYear, refDate.getMonth() - 11, 1);
      for (let offset = 11; offset >= 0; offset--) {
        const cursor = new Date(refYear, refDate.getMonth() - offset, 1);
        rollingMonths.push(this.formatMonthKey(cursor));
      }

      return {
        mode,
        targetYear: refYear,
        startMonthKey: rollingMonths[0],
        endMonthKey: rollingMonths[rollingMonths.length - 1],
        rollingMonths,
        spanDays: this.inclusiveDaysBetween(startMonthDate, refDate),
      };
    }

    return {
      mode: 'all-time',
      targetYear: refYear,
      startMonthKey: null,
      endMonthKey: null,
      rollingMonths: [],
      spanDays: 1,
    };
  });

  private readonly hybridDataset = computed(() => {
    const books = this.booksService.books();
    const logs = this.readingLogService.readingLogs();
    const window = this.periodWindow();
    const refDate = this.referenceDate();

    const parsedLogs: ParsedLogEntry[] = [];
    const loggedPagesByBook = new Map<string, number>();
    const allHybridEntries: HybridPageEntry[] = [];

    for (const log of logs) {
      const isoDate = this.extractIsoDate(log.date);
      if (!isoDate) {
        continue;
      }
      const monthKey = isoDate.slice(0, 7);
      const year = this.extractYearFromIso(isoDate);
      parsedLogs.push({ log, isoDate, monthKey, year });

      if (log.pagesRead > 0) {
        loggedPagesByBook.set(log.bookId, (loggedPagesByBook.get(log.bookId) ?? 0) + log.pagesRead);
        allHybridEntries.push({
          bookId: log.bookId,
          date: isoDate,
          monthKey,
          year,
          pages: log.pagesRead,
        });
      }
    }

    for (const book of books) {
      const effectivePages =
        book.status === 'completed' && book.currentPage === 0
          ? Math.max(book.totalPages, 0)
          : Math.max(book.currentPage, 0);
      const loggedForBook = loggedPagesByBook.get(book.id) ?? 0;

      if (effectivePages > loggedForBook) {
        const unloggedPages = effectivePages - loggedForBook;
        const fallbackIso = this.extractIsoDate(book.endDate || book.updatedAt || book.createdAt);
        if (fallbackIso) {
          allHybridEntries.push({
            bookId: book.id,
            date: fallbackIso,
            monthKey: fallbackIso.slice(0, 7),
            year: this.extractYearFromIso(fallbackIso),
            pages: unloggedPages,
          });
        }
      }
    }

    const periodEntries = allHybridEntries.filter((entry) =>
      this.isIsoDateInWindow(entry.monthKey, entry.year, window)
    );
    const periodLogs = parsedLogs.filter((entry) =>
      this.isIsoDateInWindow(entry.monthKey, entry.year, window)
    );

    const pagesByBookInPeriod = new Map<string, number>();
    const booksWithPeriodEntries = new Set<string>();
    for (const entry of periodEntries) {
      booksWithPeriodEntries.add(entry.bookId);
      pagesByBookInPeriod.set(
        entry.bookId,
        (pagesByBookInPeriod.get(entry.bookId) ?? 0) + entry.pages
      );
    }

    const completedBooksInPeriod: Array<{
      book: Book;
      completionIso: string;
      monthKey: string;
      year: number;
    }> = [];

    for (const book of books) {
      if (book.status !== 'completed') {
        continue;
      }
      const completionIso = this.extractIsoDate(book.endDate || book.updatedAt || book.createdAt);
      if (!completionIso) {
        continue;
      }
      const monthKey = completionIso.slice(0, 7);
      const year = this.extractYearFromIso(completionIso);
      if (this.isIsoDateInWindow(monthKey, year, window)) {
        completedBooksInPeriod.push({ book, completionIso, monthKey, year });
      }
    }

    const periodBooks =
      window.mode === 'all-time'
        ? books
        : books.filter((book) => {
            if (booksWithPeriodEntries.has(book.id)) {
              return true;
            }
            const anchorIso = this.extractIsoDate(this.getBookAnchorDate(book));
            if (!anchorIso) {
              return false;
            }
            return this.isIsoDateInWindow(
              anchorIso.slice(0, 7),
              this.extractYearFromIso(anchorIso),
              window
            );
          });

    let effectiveSpanDays = window.spanDays;
    if (window.mode === 'all-time') {
      const candidateDates: string[] = [];
      for (const entry of allHybridEntries) {
        candidateDates.push(entry.date);
      }
      for (const book of books) {
        const anchor = this.extractIsoDate(book.startDate || book.createdAt || book.updatedAt);
        if (anchor) {
          candidateDates.push(anchor);
        }
      }
      if (candidateDates.length > 0) {
        candidateDates.sort();
        const earliest = new Date(`${candidateDates[0]}T00:00:00`);
        effectiveSpanDays = this.inclusiveDaysBetween(earliest, refDate);
      }
    }

    return {
      allLogs: logs,
      periodEntries,
      periodLogs,
      completedBooksInPeriod,
      periodBooks,
      pagesByBookInPeriod,
      effectiveSpanDays,
    };
  });

  readonly kpiSummary = computed<AnalyticsKpiSummary>(() => {
    const {
      allLogs,
      periodEntries,
      periodLogs,
      completedBooksInPeriod,
      periodBooks,
      effectiveSpanDays,
    } = this.hybridDataset();

    const completedBooks = completedBooksInPeriod.length;
    const abandonedBooks = periodBooks.filter((book) => book.status === 'abandoned').length;
    const decidedCount = completedBooks + abandonedBooks;
    const completionRatePercent =
      decidedCount > 0 ? Math.round((completedBooks / decidedCount) * 100) : 0;

    const pagesRead = periodEntries.reduce((sum, entry) => sum + entry.pages, 0);
    const averagePagesPerDay =
      pagesRead > 0 ? Math.round((pagesRead / Math.max(1, effectiveSpanDays)) * 10) / 10 : 0;

    let totalTimeMinutes = 0;
    let timedPages = 0;
    let timedMinutes = 0;

    for (const { log } of periodLogs) {
      const minutes = Math.max(log.timeSpentMinutes ?? 0, 0);
      totalTimeMinutes += minutes;
      if (minutes > 0 && log.pagesRead > 0) {
        timedPages += log.pagesRead;
        timedMinutes += minutes;
      }
    }

    const averageSpeedPagesPerHour =
      timedMinutes > 0 ? Math.round((timedPages / timedMinutes) * 60) : 0;

    const activeDates = new Set<string>();
    for (const entry of periodEntries) {
      if (entry.pages > 0) {
        activeDates.add(entry.date);
      }
    }

    const streakInfo = this.readingStatsService.calculateStreakInfo(allLogs, this.referenceDate());

    return {
      completedBooks,
      completionRatePercent,
      pagesRead,
      averagePagesPerDay,
      totalTimeMinutes,
      averageSpeedPagesPerHour,
      activeDaysCount: activeDates.size,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
    };
  });

  readonly trendPoints = computed<AnalyticsTrendPoint[]>(() => {
    const window = this.periodWindow();
    const years = this.availableYears();
    const locale = this.i18n.intlLocale();
    const { periodEntries, periodLogs, completedBooksInPeriod } = this.hybridDataset();

    if (window.mode === 'all-time' && years.length > 1) {
      const minYear = years[years.length - 1];
      const maxYear = years[0];
      const buckets = new Map<string, AnalyticsTrendPoint>();

      for (let year = minYear; year <= maxYear; year++) {
        const key = String(year);
        buckets.set(key, { key, label: key, pages: 0, books: 0, timeMinutes: 0 });
      }

      for (const entry of periodEntries) {
        const bucket = buckets.get(String(entry.year));
        if (bucket) {
          bucket.pages += entry.pages;
        }
      }

      for (const item of completedBooksInPeriod) {
        const bucket = buckets.get(String(item.year));
        if (bucket) {
          bucket.books += 1;
        }
      }

      for (const entry of periodLogs) {
        const bucket = buckets.get(String(entry.year));
        if (bucket) {
          bucket.timeMinutes += Math.max(entry.log.timeSpentMinutes ?? 0, 0);
        }
      }

      return Array.from(buckets.values());
    }

    const monthKeys =
      window.mode === 'last-12-months'
        ? window.rollingMonths
        : this.buildYearMonthKeys(
            window.mode === 'all-time' ? (years[0] ?? window.targetYear) : window.targetYear
          );

    const buckets = new Map<string, AnalyticsTrendPoint>();
    for (const monthKey of monthKeys) {
      buckets.set(monthKey, {
        key: monthKey,
        label: this.formatShortMonth(monthKey, locale),
        pages: 0,
        books: 0,
        timeMinutes: 0,
      });
    }

    for (const entry of periodEntries) {
      const bucket = buckets.get(entry.monthKey);
      if (bucket) {
        bucket.pages += entry.pages;
      }
    }

    for (const item of completedBooksInPeriod) {
      const bucket = buckets.get(item.monthKey);
      if (bucket) {
        bucket.books += 1;
      }
    }

    for (const entry of periodLogs) {
      const bucket = buckets.get(entry.monthKey);
      if (bucket) {
        bucket.timeMinutes += Math.max(entry.log.timeSpentMinutes ?? 0, 0);
      }
    }

    return Array.from(buckets.values());
  });

  readonly formatDistribution = computed<FormatDistributionItem[]>(() => {
    const { periodBooks, pagesByBookInPeriod } = this.hybridDataset();
    const totalBooks = periodBooks.length;

    const totals = new Map<AnalyticsFormatKey, { count: number; pages: number }>();
    for (const key of FORMAT_KEYS) {
      totals.set(key, { count: 0, pages: 0 });
    }

    for (const book of periodBooks) {
      const formatKey = this.mapFormatKey(book.format);
      const bucket = totals.get(formatKey)!;
      bucket.count += 1;
      bucket.pages += pagesByBookInPeriod.get(book.id) ?? 0;
    }

    return FORMAT_KEYS.map((formatKey) => {
      const data = totals.get(formatKey)!;
      return {
        formatKey,
        count: data.count,
        percentage: totalBooks > 0 ? Math.round((data.count / totalBooks) * 100) : 0,
        pages: data.pages,
      };
    });
  });

  readonly statusDistribution = computed<StatusDistributionSummary>(() => {
    const { periodBooks } = this.hybridDataset();
    const totalBooks = periodBooks.length;

    const counts = new Map<BookStatus, number>();
    for (const status of STATUS_ORDER) {
      counts.set(status, 0);
    }

    for (const book of periodBooks) {
      counts.set(book.status, (counts.get(book.status) ?? 0) + 1);
    }

    const items = STATUS_ORDER.map((status) => {
      const count = counts.get(status) ?? 0;
      return {
        status,
        count,
        percentage: totalBooks > 0 ? Math.round((count / totalBooks) * 100) : 0,
      };
    });

    const completed = counts.get('completed') ?? 0;
    const abandoned = counts.get('abandoned') ?? 0;
    const decided = completed + abandoned;

    const completionRatePercent = decided > 0 ? Math.round((completed / decided) * 100) : 0;
    const abandonmentRatePercent = decided > 0 ? 100 - completionRatePercent : 0;

    return {
      items,
      completionRatePercent,
      abandonmentRatePercent,
    };
  });

  readonly ratingDistribution = computed<RatingDistributionSummary>(() => {
    const { periodBooks } = this.hybridDataset();
    const ratedScores: number[] = [];

    for (const book of periodBooks) {
      const normalized = normalizeBookRating(book.rating);
      if (normalized !== undefined && normalized > 0) {
        ratedScores.push(normalized);
      }
    }

    const ratedBooksCount = ratedScores.length;
    const averageRating =
      ratedBooksCount > 0
        ? Math.round((ratedScores.reduce((sum, score) => sum + score, 0) / ratedBooksCount) * 10) /
          10
        : 0;

    const bucketDefs = [
      { label: '9–10', min: 9, max: 10, matches: (score: number) => score >= 9 },
      {
        label: '7–8.5',
        min: 7,
        max: 8.5,
        matches: (score: number) => score >= 7 && score < 9,
      },
      {
        label: '5–6.5',
        min: 5,
        max: 6.5,
        matches: (score: number) => score >= 5 && score < 7,
      },
      { label: '< 5', min: 0, max: 4.5, matches: (score: number) => score > 0 && score < 5 },
    ];

    const buckets = bucketDefs.map((def) => {
      const count = ratedScores.filter(def.matches).length;
      return {
        label: def.label,
        min: def.min,
        max: def.max,
        count,
        percentage: ratedBooksCount > 0 ? Math.round((count / ratedBooksCount) * 100) : 0,
      };
    });

    return {
      averageRating,
      ratedBooksCount,
      buckets,
    };
  });

  readonly topAuthors = computed<AuthorRankItem[]>(() => {
    const { periodBooks, pagesByBookInPeriod } = this.hybridDataset();
    const authorsMap = new Map<string, AuthorRankItem>();

    for (const book of periodBooks) {
      const authorName = book.author.trim();
      if (!authorName) {
        continue;
      }
      const existing = authorsMap.get(authorName);
      const bookPages = pagesByBookInPeriod.get(book.id) ?? 0;

      if (existing) {
        existing.booksCount += 1;
        existing.pagesRead += bookPages;
      } else {
        authorsMap.set(authorName, {
          author: authorName,
          booksCount: 1,
          pagesRead: bookPages,
        });
      }
    }

    return Array.from(authorsMap.values())
      .sort((a, b) => {
        if (b.booksCount !== a.booksCount) {
          return b.booksCount - a.booksCount;
        }
        if (b.pagesRead !== a.pagesRead) {
          return b.pagesRead - a.pagesRead;
        }
        return a.author.localeCompare(b.author);
      })
      .slice(0, 5);
  });

  readonly weekdayPace = computed<WeekdayPaceItem[]>(() => {
    const { periodLogs } = this.hybridDataset();
    const totals = WEEKDAY_KEYS.map(() => ({ pages: 0, sessionsCount: 0 }));

    for (const { log, isoDate } of periodLogs) {
      if (log.pagesRead <= 0) {
        continue;
      }
      const date = new Date(`${isoDate}T00:00:00`);
      if (Number.isNaN(date.getTime())) {
        continue;
      }
      const jsDay = date.getDay();
      const index = jsDay === 0 ? 6 : jsDay - 1;
      totals[index].pages += log.pagesRead;
      totals[index].sessionsCount += 1;
    }

    const maxPages = Math.max(...totals.map((item) => item.pages), 0);
    let peakAssigned = false;

    return WEEKDAY_KEYS.map((dayKey, index) => {
      const { pages, sessionsCount } = totals[index];
      const isPeakDay = maxPages > 0 && pages === maxPages && !peakAssigned;
      if (isPeakDay) {
        peakAssigned = true;
      }

      return {
        dayKey,
        pages,
        sessionsCount,
        percentageOfPeak: maxPages > 0 ? Math.round((pages / maxPages) * 100) : 0,
        isPeakDay,
      };
    });
  });

  readonly highlights = computed<AnalyticsHighlights>(() => {
    const { periodEntries, completedBooksInPeriod, periodBooks } = this.hybridDataset();

    const pagesByDate = new Map<string, number>();
    for (const entry of periodEntries) {
      if (entry.pages > 0) {
        pagesByDate.set(entry.date, (pagesByDate.get(entry.date) ?? 0) + entry.pages);
      }
    }

    let bestDay: AnalyticsHighlights['bestDay'] = null;
    for (const [date, pages] of pagesByDate.entries()) {
      if (
        !bestDay ||
        pages > bestDay.pages ||
        (pages === bestDay.pages && date.localeCompare(bestDay.date) > 0)
      ) {
        bestDay = { date, pages };
      }
    }

    let longestBookCompleted: AnalyticsHighlights['longestBookCompleted'] = null;
    let durationDaysSum = 0;
    let durationBooksCount = 0;

    for (const { book } of completedBooksInPeriod) {
      if (
        book.totalPages > 0 &&
        (!longestBookCompleted || book.totalPages > longestBookCompleted.pages)
      ) {
        longestBookCompleted = {
          title: book.title,
          author: book.author,
          pages: book.totalPages,
        };
      }

      const startIso = this.extractIsoDate(book.startDate);
      const endIso = this.extractIsoDate(book.endDate);
      if (startIso && endIso) {
        const startMs = new Date(`${startIso}T00:00:00`).getTime();
        const endMs = new Date(`${endIso}T00:00:00`).getTime();
        if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
          const days = Math.max(1, Math.round((endMs - startMs) / MS_PER_DAY));
          durationDaysSum += days;
          durationBooksCount += 1;
        }
      }
    }

    const averageDaysToFinishBook =
      durationBooksCount > 0 ? Math.round((durationDaysSum / durationBooksCount) * 10) / 10 : null;

    let topRatedBook: AnalyticsHighlights['topRatedBook'] = null;
    let topRatedPageCount = -1;

    for (const book of periodBooks) {
      const rating = normalizeBookRating(book.rating);
      if (rating === undefined || rating <= 0) {
        continue;
      }

      if (
        !topRatedBook ||
        rating > topRatedBook.rating ||
        (rating === topRatedBook.rating && book.totalPages > topRatedPageCount)
      ) {
        topRatedBook = {
          title: book.title,
          author: book.author,
          rating,
        };
        topRatedPageCount = book.totalPages;
      }
    }

    return {
      bestDay,
      longestBookCompleted,
      averageDaysToFinishBook,
      topRatedBook,
    };
  });

  setReferenceDate(date: Date): void {
    const nextDate = new Date(date.getTime());
    this.referenceDate.set(nextDate);
    if (this.periodMode() === 'current-year') {
      this.selectedYear.set(nextDate.getFullYear());
    }
  }

  setPeriodMode(mode: AnalyticsPeriodMode): void {
    this.periodMode.set(mode);
    if (mode === 'current-year') {
      this.selectedYear.set(this.referenceDate().getFullYear());
    }
  }

  selectYear(year: number): void {
    this.selectedYear.set(year);
    this.periodMode.set('specific-year');
  }

  setTrendMetric(metric: AnalyticsTrendMetric): void {
    this.trendMetric.set(metric);
  }

  private isIsoDateInWindow(monthKey: string, year: number, window: PeriodWindow): boolean {
    if (window.mode === 'all-time') {
      return true;
    }
    if (window.mode === 'current-year' || window.mode === 'specific-year') {
      return year === window.targetYear;
    }
    if (!window.startMonthKey || !window.endMonthKey) {
      return false;
    }
    return monthKey >= window.startMonthKey && monthKey <= window.endMonthKey;
  }

  private getBookAnchorDate(book: Book): string | undefined {
    if (book.status === 'completed' || book.status === 'abandoned') {
      return book.endDate || book.updatedAt || book.createdAt;
    }
    return book.updatedAt || book.startDate || book.createdAt;
  }

  private mapFormatKey(format: Book['format']): AnalyticsFormatKey {
    const normalized = normalizeBookFormat(format).toLowerCase();
    if (normalized === 'ebook' || normalized === 'e-book' || normalized === 'digital') {
      return 'ebook';
    }
    if (normalized === 'audiolibro' || normalized === 'audiobook') {
      return 'audiobook';
    }
    return 'physical';
  }

  private buildYearMonthKeys(year: number): string[] {
    return Array.from({ length: 12 }, (_, idx) => `${year}-${String(idx + 1).padStart(2, '0')}`);
  }

  private formatShortMonth(monthKey: string, locale: string): string {
    const date = new Date(`${monthKey}-01T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      return monthKey;
    }
    const raw = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(date);
    const cleaned = raw.replace(/\.$/, '');
    return `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
  }

  private formatMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private inclusiveDaysBetween(start: Date, end: Date): number {
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diff = Math.round((endDay.getTime() - startDay.getTime()) / MS_PER_DAY) + 1;
    return Math.max(1, diff);
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
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return null;
  }

  private extractYearFromIso(isoDate: string): number {
    return parseInt(isoDate.slice(0, 4), 10);
  }
}
