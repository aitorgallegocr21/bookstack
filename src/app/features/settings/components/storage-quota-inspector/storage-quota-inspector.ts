import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { StorageBreakdownSummary } from '../../models/data-portability.model';
import { DataPortabilityService } from '../../services/data-portability.service';

export interface StorageCategoryItem {
  id: 'metadata' | 'covers' | 'logs' | 'preferences';
  label: string;
  bytes: number;
  formattedBytes: string;
  percentage: number;
  dotClass: string;
  barClass: string;
  countText: string | null;
}

@Component({
  selector: 'app-storage-quota-inspector',
  standalone: true,
  templateUrl: './storage-quota-inspector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
  },
})
export class StorageQuotaInspectorComponent {
  protected readonly i18n = inject(I18nService);
  private readonly dataPortabilityService = inject(DataPortabilityService);

  readonly breakdown = input.required<StorageBreakdownSummary>();
  readonly refreshRequested = output<void>();

  readonly isRequestingPersistence = signal(false);
  readonly persistenceFeedback = signal<{ message: string; isPositive: boolean } | null>(null);

  protected readonly persistenceLabel = computed(() => {
    const t = this.i18n.t().settings.storage;
    switch (this.breakdown().persistenceStatus) {
      case 'persisted':
        return t.persistencePersisted;
      case 'best-effort':
        return t.persistenceBestEffort;
      default:
        return t.persistenceUnsupported;
    }
  });

  protected readonly persistenceBadgeClass = computed(() => {
    switch (this.breakdown().persistenceStatus) {
      case 'persisted':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
      case 'best-effort':
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
      default:
        return 'border-subtle bg-surface-elevated text-ink-secondary';
    }
  });

  protected readonly indexedDbDiagnosticsText = computed(() => {
    const summary = this.breakdown();
    const t = this.i18n.t().settings.storage;
    const info = summary.indexedDbInfo;
    return `${info.dbName} · ${t.diagnosticsVersionPrefix}${info.version} · ${info.objectStoresCount} ${t.diagnosticsStoresLabel} · ${summary.booksCount} ${t.booksCountLabel.toLowerCase()} · ${summary.readingLogsCount} ${t.logsCountLabel.toLowerCase()}`;
  });

  async requestPersistentStorage(): Promise<void> {
    if (this.isRequestingPersistence()) {
      return;
    }

    this.isRequestingPersistence.set(true);
    this.persistenceFeedback.set(null);
    const t = this.i18n.t().settings.storage;

    try {
      const result = await this.dataPortabilityService.requestPersistentStorage();
      if (result === 'persisted') {
        this.persistenceFeedback.set({
          message: t.requestPersistentGranted,
          isPositive: true,
        });
      } else if (result === 'denied') {
        this.persistenceFeedback.set({
          message: t.requestPersistentDenied,
          isPositive: false,
        });
      } else {
        this.persistenceFeedback.set({
          message: t.requestPersistentUnsupported,
          isPositive: false,
        });
      }
      this.refreshRequested.emit();
    } finally {
      this.isRequestingPersistence.set(false);
    }
  }

  protected readonly engineLabel = computed(() => {
    const t = this.i18n.t().settings.storage;
    return this.breakdown().engine === 'indexeddb' ? t.engineIndexedDb : t.engineLocalStorage;
  });

  protected readonly healthLabel = computed(() => {
    const t = this.i18n.t().settings.storage;
    switch (this.breakdown().healthStatus) {
      case 'moderate':
        return t.healthModerate;
      case 'near-limit':
        return t.healthNearLimit;
      default:
        return t.healthHealthy;
    }
  });

  protected readonly healthBadgeClass = computed(() => {
    switch (this.breakdown().healthStatus) {
      case 'moderate':
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
      case 'near-limit':
        return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300';
      default:
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
    }
  });

  protected readonly browserQuotaText = computed(() => {
    const summary = this.breakdown();
    if (summary.browserUsageBytes === null || summary.browserQuotaBytes === null) {
      return this.i18n.t().settings.storage.quotaUnavailable;
    }
    return `${this.formatBytes(summary.browserUsageBytes)} / ${this.formatBytes(summary.browserQuotaBytes)}`;
  });

  protected readonly categories = computed<StorageCategoryItem[]>(() => {
    const summary = this.breakdown();
    const t = this.i18n.t().settings.storage;
    const total = summary.totalBookstackBytes;

    const toPct = (bytes: number): number =>
      total > 0 ? Math.min(100, Math.max(0, (bytes / total) * 100)) : 0;

    return [
      {
        id: 'metadata',
        label: t.categoryBooksMetadata,
        bytes: summary.booksMetadataBytes,
        formattedBytes: this.formatBytes(summary.booksMetadataBytes),
        percentage: toPct(summary.booksMetadataBytes),
        dotClass: 'bg-indigo-500',
        barClass: 'bg-indigo-500',
        countText: `${summary.booksCount} ${t.booksCountLabel.toLowerCase()}`,
      },
      {
        id: 'covers',
        label: t.categoryCoversBase64,
        bytes: summary.coversBase64Bytes,
        formattedBytes: this.formatBytes(summary.coversBase64Bytes),
        percentage: toPct(summary.coversBase64Bytes),
        dotClass: 'bg-amber-500',
        barClass: 'bg-amber-500',
        countText: `${summary.coversCount} ${t.coversCountLabel.toLowerCase()}`,
      },
      {
        id: 'logs',
        label: t.categoryReadingLogs,
        bytes: summary.readingLogsBytes,
        formattedBytes: this.formatBytes(summary.readingLogsBytes),
        percentage: toPct(summary.readingLogsBytes),
        dotClass: 'bg-emerald-500',
        barClass: 'bg-emerald-500',
        countText: `${summary.readingLogsCount} ${t.logsCountLabel.toLowerCase()}`,
      },
      {
        id: 'preferences',
        label: t.categoryPreferences,
        bytes: summary.preferencesBytes,
        formattedBytes: this.formatBytes(summary.preferencesBytes),
        percentage: toPct(summary.preferencesBytes),
        dotClass: 'bg-slate-400 dark:bg-slate-500',
        barClass: 'bg-slate-400 dark:bg-slate-500',
        countText: null,
      },
    ];
  });

  formatBytes(bytes: number): string {
    const safeBytes = Math.max(0, Number.isFinite(bytes) ? bytes : 0);
    if (safeBytes < 1024) {
      return `${Math.round(safeBytes)} B`;
    }
    if (safeBytes < 1024 * 1024) {
      return `${(safeBytes / 1024).toFixed(1)} KB`;
    }
    return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  protected formatPercent(percentage: number): string {
    return `${percentage.toFixed(1)}%`;
  }
}
