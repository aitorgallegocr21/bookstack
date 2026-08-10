import { Injectable, signal } from '@angular/core';
import { Book } from '../models/book.model';
import { BOOKS_SEED } from '../data/books.seed';

@Injectable({ providedIn: 'root' })
export class BooksService {
  private readonly storageKey = 'bookstack.books';

  readonly books = signal<Book[]>(this.loadBooks());

  getAll(): Book[] {
    return this.books();
  }

  getById(id: string): Book | undefined {
    return this.books().find((book) => book.id === id);
  }

  add(book: Book): void {
    this.books.update((current) => {
      const next = [...current, book];
      this.persistBooks(next);
      return next;
    });
  }

  update(id: string, updatedBook: Book): void {
    this.books.update((current) => {
      const next = current.map((book) => (book.id === id ? updatedBook : book));
      this.persistBooks(next);
      return next;
    });
  }

  remove(id: string): void {
    this.books.update((current) => {
      const next = current.filter((book) => book.id !== id);
      this.persistBooks(next);
      return next;
    });
  }

  private loadBooks(): Book[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return BOOKS_SEED;
    }

    const rawValue = window.localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return BOOKS_SEED;
    }

    try {
      const parsed = JSON.parse(rawValue) as Book[];
      return parsed;
    } catch {
      return BOOKS_SEED;
    }
  }

  private persistBooks(books: Book[]): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(books));
  }
}
