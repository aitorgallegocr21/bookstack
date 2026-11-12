import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideDynamicIcon,
  LucideEdit2,
  LucideEye,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BookDetailModalComponent } from '../../components/book-detail-modal/book-detail-modal';
import { BookEditModalComponent } from '../../components/book-edit-modal/book-edit-modal';
import { ReadingLogEditorComponent } from '../../components/reading-log-editor/reading-log-editor';
import {
  BOOK_RATING_MAX,
  BOOK_STATUS_CONFIG,
  Book,
  BookFormat,
  BookStatus,
  ReadingLog,
} from '../../models/book.model';
import { BooksService } from '../../services/books.service';
import { ReadingLogService } from '../../services/reading-log.service';
import { translateBookFormat } from '../../utils/book-form.utils';

@Component({
  selector: 'app-books-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideDynamicIcon,
    BookEditModalComponent,
    BookDetailModalComponent,
    ReadingLogEditorComponent,
  ],
  templateUrl: './books-page.html',
  styleUrl: './books-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BooksPage {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  protected readonly i18n = inject(I18nService);

  protected readonly BOOK_STATUS_CONFIG = BOOK_STATUS_CONFIG;
  protected readonly Plus = LucidePlus;
  protected readonly Eye = LucideEye;
  protected readonly Edit2 = LucideEdit2;
  protected readonly Trash2 = LucideTrash2;

  protected readonly books = this.booksService.books;
  protected readonly readingLogs = this.readingLogService.readingLogs;

  protected readonly selectedBookForDetailId = signal<string | null>(null);
  protected readonly selectedBookForEditId = signal<string | null>(null);

  // Reading log editor modal state
  protected readonly showReadingLogEditor = signal<boolean>(false);
  protected readonly readingLogBookId = signal<string | undefined>(undefined);
  protected readonly editingReadingLog = signal<ReadingLog | undefined>(undefined);

  protected readonly expandedBookIds = signal<Set<string>>(new Set());

  /**
   * O(N) reactive grouping of reading logs indexed by book ID.
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

  protected getVisibleLogs(bookId: string): ReadingLog[] {
    const allLogs = this.logsByBookMap().get(bookId) ?? [];
    const isExpanded = this.expandedBookIds().has(bookId);
    return isExpanded ? allLogs : allLogs.slice(0, 2);
  }

  protected hasMoreLogs(bookId: string): boolean {
    const allLogs = this.logsByBookMap().get(bookId) ?? [];
    return allLogs.length > 2;
  }

  protected getHiddenLogsCount(bookId: string): number {
    const allLogs = this.logsByBookMap().get(bookId) ?? [];
    const isExpanded = this.expandedBookIds().has(bookId);
    if (isExpanded || allLogs.length <= 2) {
      return 0;
    }
    return allLogs.length - 2;
  }

  protected toggleLogsExpanded(bookId: string): void {
    this.expandedBookIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
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
    const confirmed = window.confirm(this.i18n.t().books.confirmDeleteBook);
    if (!confirmed) {
      return;
    }

    try {
      await this.booksService.remove(bookId);
    } catch (error) {
      console.error('[BooksPage] Failed to delete book:', error);
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
    const confirmed = window.confirm(this.i18n.t().books.confirmDeleteLog);
    if (!confirmed) {
      return;
    }

    try {
      await this.readingLogService.remove(logId);
    } catch (error) {
      console.error('[BooksPage] Failed to delete reading log:', error);
    }
  }

  protected getStatusBadgeClass(status: BookStatus): string {
    return BOOK_STATUS_CONFIG[status].badgeClass;
  }

  protected getFormatLabel(format?: BookFormat | string): string {
    return (
      translateBookFormat(format, this.i18n.t().bookForm.formats) || this.i18n.t().books.noFormat
    );
  }

  protected getRatingBadge(rating?: number): string {
    if (rating === undefined || rating === null || Number.isNaN(rating)) {
      return this.i18n.t().books.noRating;
    }

    const normalized = Math.min(BOOK_RATING_MAX, Math.max(0, rating));
    return `★ ${normalized.toFixed(1).replace(/\.0$/, '')}/10`;
  }

  protected getStatusBarColor(status: BookStatus): string {
    return BOOK_STATUS_CONFIG[status].dotClass.replace('bg-', '');
  }
}
