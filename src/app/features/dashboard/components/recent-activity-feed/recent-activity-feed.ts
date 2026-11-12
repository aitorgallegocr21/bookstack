import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { formatLocalizedDate } from '../../../../core/utils/date-formatter';
import { Book, ReadingLog } from '../../../books/models/book.model';

export interface RecentSessionItem {
  log: ReadingLog;
  book?: Book;
  bookTitle: string;
  bookAuthor: string;
  coverUrl?: string;
  formattedDate: string;
}

@Component({
  selector: 'app-recent-activity-feed',
  standalone: true,
  templateUrl: './recent-activity-feed.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class RecentActivityFeedComponent {
  protected readonly i18n = inject(I18nService);

  readonly logs = input.required<ReadingLog[]>();
  readonly books = input.required<Book[]>();

  readonly bookSelected = output<Book>();
  readonly logSelected = output<ReadingLog>();

  protected readonly recentSessions = computed<RecentSessionItem[]>(() => {
    const booksMap = new Map<string, Book>();
    for (const b of this.books()) {
      booksMap.set(b.id, b);
    }

    const sortedLogs = [...this.logs()]
      .filter((log) => log.pagesRead > 0)
      .sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        return dateComparison !== 0 ? dateComparison : b.createdAt.localeCompare(a.createdAt);
      })
      .slice(0, 5);

    return sortedLogs.map((log) => {
      const book = booksMap.get(log.bookId);
      return {
        log,
        book,
        bookTitle: book?.title || 'Libro desconocido',
        bookAuthor: book?.author || '',
        coverUrl: book?.coverUrl,
        formattedDate: formatLocalizedDate(log.date, true, this.i18n.intlLocale()),
      };
    });
  });

  protected onItemClick(item: RecentSessionItem): void {
    if (item.book) {
      this.bookSelected.emit(item.book);
    }
    this.logSelected.emit(item.log);
  }
}
