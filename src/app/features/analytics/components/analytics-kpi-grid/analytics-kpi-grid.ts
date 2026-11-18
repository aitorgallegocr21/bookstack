import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { formatLocalizedNumber } from '../../../../core/utils/date-formatter';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-analytics-kpi-grid',
  standalone: true,
  templateUrl: './analytics-kpi-grid.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class AnalyticsKpiGridComponent {
  private readonly analyticsService = inject(AnalyticsService);
  protected readonly i18n = inject(I18nService);

  protected readonly kpi = this.analyticsService.kpiSummary;

  protected readonly formattedPagesRead = computed(() =>
    formatLocalizedNumber(this.kpi().pagesRead, this.i18n.intlLocale())
  );

  protected readonly formattedReadingTime = computed(() => {
    const totalMinutes = Math.max(0, Math.round(this.kpi().totalTimeMinutes));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const t = this.i18n.t().stats.kpis;
    return `${hours}${t.hoursShort} ${minutes}${t.minutesShort}`;
  });
}
