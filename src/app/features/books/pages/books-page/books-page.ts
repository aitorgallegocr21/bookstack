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
import { BookCreateModalComponent } from '../../components/book-create-modal/book-create-modal';
import { BookEditModalComponent } from '../../components/book-edit-modal/book-edit-modal';
import { BookDetailModalComponent } from '../../components/book-detail-modal/book-detail-modal';
import { ReadingLogEditorComponent } from '../../components/reading-log-editor/reading-log-editor';

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [
    BookCreateModalComponent,
    BookEditModalComponent,
    BookDetailModalComponent,
    ReadingLogEditorComponent
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

  // Signals para control de los 3 Modales Independientes
  protected readonly showCreateModal = signal<boolean>(false);
  protected readonly selectedBookForDetailId = signal<string | null>(null);
  protected readonly selectedBookForEditId = signal<string | null>(null);

  // Modales de registros de lectura
  protected readonly showReadingLogEditor = signal<boolean>(false);
  protected readonly readingLogBookId = signal<string | undefined>(undefined);
  protected readonly editingReadingLog = signal<ReadingLog | undefined>(undefined);

  /**
   * Agrupación reactiva O(N) de sesiones de lectura por ID de libro.
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

  // Métodos de apertura y cierre
  protected openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  protected openDetailModal(bookId: string): void {
    this.selectedBookForDetailId.set(bookId);
  }

  protected closeDetailModal(): void {
    this.selectedBookForDetailId.set(null);
  }

  protected openEditModal(bookId: string): void {
    this.selectedBookForEditId.set(bookId);
  }

  protected closeEditModal(): void {
    this.selectedBookForEditId.set(null);
  }

  protected handleEditRequestedFromDetail(bookId: string): void {
    this.closeDetailModal();
    this.openEditModal(bookId);
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

  protected closeReadingLogEditor(): void {
    this.showReadingLogEditor.set(false);
    this.readingLogBookId.set(undefined);
    this.editingReadingLog.set(undefined);
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
}
