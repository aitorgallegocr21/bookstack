import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book } from '../models/book.model';
import { BooksService } from './books.service';

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    title: 'El Nombre del Viento',
    author: 'Patrick Rothfuss',
    totalPages: 500,
    currentPage: 0,
    status: 'pending',
    format: 'Físico',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('BooksService', () => {
  let storedRecords: unknown[];
  let storageMock: Pick<StorageAdapterService, 'getAll' | 'set' | 'remove'>;

  beforeEach(() => {
    storedRecords = [makeBook(), { id: 'corrupted-book', title: '', totalPages: -5 }];

    storageMock = {
      getAll: async <T>(): Promise<T[]> => storedRecords as T[],
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

  it('should initialize from storage and discard corrupted records via Zod', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = TestBed.inject(BooksService);

    const books = await service.getAll();
    expect(books).toHaveLength(1);
    expect(books[0].id).toBe('book-1');
  });

  it('should add, getById, update, and remove books', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = TestBed.inject(BooksService);
    const created = makeBook({ id: 'book-2', title: 'El Temor de un Hombre Sabio' });

    await service.add(created);
    expect(await service.getById('book-2')).toEqual(created);

    const updated = { ...created, title: 'Updated Title' };
    await service.update('book-2', updated);
    expect((await service.getById('book-2'))?.title).toBe('Updated Title');

    await service.remove('book-2');
    expect(await service.getById('book-2')).toBeUndefined();
  });

  it('should apply reading deltas with status transitions and page clamping', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = TestBed.inject(BooksService);

    // pending (0/500) + 120 -> reading (120/500)
    await service.applyReadingDelta('book-1', 120);
    let book = await service.getById('book-1');
    expect(book?.currentPage).toBe(120);
    expect(book?.status).toBe('reading');

    // reading (120/500) + 500 -> completed (clamped at 500/500)
    await service.applyReadingDelta('book-1', 500);
    book = await service.getById('book-1');
    expect(book?.currentPage).toBe(500);
    expect(book?.status).toBe('completed');

    // completed (500/500) - 50 -> reading (450/500)
    await service.applyReadingDelta('book-1', -50);
    book = await service.getById('book-1');
    expect(book?.currentPage).toBe(450);
    expect(book?.status).toBe('reading');

    // No-op on zero, NaN, or unknown book
    await service.applyReadingDelta('book-1', 0);
    await service.applyReadingDelta('missing-id', 25);
    expect((await service.getById('book-1'))?.currentPage).toBe(450);
  });

  it('should toggle global create modal state', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = TestBed.inject(BooksService);
    expect(service.isCreateModalOpen()).toBe(false);

    service.openCreateModal();
    expect(service.isCreateModalOpen()).toBe(true);

    service.closeCreateModal();
    expect(service.isCreateModalOpen()).toBe(false);
  });
});
