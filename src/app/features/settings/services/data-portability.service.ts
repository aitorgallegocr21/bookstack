import { DOCUMENT, Injectable, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  Book,
  BookStatus,
  DEFAULT_READING_GOALS,
  ReadingGoals,
  ReadingLog,
} from '../../books/models/book.model';
import {
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_VIEW_MODE,
} from '../../books/models/catalog-filter.model';
import { BookSchema } from '../../books/schemas/book.schema';
import { BooksService } from '../../books/services/books.service';
import { CatalogFilterService } from '../../books/services/catalog-filter.service';
import { ReadingLogService } from '../../books/services/reading-log.service';
import { ReadingStatsService } from '../../books/services/reading-stats.service';
import { SeriesMetadata } from '../../series/models/series.model';
import { SeriesService } from '../../series/services/series.service';
import {
  BackupPreferences,
  BookstackBackupEnvelope,
  ImportConflictMode,
  ImportExecutionResult,
  ImportPreviewSummary,
  StorageBreakdownSummary,
  StorageHealthStatus,
} from '../models/data-portability.model';
import { parseBackupJson } from '../schemas/backup.schema';

const UTF8_BOM = '\uFEFF';
const UTF8_ENCODER = new TextEncoder();
const LOCALSTORAGE_NEAR_LIMIT_BYTES = 4 * 1024 * 1024;
const FORMULA_PREFIX_CHARS = new Set(['=', '+', '-', '@', '\t', '\r']);

const CSV_COLUMNS = [
  'id',
  'title',
  'author',
  'status',
  'totalPages',
  'currentPage',
  'format',
  'rating',
  'startDate',
  'endDate',
  'seriesName',
  'seriesOrder',
  'isbn',
  'notes',
  'createdAt',
  'updatedAt',
] as const;

type CsvColumnName = (typeof CSV_COLUMNS)[number];

interface DataSnapshot {
  books: Book[];
  readingLogs: ReadingLog[];
  seriesMetadata: SeriesMetadata[];
  readingGoals: ReadingGoals;
  preferences: BackupPreferences;
}

/**
 * Orchestrates JSON full backups, RFC 4180 CSV catalog export/import with
 * formula-injection sanitization, Zod-validated import previews, rollback-safe
 * merge/overwrite execution, destructive resets, and storage footprint inspection.
 */
@Injectable({
  providedIn: 'root',
})
export class DataPortabilityService {
  private readonly document = inject(DOCUMENT);
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  private readonly readingStatsService = inject(ReadingStatsService);
  private readonly seriesService = inject(SeriesService);
  private readonly catalogFilterService = inject(CatalogFilterService);
  private readonly storageAdapter = inject(StorageAdapterService);
  private readonly themeService = inject(ThemeService);
  private readonly i18n = inject(I18nService);

  // ==========================================
  // JSON Backup Export
  // ==========================================

  async buildJsonBackupEnvelope(): Promise<BookstackBackupEnvelope> {
    await this.seriesService.ensureInitialized();
    const seriesMetadata = [...this.seriesService.metadata()];
    return {
      schemaVersion: 1,
      app: 'BookStack',
      exportedAt: new Date().toISOString(),
      books: [...this.booksService.books()],
      readingLogs: [...this.readingLogService.readingLogs()],
      seriesMetadata,
      readingGoals: { ...this.readingStatsService.goals() },
      preferences: this.captureCurrentPreferences(),
    };
  }

  async exportJsonBackup(): Promise<string> {
    return JSON.stringify(await this.buildJsonBackupEnvelope(), null, 2);
  }

  async downloadJsonBackup(): Promise<void> {
    const json = await this.exportJsonBackup();
    const dateStamp = this.formatDateStamp(new Date());
    this.triggerFileDownload(
      json,
      `bookstack-backup-${dateStamp}.json`,
      'application/json;charset=utf-8'
    );
  }

  // ==========================================
  // RFC 4180 CSV Export & Parsing
  // ==========================================

  exportCsvCatalog(): string {
    const books = this.booksService.books();
    const headerRow = CSV_COLUMNS.join(',');
    const dataRows = books.map((book) =>
      CSV_COLUMNS.map((column) => this.serializeCsvCell(this.extractCsvField(book, column))).join(
        ','
      )
    );

    return `${UTF8_BOM}${[headerRow, ...dataRows].join('\r\n')}`;
  }

