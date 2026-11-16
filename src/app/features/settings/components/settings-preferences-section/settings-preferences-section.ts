import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { SupportedLocale } from '../../../../core/i18n/i18n.types';
import { ThemeService } from '../../../../core/services/theme.service';
import { CatalogViewMode } from '../../../books/models/catalog-filter.model';
import { CatalogFilterService } from '../../../books/services/catalog-filter.service';

@Component({
  selector: 'app-settings-preferences-section',
  standalone: true,
  templateUrl: './settings-preferences-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPreferencesSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly themeService = inject(ThemeService);
  protected readonly catalogFilter = inject(CatalogFilterService);

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
}
