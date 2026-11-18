import { Injectable, inject, signal } from '@angular/core';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book } from '../models/book.model';
import { parseStoredBooks } from '../schemas/book.schema';

export interface CreateBookPrefill {
  seriesName?: string;
  seriesVolumeNumber?: number;
}

@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly storage = inject(StorageAdapterService);
  private readonly storeName = 'books';
  private initPromise: Promise<void> | null = null;

  readonly books = signal<Book[]>([]);
  readonly isCreateModalOpen = signal<boolean>(false);
  readonly createModalPrefill = signal<CreateBookPrefill | null>(null);

  constructor() {
    void this.ensureInitialized();
  }

  private ensureInitialized(): Promise<void> {
    this.initPromise ??= this.storage
      .getAll<unknown>(this.storeName)
      .then((storedBooks) => {
        this.books.set(parseStoredBooks(storedBooks));
      })
      .catch((error: unknown) => {
        console.error('[BooksService] Failed to initialize books list:', error);
        this.books.set([]);
      });
    return this.initPromise;
  }

  async getAll(): Promise<Book[]> {
    await this.ensureInitialized();
    return this.books();
  }

  async getById(id: string): Promise<Book | undefined> {
    await this.ensureInitialized();
    return this.books().find((book) => book.id === id);
  }

  async add(book: Book): Promise<void> {
    await this.ensureInitialized();
    await this.storage.set(this.storeName, book);
    this.books.update((current) => [...current, book]);
  }

  async update(id: string, updatedBook: Book): Promise<void> {
    await this.ensureInitialized();
    await this.storage.set(this.storeName, updatedBook);
    this.books.update((current) => current.map((b) => (b.id === id ? updatedBook : b)));
  }

  async updateMany(updatedBooks: Book[]): Promise<boolean> {
    await this.ensureInitialized();
    if (updatedBooks.length === 0) {
      return true;
    }

    const persisted = await this.storage.putMany(this.storeName, updatedBooks);
    if (!persisted) {
      return false;
    }

    const updatedById = new Map<string, Book>(updatedBooks.map((book) => [book.id, book]));
    this.books.update((current) => current.map((book) => updatedById.get(book.id) ?? book));
    return true;
  }

  async applyReadingDelta(bookId: string, deltaPages: number): Promise<void> {
    await this.ensureInitialized();

    if (!Number.isFinite(deltaPages) || deltaPages === 0) {
      return;
    }

    const book = this.books().find((currentBook) => currentBook.id === bookId);
    if (!book) {
      return;
    }

    const totalPages = Math.max(0, book.totalPages);
    const currentPage = Math.min(totalPages, Math.max(0, book.currentPage));
    const nextPage = Math.min(totalPages, Math.max(0, currentPage + deltaPages));
    const nextStatus =
      nextPage >= totalPages && totalPages > 0
        ? 'completed'
        : book.status === 'completed' || (deltaPages > 0 && book.status === 'pending')
          ? 'reading'
          : book.status;

    const updatedBook: Book = {
      ...book,
      currentPage: nextPage,
      status: nextStatus,
      startDate:
        nextStatus === 'reading' && !book.startDate
          ? new Date().toLocaleDateString('sv')
          : book.startDate,
      endDate:
        nextStatus === 'completed'
          ? book.endDate || new Date().toLocaleDateString('sv')
          : book.endDate,
      updatedAt: new Date().toISOString(),
    };

    await this.storage.set(this.storeName, updatedBook);
    this.books.update((current) =>
      current.map((currentBook) => (currentBook.id === bookId ? updatedBook : currentBook))
    );
  }

  async remove(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.storage.remove(this.storeName, id);
    this.books.update((current) => current.filter((b) => b.id !== id));
  }

  async replaceAll(books: Book[]): Promise<void> {
    await this.ensureInitialized();
    const persisted = await this.storage.replaceStore(this.storeName, books);
    if (!persisted) {
      throw new Error('Failed to persist replaced books collection.');
    }
    this.books.set([...books]);
  }

  async clearAll(): Promise<void> {
    await this.ensureInitialized();
    await this.storage.clearStore(this.storeName);
    this.books.set([]);
  }

  openCreateModal(prefill?: CreateBookPrefill): void {
    this.createModalPrefill.set(prefill ?? null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.createModalPrefill.set(null);
  }
}
