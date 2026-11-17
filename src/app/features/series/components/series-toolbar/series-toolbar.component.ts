import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { LucideDynamicIcon, LucideRotateCcw, LucideSearch, LucideX } from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { SagaFilterStatus, SagaSortOption, SagaStatusCounts } from '../../models/series.model';

export const SAGA_FILTER_STATUSES: readonly SagaFilterStatus[] = [
  'all',
  'reading',
  'completed',
  'pending',
  'has-gaps',
];

export const SAGA_SORT_OPTIONS: readonly SagaSortOption[] = [
  'recent',
  'progress-desc',
  'volumes-desc',
  'rating-desc',
  'title-asc',
];

@Component({
  selector: 'app-series-toolbar',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './series-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class SeriesToolbarComponent {
  protected readonly i18n = inject(I18nService);

  readonly searchQuery = input.required<string>();
  readonly statusFilter = input.required<SagaFilterStatus>();
  readonly sortOption = input.required<SagaSortOption>();
  readonly statusCounts = input.required<SagaStatusCounts>();
  readonly hasActiveFilters = input<boolean>(false);

  readonly searchChange = output<string>();
  readonly statusChange = output<SagaFilterStatus>();
  readonly sortChange = output<SagaSortOption>();
  readonly resetFilters = output<void>();

  protected readonly Search = LucideSearch;
  protected readonly X = LucideX;
  protected readonly RotateCcw = LucideRotateCcw;

  protected readonly filterStatuses = SAGA_FILTER_STATUSES;
  protected readonly sortOptions = SAGA_SORT_OPTIONS;

  protected onSearchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchChange.emit(inputElement.value);
  }

  protected clearSearch(): void {
    this.searchChange.emit('');
  }

  protected onStatusSelect(status: SagaFilterStatus): void {
    this.statusChange.emit(status);
  }

  protected onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.sortChange.emit(selectElement.value as SagaSortOption);
  }

  protected onResetFilters(): void {
    this.resetFilters.emit();
  }

  protected getStatusLabel(status: SagaFilterStatus): string {
    const labels = this.i18n.t().series.filters;
    switch (status) {
      case 'all':
        return labels.all;
      case 'reading':
        return labels.reading;
      case 'completed':
        return labels.completed;
      case 'pending':
        return labels.pending;
      case 'has-gaps':
        return labels.hasGaps;
    }
  }

  protected getStatusCount(status: SagaFilterStatus): number {
    const counts = this.statusCounts();
    switch (status) {
      case 'all':
        return counts.all;
      case 'reading':
        return counts.reading;
      case 'completed':
        return counts.completed;
      case 'pending':
        return counts.pending;
      case 'has-gaps':
        return counts.hasGaps;
    }
  }

  protected getSortLabel(option: SagaSortOption): string {
    const labels = this.i18n.t().series.sortOptions;
    switch (option) {
      case 'recent':
        return labels.recent;
      case 'progress-desc':
        return labels.progressDesc;
      case 'volumes-desc':
        return labels.volumesDesc;
      case 'rating-desc':
        return labels.ratingDesc;
      case 'title-asc':
        return labels.titleAsc;
    }
  }
}
