import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { StreakInfo } from '../../../books/models/book.model';

@Component({
  selector: 'app-reading-streak-widget',
  standalone: true,
  templateUrl: './reading-streak-widget.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class ReadingStreakWidgetComponent {
  protected readonly i18n = inject(I18nService);

  readonly streakInfo = input.required<StreakInfo>();

  protected getDayLetter(key: StreakInfo['weeklyActivity'][number]['dayKey']): string {
    return this.i18n.t().dashboard.weekDays[key];
  }
}
