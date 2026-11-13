import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { formatLocalizedDate } from '../../../../core/utils/date-formatter';
import { WeekdayPaceItem } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

export interface WeekdayPaceViewItem extends WeekdayPaceItem {
  label: string;
  barHeightPercent: number;
  ariaSummary: string;
}

@Component({
  selector: 'app-reading-habits-section',
  standalone: true,
  templateUrl: './reading-habits-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadingHabitsSectionComponent {
  readonly i18n = inject(I18nService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly weekdayPace = this.analyticsService.weekdayPace;
  readonly highlights = this.analyticsService.highlights;

  readonly hasWeekdaySessions = computed(() =>
    this.weekdayPace().some((day) => day.sessionsCount > 0 || day.pages > 0)
  );

  readonly weekdayPaceView = computed<WeekdayPaceViewItem[]>(() => {
    const dict = this.i18n.t();
    const weekDays = dict.dashboard.weekDays;
    const pagesUnit = dict.stats.composition.authorPagesUnit;
    const sessionsUnit = dict.stats.habits.sessionsUnit;

    return this.weekdayPace().map((item) => {
      const label = weekDays[item.dayKey];
      const barHeightPercent =
        item.pages > 0 ? Math.max(8, Math.min(100, item.percentageOfPeak)) : 0;

      return {
        ...item,
        label,
        barHeightPercent,
        ariaSummary: `${label}: ${item.pages} ${pagesUnit}, ${item.sessionsCount} ${sessionsUnit}`,
      };
    });
  });

  readonly peakWeekday = computed<WeekdayPaceViewItem | null>(
    () => this.weekdayPaceView().find((day) => day.isPeakDay) ?? null
  );

  readonly bestDayFormatted = computed<string | null>(() => {
    const bestDay = this.highlights().bestDay;
    if (!bestDay) {
      return null;
    }
    return formatLocalizedDate(bestDay.date, false, this.i18n.intlLocale());
  });

  readonly formattedAvgDays = computed<string | null>(() => {
    const avg = this.highlights().averageDaysToFinishBook;
    if (avg === null) {
      return null;
    }
    return Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
  });

  readonly formattedTopRating = computed<string | null>(() => {
    const topRated = this.highlights().topRatedBook;
    if (!topRated) {
      return null;
    }
    return topRated.rating.toFixed(1);
  });
}
