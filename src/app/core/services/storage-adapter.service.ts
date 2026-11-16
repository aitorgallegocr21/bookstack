import { Injectable } from '@angular/core';
import {
  CatalogSortOption,
  CatalogViewMode,
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_VIEW_MODE,
  isCatalogSortOption,
  isCatalogViewMode,
} from '../../features/books/models/catalog-filter.model';

@Injectable({
  providedIn: 'root',
})
export class StorageAdapterService {
  private readonly dbName = 'bookstackDB';
  private readonly dbVersion = 1;
  private dbPromise: Promise<IDBDatabase> | null = null;
  readonly goalsStorageKey = 'bookstack_reading_goals';
  readonly catalogViewModeKey = 'bookstack_catalog_view_mode';
  readonly catalogSortKey = 'bookstack_catalog_sort';

  private isIndexedDbAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDbAvailable()) {
      return Promise.reject(new Error('IndexedDB is not available in this environment.'));
    }

    this.dbPromise ??= this.initDB().catch((error: unknown) => {
      this.dbPromise = null;
      throw error;
    });
    return this.dbPromise;
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        const error = request.error || new Error('Failed to open IndexedDB');
        console.error('[StorageAdapter] Failed to open IndexedDB:', error);
        reject(error);
      };

      request.onsuccess = () => {
        const db = request.result;

        db.onerror = (event) => {
          console.error('[StorageAdapter] Database error:', (event.target as IDBRequest).error);
        };

        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('readingLogs')) {
          db.createObjectStore('readingLogs', { keyPath: 'id' });
        }
      };
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return await new Promise<T | null>((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve((request.result as T | undefined) ?? null);
        };

        request.onerror = () => {
          resolve(this.getFromLocalStorage<T>(storeName, key));
        };
      });
    } catch {
      return this.getFromLocalStorage<T>(storeName, key);
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDB();
      return await new Promise<T[]>((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve((request.result as T[] | undefined) ?? []);
        };

        request.onerror = () => {
          resolve(this.getAllFromLocalStorage<T>(storeName));
        };
      });
    } catch {
      return this.getAllFromLocalStorage<T>(storeName);
    }
  }

  async set<T extends { id: string }>(storeName: string, value: T): Promise<boolean> {
    try {
      const db = await this.getDB();
      return await new Promise<boolean>((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value);

        request.onsuccess = () => {
          resolve(true);
        };

        request.onerror = () => {
          console.warn(
            `[StorageAdapter] IndexedDB write failed for "${storeName}"; falling back to localStorage.`
          );
          resolve(this.setToLocalStorage(storeName, value));
        };
      });
    } catch {
      return this.setToLocalStorage(storeName, value);
    }
  }

  async remove(storeName: string, key: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          this.removeFromLocalStorage(storeName, key);
          resolve();
        };

        request.onerror = () => {
          this.removeFromLocalStorage(storeName, key);
          resolve();
        };
      });
    } catch {
      this.removeFromLocalStorage(storeName, key);
    }
  }

  async clearStore(storeName: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
          this.clearFromLocalStorage(storeName);
          resolve();
        };

        request.onerror = () => {
          this.clearFromLocalStorage(storeName);
          resolve();
        };
      });
    } catch {
      this.clearFromLocalStorage(storeName);
    }
  }

  async replaceStore<T extends { id: string }>(storeName: string, items: T[]): Promise<boolean> {
    try {
      const db = await this.getDB();
      return await new Promise<boolean>((resolve) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        transaction.oncomplete = () => {
          this.clearFromLocalStorage(storeName);
          resolve(true);
        };

        transaction.onerror = () => {
          console.warn(
            `[StorageAdapter] IndexedDB replaceStore failed for "${storeName}"; falling back to localStorage.`
          );
          resolve(this.replaceInLocalStorage(storeName, items));
        };

        transaction.onabort = () => {
          console.warn(
            `[StorageAdapter] IndexedDB replaceStore aborted for "${storeName}"; falling back to localStorage.`
          );
          resolve(this.replaceInLocalStorage(storeName, items));
        };

        store.clear();
        for (const item of items) {
          store.put(item);
        }
      });
    } catch {
      return this.replaceInLocalStorage(storeName, items);
    }
  }

  async isUsingIndexedDb(): Promise<boolean> {
    try {
      await this.getDB();
      return true;
    } catch {
      return false;
    }
  }

  async estimateBrowserQuota(): Promise<{ usageBytes: number | null; quotaBytes: number | null }> {
    try {
      if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
        return { usageBytes: null, quotaBytes: null };
      }

      const estimate = await navigator.storage.estimate();
      return {
        usageBytes: typeof estimate.usage === 'number' ? estimate.usage : null,
        quotaBytes: typeof estimate.quota === 'number' ? estimate.quota : null,
      };
    } catch {
      return { usageBytes: null, quotaBytes: null };
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (error) {
      console.warn(`[StorageAdapter] Failed to read key "${key}" from localStorage:`, error);
      return null;
    }
  }

  setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error: unknown) {
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.code === 22)
      ) {
        console.error(`[StorageAdapter] Storage quota exceeded while persisting "${key}".`, error);
      } else {
        console.error(`[StorageAdapter] Unexpected error while persisting "${key}":`, error);
      }
      return false;
    }
  }

  getReadingGoals(): unknown | null {
    return this.getItem<unknown>(this.goalsStorageKey);
  }

  saveReadingGoals(goals: unknown): boolean {
    return this.setItem(this.goalsStorageKey, goals);
  }

  getCatalogViewMode(): CatalogViewMode {
    const raw = this.getItem<unknown>(this.catalogViewModeKey);
    return isCatalogViewMode(raw) ? raw : DEFAULT_CATALOG_VIEW_MODE;
  }

  setCatalogViewMode(viewMode: CatalogViewMode): boolean {
    return this.setItem(this.catalogViewModeKey, viewMode);
  }

  getCatalogSort(): CatalogSortOption {
    const raw = this.getItem<unknown>(this.catalogSortKey);
    return isCatalogSortOption(raw) ? raw : DEFAULT_CATALOG_SORT;
  }

  setCatalogSort(sort: CatalogSortOption): boolean {
    return this.setItem(this.catalogSortKey, sort);
  }

  private getFromLocalStorage<T>(storeName: string, key: string): T | null {
    return this.getItem<T>(`${storeName}_${key}`);
  }

  private getAllFromLocalStorage<T>(storeName: string): T[] {
    try {
      const prefix = `${storeName}_`;
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      const items: T[] = [];

      for (const k of keys) {
        const parsed = this.getItem<T>(k);
        if (parsed !== null) {
          items.push(parsed);
        }
      }

      return items;
    } catch {
      return [];
    }
  }

  private setToLocalStorage<T extends { id: string }>(storeName: string, value: T): boolean {
    return this.setItem(`${storeName}_${value.id}`, value);
  }

  private removeFromLocalStorage(storeName: string, key: string): void {
    try {
      localStorage.removeItem(`${storeName}_${key}`);
    } catch {
      // Ignore storage removal errors in restricted environments
    }
  }

  private clearFromLocalStorage(storeName: string): void {
    try {
      const prefix = `${storeName}_`;
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      for (const k of keys) {
        localStorage.removeItem(k);
      }
    } catch {
      // Ignore storage clear errors in restricted environments
    }
  }

  private replaceInLocalStorage<T extends { id: string }>(storeName: string, items: T[]): boolean {
    this.clearFromLocalStorage(storeName);
    for (const item of items) {
      if (!this.setToLocalStorage(storeName, item)) {
        return false;
      }
    }
    return true;
  }
}
