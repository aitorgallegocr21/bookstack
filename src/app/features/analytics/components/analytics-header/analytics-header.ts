import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AnalyticsPeriodMode } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-analytics-header',
  standalone: true,
  templateUrl: './analytics-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class AnalyticsHeaderComponent {
  private readonly analyticsService = inject(AnalyticsService);
  protected readonly i18n = inject(I18nService);

  protected readonly periodMode = this.analyticsService.periodMode;
  protected readonly selectedYear = this.analyticsService.selectedYear;
  protected readonly availableYears = this.analyticsService.availableYears;
  protected readonly currentReferenceYear = computed(() =>
    this.analyticsService.referenceDate().getFullYear()
  );

  protected setPeriodMode(mode: AnalyticsPeriodMode): void {
    this.analyticsService.setPeriodMode(mode);
  }

  protected onYearSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    if (!select) {
      return;
    }
    const year = Number(select.value);
    if (Number.isFinite(year)) {
      this.analyticsService.selectYear(year);
    }
  }
}
