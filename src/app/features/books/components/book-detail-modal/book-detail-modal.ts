import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BooksService } from '../../services/books.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { Book, BookStatus, ReadingLog, BOOK_RATING_MAX } from '../../models/book.model';
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

  readonly bookId = input.required<string>();
  readonly closed = output<void>();
  readonly editRequested = output<string>();

  protected readonly showLogEditor = signal<boolean>(false);
  protected readonly editingLog = signal<ReadingLog | undefined>(undefined);
  protected readonly isClosing = signal<boolean>(false);

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

  protected onBackdropClick(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }

  protected getStatusBadgeClass(status: BookStatus): string {
    switch (status) {
      case 'reading':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'abandoned':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  protected cancel(): void {
    if (this.isClosing()) {
      return;
    }

    this.isClosing.set(true);
    window.setTimeout(() => this.closed.emit(), 180);
  }

  protected getStatusLabel(status: BookStatus): string {
    switch (status) {
      case 'reading': return 'Leyendo';
      case 'completed': return 'Completado';
      case 'abandoned': return 'Abandonado';
      case 'pending': return 'Pendiente';
    }
  }

  protected getSeriesLabel(book?: Book): string {
    if (!book?.series?.name) {
      return '';
    }

    const volume = book.series.volumeNumber ? ` · Vol. ${book.series.volumeNumber}` : '';
    return `${book.series.name}${volume}`;
  }

  protected getRatingBadge(rating?: number): string {
    if (rating === undefined || rating === null || Number.isNaN(rating)) {
      return 'Sin valoración';
    }

    return `★ ${Math.min(BOOK_RATING_MAX, Math.max(0, rating)).toFixed(1).replace(/\.0$/, '')}/10`;
  }

  protected formatDate(date?: string): string {
    if (!date) {
      return '';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(parsed);
  }
}
