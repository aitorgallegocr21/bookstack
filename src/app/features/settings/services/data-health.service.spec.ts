import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nService } from '../../../core/i18n/i18n.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { Book, ReadingLog } from '../../books/models/book.model';
import { BooksService } from '../../books/services/books.service';
import { ReadingLogService } from '../../books/services/reading-log.service';
import { SeriesMetadata } from '../../series/models/series.model';
import { SeriesService } from '../../series/services/series.service';
import { DataHealthService } from './data-health.service';

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'El camino de los reyes',
    author: 'Brandon Sanderson',
    totalPages: 1200,
    currentPage: 1200,
    status: 'completed',
    publicationYear: 2010,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeLog(overrides: Partial<ReadingLog> = {}): ReadingLog {
  return {
    id: 'log-1',
    bookId: 'book-1',
    date: '2025-02-10',
    pagesRead: 40,
    createdAt: '2025-02-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('DataHealthService', () => {
  let service: DataHealthService;
  let booksSignal: ReturnType<typeof signal<Book[]>>;
  let logsSignal: ReturnType<typeof signal<ReadingLog[]>>;
  let metadataSignal: ReturnType<typeof signal<SeriesMetadata[]>>;

  const updateBookMock = vi.fn<(id: string, book: Book) => Promise<void>>();
  const updateManyMock = vi.fn<(books: Book[]) => Promise<boolean>>();
  const removeBookMock = vi.fn<(id: string) => Promise<void>>();
  const updateLogMock = vi.fn<(id: string, log: ReadingLog) => Promise<void>>();
  const confirmMock = vi.fn<() => Promise<boolean>>();

  beforeEach(() => {
    vi.clearAllMocks();
    booksSignal = signal<Book[]>([]);
    logsSignal = signal<ReadingLog[]>([]);
    metadataSignal = signal<SeriesMetadata[]>([]);

    updateBookMock.mockResolvedValue(undefined);
    updateManyMock.mockResolvedValue(true);
    removeBookMock.mockResolvedValue(undefined);
    updateLogMock.mockResolvedValue(undefined);
    confirmMock.mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        DataHealthService,
        {
          provide: BooksService,
          useValue: {
            books: booksSignal.asReadonly(),
            update: updateBookMock,
            updateMany: updateManyMock,
            remove: removeBookMock,
          },
        },
        {
          provide: ReadingLogService,
          useValue: {
            readingLogs: logsSignal.asReadonly(),
            update: updateLogMock,
          },
        },
        {
          provide: SeriesService,
          useValue: {
            metadata: metadataSignal.asReadonly(),
          },
        },
        {
          provide: ConfirmDialogService,
          useValue: {
            confirm: confirmMock,
          },
        },
      ],
    });

    TestBed.inject(I18nService).setLocale('es');
    service = TestBed.inject(DataHealthService);
  });

  it('reports 100% healthy when library has no anomalies', () => {
    booksSignal.set([makeBook()]);
    logsSignal.set([makeLog()]);

    const report = service.report();
    expect(report.totalIssuesCount).toBe(0);
    expect(report.autoFixableCount).toBe(0);
    expect(report.healthScorePercent).toBe(100);
  });

  it('detects and fixes temporal anomalies (2925 year, inverted dates, anomalous log date)', async () => {
    const anomalousBook = makeBook({
      id: 'b-temp',
      publicationYear: 2925,
      startDate: '2925-04-12',
      endDate: '2024-03-01',
    });
    const invertedBook = makeBook({
      id: 'b-inv',
      startDate: '2025-06-15',
      endDate: '2025-05-01',
    });
    const anomalousLog = makeLog({
      id: 'l-temp',
      bookId: 'b-inv',
      date: '2925-05-10',
    });

    booksSignal.set([anomalousBook, invertedBook]);
    logsSignal.set([anomalousLog]);

    const report = service.report();
    const temporal = report.issuesByCategory['temporal-anomaly'];
    expect(temporal.length).toBe(5);
    expect(temporal.every((issue) => issue.canAutoFix)).toBe(true);

    expect(await service.applyIssueFix('temporal-book-pubyear:b-temp')).toBe(true);
    expect(updateBookMock).toHaveBeenCalledWith(
      'b-temp',
      expect.objectContaining({ publicationYear: 2025 })
    );

    expect(await service.applyIssueFix('temporal-book-startdate:b-temp')).toBe(true);
    expect(updateBookMock).toHaveBeenCalledWith(
      'b-temp',
      expect.objectContaining({ startDate: '2025-04-12' })
    );

    expect(await service.applyIssueFix('temporal-book-inverted:b-inv')).toBe(true);
    expect(updateBookMock).toHaveBeenCalledWith(
      'b-inv',
      expect.objectContaining({ startDate: '2025-05-01', endDate: '2025-06-15' })
    );

    expect(await service.applyIssueFix('temporal-log-date:l-temp')).toBe(true);
    expect(updateLogMock).toHaveBeenCalledWith(
      'l-temp',
      expect.objectContaining({ date: '2025-05-10' })
    );
  });

  it('detects progress mismatches and distinguishes auto-fixable vs manual issues', async () => {
    const completedBehind = makeBook({
      id: 'b-behind',
      status: 'completed',
      totalPages: 500,
      currentPage: 320,
    });
    const placeholderBook = makeBook({
      id: 'b-placeholder',
      status: 'completed',
      totalPages: 1,
      currentPage: 1,
    });
    const pendingWithProgress = makeBook({
      id: 'b-pending',
      status: 'pending',
      totalPages: 400,
      currentPage: 45,
    });

    booksSignal.set([completedBehind, placeholderBook, pendingWithProgress]);

    const progressIssues = service.report().issuesByCategory['progress-mismatch'];
    expect(progressIssues.length).toBe(3);

    const placeholderIssue = progressIssues.find(
      (i) => i.id === 'progress-completed-placeholder:b-placeholder'
    );
    expect(placeholderIssue?.canAutoFix).toBe(false);
    expect(await service.applyIssueFix('progress-completed-placeholder:b-placeholder')).toBe(false);

    expect(await service.applyIssueFix('progress-completed-pages:b-behind')).toBe(true);
    expect(updateBookMock).toHaveBeenCalledWith(
      'b-behind',
      expect.objectContaining({ currentPage: 500 })
    );

    expect(await service.applyIssueFix('progress-pending-progress:b-pending')).toBe(true);
    expect(updateBookMock).toHaveBeenCalledWith(
      'b-pending',
      expect.objectContaining({ status: 'reading' })
    );
  });

  it('detects probable duplicates by ISBN and title+author and removes redundant copy only after confirmation', async () => {
    const completeIsbnBook = makeBook({
      id: 'b-isbn-best',
      isbn: '978-84-666-5766-2',
      coverUrl: 'data:image/png;base64,abc',
      totalPages: 1200,
      currentPage: 1200,
    });
    const sparseIsbnDuplicate = makeBook({
      id: 'b-isbn-dup',
      isbn: '9788466657662',
      totalPages: 0,
      currentPage: 0,
    });
    const titleAuthorA = makeBook({
      id: 'b-ta-1',
      title: 'Dune',
      author: 'Frank Herbert',
      coverUrl: 'data:image/png;base64,dune',
    });
    const titleAuthorB = makeBook({
      id: 'b-ta-2',
      title: '  dune ',
      author: 'frank herbert',
      totalPages: 1,
      currentPage: 0,
    });

    booksSignal.set([sparseIsbnDuplicate, completeIsbnBook, titleAuthorB, titleAuthorA]);

    const dupIssues = service.report().issuesByCategory['duplicate-book'];
    expect(dupIssues.length).toBe(2);
    expect(dupIssues.every((i) => !i.canAutoFix)).toBe(true);

    const isbnIssue = dupIssues.find((i) => i.id.startsWith('duplicate-book:isbn:'));
    expect(isbnIssue?.affectedBookIds).toEqual(['b-isbn-best', 'b-isbn-dup']);

    confirmMock.mockResolvedValueOnce(false);
    expect(await service.applyIssueFix(isbnIssue!.id)).toBe(false);
    expect(removeBookMock).not.toHaveBeenCalled();

    confirmMock.mockResolvedValueOnce(true);
    expect(await service.applyIssueFix(isbnIssue!.id)).toBe(true);
    expect(removeBookMock).toHaveBeenCalledWith('b-isbn-dup');
  });

  it('detects fragmented saga names and missing volume numbers and unifies saga names', async () => {
    const vol1 = makeBook({
      id: 'b-s1',
      series: { id: 'saga-1', name: 'El Archivo de las Tormentas', volumeNumber: 1 },
    });
    const vol2 = makeBook({
      id: 'b-s2',
      series: { id: 'saga-1', name: 'el archivo de las tormentas ', volumeNumber: 2 },
    });
    const volMissing = makeBook({
      id: 'b-s3',
      series: { id: 'saga-1', name: 'El Archivo de las Tormentas' },
    });

    booksSignal.set([vol1, vol2, volMissing]);

    const sagaIssues = service.report().issuesByCategory['fragmented-saga'];
    expect(sagaIssues.length).toBe(2);

    const nameIssue = sagaIssues.find((i) => i.id.startsWith('saga-fragmented-name:'));
    expect(nameIssue?.canAutoFix).toBe(true);
    expect(nameIssue?.suggestedValueLabel).toBe('El Archivo de las Tormentas');

    expect(await service.applyIssueFix(nameIssue!.id)).toBe(true);
    expect(updateManyMock).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'b-s2',
        series: { id: 'saga-1', name: 'El Archivo de las Tormentas', volumeNumber: 2 },
      }),
    ]);
  });

  it('applies all auto-fixable issues after confirmation and skips manual ones', async () => {
    booksSignal.set([
      makeBook({ id: 'b1', publicationYear: 2925 }),
      makeBook({ id: 'b2', status: 'completed', totalPages: 1, currentPage: 1 }),
    ]);

    confirmMock.mockResolvedValueOnce(false);
    expect(await service.applyAllAutoFixes()).toBe(0);
    expect(updateBookMock).not.toHaveBeenCalled();

    confirmMock.mockResolvedValueOnce(true);
    expect(await service.applyAllAutoFixes()).toBe(1);
    expect(updateBookMock).toHaveBeenCalledTimes(1);
  });
});
