import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideDynamicIcon,
  LucideFilter,
  LucideLayoutGrid,
  LucideLayoutList,
  LucideRotateCcw,
  LucideRows,
  LucideSearch,
  LucideStar,
  LucideX,
} from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BookStatus } from '../../models/book.model';
import {
  CATALOG_SORT_OPTIONS,
  CatalogFilterCriteria,
  CatalogSortOption,
  CatalogViewMode,
} from '../../models/catalog-filter.model';
import {
  countActiveFilters,
  countActiveSecondaryFilters,
} from '../../services/catalog-filter.service';

export interface RatingFilterOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-catalog-toolbar',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon],
  templateUrl: './catalog-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogToolbarComponent {
  protected readonly i18n = inject(I18nService);

  // Inputs
  readonly criteria = input.required<CatalogFilterCriteria>();
  readonly viewMode = input.required<CatalogViewMode>();
  readonly sortOption = input.required<CatalogSortOption>();
  readonly statusCounts = input.required<Record<BookStatus | 'all', number>>();
  readonly totalBooks = input<number>(0);
  readonly filteredBooksCount = input<number>(0);
  readonly availableFormats = input<string[]>(['Físico', 'Ebook', 'Audiolibro']);

  // Outputs
  readonly criteriaChange = output<Partial<CatalogFilterCriteria>>();
  readonly viewModeChange = output<CatalogViewMode>();
  readonly sortChange = output<CatalogSortOption>();
  readonly resetFilters = output<void>();

  // Internal reactive state
  readonly isFilterDrawerOpen = signal<boolean>(false);

  // Icons
  protected readonly Search = LucideSearch;
  protected readonly X = LucideX;
  protected readonly Grid = LucideLayoutGrid;
  protected readonly Detailed = LucideLayoutList;
  protected readonly Compact = LucideRows;
  protected readonly Filter = LucideFilter;
  protected readonly Star = LucideStar;
  protected readonly RotateCcw = LucideRotateCcw;

  // Constants
  protected readonly sortOptions = CATALOG_SORT_OPTIONS;
  protected readonly statusKeys: readonly (BookStatus | 'all')[] = [
    'all',
    'reading',
    'pending',
    'completed',
    'abandoned',
  ];

  protected readonly activeSecondaryCount = computed(() =>
    countActiveSecondaryFilters(this.criteria())
  );

  protected readonly hasActiveFilters = computed(() => countActiveFilters(this.criteria()) > 0);

  protected readonly ratingOptions: readonly RatingFilterOption[] = [
    { value: 0, label: 'Todas' },
    { value: 1, label: '1★+' },
    { value: 2, label: '2★+' },
    { value: 3, label: '3★+' },
    { value: 4, label: '4★+' },
    { value: 5, label: '5★' },
  ];

  protected onSearchInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.criteriaChange.emit({ searchQuery: inputElement.value });
  }

  protected clearSearch(): void {
    this.criteriaChange.emit({ searchQuery: '' });
  }

  protected onStatusSelect(status: BookStatus | 'all'): void {
    this.criteriaChange.emit({ status });
  }

  protected onFormatSelect(format: string): void {
    this.criteriaChange.emit({ format });
  }

  protected onRatingSelect(minRating: number): void {
    this.criteriaChange.emit({ minRating });
  }

  protected onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.sortChange.emit(selectElement.value as CatalogSortOption);
  }

  protected toggleFilterDrawer(): void {
    this.isFilterDrawerOpen.update((open) => !open);
  }

  protected onResetFilters(): void {
    this.resetFilters.emit();
  }

  protected getStatusLabel(status: BookStatus | 'all'): string {
    switch (status) {
      case 'all':
        return this.i18n.t().catalog.statusChips.all;
      case 'reading':
        return this.i18n.t().catalog.statusChips.reading;
      case 'pending':
        return this.i18n.t().catalog.statusChips.pending;
      case 'completed':
        return this.i18n.t().catalog.statusChips.completed;
      case 'abandoned':
        return this.i18n.t().catalog.statusChips.abandoned;
    }
  }

  protected getSortLabel(option: CatalogSortOption): string {
    const labels = this.i18n.t().catalog.sortOptions;
    switch (option) {
      case 'recent':
        return labels.recent;
      case 'title-asc':
        return labels.titleAsc;
      case 'title-desc':
        return labels.titleDesc;
      case 'author-asc':
        return labels.authorAsc;
      case 'rating-desc':
        return labels.ratingDesc;
      case 'progress-desc':
        return labels.progressDesc;
      case 'pages-desc':
        return labels.pagesDesc;
    }
  }

  protected getResultsCountText(): string {
    const count = this.filteredBooksCount();
    const total = this.totalBooks();
    if (count === 1 && total === 1) {
      return this.i18n.t().catalog.resultsCountSingle;
    }
    return this.i18n
      .t()
      .catalog.resultsCount.replace('{count}', count.toString())
      .replace('{total}', total.toString());
  }
}
