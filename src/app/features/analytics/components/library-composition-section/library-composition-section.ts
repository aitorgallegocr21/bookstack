import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BookStatus } from '../../../books/models/book.model';
import { AnalyticsFormatKey } from '../../models/analytics.model';
import { AnalyticsService } from '../../services/analytics.service';

const DONUT_RADIUS = 52;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

export interface FormatDonutSegment {
  formatKey: AnalyticsFormatKey;
  label: string;
  count: number;
  percentage: number;
  pages: number;
  strokeColor: string;
  dotClass: string;
  dashArray: string;
  dashOffset: number;
}

interface FormatVisualConfig {
  strokeColor: string;
  dotClass: string;
}

interface StatusVisualConfig {
  barClass: string;
  dotClass: string;
}

const FORMAT_VISUALS: Record<AnalyticsFormatKey, FormatVisualConfig> = {
  physical: {
    strokeColor: '#3b82f6',
    dotClass: 'bg-blue-500',
  },
  ebook: {
    strokeColor: '#10b981',
    dotClass: 'bg-emerald-500',
  },
  audiobook: {
    strokeColor: '#8b5cf6',
    dotClass: 'bg-violet-500',
  },
};

const STATUS_VISUALS: Record<BookStatus, StatusVisualConfig> = {
  completed: {
    barClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-500',
  },
  reading: {
    barClass: 'bg-blue-500',
    dotClass: 'bg-blue-500',
  },
  pending: {
    barClass: 'bg-amber-500',
    dotClass: 'bg-amber-500',
  },
  abandoned: {
    barClass: 'bg-rose-500',
    dotClass: 'bg-rose-500',
  },
};

@Component({
  selector: 'app-library-composition-section',
  standalone: true,
  imports: [],
  templateUrl: './library-composition-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryCompositionSectionComponent {
  private readonly analytics = inject(AnalyticsService);
  protected readonly i18n = inject(I18nService);

  protected readonly donutRadius = DONUT_RADIUS;
  protected readonly formatDistribution = this.analytics.formatDistribution;
  protected readonly statusSummary = this.analytics.statusDistribution;
  protected readonly ratingSummary = this.analytics.ratingDistribution;
  protected readonly topAuthors = this.analytics.topAuthors;

  protected readonly totalFormatBooks = computed(() =>
    this.formatDistribution().reduce((sum, item) => sum + item.count, 0)
  );

  protected readonly totalStatusBooks = computed(() =>
    this.statusSummary().items.reduce((sum, item) => sum + item.count, 0)
  );

  protected readonly formatLegendItems = computed(() => {
    const formats = this.i18n.t().bookForm.formats;
    return this.formatDistribution().map((item) => ({
      ...item,
      label: formats[item.formatKey],
      dotClass: FORMAT_VISUALS[item.formatKey].dotClass,
    }));
  });

  protected readonly donutSegments = computed<FormatDonutSegment[]>(() => {
    const total = this.totalFormatBooks();
    if (total <= 0) {
      return [];
    }

    const formats = this.i18n.t().bookForm.formats;
    const segments: FormatDonutSegment[] = [];
    let cumulativeLength = 0;

    for (const item of this.formatDistribution()) {
      if (item.count <= 0) {
        continue;
      }

      const segmentLength = (item.count / total) * DONUT_CIRCUMFERENCE;
      const visuals = FORMAT_VISUALS[item.formatKey];

      segments.push({
        formatKey: item.formatKey,
        label: formats[item.formatKey],
        count: item.count,
        percentage: item.percentage,
        pages: item.pages,
        strokeColor: visuals.strokeColor,
        dotClass: visuals.dotClass,
        dashArray: `${segmentLength.toFixed(2)} ${DONUT_CIRCUMFERENCE.toFixed(2)}`,
        dashOffset: -cumulativeLength,
      });

      cumulativeLength += segmentLength;
    }

    return segments;
  });

  protected readonly formatDonutAriaLabel = computed(() => {
    const comp = this.i18n.t().stats.composition;
    const total = this.totalFormatBooks();
    const breakdown = this.formatLegendItems()
      .map((item) => `${item.label}: ${item.count} (${item.percentage}%)`)
      .join(', ');
    return `${comp.formatsTitle}. ${total} ${comp.totalBooksLabel}. ${breakdown}`;
  });

  protected readonly statusRows = computed(() => {
    const statusLabels = this.i18n.t().status;
    const total = this.totalStatusBooks();

    return this.statusSummary().items.map((item) => ({
      ...item,
      label: statusLabels[item.status],
      barClass: STATUS_VISUALS[item.status].barClass,
      dotClass: STATUS_VISUALS[item.status].dotClass,
      exactWidthPercent: total > 0 ? (item.count / total) * 100 : 0,
    }));
  });

  protected readonly formattedAverageRating = computed(() => {
    const { averageRating, ratedBooksCount } = this.ratingSummary();
    return ratedBooksCount > 0 ? `${averageRating.toFixed(1)} / 10` : '0.0 / 10';
  });
}
