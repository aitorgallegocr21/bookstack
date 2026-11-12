import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { StorageAdapterService } from './storage-adapter.service';

interface TestRecord {
  id: string;
  label: string;
}

describe('StorageAdapterService', () => {
  let service: StorageAdapterService;
  const originalIndexedDb = globalThis.indexedDB;

  beforeEach(() => {
    localStorage.clear();
    service = TestBed.inject(StorageAdapterService);
  });

  afterEach(async () => {
    Object.defineProperty(globalThis, 'indexedDB', {
      writable: true,
      configurable: true,
      value: originalIndexedDb,
    });
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should store, read, list, and remove records in IndexedDB without duplicating into localStorage', async () => {
    const record: TestRecord = { id: 'book-1', label: 'El Quijote' };

    const persisted = await service.set('books', record);
    expect(persisted).toBe(true);
    expect(localStorage.getItem('books_book-1')).toBeNull();

    const loaded = await service.get<TestRecord>('books', 'book-1');
    expect(loaded).toEqual(record);

    const all = await service.getAll<TestRecord>('books');
    expect(all).toContainEqual(record);

    await service.remove('books', 'book-1');
    const afterDelete = await service.get<TestRecord>('books', 'book-1');
    expect(afterDelete).toBeNull();
  });

  it('should fall back to localStorage when IndexedDB is unavailable', async () => {
    Object.defineProperty(globalThis, 'indexedDB', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const record: TestRecord = { id: 'fallback-1', label: 'Fallback Book' };
    const persisted = await service.set('books', record);
    expect(persisted).toBe(true);
    expect(localStorage.getItem('books_fallback-1')).not.toBeNull();

    const loaded = await service.get<TestRecord>('books', 'fallback-1');
    expect(loaded).toEqual(record);

    const all = await service.getAll<TestRecord>('books');
    expect(all).toEqual([record]);

    await service.remove('books', 'fallback-1');
    expect(await service.get<TestRecord>('books', 'fallback-1')).toBeNull();
  });

  it('should return null when localStorage contains malformed JSON', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    localStorage.setItem('corrupt_key', '{broken');

    expect(service.getItem<TestRecord>('corrupt_key')).toBeNull();
  });

  it('should handle QuotaExceededError gracefully when setItem fails', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    const result = service.setItem('big_key', { data: 'x' });
    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should save and retrieve reading goals payload using dedicated helpers', () => {
    const goals = { year: 2026, targetBooks: 20, targetPages: 5000 };
    expect(service.getReadingGoals()).toBeNull();

    const saved = service.saveReadingGoals(goals);
    expect(saved).toBe(true);

    expect(service.getReadingGoals()).toEqual(goals);
  });
});
