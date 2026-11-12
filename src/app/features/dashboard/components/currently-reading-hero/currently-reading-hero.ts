import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { Book, BOOK_STATUS_CONFIG, BookFormat } from '../../../books/models/book.model';
import { translateBookFormat } from '../../../books/utils/book-form.utils';

@Component({
  selector: 'app-currently-reading-hero',
  standalone: true,
  templateUrl: './currently-reading-hero.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class CurrentlyReadingHeroComponent implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  private readonly uiState = inject(UiStateService);
  protected readonly BOOK_STATUS_CONFIG = BOOK_STATUS_CONFIG;

  readonly activeBook = input<Book | null>(null);
  readonly otherActiveBooks = input<Book[]>([]);
  readonly pendingBooks = input<Book[]>([]);
  readonly totalBooksCount = input<number>(0);

  readonly pageUpdated = output<{ bookId: string; newPage: number }>();
  readonly bookSelected = output<Book>();
  readonly startReading = output<Book>();
  readonly openFullLog = output<Book>();
  readonly openCreateModal = output<void>();

  protected readonly pageInputValue = signal<number>(0);
  protected readonly isCompletionModalOpen = signal<boolean>(false);

  constructor() {
    effect(() => {
      const book = this.activeBook();
      if (book) {
        this.pageInputValue.set(book.currentPage);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.isCompletionModalOpen()) {
      this.uiState.releaseScrollLock();
    }
  }

  protected readonly progressPercentage = computed<number>(() => {
    const book = this.activeBook();
    if (!book || book.totalPages <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
  });

  protected readonly activeFormatLabel = computed<string>(() => {
    const book = this.activeBook();
    if (!book) {
      return '';
    }
    return this.getFormatLabel(book.format);
  });

  protected readonly isPageUpdateValid = computed<boolean>(() => {
    const book = this.activeBook();
    if (!book) {
      return false;
    }
    const val = this.pageInputValue();
    return val > book.currentPage && val <= book.totalPages;
  });

  protected getFormatLabel(format?: BookFormat | string): string {
    return translateBookFormat(format, this.i18n.t().bookForm.formats);
  }

  protected calculateBookProgress(book: Book): number {
    if (book.totalPages <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));
  }

  protected onPageInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value, 10);
    this.pageInputValue.set(Number.isNaN(value) ? 0 : value);
  }

  protected submitPageUpdate(): void {
    const book = this.activeBook();
    if (!book || !this.isPageUpdateValid()) {
      return;
    }

    const val = this.pageInputValue();
    if (val >= book.totalPages) {
      this.uiState.acquireScrollLock();
      this.isCompletionModalOpen.set(true);
      return;
    }

    this.pageUpdated.emit({ bookId: book.id, newPage: val });
  }

  protected confirmCompletion(): void {
    const book = this.activeBook();
    if (!book) {
      return;
    }

    this.uiState.releaseScrollLock();
    this.isCompletionModalOpen.set(false);
    this.pageUpdated.emit({ bookId: book.id, newPage: book.totalPages });
  }

  protected cancelCompletion(): void {
    if (this.isCompletionModalOpen()) {
      this.uiState.releaseScrollLock();
      this.isCompletionModalOpen.set(false);
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelCompletion();
    }
  }
}
