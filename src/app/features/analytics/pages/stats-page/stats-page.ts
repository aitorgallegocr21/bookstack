import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { BooksService } from '../../../books/services/books.service';
import { AnalyticsHeaderComponent } from '../../components/analytics-header/analytics-header';
import { AnalyticsKpiGridComponent } from '../../components/analytics-kpi-grid/analytics-kpi-grid';

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [AnalyticsHeaderComponent, AnalyticsKpiGridComponent],
  templateUrl: './stats-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsPage {
  private readonly booksService = inject(BooksService);
  private readonly uiState = inject(UiStateService);
  protected readonly i18n = inject(I18nService);

  protected readonly hasBooks = computed(() => this.booksService.books().length > 0);

  protected handleOpenCreateModal(): void {
    this.uiState.openCreateModal();
    this.booksService.openCreateModal();
  }
}
