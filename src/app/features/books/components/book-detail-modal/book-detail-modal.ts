import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { formatLocalizedDate } from '../../../../core/utils/date-formatter';
import { BOOK_RATING_MAX, Book, BookFormat, BookStatus, ReadingLog } from '../../models/book.model';
import { BooksService } from '../../services/books.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { translateBookFormat } from '../../utils/book-form.utils';
import { ReadingLogEditorComponent } from '../reading-log-editor/reading-log-editor';

@Component({
  selector: 'app-book-detail-modal',
  standalone: true,
  imports: [CommonModule, ReadingLogEditorComponent],
  templateUrl: './book-detail-modal.html',
  styleUrl: './book-detail-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'handleEscape()',
  },
})
export class BookDetailModalComponent implements OnDestroy {
  private readonly uiState = inject(UiStateService);
  protected readonly i18n = inject(I18nService);
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);

  readonly bookId = input.required<string>();
  readonly closed = output<void>();
  readonly editRequested = output<string>();

  protected readonly showLogEditor = signal<boolean>(false);
  protected readonly editingLog = signal<ReadingLog | undefined>(undefined);
  protected readonly isClosing = signal<boolean>(false);
  protected readonly showAllLogs = signal<boolean>(false);

  constructor() {
    this.uiState.acquireScrollLock();
  }

  ngOnDestroy(): void {
    this.uiState.releaseScrollLock();
  }

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

  protected readonly visibleBookLogs = computed<ReadingLog[]>(() => {
    const logs = this.bookLogs();
    return this.showAllLogs() ? logs : logs.slice(0, 2);
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

  protected toggleLogsExpanded(): void {
    this.showAllLogs.update((isExpanded) => !isExpanded);
  }

  protected async deleteLog(logId: string): Promise<void> {
    const confirmed = window.confirm(this.i18n.t().books.confirmDeleteLog);
    if (!confirmed) return;

    try {
      await this.readingLogService.remove(logId);
    } catch (error) {
      console.error('[BookDetailModal] Failed to delete reading session:', error);
    }
  }

  protected onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  protected handleEscape(): void {
    this.cancel();
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
    return this.i18n.t().status[status];
  }

  protected getFormatLabel(format?: BookFormat | string): string {
    return translateBookFormat(format, this.i18n.t().bookForm.formats);
  }

  protected getSeriesLabel(book?: Book): string {
    if (!book?.series?.name) {
      return '';
    }

    const volume = book.series.volumeNumber
      ? ` · ${this.i18n.t().bookDetail.volumePrefix} ${book.series.volumeNumber}`
      : '';
    return `${book.series.name}${volume}`;
  }

  protected getRatingBadge(rating?: number): string {
    if (rating === undefined || rating === null || Number.isNaN(rating)) {
      return this.i18n.t().books.noRating;
    }

    return `★ ${Math.min(BOOK_RATING_MAX, Math.max(0, rating)).toFixed(1).replace(/\.0$/, '')}/10`;
  }

  protected formatDate(date?: string): string {
    return formatLocalizedDate(date, true, this.i18n.intlLocale());
  }
}
