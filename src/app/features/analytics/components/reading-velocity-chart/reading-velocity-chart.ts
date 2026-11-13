import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AnalyticsTrendMetric, AnalyticsTrendPoint } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

export interface VelocityBarViewModel {
  point: AnalyticsTrendPoint;
  value: number;
  heightPercent: number;
  isZero: boolean;
  formattedValue: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-reading-velocity-chart',
  standalone: true,
  templateUrl: './reading-velocity-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class ReadingVelocityChartComponent {
  protected readonly analytics = inject(AnalyticsService);
  protected readonly i18n = inject(I18nService);

  protected readonly selectedBucketKey = signal<string | null>(null);

  protected readonly metricOptions: readonly {
    key: AnalyticsTrendMetric;
    labelKey: 'pagesMetric' | 'booksMetric' | 'timeMetric';
  }[] = [
    { key: 'pages', labelKey: 'pagesMetric' },
    { key: 'books', labelKey: 'booksMetric' },
    { key: 'time', labelKey: 'timeMetric' },
  ];

  protected readonly totalValue = computed(() => {
    const metric = this.analytics.trendMetric();
    return this.analytics
      .trendPoints()
      .reduce((sum, point) => sum + this.getPointMetricValue(point, metric), 0);
  });

  protected readonly averageValue = computed(() => {
    const points = this.analytics.trendPoints();
    if (points.length === 0) {
      return 0;
    }
    return this.totalValue() / points.length;
  });

  protected readonly maxValue = computed(() => {
    const metric = this.analytics.trendMetric();
    let max = 0;
    for (const point of this.analytics.trendPoints()) {
      const value = this.getPointMetricValue(point, metric);
      if (value > max) {
        max = value;
      }
    }
    return max;
  });

  protected readonly averageHeightPercent = computed(() => {
    const max = this.maxValue();
    const avg = this.averageValue();
    if (max <= 0 || avg <= 0) {
      return 0;
    }
    return Math.min(100, Math.max(2, Math.round((avg / max) * 100)));
  });

  protected readonly hasActivity = computed(() => this.totalValue() > 0);

  protected readonly formattedTotal = computed(() =>
    this.formatMetricValue(this.totalValue(), this.analytics.trendMetric(), false)
  );

  protected readonly formattedAverage = computed(() =>
    this.formatMetricValue(this.averageValue(), this.analytics.trendMetric(), true)
  );

  protected readonly bars = computed<VelocityBarViewModel[]>(() => {
    const metric = this.analytics.trendMetric();
    const max = this.maxValue();
    const dict = this.i18n.t().stats.velocity;

    return this.analytics.trendPoints().map((point) => {
      const value = this.getPointMetricValue(point, metric);
      const isZero = value <= 0;
      const heightPercent =
        max > 0 && value > 0 ? Math.min(100, Math.max(6, Math.round((value / max) * 100))) : 0;
      const formattedValue = this.formatMetricValue(value, metric, false);
      const ariaLabel = `${point.label}: ${this.formatInteger(point.pages)} ${dict.pagesUnit}, ${this.formatInteger(point.books)} ${dict.booksUnit}, ${this.formatDuration(point.timeMinutes)}`;

      return {
        point,
        value,
        heightPercent,
        isZero,
        formattedValue,
        ariaLabel,
      };
    });
  });

  protected readonly selectedPoint = computed<AnalyticsTrendPoint | null>(() => {
    const points = this.analytics.trendPoints();
    if (points.length === 0) {
      return null;
    }

    const activeKey = this.selectedBucketKey();
    if (activeKey) {
      const matched = points.find((point) => point.key === activeKey);
      if (matched) {
        return matched;
      }
    }

    const metric = this.analytics.trendMetric();
    for (let index = points.length - 1; index >= 0; index -= 1) {
      if (this.getPointMetricValue(points[index], metric) > 0) {
        return points[index];
      }
    }

    return points[points.length - 1];
  });

  protected selectMetric(metric: AnalyticsTrendMetric): void {
    this.analytics.setTrendMetric(metric);
  }

  protected selectBucket(key: string): void {
    this.selectedBucketKey.set(key);
  }

  protected formatInteger(value: number): string {
    return new Intl.NumberFormat(this.i18n.intlLocale(), { maximumFractionDigits: 0 }).format(
      Math.round(value)
    );
  }

  protected formatDuration(totalMinutes: number): string {
    const kpis = this.i18n.t().stats.kpis;
    const velocity = this.i18n.t().stats.velocity;
    const rounded = Math.round(totalMinutes);
    if (rounded < 60) {
      return `${this.formatInteger(rounded)} ${velocity.minutesUnit}`;
    }
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;
    if (minutes === 0) {
      return `${this.formatInteger(hours)}${kpis.hoursShort}`;
    }
    return `${this.formatInteger(hours)}${kpis.hoursShort} ${minutes}${kpis.minutesShort}`;
  }

  private getPointMetricValue(point: AnalyticsTrendPoint, metric: AnalyticsTrendMetric): number {
    switch (metric) {
      case 'pages':
        return point.pages;
      case 'books':
        return point.books;
      case 'time':
        return point.timeMinutes;
    }
  }

  private formatMetricValue(
    value: number,
    metric: AnalyticsTrendMetric,
    allowDecimals: boolean
  ): string {
    const velocity = this.i18n.t().stats.velocity;

    if (metric === 'time') {
      return this.formatDuration(value);
    }

    const formattedNumber = new Intl.NumberFormat(this.i18n.intlLocale(), {
      maximumFractionDigits: allowDecimals ? 1 : 0,
    }).format(allowDecimals ? value : Math.round(value));

    return metric === 'pages'
      ? `${formattedNumber} ${velocity.pagesUnit}`
      : `${formattedNumber} ${velocity.booksUnit}`;
  }
}
