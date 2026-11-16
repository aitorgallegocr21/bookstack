import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-series-page',
  standalone: true,
  template: `
    <div
      class="mx-auto flex min-h-screen w-full max-w-[1720px] flex-col gap-6 bg-slate-100/80 px-4 py-6 text-slate-900 transition-colors duration-200 sm:px-6 lg:px-8 dark:bg-slate-950 dark:text-slate-100"
    >
      <header>
        <h1 class="text-2xl font-bold">{{ i18n.t().series.title }}</h1>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {{ i18n.t().series.subtitle }}
        </p>
      </header>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriesPage {
  protected readonly i18n = inject(I18nService);
}
