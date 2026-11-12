import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { formatLocalizedMonth } from '../../../../core/utils/date-formatter';
import { BOOK_STATUS_CONFIG } from '../../../books/models/book.model';
import { ReadingStatsService } from '../../../books/services/reading-stats.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly readingStatsService = inject(ReadingStatsService);
  protected readonly i18n = inject(I18nService);

  protected readonly stats = this.readingStatsService.stats;
  protected readonly BOOK_STATUS_CONFIG = BOOK_STATUS_CONFIG;

  protected readonly maxMonthlyPages = computed(() => {
    const monthly = this.stats().monthlyPages;
    return monthly.length > 0 ? Math.max(...monthly.map((month) => month.pages), 1) : 1;
  });

  protected formatMonth(month: string): string {
    return formatLocalizedMonth(month, this.i18n.intlLocale());
  }
}
