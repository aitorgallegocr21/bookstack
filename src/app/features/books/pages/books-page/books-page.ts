import { Component, computed, inject, signal } from '@angular/core';
import { BooksService } from '../../services/books.service';
import { ReadingStatsService } from '../../services/reading-stats.service';
import { Book, ReadingLog } from '../../models/book.model';
import { BookEditorComponent } from '../../components/book-editor/book-editor';
import { ReadingLogEditorComponent } from '../../components/reading-log-editor/reading-log-editor';

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [BookEditorComponent, ReadingLogEditorComponent],
  templateUrl: './books-page.html',
  styleUrl: './books-page.css'
})
export class BooksPage {
  private readonly booksService = inject(BooksService);
  private readonly readingStatsService = inject(ReadingStatsService);

  protected readonly books = this.booksService.books;
  protected readonly stats = computed(() => this.readingStatsService.getStats());
  protected readonly showEditor = signal(false);
  protected readonly editorBook = signal<Book | undefined>(undefined);
  protected readonly showReadingLogEditor = signal(false);
  protected readonly readingLogBookId = signal<string | undefined>(undefined);
  protected readonly editingReadingLog = signal<ReadingLog | undefined>(undefined);

  protected readonly totalBooks = computed(() => this.books().length);
  protected readonly readingBooks = computed(
    () => this.books().filter((book) => book.status === 'reading').length
  );

  protected openCreateEditor(): void {
    this.editorBook.set(undefined);
    this.showEditor.set(true);
  }

  protected openEditEditor(book: Book): void {
    this.editorBook.set(book);
    this.showEditor.set(true);
  }

  protected deleteBook(bookId: string): void {
    this.booksService.remove(bookId);
  }

  protected openReadingLogEditor(book: Book): void {
    this.readingLogBookId.set(book.id);
    this.editingReadingLog.set(undefined);
    this.showReadingLogEditor.set(true);
  }

  protected closeReadingLogEditor(): void {
    this.showReadingLogEditor.set(false);
    this.readingLogBookId.set(undefined);
    this.editingReadingLog.set(undefined);
  }

  protected closeEditor(): void {
    this.showEditor.set(false);
    this.editorBook.set(undefined);
  }
}
