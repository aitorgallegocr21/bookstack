import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { DataHealthIssueCategory, DataHealthIssueSeverity } from '../../models/data-health.model';
import { DataHealthService } from '../../services/data-health.service';

@Component({
  selector: 'app-data-health-section',
  standalone: true,
  templateUrl: './data-health-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataHealthSectionComponent {
  protected readonly i18n = inject(I18nService);
  private readonly dataHealthService = inject(DataHealthService);

  readonly report = this.dataHealthService.report;
  readonly isApplyingFix = signal(false);
  readonly feedbackMessage = signal<string | null>(null);
  readonly expandedCategories = signal<Record<DataHealthIssueCategory, boolean>>({
    'temporal-anomaly': true,
    'progress-mismatch': true,
    'duplicate-book': true,
    'fragmented-saga': true,
  });

  readonly categories: readonly DataHealthIssueCategory[] = [
    'temporal-anomaly',
    'progress-mismatch',
    'duplicate-book',
    'fragmented-saga',
  ];

  toggleCategory(category: DataHealthIssueCategory): void {
    this.expandedCategories.update((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  async fixSingleIssue(issueId: string): Promise<void> {
    if (this.isApplyingFix()) {
      return;
    }

    this.isApplyingFix.set(true);
    this.feedbackMessage.set(null);
    try {
      const fixed = await this.dataHealthService.applyIssueFix(issueId);
      if (fixed) {
        this.feedbackMessage.set(this.i18n.t().settings.dataHealth.fixedSingleMessage);
      }
    } finally {
      this.isApplyingFix.set(false);
    }
  }

  async fixAllAutoFixable(): Promise<void> {
    if (this.isApplyingFix()) {
      return;
    }

    this.isApplyingFix.set(true);
    this.feedbackMessage.set(null);
    try {
      const fixedCount = await this.dataHealthService.applyAllAutoFixes();
      if (fixedCount > 0) {
        this.feedbackMessage.set(
          this.i18n.t().settings.dataHealth.fixedAllMessage.replace('{count}', String(fixedCount))
        );
      }
    } finally {
      this.isApplyingFix.set(false);
    }
  }

  formatFixAllLabel(count: number): string {
    return this.i18n.t().settings.dataHealth.fixAllAction.replace('{count}', String(count));
  }

  getSeverityBadgeClass(severity: DataHealthIssueSeverity): string {
    switch (severity) {
      case 'high':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
      case 'low':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300';
    }
  }
}
