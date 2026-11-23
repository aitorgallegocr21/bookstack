import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { SupportedLocale } from '../../../../core/i18n/i18n.types';
import { CONFIRM_SUPPRESSION_KEYS } from '../../../../core/models/confirm-dialog.model';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { CatalogViewMode } from '../../../books/models/catalog-filter.model';
import { CatalogFilterService } from '../../../books/services/catalog-filter.service';

@Component({
  selector: 'app-settings-preferences-section',
  standalone: true,
  templateUrl: './settings-preferences-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class SettingsPreferencesSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly catalogFilter = inject(CatalogFilterService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  protected readonly hasSuppressedConfirms = signal<boolean>(this.checkHasSuppressedConfirms());
  protected readonly confirmsResetDone = signal<boolean>(false);

  protected onLocaleChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const nextLocale: SupportedLocale = target?.value === 'en' ? 'en' : 'es';
    this.i18n.setLocale(nextLocale);
  }

  protected setTheme(theme: 'light' | 'dark'): void {
    this.themeService.setTheme(theme);
  }

  protected onViewModeChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    const rawValue = target?.value;
    const nextMode: CatalogViewMode =
      rawValue === 'detailed' || rawValue === 'compact' ? rawValue : 'grid';
    this.catalogFilter.setViewMode(nextMode);
  }

  protected resetSuppressedConfirms(): void {
    this.confirmDialogService.resetSuppressed();
    this.hasSuppressedConfirms.set(false);
    this.confirmsResetDone.set(true);
  }

  private checkHasSuppressedConfirms(): boolean {
    return CONFIRM_SUPPRESSION_KEYS.some((key) => this.confirmDialogService.isSuppressed(key));
  }
}
