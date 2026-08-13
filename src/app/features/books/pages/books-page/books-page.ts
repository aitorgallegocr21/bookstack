import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { BooksService } from '../../services/books.service';
import { ReadingStatsService } from '../../services/reading-stats.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { Book, ReadingLog } from '../../models/book.model';
import { BookEditorComponent } from '../../components/book-editor/book-editor';
import { ReadingLogEditorComponent } from '../../components/reading-log-editor/reading-log-editor';
import { BookDetailModalComponent } from '../../components/book-detail-modal/book-detail-modal';

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [
    BookEditorComponent,
    ReadingLogEditorComponent,
    BookDetailModalComponent
  ],
  templateUrl: './books-page.html',
  styleUrl: './books-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BooksPage {
  private readonly booksService = inject(BooksService);
  private readonly readingStatsService = inject(ReadingStatsService);
  private readonly readingLogService = inject(ReadingLogService);

  protected readonly books = this.booksService.books;
  protected readonly readingLogs = this.readingLogService.readingLogs;
  protected readonly stats = this.readingStatsService.stats;

  // Signals de estado local
  protected readonly showEditor = signal(false);
  protected readonly editorBook = signal<Book | undefined>(undefined);
  protected readonly showReadingLogEditor = signal(false);
  protected readonly readingLogBookId = signal<string | undefined>(undefined);
  protected readonly editingReadingLog = signal<ReadingLog | undefined>(undefined);

  // SPEC-001: Señal para gestionar el libro seleccionado para vista detallada y edición
  protected readonly selectedBookId = signal<string | null>(null);

  /**
   * Agrupación reactiva O(N) de sesiones de lectura por ID de libro.
   * Permite búsquedas O(1) instantáneas en la plantilla.
   */
  protected readonly logsByBookMap = computed(() => {
    const map = new Map<string, ReadingLog[]>();
    for (const log of this.readingLogs()) {
      const list = map.get(log.bookId);
      if (list) {
        list.push(log);
      } else {
        map.set(log.bookId, [log]);
      }
    }
    return map;
  });

  protected readonly maxMonthlyPages = computed(() => {
    const monthly = this.stats().monthlyPages;
    if (monthly.length === 0) {
      return 1;
    }
    return Math.max(...monthly.map((m) => m.pages), 1);
  });

  protected openCreateEditor(): void {
    this.editorBook.set(undefined);
    this.showEditor.set(true);
  }

  protected openEditEditor(book: Book): void {
    this.editorBook.set(book);
    this.showEditor.set(true);
  }

  protected openBookDetail(bookId: string): void {
    this.selectedBookId.set(bookId);
  }

  protected closeBookDetail(): void {
    this.selectedBookId.set(null);
  }

  protected async deleteBook(bookId: string): Promise<void> {
    const confirmed = window.confirm('¿Estás seguro de que deseas eliminar este libro? Se conservarán sus lecturas asociadas.');
    if (!confirmed) {
      return;
    }

    try {
      await this.booksService.remove(bookId);
    } catch (error) {
      console.error('Error al eliminar el libro:', error);
    }
  }

  protected openReadingLogEditor(book: Book, existingLog?: ReadingLog): void {
    this.readingLogBookId.set(book.id);
    this.editingReadingLog.set(existingLog);
    this.showReadingLogEditor.set(true);
  }

  protected async deleteReadingLog(logId: string): Promise<void> {
    const confirmed = window.confirm('¿Deseas borrar este registro de lectura?');
    if (!confirmed) {
      return;
    }

    try {
      await this.readingLogService.remove(logId);
    } catch (error) {
      console.error('Error al borrar la sesión de lectura:', error);
    }
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
