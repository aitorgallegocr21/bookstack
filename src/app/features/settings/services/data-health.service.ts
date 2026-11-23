import { computed, inject, Injectable } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Book, ReadingLog } from '../../books/models/book.model';
import { BooksService } from '../../books/services/books.service';
import { ReadingLogService } from '../../books/services/reading-log.service';
import { normalizeIsbn } from '../../books/utils/isbn.utils';
import {
  extractYearFromIsoPrefix,
  isValidPublicationYear,
  isValidReadingActivityYear,
  suggestCorrectedYear,
} from '../../books/utils/temporal-bounds.utils';
import { SeriesService } from '../../series/services/series.service';
import { normalizeSeriesKey } from '../../series/utils/series.utils';
import {
  DataHealthIssue,
  DataHealthIssueCategory,
  DataHealthReport,
} from '../models/data-health.model';

function interpolate(template: string, params: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

function replaceIsoYearPrefix(rawDate: string, correctedYear: number): string {
  const paddedYear = String(correctedYear).padStart(4, '0');
  return `${paddedYear}${rawDate.slice(4)}`;
}

function normalizeBookText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function scoreBookCompleteness(book: Book): number {
  let score = 0;
  if (book.coverUrl?.trim()) score += 3;
  if (book.totalPages > 1) score += 2;
  if (normalizeIsbn(book.isbn ?? '')) score += 2;
  if (book.publicationYear) score += 1;
  if (book.publisher?.trim()) score += 1;
  if (book.series?.name?.trim()) score += 1;
  score += Math.min(0.99, Math.max(0, book.currentPage) / 10000);
  return score;
}

function pickCanonicalSagaName(books: Book[], existingMetadataName?: string): string {
  const trimmedMeta = existingMetadataName?.trim();
  if (trimmedMeta) {
    return trimmedMeta;
  }

  const frequency = new Map<string, number>();
  for (const book of books) {
    const trimmed = book.series?.name?.trim();
    if (!trimmed) {
      continue;
    }
    frequency.set(trimmed, (frequency.get(trimmed) ?? 0) + 1);
  }

  let bestName = '';
  let bestCount = -1;
  for (const [name, count] of frequency.entries()) {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  }
  return bestName;
}

function computeHealthScore(issues: DataHealthIssue[]): number {
  if (issues.length === 0) {
    return 100;
  }

  let penalty = 0;
  for (const issue of issues) {
    switch (issue.severity) {
      case 'high':
        penalty += 15;
        break;
      case 'medium':
        penalty += 8;
        break;
      case 'low':
        penalty += 4;
        break;
    }
  }

  return Math.max(0, Math.min(99, 100 - penalty));
}

@Injectable({ providedIn: 'root' })
export class DataHealthService {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  private readonly seriesService = inject(SeriesService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly i18n = inject(I18nService);

  readonly report = computed<DataHealthReport>(() => {
    const books = this.booksService.books();
    const logs = this.readingLogService.readingLogs();
    const seriesMetadata = this.seriesService.metadata();
    const t = this.i18n.t().settings.dataHealth;

    const booksById = new Map<string, Book>(books.map((book) => [book.id, book]));
    const metadataByKey = new Map(seriesMetadata.map((item) => [item.normalizedKey, item]));

    const issuesByCategory: Record<DataHealthIssueCategory, DataHealthIssue[]> = {
      'temporal-anomaly': [],
      'progress-mismatch': [],
      'duplicate-book': [],
      'fragmented-saga': [],
    };

    this.collectBookIssues(books, t, issuesByCategory);
    this.collectReadingLogIssues(logs, booksById, t, issuesByCategory['temporal-anomaly']);
    this.collectDuplicateBookIssues(books, t, issuesByCategory['duplicate-book']);
    this.collectFragmentedSagaIssues(books, metadataByKey, t, issuesByCategory['fragmented-saga']);

    const allIssues: DataHealthIssue[] = [
      ...issuesByCategory['temporal-anomaly'],
      ...issuesByCategory['progress-mismatch'],
      ...issuesByCategory['duplicate-book'],
      ...issuesByCategory['fragmented-saga'],
    ];

    const autoFixableCount = allIssues.filter((issue) => issue.canAutoFix).length;

    return {
      totalIssuesCount: allIssues.length,
      autoFixableCount,
      healthScorePercent: computeHealthScore(allIssues),
      issuesByCategory,
      allIssues,
    };
  });

  async applyIssueFix(issueId: string): Promise<boolean> {
    const issue = this.report().allIssues.find((item) => item.id === issueId);
    if (!issue) {
      return false;
    }

    if (issue.category === 'duplicate-book') {
      return this.confirmAndFixDuplicateIssue(issue);
    }

    if (!issue.canAutoFix) {
      return false;
    }

    return this.executeIssueFix(issue);
  }

  async applyAllAutoFixes(): Promise<number> {
    const autoFixable = this.report().allIssues.filter((issue) => issue.canAutoFix);
    if (autoFixable.length === 0) {
      return 0;
    }

    const t = this.i18n.t().settings.dataHealth;
    const confirmed = await this.confirmDialogService.confirm({
      title: interpolate(t.confirmFixAllTitle, { count: autoFixable.length }),
      message: t.confirmFixAllMessage,
      confirmLabel: t.confirmFixAllAction,
      cancelLabel: t.cancelAction,
      severity: 'info',
    });

    if (!confirmed) {
      return 0;
    }

    let fixedCount = 0;
    for (const issue of autoFixable) {
      const fixed = await this.executeIssueFix(issue);
      if (fixed) {
        fixedCount++;
      }
    }

    return fixedCount;
  }

  private collectBookIssues(
    books: Book[],
    t: ReturnType<I18nService['t']>['settings']['dataHealth'],
    issuesByCategory: Record<DataHealthIssueCategory, DataHealthIssue[]>
  ): void {
    const temporal = issuesByCategory['temporal-anomaly'];
    const progress = issuesByCategory['progress-mismatch'];

    for (const book of books) {
      if (
        typeof book.publicationYear === 'number' &&
        !isValidPublicationYear(book.publicationYear)
      ) {
        const suggestedYear = suggestCorrectedYear(book.publicationYear);
        temporal.push({
          id: `temporal-book-pubyear:${book.id}`,
          category: 'temporal-anomaly',
          severity: 'high',
          title: interpolate(t.issues.pubYearAnomalyTitle, { title: book.title }),
          description: interpolate(t.issues.pubYearAnomalyDescription, {
            year: book.publicationYear,
          }),
          affectedBookIds: [book.id],
          suggestedValueLabel: `${book.publicationYear} → ${suggestedYear}`,
          canAutoFix: true,
        });
      }

      const startYear = extractYearFromIsoPrefix(book.startDate);
      if (startYear !== null && !isValidReadingActivityYear(startYear)) {
        const suggestedYear = suggestCorrectedYear(startYear);
        temporal.push({
          id: `temporal-book-startdate:${book.id}`,
          category: 'temporal-anomaly',
          severity: 'high',
          title: interpolate(t.issues.startDateAnomalyTitle, { title: book.title }),
          description: interpolate(t.issues.startDateAnomalyDescription, {
            date: book.startDate ?? '',
          }),
          affectedBookIds: [book.id],
          suggestedValueLabel: `${startYear} → ${suggestedYear}`,
          canAutoFix: true,
        });
      }

      const endYear = extractYearFromIsoPrefix(book.endDate);
      if (endYear !== null && !isValidReadingActivityYear(endYear)) {
        const suggestedYear = suggestCorrectedYear(endYear);
        temporal.push({
          id: `temporal-book-enddate:${book.id}`,
          category: 'temporal-anomaly',
          severity: 'high',
          title: interpolate(t.issues.endDateAnomalyTitle, { title: book.title }),
          description: interpolate(t.issues.endDateAnomalyDescription, {
            date: book.endDate ?? '',
          }),
          affectedBookIds: [book.id],
          suggestedValueLabel: `${endYear} → ${suggestedYear}`,
          canAutoFix: true,
        });
      }

      if (book.startDate && book.endDate && book.endDate < book.startDate) {
        temporal.push({
          id: `temporal-book-inverted:${book.id}`,
          category: 'temporal-anomaly',
          severity: 'medium',
          title: interpolate(t.issues.invertedDatesTitle, { title: book.title }),
          description: interpolate(t.issues.invertedDatesDescription, {
            startDate: book.startDate,
            endDate: book.endDate,
          }),
          affectedBookIds: [book.id],
          suggestedValueLabel: `${book.startDate} ↔ ${book.endDate}`,
          canAutoFix: true,
        });
      }

      if (book.status === 'completed' && book.totalPages <= 1) {
        progress.push({
          id: `progress-completed-placeholder:${book.id}`,
          category: 'progress-mismatch',
          severity: 'low',
          title: interpolate(t.issues.completedPlaceholderPagesTitle, { title: book.title }),
          description: interpolate(t.issues.completedPlaceholderPagesDescription, {
            totalPages: book.totalPages,
          }),
          affectedBookIds: [book.id],
          suggestedValueLabel: t.issues.manualFixHint,
          canAutoFix: false,
        });
      } else if (book.status === 'completed' && book.currentPage < book.totalPages) {
        progress.push({
          id: `progress-completed-pages:${book.id}`,
          category: 'progress-mismatch',
          severity: 'medium',
          title: interpolate(t.issues.completedPagesMismatchTitle, { title: book.title }),
          description: interpolate(t.issues.completedPagesMismatchDescription, {
            currentPage: book.currentPage,
            totalPages: book.totalPages,
          }),
          affectedBookIds: [book.id],
          suggestedValueLabel: `${book.currentPage} → ${book.totalPages} p.`,
          canAutoFix: true,
        });
      }

      if (book.status === 'pending' && book.currentPage > 0) {
        progress.push({
          id: `progress-pending-progress:${book.id}`,
          category: 'progress-mismatch',
          severity: 'medium',
          title: interpolate(t.issues.pendingWithProgressTitle, { title: book.title }),
          description: interpolate(t.issues.pendingWithProgressDescription, {
            currentPage: book.currentPage,
          }),
          affectedBookIds: [book.id],
          suggestedValueLabel: 'pending → reading',
          canAutoFix: true,
        });
      }
    }
  }

  private collectReadingLogIssues(
    logs: ReadingLog[],
    booksById: Map<string, Book>,
    t: ReturnType<I18nService['t']>['settings']['dataHealth'],
    temporalIssues: DataHealthIssue[]
  ): void {
    for (const log of logs) {
      const year = extractYearFromIsoPrefix(log.date);
      if (year !== null && !isValidReadingActivityYear(year)) {
        const suggestedYear = suggestCorrectedYear(year);
        const bookTitle = booksById.get(log.bookId)?.title ?? log.bookId;
        temporalIssues.push({
          id: `temporal-log-date:${log.id}`,
          category: 'temporal-anomaly',
          severity: 'high',
          title: interpolate(t.issues.logDateAnomalyTitle, { title: bookTitle }),
          description: interpolate(t.issues.logDateAnomalyDescription, { date: log.date }),
          affectedBookIds: [log.bookId],
          affectedLogIds: [log.id],
          suggestedValueLabel: `${year} → ${suggestedYear}`,
          canAutoFix: true,
        });
      }
    }
  }

  private collectDuplicateBookIssues(
    books: Book[],
    t: ReturnType<I18nService['t']>['settings']['dataHealth'],
    duplicateIssues: DataHealthIssue[]
  ): void {
    const byIsbn = new Map<string, Book[]>();
    const groupedBookIds = new Set<string>();

    for (const book of books) {
      const normalized = normalizeIsbn(book.isbn ?? '');
      if (!normalized) {
        continue;
      }
      const group = byIsbn.get(normalized);
      if (group) {
        group.push(book);
      } else {
        byIsbn.set(normalized, [book]);
      }
    }

    for (const [isbnKey, group] of byIsbn.entries()) {
      if (group.length < 2) {
        continue;
      }
      const sorted = [...group].sort((a, b) => scoreBookCompleteness(b) - scoreBookCompleteness(a));
      for (const b of sorted) {
        groupedBookIds.add(b.id);
      }
      duplicateIssues.push({
        id: `duplicate-book:isbn:${isbnKey}`,
        category: 'duplicate-book',
        severity: 'medium',
        title: interpolate(t.issues.duplicateBookTitle, { title: sorted[0].title }),
        description: interpolate(t.issues.duplicateBookDescription, {
          count: sorted.length,
          reason: `ISBN ${isbnKey}`,
        }),
        affectedBookIds: sorted.map((b) => b.id),
        suggestedValueLabel: sorted[0].title,
        canAutoFix: false,
      });
    }

    const byTitleAuthor = new Map<string, Book[]>();
    for (const book of books) {
      if (groupedBookIds.has(book.id)) {
        continue;
      }
      const titleKey = normalizeBookText(book.title);
      const authorKey = normalizeBookText(book.author);
      if (!titleKey) {
        continue;
      }
      const compositeKey = `${titleKey}::${authorKey}`;
      const group = byTitleAuthor.get(compositeKey);
      if (group) {
        group.push(book);
      } else {
        byTitleAuthor.set(compositeKey, [book]);
      }
    }

    for (const [compositeKey, group] of byTitleAuthor.entries()) {
      if (group.length < 2) {
        continue;
      }
      const sorted = [...group].sort((a, b) => scoreBookCompleteness(b) - scoreBookCompleteness(a));
      duplicateIssues.push({
        id: `duplicate-book:title:${compositeKey}`,
        category: 'duplicate-book',
        severity: 'medium',
        title: interpolate(t.issues.duplicateBookTitle, { title: sorted[0].title }),
        description: interpolate(t.issues.duplicateBookDescription, {
          count: sorted.length,
          reason: sorted[0].author || sorted[0].title,
        }),
        affectedBookIds: sorted.map((b) => b.id),
        suggestedValueLabel: sorted[0].title,
        canAutoFix: false,
      });
    }
  }

  private collectFragmentedSagaIssues(
    books: Book[],
    metadataByKey: Map<string, { name: string }>,
    t: ReturnType<I18nService['t']>['settings']['dataHealth'],
    sagaIssues: DataHealthIssue[]
  ): void {
    const groupedBySaga = new Map<string, Book[]>();

    for (const book of books) {
      const rawName = book.series?.name?.trim();
      if (!rawName) {
        continue;
      }
      const key = normalizeSeriesKey(rawName);
      if (!key) {
        continue;
      }
      const group = groupedBySaga.get(key);
      if (group) {
        group.push(book);
      } else {
        groupedBySaga.set(key, [book]);
      }
    }

    for (const [normalizedKey, groupBooks] of groupedBySaga.entries()) {
      const distinctRawNames = new Set(groupBooks.map((b) => b.series?.name ?? ''));
      const canonicalName = pickCanonicalSagaName(
        groupBooks,
        metadataByKey.get(normalizedKey)?.name
      );

      if (distinctRawNames.size > 1 && canonicalName) {
        sagaIssues.push({
          id: `saga-fragmented-name:${normalizedKey}`,
          category: 'fragmented-saga',
          severity: 'low',
          title: interpolate(t.issues.fragmentedSagaNameTitle, { saga: canonicalName }),
          description: interpolate(t.issues.fragmentedSagaNameDescription, {
            count: groupBooks.length,
          }),
          affectedBookIds: groupBooks.map((b) => b.id),
          suggestedValueLabel: canonicalName,
          canAutoFix: true,
        });
      }

      const missingVolumeBooks = groupBooks.filter(
        (b) =>
          typeof b.series?.volumeNumber !== 'number' ||
          !Number.isInteger(b.series.volumeNumber) ||
          b.series.volumeNumber <= 0
      );

      if (missingVolumeBooks.length > 0 && canonicalName) {
        sagaIssues.push({
          id: `saga-missing-volume:${normalizedKey}`,
          category: 'fragmented-saga',
          severity: 'low',
          title: interpolate(t.issues.missingSagaVolumeTitle, { saga: canonicalName }),
          description: interpolate(t.issues.missingSagaVolumeDescription, {
            count: missingVolumeBooks.length,
          }),
          affectedBookIds: missingVolumeBooks.map((b) => b.id),
          suggestedValueLabel: t.issues.manualFixHint,
          canAutoFix: false,
        });
      }
    }
  }

  private async confirmAndFixDuplicateIssue(issue: DataHealthIssue): Promise<boolean> {
    if (issue.affectedBookIds.length < 2) {
      return false;
    }

    const keeperId = issue.affectedBookIds[0];
    const duplicateIds = issue.affectedBookIds.slice(1);
    const keeper = this.booksService.books().find((b) => b.id === keeperId);
    if (!keeper) {
      return false;
    }

    const t = this.i18n.t().settings.dataHealth;
    const confirmed = await this.confirmDialogService.confirm({
      title: t.confirmDuplicateTitle,
      message: interpolate(t.confirmDuplicateMessage, {
        keeper: keeper.title,
        count: duplicateIds.length,
      }),
      confirmLabel: t.confirmDuplicateAction,
      cancelLabel: t.cancelAction,
      severity: 'warning',
    });

    if (!confirmed) {
      return false;
    }

    for (const dupId of duplicateIds) {
      await this.booksService.remove(dupId);
    }

    return true;
  }

  private async executeIssueFix(issue: DataHealthIssue): Promise<boolean> {
    const colonIndex = issue.id.indexOf(':');
    if (colonIndex < 0) {
      return false;
    }

    const prefix = issue.id.slice(0, colonIndex);
    const targetKey = issue.id.slice(colonIndex + 1);
    const now = new Date().toISOString();

    switch (prefix) {
      case 'temporal-book-pubyear': {
        const book = this.booksService.books().find((b) => b.id === targetKey);
        if (!book || typeof book.publicationYear !== 'number') {
          return false;
        }
        const correctedYear = suggestCorrectedYear(book.publicationYear);
        await this.booksService.update(book.id, {
          ...book,
          publicationYear: correctedYear,
          updatedAt: now,
        });
        return true;
      }

      case 'temporal-book-startdate': {
        const book = this.booksService.books().find((b) => b.id === targetKey);
        const year = extractYearFromIsoPrefix(book?.startDate);
        if (!book || !book.startDate || year === null) {
          return false;
        }
        const correctedYear = suggestCorrectedYear(year);
        await this.booksService.update(book.id, {
          ...book,
          startDate: replaceIsoYearPrefix(book.startDate, correctedYear),
          updatedAt: now,
        });
        return true;
      }

      case 'temporal-book-enddate': {
        const book = this.booksService.books().find((b) => b.id === targetKey);
        const year = extractYearFromIsoPrefix(book?.endDate);
        if (!book || !book.endDate || year === null) {
          return false;
        }
        const correctedYear = suggestCorrectedYear(year);
        await this.booksService.update(book.id, {
          ...book,
          endDate: replaceIsoYearPrefix(book.endDate, correctedYear),
          updatedAt: now,
        });
        return true;
      }

      case 'temporal-book-inverted': {
        const book = this.booksService.books().find((b) => b.id === targetKey);
        if (!book || !book.startDate || !book.endDate) {
          return false;
        }
        await this.booksService.update(book.id, {
          ...book,
          startDate: book.endDate,
          endDate: book.startDate,
          updatedAt: now,
        });
        return true;
      }

      case 'temporal-log-date': {
        const log = this.readingLogService.readingLogs().find((l) => l.id === targetKey);
        const year = extractYearFromIsoPrefix(log?.date);
        if (!log || year === null) {
          return false;
        }
        const correctedYear = suggestCorrectedYear(year);
        await this.readingLogService.update(log.id, {
          ...log,
          date: replaceIsoYearPrefix(log.date, correctedYear),
        });
        return true;
      }

      case 'progress-completed-pages': {
        const book = this.booksService.books().find((b) => b.id === targetKey);
        if (!book) {
          return false;
        }
        await this.booksService.update(book.id, {
          ...book,
          currentPage: book.totalPages,
          updatedAt: now,
        });
        return true;
      }

      case 'progress-pending-progress': {
        const book = this.booksService.books().find((b) => b.id === targetKey);
        if (!book) {
          return false;
        }
        await this.booksService.update(book.id, {
          ...book,
          status: 'reading',
          updatedAt: now,
        });
        return true;
      }

      case 'saga-fragmented-name': {
        const canonicalName = issue.suggestedValueLabel?.trim();
        if (!canonicalName) {
          return false;
        }
        const affectedBooks = this.booksService
          .books()
          .filter(
            (b) =>
              b.series?.name &&
              normalizeSeriesKey(b.series.name) === targetKey &&
              b.series.name !== canonicalName
          );
        if (affectedBooks.length === 0) {
          return false;
        }
        const updatedBooks: Book[] = affectedBooks
          .filter((book): book is Book & { series: NonNullable<Book['series']> } =>
            Boolean(book.series)
          )
          .map((book) => ({
            ...book,
            series: {
              ...book.series,
              name: canonicalName,
            },
            updatedAt: now,
          }));
        return this.booksService.updateMany(updatedBooks);
      }

      default:
        return false;
    }
  }
}
