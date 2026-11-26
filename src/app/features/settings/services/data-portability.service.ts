import { DOCUMENT, Injectable, inject } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { AppPreferencesService } from '../../../core/services/app-preferences.service';
import { DockPositionService } from '../../../core/services/dock-position.service';
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
import { isValidIsbn } from '../../books/utils/isbn.utils';
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
  PersistentStorageRequestResult,
  StorageBreakdownSummary,
  StorageHealthStatus,
  StoragePersistenceStatus,
} from '../models/data-portability.model';
import {
  EncryptedBackupEnvelopeSchema,
  isEncryptedBackupPayload,
  normalizeImportedBookCandidate,
  parseBackupJson,
} from '../schemas/backup.schema';
import {
  BackupCryptoError,
  decryptBackupPayload,
  encryptBackupPayload,
} from '../utils/backup-crypto.utils';
import {
  binaryToDataUrl,
  createZipArchive,
  dataUrlToBinary,
  readZipArchive,
  ZipEntryInput,
} from '../utils/zip-archive.utils';

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
  'publisher',
  'publicationYear',
  'genre',
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
  private readonly dockPositionService = inject(DockPositionService);
  private readonly appPreferencesService = inject(AppPreferencesService);
  private readonly i18n = inject(I18nService);

  // ==========================================
  // JSON & Portable .ZIP Backup Export
  // ==========================================

  async buildJsonBackupEnvelope(
    options: { includeCovers?: boolean } = {}
  ): Promise<BookstackBackupEnvelope> {
    const includeCovers = options.includeCovers ?? true;
    await this.seriesService.ensureInitialized();
    const seriesMetadata = [...this.seriesService.metadata()];
    const books = this.booksService.books().map((book) => {
      if (includeCovers || !book.coverUrl?.startsWith('data:image/')) {
        return { ...book };
      }
      const stripped = { ...book };
      delete stripped.coverUrl;
      return stripped;
    });

    const envelope: BookstackBackupEnvelope = {
      schemaVersion: 1,
      app: 'BookStack',
      exportedAt: new Date().toISOString(),
      books,
      readingLogs: [...this.readingLogService.readingLogs()],
      seriesMetadata,
      readingGoals: { ...this.readingStatsService.goals() },
    };

    if (this.appPreferencesService.includePreferencesInBackup()) {
      envelope.preferences = this.captureCurrentPreferences();
    }

    return envelope;
  }

  async exportJsonBackup(options: { includeCovers?: boolean } = {}): Promise<string> {
    return JSON.stringify(await this.buildJsonBackupEnvelope(options), null, 2);
  }

  async downloadJsonBackup(): Promise<void> {
    const json = await this.exportJsonBackup({ includeCovers: true });
    const dateStamp = this.formatDateStamp(new Date());
    this.triggerFileDownload(
      json,
      `bookstack-backup-full-${dateStamp}.json`,
      'application/json;charset=utf-8'
    );
    this.appPreferencesService.markBackupExported();
  }

  async downloadLightweightJsonBackup(): Promise<void> {
    const json = await this.exportJsonBackup({ includeCovers: false });
    const dateStamp = this.formatDateStamp(new Date());
    this.triggerFileDownload(
      json,
      `bookstack-backup-light-${dateStamp}.json`,
      'application/json;charset=utf-8'
    );
    this.appPreferencesService.markBackupExported();
  }

  async exportZipBundle(): Promise<Uint8Array> {
    const envelope = await this.buildJsonBackupEnvelope({ includeCovers: true });
    const coverEntries: ZipEntryInput[] = [];

    const booksForZip = envelope.books.map((book) => {
      if (!book.coverUrl?.startsWith('data:image/')) {
        return book;
      }
      const binary = dataUrlToBinary(book.coverUrl);
      if (!binary) {
        return book;
      }
      const relativePath = `covers/${book.id}.${binary.extension}`;
      coverEntries.push({ path: relativePath, data: binary.bytes });
      return {
        ...book,
        coverUrl: relativePath,
      };
    });

    const zipEnvelope: BookstackBackupEnvelope = {
      ...envelope,
      books: booksForZip,
    };

    const entries: ZipEntryInput[] = [
      { path: 'backup.json', data: JSON.stringify(zipEnvelope, null, 2) },
      { path: 'catalog.csv', data: this.exportCsvCatalog() },
      ...coverEntries,
    ];

    return createZipArchive(entries);
  }

  async downloadZipBundle(): Promise<void> {
    const zipBytes = await this.exportZipBundle();
    const dateStamp = this.formatDateStamp(new Date());
    this.triggerFileDownload(zipBytes, `bookstack-bundle-${dateStamp}.zip`, 'application/zip');
    this.appPreferencesService.markBackupExported();
  }

  async exportEncryptedJsonBackup(
    password: string,
    options: { includeCovers?: boolean } = {}
  ): Promise<string> {
    const json = await this.exportJsonBackup(options);
    const envelope = await encryptBackupPayload(json, password, 'json');
    return JSON.stringify(envelope, null, 2);
  }

  async downloadEncryptedJsonBackup(
    password: string,
    options: { includeCovers?: boolean } = {}
  ): Promise<void> {
    const encryptedJson = await this.exportEncryptedJsonBackup(password, options);
    const dateStamp = this.formatDateStamp(new Date());
    this.triggerFileDownload(
      encryptedJson,
      `bookstack-backup-encrypted-${dateStamp}.enc.json`,
      'application/json;charset=utf-8'
    );
    this.appPreferencesService.markBackupExported();
  }

  async exportEncryptedZipBackup(password: string): Promise<string> {
    const zipBytes = await this.exportZipBundle();
    const envelope = await encryptBackupPayload(zipBytes, password, 'zip');
    return JSON.stringify(envelope, null, 2);
  }

  async downloadEncryptedZipBackup(password: string): Promise<void> {
    const encryptedJson = await this.exportEncryptedZipBackup(password);
    const dateStamp = this.formatDateStamp(new Date());
    this.triggerFileDownload(
      encryptedJson,
      `bookstack-bundle-encrypted-${dateStamp}.enc.json`,
      'application/json;charset=utf-8'
    );
    this.appPreferencesService.markBackupExported();
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
    this.appPreferencesService.markBackupExported();
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

    if (!headerIndex.has('title') || !headerIndex.has('author')) {
      return { validBooks: [], invalidBooksCount: 0 };
    }

    const validBooks: Book[] = [];
    let invalidBooksCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every((cell) => cell.trim() === '')) {
        continue;
      }

      const candidate = this.mapCsvRowToBookCandidate(row, headerIndex);
      const parsed = BookSchema.safeParse(normalizeImportedBookCandidate(candidate));
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

  detectEncryptedBackup(rawContent: string): boolean {
    try {
      const parsed: unknown = JSON.parse(rawContent);
      return isEncryptedBackupPayload(parsed);
    } catch {
      return false;
    }
  }

  async decryptBackupFile(
    fileName: string,
    rawContent: string,
    password: string
  ): Promise<ImportPreviewSummary> {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch {
      throw new BackupCryptoError(
        'UNSUPPORTED_FORMAT',
        'Invalid JSON syntax in encrypted backup file.'
      );
    }

    const validated = EncryptedBackupEnvelopeSchema.safeParse(parsedJson);
    if (!validated.success) {
      throw new BackupCryptoError(
        'UNSUPPORTED_FORMAT',
        'Unsupported or malformed encrypted backup envelope.'
      );
    }

    const decrypted = await decryptBackupPayload(validated.data, password);
    if (decrypted.payloadType === 'zip') {
      return this.analyzeImportZipFile(fileName, decrypted.bytes);
    }
    return this.analyzeImportFile(fileName, decrypted.text ?? '');
  }

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
        hasPreferences: validation.data.preferences !== null,
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
      hasPreferences: false,
      invalidBooksCount: csvResult.invalidBooksCount,
      invalidLogsCount: 0,
      invalidSeriesMetadataCount: 0,
      duplicateBooksCount,
      newBooksCount,
    };
  }

  async analyzeImportZipFile(
    fileName: string,
    zipBytes: Uint8Array
  ): Promise<ImportPreviewSummary> {
    const entries = await readZipArchive(zipBytes);
    const jsonEntry = this.findZipEntry(entries, 'backup.json', '.json');

    if (jsonEntry) {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(new TextDecoder('utf-8').decode(jsonEntry));
      } catch {
        throw new Error('Invalid JSON syntax in backup.json inside ZIP archive.');
      }

      const hydratedJson = this.rehydrateZipCovers(parsedJson, entries);
      const validation = parseBackupJson(hydratedJson);
      if (!validation.success) {
        throw new Error(validation.error);
      }

      const { duplicateBooksCount, newBooksCount } = this.countBookConflicts(
        validation.data.validBooks
      );

      return {
        format: 'zip',
        fileName,
        validBooks: validation.data.validBooks,
        validReadingLogs: validation.data.validReadingLogs,
        validSeriesMetadata: validation.data.validSeriesMetadata,
        readingGoals: validation.data.readingGoals,
        preferences: validation.data.preferences,
        hasPreferences: validation.data.preferences !== null,
        invalidBooksCount: validation.data.invalidBooksCount,
        invalidLogsCount: validation.data.invalidLogsCount,
        invalidSeriesMetadataCount: validation.data.invalidSeriesMetadataCount,
        duplicateBooksCount,
        newBooksCount,
      };
    }

    const csvEntry = this.findZipEntry(entries, 'catalog.csv', '.csv');
    if (csvEntry) {
      const csvText = new TextDecoder('utf-8').decode(csvEntry);
      const csvResult = this.parseCsvCatalog(csvText);
      const validBooks = csvResult.validBooks.map((book) =>
        this.attachZipCoverToBook(book, entries)
      );
      const { duplicateBooksCount, newBooksCount } = this.countBookConflicts(validBooks);

      return {
        format: 'zip',
        fileName,
        validBooks,
        validReadingLogs: [],
        validSeriesMetadata: [],
        readingGoals: null,
        preferences: null,
        hasPreferences: false,
        invalidBooksCount: csvResult.invalidBooksCount,
        invalidLogsCount: 0,
        invalidSeriesMetadataCount: 0,
        duplicateBooksCount,
        newBooksCount,
      };
    }

    throw new Error('ZIP archive does not contain backup.json or catalog.csv.');
  }

  async executeImport(
    preview: ImportPreviewSummary,
    mode: ImportConflictMode,
    options: { applyPreferences?: boolean } = {}
  ): Promise<ImportExecutionResult> {
    const snapshot = await this.captureSnapshot();
    const shouldApplyPreferences = options.applyPreferences ?? true;

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
      if (preview.preferences && shouldApplyPreferences) {
        this.applyPreferences(preview.preferences);
        preferencesRestored = true;
      }

      const allBooks = this.booksService.books();
      const booksWithoutCovers = allBooks.filter((book) => !book.coverUrl?.trim());
      const missingCoversWithIsbnCount = booksWithoutCovers.filter((book) =>
        Boolean(book.isbn && isValidIsbn(book.isbn))
      ).length;
      const incompleteMetadataCount = allBooks.filter((book) => {
        const missingCover = !book.coverUrl?.trim();
        const missingPages = book.totalPages <= 1;
        const missingYear = !book.publicationYear;
        const missingPublisher = !book.publisher?.trim();
        const missingIsbn = !book.isbn || !isValidIsbn(book.isbn);
        return missingCover || missingPages || missingYear || missingPublisher || missingIsbn;
      }).length;

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
        missingCoversCount: booksWithoutCovers.length,
        missingCoversWithIsbnCount,
        incompleteMetadataCount,
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

  async requestPersistentStorage(): Promise<PersistentStorageRequestResult> {
    if (
      typeof navigator === 'undefined' ||
      !('storage' in navigator) ||
      typeof navigator.storage?.persist !== 'function'
    ) {
      return 'unsupported';
    }

    try {
      const granted = await navigator.storage.persist();
      return granted ? 'persisted' : 'denied';
    } catch {
      return 'unsupported';
    }
  }

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
    const persistenceStatus = await this.queryStoragePersistenceStatus();
    const indexedDbInfo = this.storageAdapter.getDatabaseDiagnostics();
    const healthStatus = this.resolveStorageHealthStatus(
      usingIndexedDb,
      totalBookstackBytes,
      quotaEstimate.usageBytes,
      quotaEstimate.quotaBytes
    );

    return {
      engine: usingIndexedDb ? 'indexeddb' : 'localstorage',
      persistenceStatus,
      indexedDbInfo,
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

  private async queryStoragePersistenceStatus(): Promise<StoragePersistenceStatus> {
    if (
      typeof navigator === 'undefined' ||
      !('storage' in navigator) ||
      typeof navigator.storage?.persisted !== 'function'
    ) {
      return 'unsupported';
    }

    try {
      const isPersisted = await navigator.storage.persisted();
      return isPersisted ? 'persisted' : 'best-effort';
    } catch {
      return 'unsupported';
    }
  }

  private captureCurrentPreferences(): BackupPreferences {
    return {
      locale: this.i18n.locale(),
      theme: this.themeService.themeMode(),
      accent: this.themeService.accent(),
      desktopDockPosition: this.dockPositionService.desktopPosition(),
      mobileDockPosition: this.dockPositionService.mobilePosition(),
      catalogViewMode: this.catalogFilterService.viewMode(),
      catalogSort: this.catalogFilterService.sortOption(),
      appPreferences: { ...this.appPreferencesService.preferences() },
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
    if (preferences.accent) {
      this.themeService.setAccent(preferences.accent);
    }
    if (preferences.desktopDockPosition) {
      this.dockPositionService.setDesktopPosition(preferences.desktopDockPosition);
    }
    if (preferences.mobileDockPosition) {
      this.dockPositionService.setMobilePosition(preferences.mobileDockPosition);
    }
    if (preferences.catalogViewMode) {
      this.catalogFilterService.setViewMode(preferences.catalogViewMode);
    }
    if (preferences.catalogSort) {
      this.catalogFilterService.setSortOption(preferences.catalogSort);
    }
    if (preferences.appPreferences) {
      this.appPreferencesService.updatePreferences(preferences.appPreferences);
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
    if (lowerName.includes('.')) {
      throw new Error('Unsupported backup file extension. Use .json or .csv.');
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
      case 'publisher':
        return book.publisher ?? '';
      case 'publicationYear':
        return book.publicationYear !== undefined ? String(book.publicationYear) : '';
      case 'genre':
        return book.genre && book.genre.length > 0 ? book.genre.join('; ') : '';
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
    const currentPageRaw = getCell('currentPage');
    const parsedCurrentPage = currentPageRaw ? Number.parseInt(currentPageRaw, 10) : 0;
    const currentPage =
      Number.isFinite(parsedCurrentPage) && parsedCurrentPage >= 0 ? parsedCurrentPage : 0;
    const totalPagesRaw = getCell('totalPages');
    const parsedTotalPages = totalPagesRaw ? Number.parseInt(totalPagesRaw, 10) : Number.NaN;
    const totalPages =
      Number.isFinite(parsedTotalPages) && parsedTotalPages >= 1
        ? parsedTotalPages
        : Math.max(1, currentPage);

    const ratingRaw = getCell('rating');
    const rating = ratingRaw ? Number.parseFloat(ratingRaw) : undefined;

    const seriesName = getCell('seriesName');
    const seriesOrderRaw = getCell('seriesOrder');
    const seriesOrder = seriesOrderRaw ? Number.parseInt(seriesOrderRaw, 10) : undefined;

    const format = getCell('format') || undefined;
    const startDate = getCell('startDate') || undefined;
    const endDate = getCell('endDate') || undefined;
    const isbn = getCell('isbn') || undefined;
    const publisher = getCell('publisher') || undefined;
    const publicationYearRaw = getCell('publicationYear');
    const publicationYear = publicationYearRaw
      ? Number.parseInt(publicationYearRaw, 10)
      : undefined;
    const genreRaw = getCell('genre');
    const genre = genreRaw
      ? genreRaw
          .split(';')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : undefined;
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
    if (publisher) {
      candidate['publisher'] = publisher;
    }
    if (publicationYear !== undefined && !Number.isNaN(publicationYear)) {
      candidate['publicationYear'] = publicationYear;
    }
    if (genre && genre.length > 0) {
      candidate['genre'] = genre;
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

  private findZipEntry(
    entries: ReadonlyMap<string, Uint8Array>,
    preferredName: string,
    fallbackExtension: string
  ): Uint8Array | null {
    const exact = entries.get(preferredName);
    if (exact) {
      return exact;
    }

    const lowerPreferred = preferredName.toLowerCase();
    for (const [path, data] of entries.entries()) {
      const lowerPath = path.toLowerCase();
      if (lowerPath === lowerPreferred || lowerPath.endsWith(`/${lowerPreferred}`)) {
        return data;
      }
    }

    for (const [path, data] of entries.entries()) {
      if (path.toLowerCase().endsWith(fallbackExtension)) {
        return data;
      }
    }

    return null;
  }

  private rehydrateZipCovers(raw: unknown, entries: ReadonlyMap<string, Uint8Array>): unknown {
    if (Array.isArray(raw)) {
      return raw.map((item) => this.rehydrateZipBookRecord(item, entries));
    }

    if (raw !== null && typeof raw === 'object') {
      const obj = raw as Record<string, unknown>;
      if (Array.isArray(obj['books'])) {
        return {
          ...obj,
          books: obj['books'].map((item) => this.rehydrateZipBookRecord(item, entries)),
        };
      }
    }

    return raw;
  }

  private rehydrateZipBookRecord(raw: unknown, entries: ReadonlyMap<string, Uint8Array>): unknown {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return raw;
    }

    const record = raw as Record<string, unknown>;
    const rawCover = typeof record['coverUrl'] === 'string' ? record['coverUrl'].trim() : '';
    const bookId = typeof record['id'] === 'string' ? record['id'].trim() : '';

    if (rawCover && !rawCover.startsWith('data:') && !rawCover.startsWith('https://')) {
      const normalizedPath = rawCover.replace(/\\/g, '/').replace(/^\.?\//, '');
      const coverBytes = entries.get(normalizedPath);
      if (coverBytes) {
        return {
          ...record,
          coverUrl: binaryToDataUrl(coverBytes, this.resolveCoverMimeType(normalizedPath)),
        };
      }
    }

    if (!rawCover && bookId) {
      const matched = this.findCoverEntryByBookId(bookId, entries);
      if (matched) {
        return {
          ...record,
          coverUrl: matched,
        };
      }
    }

    return record;
  }

  private attachZipCoverToBook(book: Book, entries: ReadonlyMap<string, Uint8Array>): Book {
    if (book.coverUrl?.trim()) {
      return book;
    }
    const matched = this.findCoverEntryByBookId(book.id, entries);
    return matched ? { ...book, coverUrl: matched } : book;
  }

  private findCoverEntryByBookId(
    bookId: string,
    entries: ReadonlyMap<string, Uint8Array>
  ): string | null {
    for (const ext of ['webp', 'jpg', 'jpeg', 'png'] as const) {
      const path = `covers/${bookId}.${ext}`;
      const bytes = entries.get(path);
      if (bytes) {
        return binaryToDataUrl(bytes, this.resolveCoverMimeType(path));
      }
    }
    return null;
  }

  private resolveCoverMimeType(path: string): string {
    const lower = path.toLowerCase();
    if (lower.endsWith('.webp')) {
      return 'image/webp';
    }
    if (lower.endsWith('.png')) {
      return 'image/png';
    }
    return 'image/jpeg';
  }

  private triggerFileDownload(
    content: string | Uint8Array,
    filename: string,
    mimeType: string
  ): void {
    const blobPart: BlobPart = content instanceof Uint8Array ? new Uint8Array(content) : content;
    const blob = new Blob([blobPart], { type: mimeType });
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
