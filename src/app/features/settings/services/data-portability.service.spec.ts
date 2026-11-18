import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { I18nService } from '../../../core/i18n/i18n.service';
import { SupportedLocale } from '../../../core/i18n/i18n.types';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { ThemeService } from '../../../core/services/theme.service';
import {
  Book,
  DEFAULT_READING_GOALS,
  ReadingGoals,
  ReadingLog,
} from '../../books/models/book.model';
import {
  CatalogSortOption,
  CatalogViewMode,
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_VIEW_MODE,
} from '../../books/models/catalog-filter.model';
import { BooksService } from '../../books/services/books.service';
import { CatalogFilterService } from '../../books/services/catalog-filter.service';
import { ReadingLogService } from '../../books/services/reading-log.service';
import { ReadingStatsService } from '../../books/services/reading-stats.service';
import { SeriesMetadata } from '../../series/models/series.model';
import { SeriesService } from '../../series/services/series.service';
import { DataPortabilityService } from './data-portability.service';

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  title: 'El Quijote',
  author: 'Miguel de Cervantes',
  totalPages: 863,
  currentPage: 120,
  status: 'reading',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-05T10:00:00.000Z',
  ...overrides,
});

const makeLog = (overrides: Partial<ReadingLog> = {}): ReadingLog => ({
  id: 'log-1',
  bookId: 'book-1',
  date: '2026-01-05',
  pagesRead: 40,
  timeSpentMinutes: 55,
  createdAt: '2026-01-05T10:00:00.000Z',
  ...overrides,
});

