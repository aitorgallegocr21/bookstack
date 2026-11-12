import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  formatLocalizedMonth,
  getCurrentLocalDateTime,
} from '../../../../core/utils/date-formatter';
import { BOOK_STATUS_CONFIG, Book, ReadingGoals } from '../../../books/models/book.model';
import { BooksService } from '../../../books/services/books.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { ReadingStatsService } from '../../../books/services/reading-stats.service';
import { CurrentlyReadingHeroComponent } from '../../components/currently-reading-hero/currently-reading-hero';
import { ReadingStreakWidgetComponent } from '../../components/reading-streak-widget/reading-streak-widget';
import { AnnualGoalCardComponent } from '../../components/annual-goal-card/annual-goal-card';
import { RecentActivityFeedComponent } from '../../components/recent-activity-feed/recent-activity-feed';
import { ReadingLogEditorComponent } from '../../../books/components/reading-log-editor/reading-log-editor';
import { BookDetailModalComponent } from '../../../books/components/book-detail-modal/book-detail-modal';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrentlyReadingHeroComponent,
    ReadingStreakWidgetComponent,
    AnnualGoalCardComponent,
    RecentActivityFeedComponent,
    ReadingLogEditorComponent,
    BookDetailModalComponent,
  ],
  templateUrl: './dashboard-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly booksService = inject(BooksService);
  private readonly readingLogService = inject(ReadingLogService);
  private readonly readingStatsService = inject(ReadingStatsService);
  protected readonly i18n = inject(I18nService);

  protected readonly stats = this.readingStatsService.stats;
  protected readonly goals = this.readingStatsService.goals;
  protected readonly allBooks = this.booksService.books;
  protected readonly allLogs = this.readingLogService.readingLogs;
  protected readonly BOOK_STATUS_CONFIG = BOOK_STATUS_CONFIG;

  protected readonly selectedActiveBookId = signal<string | null>(null);
  protected readonly selectedBookForLog = signal<Book | null>(null);
  protected readonly selectedBookForDetail = signal<Book | null>(null);

  protected readonly activeReadingBooks = computed<Book[]>(() => {
    return this.allBooks()
      .filter((book) => book.status === 'reading')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  });

  protected readonly primaryActiveBook = computed<Book | null>(() => {
    const active = this.activeReadingBooks();
    if (active.length === 0) {
      return null;
    }

    const selectedId = this.selectedActiveBookId();
    if (selectedId) {
      const found = active.find((b) => b.id === selectedId);
      if (found) {
        return found;
      }
    }

    return active[0];
  });

  protected readonly otherActiveBooks = computed<Book[]>(() => {
    const primary = this.primaryActiveBook();
    if (!primary) {
      return [];
    }
    return this.activeReadingBooks().filter((b) => b.id !== primary.id);
  });

  protected readonly pendingBooks = computed<Book[]>(() => {
    return this.allBooks().filter((book) => book.status === 'pending');
  });

  protected readonly maxMonthlyPages = computed(() => {
    const monthly = this.stats().monthlyPages;
    return monthly.length > 0 ? Math.max(...monthly.map((month) => month.pages), 1) : 1;
  });

  protected formatMonth(month: string): string {
    return formatLocalizedMonth(month, this.i18n.intlLocale());
  }

  protected async handlePageUpdate(event: { bookId: string; newPage: number }): Promise<void> {
    const book = this.allBooks().find((b) => b.id === event.bookId);
    if (!book) {
      return;
    }

    const delta = event.newPage - book.currentPage;
    if (delta > 0) {
      await this.readingLogService.add({
        id: crypto.randomUUID(),
        bookId: event.bookId,
        date: getCurrentLocalDateTime(),
        pagesRead: delta,
        createdAt: new Date().toISOString(),
      });
    } else if (delta < 0) {
      await this.booksService.update(event.bookId, {
        ...book,
        currentPage: event.newPage,
        status: event.newPage === 0 && book.status === 'reading' ? 'pending' : book.status,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  protected handleSelectActiveBook(book: Book): void {
    this.selectedActiveBookId.set(book.id);
  }

  protected async handleStartReading(book: Book): Promise<void> {
    const updated: Book = {
      ...book,
      status: 'reading',
      startDate: book.startDate || new Date().toLocaleDateString('sv'),
      updatedAt: new Date().toISOString(),
    };
    await this.booksService.update(book.id, updated);
    this.selectedActiveBookId.set(book.id);
  }

  protected handleOpenCreateModal(): void {
    this.booksService.openCreateModal();
  }

  protected handleOpenFullLog(book: Book): void {
    this.selectedBookForLog.set(book);
  }

  protected handleCloseFullLog(): void {
    this.selectedBookForLog.set(null);
  }

  protected handleSelectBook(book: Book): void {
    this.selectedBookForDetail.set(book);
  }

  protected handleCloseDetail(): void {
    this.selectedBookForDetail.set(null);
  }

  protected handleGoalsUpdated(newGoals: ReadingGoals): void {
    this.readingStatsService.saveGoals(newGoals);
  }
}
