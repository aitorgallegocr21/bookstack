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
  let storageMock: Pick<
    StorageAdapterService,
    'getAll' | 'set' | 'putMany' | 'remove' | 'replaceStore' | 'clearStore'
  >;

  beforeEach(() => {
    storedRecords = [makeBook(), { id: 'corrupted-book', title: '', totalPages: -5 }];

    storageMock = {
      getAll: async <T>(): Promise<T[]> => storedRecords as T[],
      set: vi.fn(async () => true),
      putMany: vi.fn(async () => true),
      remove: vi.fn(async () => undefined),
      replaceStore: vi.fn(async () => true),
      clearStore: vi.fn(async () => undefined),
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

  it('should toggle global create modal state and manage prefill payload', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const service = TestBed.inject(BooksService);
    expect(service.isCreateModalOpen()).toBe(false);
    expect(service.createModalPrefill()).toBeNull();

    service.openCreateModal({ seriesName: 'Mistborn', seriesVolumeNumber: 2 });
    expect(service.isCreateModalOpen()).toBe(true);
    expect(service.createModalPrefill()).toEqual({
      seriesName: 'Mistborn',
      seriesVolumeNumber: 2,
    });

    service.closeCreateModal();
    expect(service.isCreateModalOpen()).toBe(false);
    expect(service.createModalPrefill()).toBeNull();

    service.openCreateModal();
    expect(service.isCreateModalOpen()).toBe(true);
    expect(service.createModalPrefill()).toBeNull();
  });

  it('should replaceAll and clearAll books atomically in storage and signal', async () => {
    const service = TestBed.inject(BooksService);
    await service.add(makeBook({ id: 'book-1', title: 'Original' }));

    const replacement = [
      makeBook({ id: 'book-2', title: 'Replaced 1' }),
      makeBook({ id: 'book-3', title: 'Replaced 2' }),
    ];
    await service.replaceAll(replacement);

    expect(service.books().map((b) => b.id)).toEqual(['book-2', 'book-3']);
    expect((await service.getAll()).map((b) => b.id)).toEqual(['book-2', 'book-3']);

    await service.clearAll();
    expect(service.books()).toEqual([]);
    expect(await service.getAll()).toEqual([]);
  });

  it('should batch-update multiple books with updateMany in a single signal update', async () => {
    const service = TestBed.inject(BooksService);
    await service.replaceAll([
      makeBook({ id: 'b1', title: 'Book 1', currentPage: 10 }),
      makeBook({ id: 'b2', title: 'Book 2', currentPage: 20 }),
      makeBook({ id: 'b3', title: 'Book 3', currentPage: 30 }),
    ]);

    expect(await service.updateMany([])).toBe(true);

    const updated = await service.updateMany([
      makeBook({ id: 'b1', title: 'Book 1 Updated', currentPage: 50 }),
      makeBook({ id: 'b3', title: 'Book 3 Updated', currentPage: 90 }),
    ]);
    expect(updated).toBe(true);

    expect(service.books().map((b) => [b.id, b.title, b.currentPage])).toEqual([
      ['b1', 'Book 1 Updated', 50],
      ['b2', 'Book 2', 20],
      ['b3', 'Book 3 Updated', 90],
    ]);
    expect((await service.getById('b1'))?.currentPage).toBe(50);
    expect((await service.getById('b3'))?.currentPage).toBe(90);
  });
});