describe('DataPortabilityService', () => {
  let service: DataPortabilityService;

  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;
  let goalsSignal: ReturnType<typeof signal<ReadingGoals>>;
  let localeSignal: ReturnType<typeof signal<SupportedLocale>>;
  let viewModeSignal: ReturnType<typeof signal<CatalogViewMode>>;
  let sortOptionSignal: ReturnType<typeof signal<CatalogSortOption>>;
  let currentTheme: 'light' | 'dark';

  let booksServiceMock: {
    books: ReturnType<typeof signal<Book[]>>;
    replaceAll: ReturnType<typeof vi.fn>;
    clearAll: ReturnType<typeof vi.fn>;
  };
  let readingLogServiceMock: {
    readingLogs: ReturnType<typeof signal<ReadingLog[]>>;
    replaceAll: ReturnType<typeof vi.fn>;
    clearAll: ReturnType<typeof vi.fn>;
  };
  let readingStatsServiceMock: {
    goals: ReturnType<typeof signal<ReadingGoals>>;
    saveGoals: ReturnType<typeof vi.fn>;
  };
  let catalogFilterServiceMock: {
    viewMode: ReturnType<typeof signal<CatalogViewMode>>;
    sortOption: ReturnType<typeof signal<CatalogSortOption>>;
    setViewMode: ReturnType<typeof vi.fn>;
    setSortOption: ReturnType<typeof vi.fn>;
  };
  let seriesMetadataSignal: ReturnType<typeof signal<SeriesMetadata[]>>;
  let seriesServiceMock: {
    metadata: ReturnType<typeof signal<SeriesMetadata[]>>;
    ensureInitialized: ReturnType<typeof vi.fn>;
    replaceAllMetadata: ReturnType<typeof vi.fn>;
    clearAllMetadata: ReturnType<typeof vi.fn>;
  };
  let storageAdapterMock: {
    isUsingIndexedDb: ReturnType<typeof vi.fn>;
    estimateBrowserQuota: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    replaceStore: ReturnType<typeof vi.fn>;
    clearStore: ReturnType<typeof vi.fn>;
  };
  let themeServiceMock: {
    getTheme: ReturnType<typeof vi.fn>;
    setTheme: ReturnType<typeof vi.fn>;
  };
  let i18nServiceMock: {
    locale: ReturnType<typeof signal<SupportedLocale>>;
    setLocale: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    booksSignal = signal<Book[]>([makeBook()]);
    logsSignal = signal<ReadingLog[]>([makeLog()]);
    goalsSignal = signal<ReadingGoals>({ year: 2026, targetBooks: 24, targetPages: 6000 });
    localeSignal = signal<SupportedLocale>('es');
    viewModeSignal = signal<CatalogViewMode>('grid');
    sortOptionSignal = signal<CatalogSortOption>('recent');
    currentTheme = 'light';

    booksServiceMock = {
      books: booksSignal,
      replaceAll: vi.fn(async (nextBooks: Book[]) => {
        booksSignal.set([...nextBooks]);
      }),
      clearAll: vi.fn(async () => {
        booksSignal.set([]);
      }),
    };

    readingLogServiceMock = {
      readingLogs: logsSignal,
      replaceAll: vi.fn(async (nextLogs: ReadingLog[]) => {
        logsSignal.set([...nextLogs]);
      }),
      clearAll: vi.fn(async () => {
        logsSignal.set([]);
      }),
    };

    readingStatsServiceMock = {
      goals: goalsSignal,
      saveGoals: vi.fn((nextGoals: ReadingGoals) => {
        goalsSignal.set({ ...nextGoals });
        return true;
      }),
    };

    catalogFilterServiceMock = {
      viewMode: viewModeSignal,
      sortOption: sortOptionSignal,
      setViewMode: vi.fn((mode: CatalogViewMode) => {
        viewModeSignal.set(mode);
      }),
      setSortOption: vi.fn((sort: CatalogSortOption) => {
        sortOptionSignal.set(sort);
      }),
    };

    seriesMetadataSignal = signal<SeriesMetadata[]>([]);
    seriesServiceMock = {
      metadata: seriesMetadataSignal,
      ensureInitialized: vi.fn(async () => undefined),
      replaceAllMetadata: vi.fn(async (items: SeriesMetadata[]) => {
        seriesMetadataSignal.set([...items]);
      }),
      clearAllMetadata: vi.fn(async () => {
        seriesMetadataSignal.set([]);
      }),
    };
    storageAdapterMock = {
      isUsingIndexedDb: vi.fn(async () => true),
      estimateBrowserQuota: vi.fn(async () => ({
        usageBytes: 500_000,
        quotaBytes: 100_000_000,
      })),
      getAll: vi.fn(async () => []),
      replaceStore: vi.fn(async () => true),
      clearStore: vi.fn(async () => undefined),
    };

    themeServiceMock = {
      getTheme: vi.fn(() => currentTheme),
      setTheme: vi.fn((theme: 'light' | 'dark') => {
        currentTheme = theme;
      }),
    };

    i18nServiceMock = {
      locale: localeSignal,
      setLocale: vi.fn((loc: SupportedLocale) => {
        localeSignal.set(loc);
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        DataPortabilityService,
        { provide: BooksService, useValue: booksServiceMock },
        { provide: ReadingLogService, useValue: readingLogServiceMock },
        { provide: ReadingStatsService, useValue: readingStatsServiceMock },
        { provide: SeriesService, useValue: seriesServiceMock },
        { provide: CatalogFilterService, useValue: catalogFilterServiceMock },
        { provide: StorageAdapterService, useValue: storageAdapterMock },
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: I18nService, useValue: i18nServiceMock },
      ],
    });

    service = TestBed.inject(DataPortabilityService);
  });

  describe('JSON backup export & round-trip import', () => {
    it('builds a valid BookstackBackupEnvelope with books, logs, seriesMetadata, goals, and preferences', async () => {
      seriesMetadataSignal.set([
        {
          id: 'series-1',
          normalizedKey: 'cosmere',
          name: 'Cosmere',
          expectedVolumes: 10,
          publicationStatus: 'ongoing',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ]);
      const envelope = await service.buildJsonBackupEnvelope();

      expect(envelope.schemaVersion).toBe(1);
      expect(envelope.app).toBe('BookStack');
      expect(Date.parse(envelope.exportedAt)).not.toBeNaN();
      expect(envelope.books).toHaveLength(1);
      expect(envelope.readingLogs).toHaveLength(1);
      expect(envelope.seriesMetadata).toHaveLength(1);
      expect(envelope.readingGoals).toEqual({ year: 2026, targetBooks: 24, targetPages: 6000 });
      expect(envelope.preferences).toEqual({
        locale: 'es',
        theme: 'light',
        catalogViewMode: 'grid',
        catalogSort: 'recent',
      });
    });

    it('analyzes a JSON backup with partial invalid records and counts duplicates vs new books', () => {
      const payload = {
        schemaVersion: 1,
        app: 'BookStack',
        exportedAt: '2026-02-01T00:00:00.000Z',
        books: [
          makeBook({ id: 'incoming-dup', title: '  el quijote ', author: 'MIGUEL DE CERVANTES' }),
          makeBook({ id: 'book-2', title: 'Dune', author: 'Frank Herbert', totalPages: 600 }),
          { id: 'bad-book', title: '', totalPages: -10 },
        ],
        readingLogs: [
          makeLog({ id: 'log-2', bookId: 'incoming-dup' }),
          { id: 'bad-log', pagesRead: -5 },
        ],
        readingGoals: { year: 2026, targetBooks: 30, targetPages: 8000 },
        preferences: { locale: 'en', theme: 'dark' },
      };

      const preview = service.analyzeImportFile('backup.json', JSON.stringify(payload));

      expect(preview.format).toBe('json');
      expect(preview.validBooks).toHaveLength(2);
      expect(preview.validReadingLogs).toHaveLength(1);
      expect(preview.invalidBooksCount).toBe(1);
      expect(preview.invalidLogsCount).toBe(1);
      expect(preview.duplicateBooksCount).toBe(1);
      expect(preview.newBooksCount).toBe(1);
    });

    it('executes merge mode preserving matched book id and remapping incoming readingLog bookId', async () => {
      const payload = {
        schemaVersion: 1,
        app: 'BookStack',
        exportedAt: '2026-02-01T00:00:00.000Z',
        books: [
          makeBook({
            id: 'external-quijote-id',
            title: 'El Quijote',
            author: 'Miguel de Cervantes',
            currentPage: 350,
          }),
          makeBook({ id: 'book-2', title: 'Dune', author: 'Frank Herbert', totalPages: 600 }),
        ],
        readingLogs: [makeLog({ id: 'log-2', bookId: 'external-quijote-id', pagesRead: 30 })],
        readingGoals: { year: 2026, targetBooks: 30, targetPages: 8000 },
        preferences: { locale: 'en', theme: 'dark' },
      };

      const preview = service.analyzeImportFile('backup.json', JSON.stringify(payload));
      const result = await service.executeImport(preview, 'merge');

      expect(result.mode).toBe('merge');
      expect(result.booksImported).toBe(2);
      expect(result.logsImported).toBe(1);
      expect(result.goalsRestored).toBe(true);
      expect(result.preferencesRestored).toBe(true);

      const storedBooks = booksSignal();
      expect(storedBooks).toHaveLength(2);
      expect(storedBooks[0].id).toBe('book-1');
      expect(storedBooks[0].currentPage).toBe(350);
      expect(storedBooks[1].id).toBe('book-2');

      const storedLogs = logsSignal();
      expect(storedLogs).toHaveLength(2);
      expect(storedLogs[1].bookId).toBe('book-1');
      expect(localeSignal()).toBe('en');
      expect(currentTheme).toBe('dark');
    });

    it('executes overwrite mode replacing all books, logs, goals, and preferences', async () => {
      const payload = {
        schemaVersion: 1,
        app: 'BookStack',
        exportedAt: '2026-02-01T00:00:00.000Z',
        books: [
          makeBook({ id: 'book-99', title: '1984', author: 'George Orwell', totalPages: 328 }),
        ],
        readingLogs: [],
      };

      const preview = service.analyzeImportFile('backup.json', JSON.stringify(payload));
      const result = await service.executeImport(preview, 'overwrite');

      expect(result.mode).toBe('overwrite');
      expect(result.missingCoversCount).toBe(1);
      expect(result.missingCoversWithIsbnCount).toBe(0);
      expect(booksSignal()).toHaveLength(1);
      expect(booksSignal()[0].id).toBe('book-99');
      expect(logsSignal()).toHaveLength(0);
    });

    it('reports missingCoversCount and missingCoversWithIsbnCount after import', async () => {
      const payload = {
        schemaVersion: 1,
        app: 'BookStack',
        exportedAt: '2026-02-01T00:00:00.000Z',
        books: [
          makeBook({
            id: 'has-cover',
            title: 'With Cover',
            author: 'A',
            isbn: '9780441172719',
            coverUrl: 'data:image/webp;base64,xyz',
          }),
          makeBook({
            id: 'missing-with-isbn',
            title: 'Missing ISBN Cover',
            author: 'B',
            isbn: '0441172717',
          }),
          makeBook({
            id: 'missing-no-isbn',
            title: 'Missing Plain',
            author: 'C',
          }),
        ],
        readingLogs: [],
      };

      const preview = service.analyzeImportFile('backup.json', JSON.stringify(payload));
      const result = await service.executeImport(preview, 'overwrite');

      expect(result.missingCoversCount).toBe(2);
      expect(result.missingCoversWithIsbnCount).toBe(1);
    });

    it('rolls back snapshot if persistence throws during executeImport', async () => {
      readingLogServiceMock.replaceAll.mockRejectedValueOnce(new Error('IndexedDB write failed'));

      const payload = {
        schemaVersion: 1,
        app: 'BookStack',
        exportedAt: '2026-02-01T00:00:00.000Z',
        books: [
          makeBook({ id: 'book-99', title: '1984', author: 'George Orwell', totalPages: 328 }),
        ],
        readingLogs: [makeLog({ id: 'log-99', bookId: 'book-99' })],
      };

      const preview = service.analyzeImportFile('backup.json', JSON.stringify(payload));

      await expect(service.executeImport(preview, 'overwrite')).rejects.toThrow(
        'IndexedDB write failed'
      );

      expect(booksSignal()).toHaveLength(1);
      expect(booksSignal()[0].id).toBe('book-1');
      expect(logsSignal()).toHaveLength(1);
      expect(logsSignal()[0].id).toBe('log-1');
    });
  });

  describe('RFC 4180 CSV export & import with formula guard', () => {
    it('exports CSV with UTF-8 BOM, formula-injection sanitization, and RFC 4180 quoting', () => {
      booksSignal.set([
        makeBook({
          title: '=cmd|" /C calc"!A0',
          author: 'Author, "Quoted"',
          notes: '+SUM(1,2)',
        }),
      ]);

      const csv = service.exportCsvCatalog();

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('"\'=cmd|"" /C calc""!A0"');
      expect(csv).toContain('"Author, ""Quoted"""');
      expect(csv).toContain("'+SUM(1,2)");
    });

    it('parses exported CSV back and strips formula guards while preserving embedded commas/quotes', () => {
      booksSignal.set([
        makeBook({
          title: '=SUM(A1:A2)',
          author: 'Cervantes, Miguel',
          notes: 'He said "Hola"',
          series: { id: 'la-mancha', name: 'La Mancha', volumeNumber: 1 },
        }),
      ]);

      const csv = service.exportCsvCatalog();
      const parsed = service.parseCsvCatalog(csv);

      expect(parsed.invalidBooksCount).toBe(0);
      expect(parsed.validBooks).toHaveLength(1);
      expect(parsed.validBooks[0].title).toBe('=SUM(A1:A2)');
      expect(parsed.validBooks[0].author).toBe('Cervantes, Miguel');
      expect(parsed.validBooks[0].notes).toBe('He said "Hola"');
      expect(parsed.validBooks[0].series?.name).toBe('La Mancha');
      expect(parsed.validBooks[0].series?.volumeNumber).toBe(1);
    });

    it('imports external CSV rows without id/timestamps and detects duplicates by title + author', () => {
      const externalCsv = [
        'title,author,status,totalPages,currentPage',
        'El Quijote,Miguel de Cervantes,reading,863,400',
        'Foundation,Isaac Asimov,completed,255,255',
        'Invalid Book,Unknown,reading,0,10',
      ].join('\n');

      const preview = service.analyzeImportFile('books.csv', externalCsv);

      expect(preview.format).toBe('csv');
      expect(preview.validBooks).toHaveLength(2);
      expect(preview.invalidBooksCount).toBe(1);
      expect(preview.duplicateBooksCount).toBe(1);
      expect(preview.newBooksCount).toBe(1);
    });

    it('rejects unrelated CSV headers and unsupported file extensions', () => {
      const unrelatedCsv = 'account,balance,currency\nES00,1200,EUR';
      const csvPreview = service.analyzeImportFile('bank.csv', unrelatedCsv);
      expect(csvPreview.validBooks).toEqual([]);

      expect(() => service.analyzeImportFile('notes.txt', '{"books":[]}')).toThrow(
        'Unsupported backup file extension. Use .json or .csv.'
      );
    });
  });

  describe('Destructive reset operations', () => {
    it('clearReadingSessionsOnly clears logs while keeping books intact', async () => {
      await service.clearReadingSessionsOnly();

      expect(readingLogServiceMock.clearAll).toHaveBeenCalledTimes(1);
      expect(booksServiceMock.clearAll).not.toHaveBeenCalled();
      expect(logsSignal()).toEqual([]);
      expect(booksSignal()).toHaveLength(1);
    });

    it('factoryResetAllData clears books, logs, and resets goals and preferences', async () => {
      localeSignal.set('en');
      viewModeSignal.set('compact');
      sortOptionSignal.set('title-asc');

      await service.factoryResetAllData();

      expect(booksSignal()).toEqual([]);
      expect(logsSignal()).toEqual([]);
      expect(goalsSignal()).toEqual({
        ...DEFAULT_READING_GOALS,
        year: new Date().getFullYear(),
      });
      expect(localeSignal()).toBe('es');
      expect(viewModeSignal()).toBe(DEFAULT_CATALOG_VIEW_MODE);
      expect(sortOptionSignal()).toBe(DEFAULT_CATALOG_SORT);
    });
  });

  describe('Storage footprint & quota inspector', () => {
    it('separates Base64 cover bytes from book metadata, logs, and preferences', async () => {
      const fakeBase64Cover = `data:image/webp;base64,${'A'.repeat(2048)}`;
      booksSignal.set([makeBook({ coverUrl: fakeBase64Cover })]);

      const breakdown = await service.computeStorageBreakdown();

      expect(breakdown.engine).toBe('indexeddb');
      expect(breakdown.booksCount).toBe(1);
      expect(breakdown.coversCount).toBe(1);
      expect(breakdown.coversBase64Bytes).toBe(
        new TextEncoder().encode(fakeBase64Cover).byteLength
      );
      expect(breakdown.booksMetadataBytes).toBeLessThan(breakdown.coversBase64Bytes);
      expect(breakdown.readingLogsBytes).toBeGreaterThan(0);
      expect(breakdown.preferencesBytes).toBeGreaterThan(0);
      expect(breakdown.totalBookstackBytes).toBe(
        breakdown.booksMetadataBytes +
          breakdown.coversBase64Bytes +
          breakdown.readingLogsBytes +
          breakdown.preferencesBytes
      );
      expect(breakdown.healthStatus).toBe('healthy');
    });

    it('reports moderate and near-limit health statuses based on browser quota and localStorage fallback', async () => {
      storageAdapterMock.estimateBrowserQuota.mockResolvedValueOnce({
        usageBytes: 70_000_000,
        quotaBytes: 100_000_000,
      });
      const moderate = await service.computeStorageBreakdown();
      expect(moderate.healthStatus).toBe('moderate');

      storageAdapterMock.estimateBrowserQuota.mockResolvedValueOnce({
        usageBytes: 90_000_000,
        quotaBytes: 100_000_000,
      });
      const nearLimitQuota = await service.computeStorageBreakdown();
      expect(nearLimitQuota.healthStatus).toBe('near-limit');

      storageAdapterMock.isUsingIndexedDb.mockResolvedValue(false);
      booksSignal.set([makeBook({ coverUrl: `data:image/webp;base64,${'B'.repeat(4_300_000)}` })]);
      const localStorageNearLimit = await service.computeStorageBreakdown();
      expect(localStorageNearLimit.engine).toBe('localstorage');
      expect(localStorageNearLimit.healthStatus).toBe('near-limit');
    });

    it('exports, merges, overwrites, resets, and measures seriesMetadata in backups and storage', async () => {
      const existingSeries: SeriesMetadata = {
        id: 'series-local-1',
        normalizedKey: 'dune',
        name: 'Dune',
        expectedVolumes: 6,
        publicationStatus: 'completed',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-10T00:00:00.000Z',
      };
      seriesMetadataSignal.set([existingSeries]);

      const beforeBreakdown = await service.computeStorageBreakdown();
      seriesMetadataSignal.set([]);
      const emptySeriesBreakdown = await service.computeStorageBreakdown();
      expect(beforeBreakdown.booksMetadataBytes).toBeGreaterThan(
        emptySeriesBreakdown.booksMetadataBytes
      );

      seriesMetadataSignal.set([existingSeries]);
      const payload = {
        schemaVersion: 1,
        app: 'BookStack',
        exportedAt: '2026-02-01T00:00:00.000Z',
        books: [makeBook()],
        readingLogs: [],
        seriesMetadata: [
          {
            id: 'series-incoming-dune',
            normalizedKey: 'dune',
            name: 'Dune Saga',
            expectedVolumes: 8,
            publicationStatus: 'completed',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z',
          },
          {
            id: 'series-2',
            normalizedKey: 'cosmere',
            name: 'Cosmere',
            expectedVolumes: 10,
            publicationStatus: 'ongoing',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-05T00:00:00.000Z',
          },
          { id: 'bad-series', name: '' },
        ],
      };

      const preview = service.analyzeImportFile('backup.json', JSON.stringify(payload));
      expect(preview.validSeriesMetadata).toHaveLength(2);
      expect(preview.invalidSeriesMetadataCount).toBe(1);

      const mergeResult = await service.executeImport(preview, 'merge');
      expect(mergeResult.seriesMetadataImported).toBe(2);
      expect(mergeResult.skippedRecords).toBe(1);
      expect(seriesServiceMock.replaceAllMetadata).toHaveBeenCalledTimes(1);
      expect(seriesMetadataSignal()).toHaveLength(2);
      expect(seriesMetadataSignal()[0]).toMatchObject({
        id: 'series-local-1',
        name: 'Dune Saga',
        expectedVolumes: 8,
      });

      await service.factoryResetAllData();
      expect(seriesServiceMock.clearAllMetadata).toHaveBeenCalledTimes(1);
      expect(seriesMetadataSignal()).toEqual([]);
    });
  });
});
