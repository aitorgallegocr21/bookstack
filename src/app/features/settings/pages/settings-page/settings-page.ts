import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { SupportedLocale } from '../../../../core/i18n/i18n.types';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  templateUrl: './settings-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  protected readonly i18n = inject(I18nService);

  protected onLocaleChange(rawLocale: string): void {
    const nextLocale: SupportedLocale = rawLocale === 'en' ? 'en' : 'es';
    this.i18n.setLocale(nextLocale);
  }
}
