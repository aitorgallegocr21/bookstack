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

  describe('Catalog preferences persistence', () => {
    it('should default viewMode to "detailed" when nothing or invalid value is stored', () => {
      expect(service.getCatalogViewMode()).toBe('detailed');

      localStorage.setItem(service.catalogViewModeKey, JSON.stringify('invalid-mode'));
      expect(service.getCatalogViewMode()).toBe('detailed');
    });

    it('should persist and retrieve valid CatalogViewMode', () => {
      expect(service.setCatalogViewMode('grid')).toBe(true);
      expect(service.getCatalogViewMode()).toBe('grid');

      expect(service.setCatalogViewMode('compact')).toBe(true);
      expect(service.getCatalogViewMode()).toBe('compact');
    });

    it('should default sortOption to "recent" when nothing or invalid value is stored', () => {
      expect(service.getCatalogSort()).toBe('recent');

      localStorage.setItem(service.catalogSortKey, JSON.stringify('unsupported-sort'));
      expect(service.getCatalogSort()).toBe('recent');
    });

    it('should persist and retrieve valid CatalogSortOption', () => {
      expect(service.setCatalogSort('title-asc')).toBe(true);
      expect(service.getCatalogSort()).toBe('title-asc');

      expect(service.setCatalogSort('rating-desc')).toBe(true);
      expect(service.getCatalogSort()).toBe('rating-desc');
    });
  });

  describe('Batch store primitives & quota estimation', () => {
    it('should replaceStore and clearStore in IndexedDB while preserving unrelated localStorage keys', async () => {
      localStorage.setItem('books_stale', JSON.stringify({ id: 'stale' }));
      localStorage.setItem('bookstack_catalog_view_mode', JSON.stringify('grid'));

      await service.set('books', { id: 'old-1', label: 'Old Book' });

      const replaced = await service.replaceStore<TestRecord>('books', [
        { id: 'new-1', label: 'New Book 1' },
        { id: 'new-2', label: 'New Book 2' },
      ]);

      expect(replaced).toBe(true);
      const allAfterReplace = await service.getAll<TestRecord>('books');
      expect(allAfterReplace).toHaveLength(2);
      expect(allAfterReplace.map((r) => r.id).sort()).toEqual(['new-1', 'new-2']);
      expect(localStorage.getItem('books_stale')).toBeNull();
      expect(localStorage.getItem('bookstack_catalog_view_mode')).not.toBeNull();

      await service.clearStore('books');
      expect(await service.getAll<TestRecord>('books')).toEqual([]);
      expect(localStorage.getItem('bookstack_catalog_view_mode')).not.toBeNull();
    });

    it('should fall back to localStorage for replaceStore and clearStore when IndexedDB is unavailable', async () => {
      Object.defineProperty(globalThis, 'indexedDB', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      localStorage.setItem('books_legacy', JSON.stringify({ id: 'legacy', label: 'Legacy' }));

      const replaced = await service.replaceStore<TestRecord>('books', [
        { id: 'fb-1', label: 'Fallback 1' },
      ]);
      expect(replaced).toBe(true);
      expect(localStorage.getItem('books_legacy')).toBeNull();
      expect(await service.getAll<TestRecord>('books')).toEqual([
        { id: 'fb-1', label: 'Fallback 1' },
      ]);

      await service.clearStore('books');
      expect(await service.getAll<TestRecord>('books')).toEqual([]);
    });

    it('should report isUsingIndexedDb accurately based on IndexedDB availability', async () => {
      expect(await service.isUsingIndexedDb()).toBe(true);

      Object.defineProperty(globalThis, 'indexedDB', {
        writable: true,
        configurable: true,
        value: undefined,
      });
      const fallbackService = TestBed.resetTestingModule().inject(StorageAdapterService);
      expect(await fallbackService.isUsingIndexedDb()).toBe(false);
    });

    it('should safely estimate browser quota or return nulls when unsupported', async () => {
      const estimateSpy = vi.fn().mockResolvedValue({ usage: 1024, quota: 5242880 });
      Object.defineProperty(navigator, 'storage', {
        configurable: true,
        value: { estimate: estimateSpy },
      });

      expect(await service.estimateBrowserQuota()).toEqual({
        usageBytes: 1024,
        quotaBytes: 5242880,
      });

      estimateSpy.mockRejectedValueOnce(new Error('Storage estimate blocked'));
      expect(await service.estimateBrowserQuota()).toEqual({
        usageBytes: null,
        quotaBytes: null,
      });

      Object.defineProperty(navigator, 'storage', {
        configurable: true,
        value: undefined,
      });
      expect(await service.estimateBrowserQuota()).toEqual({
        usageBytes: null,
        quotaBytes: null,
      });
    });

    it('should provision the seriesMetadata object store on IndexedDB v2', async () => {
      const metadataRecord: TestRecord = { id: 'series-1', label: 'Cosmere' };

      const persisted = await service.set('seriesMetadata', metadataRecord);
      expect(persisted).toBe(true);
      expect(await service.get<TestRecord>('seriesMetadata', 'series-1')).toEqual(metadataRecord);
      expect(await service.getAll<TestRecord>('seriesMetadata')).toEqual([metadataRecord]);

      await service.replaceStore('seriesMetadata', [{ id: 'series-2', label: 'Dune' }]);
      expect(await service.getAll<TestRecord>('seriesMetadata')).toEqual([
        { id: 'series-2', label: 'Dune' },
      ]);

      await service.clearStore('seriesMetadata');
      expect(await service.getAll<TestRecord>('seriesMetadata')).toEqual([]);
    });
  });
});