  downloadCsvCatalog(): void {
    const csv = this.exportCsvCatalog();
    const dateStamp = this.formatDateStamp(new Date());
    this.triggerFileDownload(csv, `bookstack-catalog-${dateStamp}.csv`, 'text/csv;charset=utf-8');
  }

  parseCsvCatalog(rawCsv: string): { validBooks: Book[]; invalidBooksCount: number } {
    const cleaned = rawCsv.startsWith(UTF8_BOM) ? rawCsv.slice(1) : rawCsv;
    const rows = this.parseRfc4180Rows(cleaned);
    if (rows.length < 2) {
      return { validBooks: [], invalidBooksCount: 0 };
    }

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const headerIndex = new Map<string, number>();
    headers.forEach((header, idx) => {
      if (header.length > 0) {
        headerIndex.set(header, idx);
      }
    });

    const validBooks: Book[] = [];
    let invalidBooksCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every((cell) => cell.trim() === '')) {
        continue;
      }

      const candidate = this.mapCsvRowToBookCandidate(row, headerIndex);
      const parsed = BookSchema.safeParse(candidate);
      if (parsed.success) {
        validBooks.push(parsed.data);
      } else {
        invalidBooksCount++;
      }
    }

    return { validBooks, invalidBooksCount };
  }

  // ==========================================
  // Two-Step Import Preview & Execution
  // ==========================================

  analyzeImportFile(fileName: string, rawContent: string): ImportPreviewSummary {
    const format = this.detectImportFormat(fileName, rawContent);

    if (format === 'json') {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawContent);
      } catch {
        throw new Error('Invalid JSON syntax in backup file.');
      }

      const validation = parseBackupJson(parsedJson);
      if (!validation.success) {
        throw new Error(validation.error);
      }

      const { duplicateBooksCount, newBooksCount } = this.countBookConflicts(
        validation.data.validBooks
      );

      return {
        format: 'json',
        fileName,
        validBooks: validation.data.validBooks,
        validReadingLogs: validation.data.validReadingLogs,
        validSeriesMetadata: validation.data.validSeriesMetadata,
        readingGoals: validation.data.readingGoals,
        preferences: validation.data.preferences,
        invalidBooksCount: validation.data.invalidBooksCount,
        invalidLogsCount: validation.data.invalidLogsCount,
        invalidSeriesMetadataCount: validation.data.invalidSeriesMetadataCount,
        duplicateBooksCount,
        newBooksCount,
      };
    }

    const csvResult = this.parseCsvCatalog(rawContent);
    const { duplicateBooksCount, newBooksCount } = this.countBookConflicts(csvResult.validBooks);

    return {
      format: 'csv',
      fileName,
      validBooks: csvResult.validBooks,
      validReadingLogs: [],
      validSeriesMetadata: [],
      readingGoals: null,
      preferences: null,
      invalidBooksCount: csvResult.invalidBooksCount,
      invalidLogsCount: 0,
      invalidSeriesMetadataCount: 0,
      duplicateBooksCount,
      newBooksCount,
    };
  }

  async executeImport(
    preview: ImportPreviewSummary,
    mode: ImportConflictMode
  ): Promise<ImportExecutionResult> {
    const snapshot = await this.captureSnapshot();

    try {
      if (mode === 'overwrite') {
        await this.booksService.replaceAll(preview.validBooks);
        await this.readingLogService.replaceAll(preview.validReadingLogs);
        await this.seriesService.replaceAllMetadata(preview.validSeriesMetadata);
      } else {
        const { mergedBooks, mergedLogs } = this.buildMergedCollections(
          snapshot.books,
          snapshot.readingLogs,
          preview.validBooks,
          preview.validReadingLogs
        );
        const mergedSeriesMetadata = this.mergeSeriesMetadata(
          snapshot.seriesMetadata,
          preview.validSeriesMetadata
        );
        await this.booksService.replaceAll(mergedBooks);
        await this.readingLogService.replaceAll(mergedLogs);
        await this.seriesService.replaceAllMetadata(mergedSeriesMetadata);
      }

      let goalsRestored = false;
      if (preview.readingGoals) {
        goalsRestored = this.readingStatsService.saveGoals(preview.readingGoals);
      }

      let preferencesRestored = false;
      if (preview.preferences) {
        this.applyPreferences(preview.preferences);
        preferencesRestored = true;
      }

      return {
        mode,
        format: preview.format,
        booksImported: preview.validBooks.length,
        logsImported: preview.validReadingLogs.length,
        seriesMetadataImported: preview.validSeriesMetadata.length,
        skippedRecords:
          preview.invalidBooksCount + preview.invalidLogsCount + preview.invalidSeriesMetadataCount,
        goalsRestored,
        preferencesRestored,
      };
    } catch (error) {
      await this.restoreSnapshot(snapshot);
      throw error;
    }
  }

  // ==========================================
  // Destructive Reset Operations
  // ==========================================

  async clearReadingSessionsOnly(): Promise<void> {
    await this.readingLogService.clearAll();
  }

  async factoryResetAllData(): Promise<void> {
    await this.booksService.clearAll();
    await this.readingLogService.clearAll();
    await this.seriesService.clearAllMetadata();
    this.readingStatsService.saveGoals({
      ...DEFAULT_READING_GOALS,
      year: new Date().getFullYear(),
    });
    this.i18n.setLocale('es');
    this.catalogFilterService.setViewMode(DEFAULT_CATALOG_VIEW_MODE);
    this.catalogFilterService.setSortOption(DEFAULT_CATALOG_SORT);
  }

  // ==========================================
  // Storage Footprint & Quota Inspector
  // ==========================================

  async computeStorageBreakdown(): Promise<StorageBreakdownSummary> {
    await this.seriesService.ensureInitialized();
    const books = this.booksService.books();
    const readingLogs = this.readingLogService.readingLogs();
    const seriesMetadata = this.seriesService.metadata();
    const readingGoals = this.readingStatsService.goals();
    const preferences = this.captureCurrentPreferences();

    let coversBase64Bytes = 0;
    let coversCount = 0;

    for (const book of books) {
      if (book.coverUrl && book.coverUrl.startsWith('data:image/')) {
        coversBase64Bytes += this.measureUtf8Bytes(book.coverUrl);
        coversCount++;
      }
    }

    const totalBooksBytes = this.measureUtf8Bytes(JSON.stringify(books));
    const booksMetadataBytes =
      Math.max(0, totalBooksBytes - coversBase64Bytes) +
      this.measureUtf8Bytes(JSON.stringify(seriesMetadata));
    const readingLogsBytes = this.measureUtf8Bytes(JSON.stringify(readingLogs));
    const preferencesBytes = this.measureUtf8Bytes(
      JSON.stringify({ readingGoals, ...preferences })
    );
    const totalBookstackBytes =
      booksMetadataBytes + coversBase64Bytes + readingLogsBytes + preferencesBytes;

    const usingIndexedDb = await this.storageAdapter.isUsingIndexedDb();
    const quotaEstimate = await this.storageAdapter.estimateBrowserQuota();
    const healthStatus = this.resolveStorageHealthStatus(
      usingIndexedDb,
      totalBookstackBytes,
      quotaEstimate.usageBytes,
      quotaEstimate.quotaBytes
    );

    return {
      engine: usingIndexedDb ? 'indexeddb' : 'localstorage',
      totalBookstackBytes,
      booksMetadataBytes,
      coversBase64Bytes,
      readingLogsBytes,
      preferencesBytes,
      booksCount: books.length,
      coversCount,
      readingLogsCount: readingLogs.length,
      browserUsageBytes: quotaEstimate.usageBytes,
      browserQuotaBytes: quotaEstimate.quotaBytes,
      healthStatus,
    };
  }

  // ==========================================
  // Private Helpers
  // ==========================================

  private captureCurrentPreferences(): BackupPreferences {
    return {
      locale: this.i18n.locale(),
      theme: this.themeService.getTheme(),
      catalogViewMode: this.catalogFilterService.viewMode(),
      catalogSort: this.catalogFilterService.sortOption(),
    };
  }

  private async captureSnapshot(): Promise<DataSnapshot> {
    await this.seriesService.ensureInitialized();
    return {
      books: [...this.booksService.books()],
      readingLogs: [...this.readingLogService.readingLogs()],
      seriesMetadata: [...this.seriesService.metadata()],
      readingGoals: { ...this.readingStatsService.goals() },
      preferences: this.captureCurrentPreferences(),
    };
  }

  private async restoreSnapshot(snapshot: DataSnapshot): Promise<void> {
    try {
      await this.booksService.replaceAll(snapshot.books);
      await this.readingLogService.replaceAll(snapshot.readingLogs);
      await this.seriesService.replaceAllMetadata(snapshot.seriesMetadata);
      this.readingStatsService.saveGoals(snapshot.readingGoals);
      this.applyPreferences(snapshot.preferences);
    } catch (rollbackError) {
      console.error('[DataPortabilityService] Snapshot rollback failed:', rollbackError);
    }
  }

  private applyPreferences(preferences: BackupPreferences): void {
    if (preferences.locale) {
      this.i18n.setLocale(preferences.locale);
    }
    if (preferences.theme) {
      this.themeService.setTheme(preferences.theme);
    }
    if (preferences.catalogViewMode) {
      this.catalogFilterService.setViewMode(preferences.catalogViewMode);
    }
    if (preferences.catalogSort) {
      this.catalogFilterService.setSortOption(preferences.catalogSort);
    }
  }

  private detectImportFormat(fileName: string, rawContent: string): 'json' | 'csv' {
    const lowerName = fileName.trim().toLowerCase();
    if (lowerName.endsWith('.json')) {
      return 'json';
    }
    if (lowerName.endsWith('.csv')) {
      return 'csv';
    }
    return rawContent.trimStart().startsWith('{') ? 'json' : 'csv';
  }

  private normalizeTitleAuthorKey(title: string, author: string): string {
    return `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
  }

  private countBookConflicts(incomingBooks: readonly Book[]): {
    duplicateBooksCount: number;
    newBooksCount: number;
  } {
    const existingBooks = this.booksService.books();
    const existingIds = new Set(existingBooks.map((book) => book.id));
    const existingKeys = new Set(
      existingBooks.map((book) => this.normalizeTitleAuthorKey(book.title, book.author))
    );

    let duplicateBooksCount = 0;
    let newBooksCount = 0;

    for (const book of incomingBooks) {
      const key = this.normalizeTitleAuthorKey(book.title, book.author);
      if (existingIds.has(book.id) || existingKeys.has(key)) {
        duplicateBooksCount++;
      } else {
        newBooksCount++;
      }
    }

    return { duplicateBooksCount, newBooksCount };
  }

  private buildMergedCollections(
    existingBooks: readonly Book[],
    existingLogs: readonly ReadingLog[],
    incomingBooks: readonly Book[],
    incomingLogs: readonly ReadingLog[]
  ): { mergedBooks: Book[]; mergedLogs: ReadingLog[] } {
    const mergedBooks = [...existingBooks];
    const indexById = new Map<string, number>();
    const indexByTitleAuthor = new Map<string, number>();

    mergedBooks.forEach((book, idx) => {
      indexById.set(book.id, idx);
      indexByTitleAuthor.set(this.normalizeTitleAuthorKey(book.title, book.author), idx);
    });

    const idRemap = new Map<string, string>();

    for (const incoming of incomingBooks) {
      const titleAuthorKey = this.normalizeTitleAuthorKey(incoming.title, incoming.author);
      const matchedIdx = indexById.get(incoming.id) ?? indexByTitleAuthor.get(titleAuthorKey);

      if (matchedIdx !== undefined) {
        const existing = mergedBooks[matchedIdx];
        const preservedId = existing.id;
        idRemap.set(incoming.id, preservedId);
        mergedBooks[matchedIdx] = {
          ...existing,
          ...incoming,
          id: preservedId,
          coverUrl: incoming.coverUrl ?? existing.coverUrl,
        };
      } else {
        const newIdx = mergedBooks.length;
        mergedBooks.push(incoming);
        indexById.set(incoming.id, newIdx);
        indexByTitleAuthor.set(titleAuthorKey, newIdx);
      }
    }

    const mergedLogs = [...existingLogs];
    const logIndexById = new Map<string, number>();
    mergedLogs.forEach((log, idx) => {
      logIndexById.set(log.id, idx);
    });

    for (const incomingLog of incomingLogs) {
      const remappedLog: ReadingLog = {
        ...incomingLog,
        bookId: idRemap.get(incomingLog.bookId) ?? incomingLog.bookId,
      };

      const existingLogIdx = logIndexById.get(remappedLog.id);
      if (existingLogIdx !== undefined) {
        mergedLogs[existingLogIdx] = remappedLog;
      } else {
        logIndexById.set(remappedLog.id, mergedLogs.length);
        mergedLogs.push(remappedLog);
      }
    }

    return { mergedBooks, mergedLogs };
  }

  private mergeSeriesMetadata(
    existing: readonly SeriesMetadata[],
    incoming: readonly SeriesMetadata[]
  ): SeriesMetadata[] {
    const merged = [...existing];
    const indexById = new Map<string, number>();
    const indexByKey = new Map<string, number>();

    merged.forEach((item, idx) => {
      indexById.set(item.id, idx);
      indexByKey.set(item.normalizedKey, idx);
    });

    for (const item of incoming) {
      const matchedIdx = indexById.get(item.id) ?? indexByKey.get(item.normalizedKey);
      if (matchedIdx !== undefined) {
        const current = merged[matchedIdx];
        const incomingTime = Date.parse(item.updatedAt);
        const currentTime = Date.parse(current.updatedAt);
        const shouldUseIncoming =
          Number.isNaN(currentTime) || (!Number.isNaN(incomingTime) && incomingTime >= currentTime);

        if (shouldUseIncoming) {
          const updated: SeriesMetadata = {
            ...current,
            ...item,
            id: current.id,
          };
          merged[matchedIdx] = updated;
          indexByKey.set(updated.normalizedKey, matchedIdx);
        }
      } else {
        const nextIdx = merged.length;
        merged.push(item);
        indexById.set(item.id, nextIdx);
        indexByKey.set(item.normalizedKey, nextIdx);
      }
    }

    return merged;
  }

  private extractCsvField(book: Book, column: CsvColumnName): string {
    switch (column) {
      case 'id':
        return book.id;
      case 'title':
        return book.title;
      case 'author':
        return book.author;
      case 'status':
        return book.status;
      case 'totalPages':
        return String(book.totalPages);
      case 'currentPage':
        return String(book.currentPage);
      case 'format':
        return typeof book.format === 'string' ? book.format : (book.format?.name ?? '');
      case 'rating':
        return book.rating !== undefined ? String(book.rating) : '';
      case 'startDate':
        return book.startDate ?? '';
      case 'endDate':
        return book.endDate ?? '';
      case 'seriesName':
        return book.series?.name ?? book.seriesInfo?.seriesName ?? '';
      case 'seriesOrder': {
        const order = book.series?.volumeNumber ?? book.seriesInfo?.orderInSeries;
        return order !== undefined ? String(order) : '';
      }
      case 'isbn':
        return book.isbn ?? '';
      case 'notes':
        return book.notes ?? '';
      case 'createdAt':
        return book.createdAt;
      case 'updatedAt':
        return book.updatedAt;
    }
  }

  private serializeCsvCell(rawValue: string): string {
    const sanitized = this.sanitizeCsvFormula(rawValue);
    if (
      sanitized.includes(',') ||
      sanitized.includes('"') ||
      sanitized.includes('\n') ||
      sanitized.includes('\r')
    ) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return sanitized;
  }

  private sanitizeCsvFormula(value: string): string {
    if (value.length === 0) {
      return value;
    }

    const firstChar = value.charAt(0);
    const trimmedFirstChar = value.trimStart().charAt(0);
    if (FORMULA_PREFIX_CHARS.has(firstChar) || FORMULA_PREFIX_CHARS.has(trimmedFirstChar)) {
      return `'${value}`;
    }

    return value;
  }

  private stripFormulaGuard(value: string): string {
    if (value.length >= 2 && value.startsWith("'")) {
      const nextChar = value.charAt(1);
      const nextTrimmedChar = value.slice(1).trimStart().charAt(0);
      if (FORMULA_PREFIX_CHARS.has(nextChar) || FORMULA_PREFIX_CHARS.has(nextTrimmedChar)) {
        return value.slice(1);
      }
    }
    return value;
  }

  private parseRfc4180Rows(input: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      const nextChar = input[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(this.stripFormulaGuard(currentField));
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(this.stripFormulaGuard(currentField));
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        i++;
      } else if (char === '\n' || char === '\r') {
        currentRow.push(this.stripFormulaGuard(currentField));
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(this.stripFormulaGuard(currentField));
      rows.push(currentRow);
    }

    return rows;
  }

  private mapCsvRowToBookCandidate(
    row: readonly string[],
    headerIndex: ReadonlyMap<string, number>
  ): Record<string, unknown> {
    const getCell = (column: CsvColumnName): string => {
      const idx = headerIndex.get(column.toLowerCase());
      return idx !== undefined ? (row[idx] ?? '').trim() : '';
    };

    const nowIso = new Date().toISOString();
    const id = getCell('id') || this.generateUuid();
    const title = getCell('title');
    const author = getCell('author');
    const status = (getCell('status') || 'pending') as BookStatus;
    const totalPages = Number.parseInt(getCell('totalPages'), 10);
    const currentPageRaw = getCell('currentPage');
    const currentPage = currentPageRaw ? Number.parseInt(currentPageRaw, 10) : 0;

    const ratingRaw = getCell('rating');
    const rating = ratingRaw ? Number.parseFloat(ratingRaw) : undefined;

    const seriesName = getCell('seriesName');
    const seriesOrderRaw = getCell('seriesOrder');
    const seriesOrder = seriesOrderRaw ? Number.parseInt(seriesOrderRaw, 10) : undefined;

    const format = getCell('format') || undefined;
    const startDate = getCell('startDate') || undefined;
    const endDate = getCell('endDate') || undefined;
    const isbn = getCell('isbn') || undefined;
    const notes = getCell('notes') || undefined;
    const createdAt = getCell('createdAt') || nowIso;
    const updatedAt = getCell('updatedAt') || nowIso;

    const candidate: Record<string, unknown> = {
      id,
      title,
      author,
      status,
      totalPages,
      currentPage,
      createdAt,
      updatedAt,
    };

    if (format) {
      candidate['format'] = format;
    }
    if (rating !== undefined && !Number.isNaN(rating)) {
      candidate['rating'] = rating;
    }
    if (startDate) {
      candidate['startDate'] = startDate;
    }
    if (endDate) {
      candidate['endDate'] = endDate;
    }
    if (isbn) {
      candidate['isbn'] = isbn;
    }
    if (notes) {
      candidate['notes'] = notes;
    }
    if (seriesName) {
      candidate['series'] = {
        id: this.slugify(seriesName) || this.generateUuid(),
        name: seriesName,
        ...(seriesOrder !== undefined && !Number.isNaN(seriesOrder)
          ? { volumeNumber: seriesOrder }
          : {}),
      };
    }

    return candidate;
  }

  private resolveStorageHealthStatus(
    usingIndexedDb: boolean,
    totalBookstackBytes: number,
    browserUsageBytes: number | null,
    browserQuotaBytes: number | null
  ): StorageHealthStatus {
    if (!usingIndexedDb && totalBookstackBytes > LOCALSTORAGE_NEAR_LIMIT_BYTES) {
      return 'near-limit';
    }

    if (browserQuotaBytes !== null && browserQuotaBytes > 0) {
      const usage = browserUsageBytes ?? totalBookstackBytes;
      const ratio = usage / browserQuotaBytes;
      if (ratio > 0.85) {
        return 'near-limit';
      }
      if (ratio >= 0.6) {
        return 'moderate';
      }
    }

    return 'healthy';
  }

  private measureUtf8Bytes(value: string): number {
    return UTF8_ENCODER.encode(value).byteLength;
  }

  private formatDateStamp(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `book-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private triggerFileDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    this.document.body.appendChild(link);
    link.click();
    this.document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
