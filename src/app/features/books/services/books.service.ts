import { Injectable, signal } from '@angular/core';
import { from } from 'rxjs';
import { Book } from '../models/book.model';
import { StorageAdapterService } from './storage-adapter.service';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly storeName = 'books';
  private initPromise: Promise<void> | null = null;

  readonly books = signal<Book[]>([]);

  constructor(private readonly storage: StorageAdapterService) {
    this.initDataStream();
  }

  private initDataStream(): void {
    from(this.storage.getAll<Book>(this.storeName)).subscribe({
      next: (storedBooks) => this.books.set(storedBooks),
      error: (error) => {
        console.error('Error inicializando la lista de libros:', error);
        this.books.set([]);
      }
    });
  }

  private ensureInitialized(): Promise<void> {
    this.initPromise ??= this.storage
      .getAll<Book>(this.storeName)
      .then((storedBooks) => {
        this.books.set(storedBooks);
      })
      .catch((error) => {
        console.error('Error inicializando la lista de libros:', error);
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
    this.books.update((current) =>
      current.map((b) => (b.id === id ? updatedBook : b))
    );
  }

  async remove(id: string): Promise<void> {
    await this.ensureInitialized();
    await this.storage.remove(this.storeName, id);
    this.books.update((current) => current.filter((b) => b.id !== id));
  }
}
