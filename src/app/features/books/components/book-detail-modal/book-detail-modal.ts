import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BooksService } from '../../services/books.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { Book, BookStatus, ReadingLog } from '../../models/book.model';
import { ReadingLogEditorComponent } from '../reading-log-editor/reading-log-editor';

@Component({
  selector: 'app-book-detail-modal',
  standalone: true,
  imports: [CommonModule, ReadingLogEditorComponent],
  templateUrl: './book-detail-modal.html',
  styleUrl: './book-detail-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetailModalComponent {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);

  // Inputs y Outputs
  readonly bookId = input.required<string>();
  readonly closed = output<void>();
  readonly editRequested = output<string>();

  // Estados locales
  protected readonly showLogEditor = signal<boolean>(false);
  protected readonly editingLog = signal<ReadingLog | undefined>(undefined);

  // Signals computados declarativos
  protected readonly book = computed<Book | undefined>(() => {
    return this.booksService.books().find((b) => b.id === this.bookId());
  });

  protected readonly bookLogs = computed<ReadingLog[]>(() => {
    const id = this.bookId();
    return this.readingLogService
      .readingLogs()
      .filter((log) => log.bookId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  protected readonly progressPercentage = computed(() => {
    const currentBook = this.book();
    if (!currentBook || currentBook.totalPages <= 0) return 0;
    return Math.min(100, Math.round((currentBook.currentPage / currentBook.totalPages) * 100));
  });

  protected onRequestEdit(): void {
    this.editRequested.emit(this.bookId());
  }

  protected openLogEditor(existingLog?: ReadingLog): void {
    this.editingLog.set(existingLog);
    this.showLogEditor.set(true);
  }

  protected closeLogEditor(): void {
    this.showLogEditor.set(false);
    this.editingLog.set(undefined);
  }

  protected async deleteLog(logId: string): Promise<void> {
    const confirmed = window.confirm('¿Deseas eliminar este registro de lectura?');
    if (!confirmed) return;

    try {
      await this.readingLogService.remove(logId);
    } catch (error) {
      console.error('Error al eliminar la sesión de lectura:', error);
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }

  protected getStatusBadgeClass(status: BookStatus): string {
    switch (status) {
      case 'reading':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      case 'abandoned':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'pending':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  }

  protected getStatusLabel(status: BookStatus): string {
    switch (status) {
      case 'reading': return 'Leyendo';
      case 'completed': return 'Completado';
      case 'abandoned': return 'Abandonado';
      case 'pending': return 'Pendiente';
    }
  }
}
