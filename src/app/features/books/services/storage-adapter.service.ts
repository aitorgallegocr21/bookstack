import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageAdapterService {
  private readonly dbName = 'bookstackDB';
  private readonly dbVersion = 1;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    this.dbPromise ??= this.initDB();
    return this.dbPromise;
  }

  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        const error = request.error || new Error('Failed to open IndexedDB');
        console.error('Failed to open IndexedDB:', error);
        reject(error);
      };

      request.onsuccess = () => {
        const db = request.result;

        db.onerror = (event) => {
          console.error('Database error:', (event.target as IDBRequest).error);
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
      return new Promise((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result || null);
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
      return new Promise((resolve) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          resolve(this.getAllFromLocalStorage<T>(storeName));
        };
      });
    } catch {
      return this.getAllFromLocalStorage<T>(storeName);
    }
  }

  async set<T extends { id: string }>(storeName: string, value: T): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value);

        request.onsuccess = () => {
          this.setToLocalStorage(storeName, value);
          resolve();
        };

        request.onerror = () => {
          this.setToLocalStorage(storeName, value);
          reject(request.error || new Error(`Failed to set item in store: ${storeName}`));
        };
      });
    } catch {
      this.setToLocalStorage(storeName, value);
    }
  }

  async remove(storeName: string, key: string): Promise<void> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => {
          this.removeFromLocalStorage(storeName, key);
          resolve();
        };

        request.onerror = () => {
          this.removeFromLocalStorage(storeName, key);
          reject(request.error || new Error(`Failed to remove item with key ${key} from store: ${storeName}`));
        };
      });
    } catch {
      this.removeFromLocalStorage(storeName, key);
    }
  }

  private getFromLocalStorage<T>(storeName: string, key: string): T | null {
    const data = localStorage.getItem(`${storeName}_${key}`);
    return data ? (JSON.parse(data) as T) : null;
  }

  private getAllFromLocalStorage<T>(storeName: string): T[] {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`${storeName}_`));
    return keys.map(k => JSON.parse(localStorage.getItem(k) || '{}') as T);
  }

  private setToLocalStorage<T extends { id: string }>(storeName: string, value: T): void {
    const key = `${storeName}_${value.id}`;
    localStorage.setItem(key, JSON.stringify(value));
  }

  private removeFromLocalStorage(storeName: string, key: string): void {
    localStorage.removeItem(`${storeName}_${key}`);
  }
}
