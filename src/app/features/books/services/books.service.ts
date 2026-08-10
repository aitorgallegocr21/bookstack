import { Injectable, signal } from '@angular/core';
import { Book } from '../models/book.model';
import { BOOKS_SEED } from '../data/books.seed';
import { StorageAdapterService } from './storage-adapter.service';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly storeName = 'books';

  readonly books = signal<Book[]>([]);

  constructor(private storage: StorageAdapterService) {
    this.initBooks();
  }

  private async initBooks(): Promise<void> {
    const storedBooks = await this.storage.getAll<Book>(this.storeName);
    if (storedBooks.length === 0) {
      for (const book of BOOKS_SEED) {
        await this.storage.set(this.storeName, book);
      }
      this.books.set(BOOKS_SEED);
    } else {
      this.books.set(storedBooks);
    }
  }

  getAll(): Book[] {
    return this.books();
  }

  getById(id: string): Book | undefined {
    return this.books().find((book) => book.id === id);
  }

  async add(book: Book): Promise<void> {
    await this.storage.set(this.storeName, book);
    this.books.update((current) => [...current, book]);
  }

  async update(id: string, updatedBook: Book): Promise<void> {
    await this.storage.set(this.storeName, updatedBook);
    this.books.update((current) =>
      current.map((book) => (book.id === id ? updatedBook : book))
    );
  }

  async remove(id: string): Promise<void> {
    await this.storage.remove(this.storeName, id);
    this.books.update((current) => current.filter((book) => book.id !== id));
  }
}
