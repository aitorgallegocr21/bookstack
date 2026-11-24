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
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { CoverColorService } from '../../../../core/services/cover-color.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { formatLocalizedDate } from '../../../../core/utils/date-formatter';
import {
  formatRatingBadge,
  getStatusBadgeClass,
} from '../../../../shared/utils/book-display.utils';
import { Book, BookFormat, BookStatus, ReadingLog } from '../../models/book.model';
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
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly coverColorService = inject(CoverColorService);

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

  protected readonly bookTint = computed<string | null>(() => {
    const currentBook = this.book();
    return currentBook ? this.coverColorService.getTint(currentBook, 'high') : null;
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
    const log = this.bookLogs().find((l) => l.id === logId);
    const parentBook = this.book();
    const t = this.i18n.t();
    const confirmed = await this.confirmDialogService.confirm({
      title: t.books.confirmDeleteLogTitle,
      message: t.books.confirmDeleteLog,
      confirmLabel: t.confirmDialog.delete,
      cancelLabel: t.confirmDialog.cancel,
      severity: 'danger',
      suppressibleKey: 'deleteReadingLog',
      suppressCheckboxLabel: t.confirmDialog.dontAskAgainMinor,
      entityPreview: log
        ? {
            title: parentBook?.title ?? t.books.confirmDeleteLogUnknownBook,
            subtitle: formatLocalizedDate(log.date, true, this.i18n.intlLocale()),
            badge: `+${log.pagesRead} pp.`,
            coverUrl: parentBook?.coverUrl,
          }
        : undefined,
    });
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
    if (this.confirmDialogService.activeDialog() !== null) {
      return;
    }
    this.cancel();
  }

  protected readonly getStatusBadgeClass = getStatusBadgeClass;

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
    return formatRatingBadge(rating, this.i18n.t().books.noRating);
  }

  protected formatDate(date?: string): string {
    return formatLocalizedDate(date, true, this.i18n.intlLocale());
  }
}
