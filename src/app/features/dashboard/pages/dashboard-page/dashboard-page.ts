import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadingStatsService } from '../../../books/services/reading-stats.service';
import {
  BOOK_STATUS_CONFIG,
  BOOK_STATUS_LABELS
} from '../../../books/models/book.model';
import { formatSpanishMonth } from '../../../../core/utils/date-formatter';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage {
  private readonly readingStatsService = inject(ReadingStatsService);

  protected readonly stats = this.readingStatsService.stats;
  protected readonly BOOK_STATUS_CONFIG = BOOK_STATUS_CONFIG;
  protected readonly BOOK_STATUS_LABELS = BOOK_STATUS_LABELS;

  protected readonly maxMonthlyPages = computed(() => {
    const monthly = this.stats().monthlyPages;
    return monthly.length > 0 ? Math.max(...monthly.map((month) => month.pages), 1) : 1;
  });

  protected formatMonth(month: string): string {
    return formatSpanishMonth(month);
  }
}
