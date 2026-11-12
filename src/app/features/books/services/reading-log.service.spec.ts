import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book, ReadingLog } from '../models/book.model';
import { BooksService } from './books.service';
import { ReadingLogService } from './reading-log.service';

function makeBook(id: string, currentPage = 0): Book {
  return {
    id,
    title: `Book ${id}`,
    author: 'Author',
    totalPages: 300,
    currentPage,
    status: currentPage > 0 ? 'reading' : 'pending',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };
}

function makeLog(overrides: Partial<ReadingLog> = {}): ReadingLog {
  return {
    id: 'log-1',
    bookId: 'book-1',
    date: '2026-02-10',
    pagesRead: 40,
    timeSpentMinutes: 50,
    createdAt: '2026-02-10T10:00:00.000Z',
    ...overrides,
  };
}

describe('ReadingLogService', () => {
  let initialLogs: ReadingLog[];
  let initialBooks: Book[];

  beforeEach(() => {
    initialBooks = [makeBook('book-1', 0), makeBook('book-2', 50)];
    initialLogs = [];

    const storageMock: Pick<StorageAdapterService, 'getAll' | 'set' | 'remove'> = {
      getAll: async <T>(storeName: string): Promise<T[]> => {
        if (storeName === 'books') {
          return initialBooks as T[];
        }
        return initialLogs as T[];
      },
      set: vi.fn(async () => true),
      remove: vi.fn(async () => undefined),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: StorageAdapterService, useValue: storageMock }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add logs, filter by bookId, and apply reading delta to the book', async () => {
    const booksService = TestBed.inject(BooksService);
    const logService = TestBed.inject(ReadingLogService);

    await logService.add(makeLog({ id: 'log-1', bookId: 'book-1', pagesRead: 40 }));

    expect(await logService.getAll()).toHaveLength(1);
    expect(await logService.getById('log-1')).toBeDefined();
    expect(await logService.getByBookId('book-1')).toHaveLength(1);
    expect((await booksService.getById('book-1'))?.currentPage).toBe(40);
  });

  it('should apply page difference when updating a log on the same book or across books', async () => {
    const booksService = TestBed.inject(BooksService);
    const logService = TestBed.inject(ReadingLogService);
    const original = makeLog({ id: 'log-1', bookId: 'book-1', pagesRead: 40 });

    await logService.add(original);
    expect((await booksService.getById('book-1'))?.currentPage).toBe(40);

    await logService.update('log-1', { ...original, pagesRead: 65 });
    expect((await booksService.getById('book-1'))?.currentPage).toBe(65);

    await logService.update('log-1', { ...original, bookId: 'book-2', pagesRead: 30 });
    expect((await booksService.getById('book-1'))?.currentPage).toBe(0);
    expect((await booksService.getById('book-2'))?.currentPage).toBe(80);
  });

  it('should revert reading delta when removing a log', async () => {
    const booksService = TestBed.inject(BooksService);
    const logService = TestBed.inject(ReadingLogService);
    await logService.add(makeLog({ id: 'log-1', bookId: 'book-1', pagesRead: 40 }));

    await logService.remove('log-1');

    expect(await logService.getAll()).toHaveLength(0);
    expect((await booksService.getById('book-1'))?.currentPage).toBe(0);
  });
});
