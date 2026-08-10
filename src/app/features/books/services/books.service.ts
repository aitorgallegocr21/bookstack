import { Injectable, signal } from '@angular/core';
import { Book } from '../models/book.model';
import { BOOKS_SEED } from '../data/books.seed';

@Injectable({ providedIn: 'root' })
export class BooksService {
  readonly books = signal<Book[]>(BOOKS_SEED);

  getAll(): Book[] {
    return this.books();
  }

  getById(id: string): Book | undefined {
    return this.books().find((book) => book.id === id);
  }

  add(book: Book): void {
    this.books.update((current) => [...current, book]);
  }

  update(id: string, updatedBook: Book): void {
    this.books.update((current) =>
      current.map((book) => (book.id === id ? updatedBook : book))
    );
  }

  remove(id: string): void {
    this.books.update((current) => current.filter((book) => book.id !== id));
  }
}
