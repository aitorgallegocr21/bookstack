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
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { CoverColorService } from '../../../../core/services/cover-color.service';
import {
  formatRatingBadge,
  getStatusBadgeClass,
} from '../../../../shared/utils/book-display.utils';
import { BOOK_STATUS_CONFIG, Book } from '../../models/book.model';
import { translateBookFormat } from '../../utils/book-form.utils';

@Component({
  selector: 'app-book-detailed-card',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon],
  templateUrl: './book-detailed-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full catalog-card-contain',
  },
})
export class BookDetailedCardComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly appPreferences = inject(AppPreferencesService);
  private readonly coverColorService = inject(CoverColorService);

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

  protected readonly bookTint = computed(() => {
    return this.coverColorService.getTint(this.book());
  });

  protected readonly getStatusBadgeClass = getStatusBadgeClass;
  protected readonly getRatingBadge = formatRatingBadge;
}
