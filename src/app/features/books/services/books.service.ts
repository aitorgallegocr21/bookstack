import { Injectable, inject, signal } from '@angular/core';
import { StorageAdapterService } from '../../../core/services/storage-adapter.service';
import { Book } from '../models/book.model';
import { parseStoredBooks } from '../schemas/book.schema';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly storage = inject(StorageAdapterService);
  private readonly storeName = 'books';
  private initPromise: Promise<void> | null = null;

  readonly books = signal<Book[]>([]);
  readonly isCreateModalOpen = signal<boolean>(false);

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

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }
}
