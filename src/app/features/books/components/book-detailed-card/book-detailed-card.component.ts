import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideDynamicIcon,
  LucideEdit2,
  LucideEye,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BOOK_RATING_MAX, BOOK_STATUS_CONFIG, Book } from '../../models/book.model';
import { translateBookFormat } from '../../utils/book-form.utils';

@Component({
  selector: 'app-book-detailed-card',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon],
  templateUrl: './book-detailed-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookDetailedCardComponent {
  protected readonly i18n = inject(I18nService);

  readonly book = input.required<Book>();

  readonly viewDetails = output<string>();
  readonly logReading = output<string>();
  readonly editBook = output<string>();
  readonly deleteBook = output<string>();

  protected readonly Plus = LucidePlus;
  protected readonly Eye = LucideEye;
  protected readonly Edit2 = LucideEdit2;
  protected readonly Trash2 = LucideTrash2;
  protected readonly BOOK_STATUS_CONFIG = BOOK_STATUS_CONFIG;

  protected readonly formatLabel = computed(() => {
    return translateBookFormat(this.book().format, this.i18n.t().bookForm.formats);
  });

  protected readonly displayRating = computed(() => {
    const r = this.book().rating;
    return r !== undefined && r !== null && !Number.isNaN(r) && r > 0 ? r : null;
  });

  protected readonly progressPercent = computed(() => {
    const b = this.book();
    if (!b.totalPages || b.totalPages <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(0, (b.currentPage / b.totalPages) * 100));
  });

  protected getStatusBadgeClass(status: Book['status']): string {
    return BOOK_STATUS_CONFIG[status]?.badgeClass ?? 'bg-slate-100 text-slate-700';
  }

  protected getRatingBadge(rating?: number): string {
    if (rating === undefined || rating === null || Number.isNaN(rating)) {
      return '';
    }
    const normalized = Math.min(BOOK_RATING_MAX, Math.max(0, rating));
    return `★ ${normalized.toFixed(1).replace(/\.0$/, '')}/10`;
  }
}
