import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LucideCheck, LucideDynamicIcon, LucideRotateCcw } from '@lucide/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  DefaultBookFormat,
  DefaultBookStatus,
  QuickPageStep,
} from '../../../../core/models/app-preferences.model';
import {
  CONFIRM_SUPPRESSION_KEYS,
  ConfirmSuppressionKey,
} from '../../../../core/models/confirm-dialog.model';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import {
  CATALOG_SORT_OPTIONS,
  CatalogSortOption,
  CatalogViewMode,
} from '../../../books/models/catalog-filter.model';
import { CatalogFilterService } from '../../../books/services/catalog-filter.service';

@Component({
  selector: 'app-settings-catalog-reading-section',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './settings-catalog-reading-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block space-y-6',
  },
})
export class SettingsCatalogReadingSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly catalogFilter = inject(CatalogFilterService);
  protected readonly appPreferences = inject(AppPreferencesService);
  protected readonly confirmDialogService = inject(ConfirmDialogService);

  protected readonly Check = LucideCheck;
  protected readonly RotateCcw = LucideRotateCcw;

  protected readonly sortOptions = CATALOG_SORT_OPTIONS;
  protected readonly quickPageSteps: readonly QuickPageStep[] = [1, 5, 10, 25];
  protected readonly formatOptions: readonly DefaultBookFormat[] = [
    'physical',
    'ebook',
    'audiobook',
  ];
  protected readonly statusOptions: readonly DefaultBookStatus[] = ['pending', 'reading'];
  protected readonly confirmationKeys = CONFIRM_SUPPRESSION_KEYS;

  protected readonly hasSuppressedConfirms = computed(
    () => this.confirmDialogService.suppressedKeys().length > 0
  );

  protected onViewModeChange(event: Event): void {
    const rawValue = (event.target as HTMLSelectElement | null)?.value;
    const nextMode: CatalogViewMode =
      rawValue === 'detailed' || rawValue === 'compact' ? rawValue : 'grid';
    this.catalogFilter.setViewMode(nextMode);
  }

  protected onSortByChange(event: Event): void {
    const rawValue = (event.target as HTMLSelectElement | null)?.value as
      CatalogSortOption | undefined;
    if (rawValue && CATALOG_SORT_OPTIONS.includes(rawValue)) {
      this.catalogFilter.setSortOption(rawValue);
    }
  }

  protected getSortLabel(option: CatalogSortOption): string {
    const labels = this.i18n.t().catalog.sortOptions;
    const map: Record<CatalogSortOption, string> = {
      recent: labels.recent,
      'title-asc': labels.titleAsc,
      'title-desc': labels.titleDesc,
      'author-asc': labels.authorAsc,
      'rating-desc': labels.ratingDesc,
      'progress-desc': labels.progressDesc,
      'pages-desc': labels.pagesDesc,
    };
    return map[option];
  }

  protected toggleShowCardQuickActions(): void {
    this.appPreferences.updatePreferences({
      showCardQuickActions: !this.appPreferences.showCardQuickActions(),
    });
  }

  protected toggleShowCardProgressBar(): void {
    this.appPreferences.updatePreferences({
      showCardProgressBar: !this.appPreferences.showCardProgressBar(),
    });
  }

  protected onDefaultFormatChange(event: Event): void {
    const rawValue = (event.target as HTMLSelectElement | null)?.value;
    const nextFormat: DefaultBookFormat =
      rawValue === 'ebook' || rawValue === 'audiobook' ? rawValue : 'physical';
    this.appPreferences.updatePreferences({ defaultBookFormat: nextFormat });
  }

  protected getFormatLabel(format: DefaultBookFormat): string {
    return this.i18n.t().bookForm.formats[format];
  }

  protected onDefaultStatusChange(event: Event): void {
    const rawValue = (event.target as HTMLSelectElement | null)?.value;
    const nextStatus: DefaultBookStatus = rawValue === 'reading' ? 'reading' : 'pending';
    this.appPreferences.updatePreferences({ defaultBookStatus: nextStatus });
  }

  protected setQuickPageStep(step: QuickPageStep): void {
    this.appPreferences.updatePreferences({ quickPageStep: step });
  }

  protected toggleTrackReadingTime(): void {
    this.appPreferences.updatePreferences({
      trackReadingTime: !this.appPreferences.trackReadingTime(),
    });
  }

  protected isConfirmationEnabled(key: ConfirmSuppressionKey): boolean {
    return !this.confirmDialogService.isSuppressed(key);
  }

  protected toggleConfirmationPrompt(key: ConfirmSuppressionKey): void {
    const currentlySuppressed = this.confirmDialogService.isSuppressed(key);
    this.confirmDialogService.setSuppressed(key, !currentlySuppressed);
  }

  protected getConfirmationLabel(key: ConfirmSuppressionKey): string {
    const copy = this.i18n.t().settings.catalogReading;
    const map: Record<ConfirmSuppressionKey, string> = {
      deleteReadingLog: copy.confirmDeleteReadingLogLabel,
      unlinkSagaBook: copy.confirmUnlinkSagaBookLabel,
      manualAntiqueYear: copy.confirmManualAntiqueYearLabel,
    };
    return map[key];
  }

  protected resetSuppressedConfirms(): void {
    this.confirmDialogService.resetSuppressed();
  }
}
