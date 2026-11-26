import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  LucideCheck,
  LucideDownload,
  LucideDynamicIcon,
  LucideImage,
  LucideRotateCcw,
  LucideSearch,
  LucideShieldCheck,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';
import packageJson from '../../../../../../package.json';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  CoverMaxDimension,
  MetadataSearchQuota,
} from '../../../../core/models/app-preferences.model';
import { AppPreferencesService } from '../../../../core/services/app-preferences.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { CoverColorService } from '../../../../core/services/cover-color.service';
import { DockPositionService } from '../../../../core/services/dock-position.service';
import { ThemeService } from '../../../../core/services/theme.service';
import {
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_VIEW_MODE,
} from '../../../books/models/catalog-filter.model';
import { CatalogFilterService } from '../../../books/services/catalog-filter.service';
import { ReadingLogService } from '../../../books/services/reading-log.service';
import { DataPortabilityService } from '../../services/data-portability.service';

export interface DiagnosticReportPayload {
  readonly appVersion: string;
  readonly exportedAt: string;
  readonly environment: {
    readonly userAgent: string;
    readonly language: string;
    readonly viewportWidth: number;
    readonly viewportHeight: number;
    readonly online: boolean;
    readonly standalonePwa: boolean;
  };
  readonly storage: {
    readonly engine: string;
    readonly persistenceStatus: string;
    readonly totalBookstackBytes: number;
    readonly browserUsageBytes: number | null;
    readonly browserQuotaBytes: number | null;
    readonly booksCount: number;
    readonly coversCount: number;
    readonly readingLogsCount: number;
  };
  readonly scanner: {
    readonly nativeBarcodeDetectorSupported: boolean;
  };
  readonly preferences: {
    readonly offlineMode: boolean;
    readonly coverMaxDimension: CoverMaxDimension;
    readonly coverQuality: number;
    readonly metadataSearchQuota: MetadataSearchQuota;
    readonly enabledProvidersCount: number;
    readonly reducedMotion: string;
    readonly trackReadingTime: boolean;
    readonly includePreferencesInBackup: boolean;
  };
}

const COVER_DIMENSION_OPTIONS: readonly CoverMaxDimension[] = [300, 360, 400, 600];
const METADATA_QUOTA_OPTIONS: readonly MetadataSearchQuota[] = [4, 8, 12];

@Component({
  selector: 'app-settings-advanced-section',
  standalone: true,
  imports: [LucideDynamicIcon],
  templateUrl: './settings-advanced-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block space-y-6',
  },
})
export class SettingsAdvancedSectionComponent {
  protected readonly i18n = inject(I18nService);
  protected readonly appPreferences = inject(AppPreferencesService);
  private readonly coverColorService = inject(CoverColorService);
  private readonly readingLogService = inject(ReadingLogService);
  private readonly themeService = inject(ThemeService);
  private readonly dockPositionService = inject(DockPositionService);
  private readonly catalogFilterService = inject(CatalogFilterService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dataPortabilityService = inject(DataPortabilityService);
  private readonly document = inject(DOCUMENT);

  readonly dataReset = output<void>();

  protected readonly dimensionOptions = COVER_DIMENSION_OPTIONS;
  protected readonly quotaOptions = METADATA_QUOTA_OPTIONS;

  protected readonly ImageIcon = LucideImage;
  protected readonly SearchIcon = LucideSearch;
  protected readonly RotateCcwIcon = LucideRotateCcw;
  protected readonly Trash2Icon = LucideTrash2;
  protected readonly DownloadIcon = LucideDownload;
  protected readonly ShieldCheckIcon = LucideShieldCheck;
  protected readonly CheckIcon = LucideCheck;
  protected readonly CloseIcon = LucideX;

  readonly statusMessage = signal<string | null>(null);
  readonly isExportingDiagnostics = signal<boolean>(false);

  protected readonly qualityPercentage = computed(() =>
    Math.round(this.appPreferences.coverQuality() * 100)
  );

  protected readonly qualityDecimalLabel = computed(() =>
    this.appPreferences.coverQuality().toFixed(2)
  );

  setCoverMaxDimension(dimension: CoverMaxDimension): void {
    this.appPreferences.setPreference('coverMaxDimension', dimension);
  }

  onQualityInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) {
      return;
    }
    const parsed = Number(target.value);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(0.95, Math.max(0.5, Math.round(parsed * 100) / 100));
      this.appPreferences.setPreference('coverQuality', clamped);
    }
  }

  setMetadataSearchQuota(quota: MetadataSearchQuota): void {
    this.appPreferences.setPreference('metadataSearchQuota', quota);
  }

  async clearCoverColorCache(): Promise<void> {
    const copy = this.i18n.t().settings.advanced;
    const confirmed = await this.confirmDialog.confirm({
      title: copy.clearColorCacheConfirmTitle,
      message: copy.clearColorCacheConfirmMessage,
      confirmLabel: copy.clearColorCacheConfirmAction,
      cancelLabel: copy.cancelAction,
      severity: 'warning',
    });

    if (!confirmed) {
      return;
    }

    this.coverColorService.clearCache();
    this.statusMessage.set(copy.clearColorCacheSuccess);
  }

  async clearReadingLogs(): Promise<void> {
    const copy = this.i18n.t().settings.advanced;
    const confirmed = await this.confirmDialog.confirm({
      title: copy.clearLogsConfirmTitle,
      message: copy.clearLogsConfirmMessage,
      confirmLabel: copy.clearLogsConfirmAction,
      cancelLabel: copy.cancelAction,
      severity: 'danger',
    });

    if (!confirmed) {
      return;
    }

    await this.readingLogService.clearAllLogs();
    this.statusMessage.set(copy.clearLogsSuccess);
    this.dataReset.emit();
  }

  async resetAllPreferences(): Promise<void> {
    const copy = this.i18n.t().settings.advanced;
    const confirmed = await this.confirmDialog.confirm({
      title: copy.resetPrefsConfirmTitle,
      message: copy.resetPrefsConfirmMessage,
      confirmLabel: copy.resetPrefsConfirmAction,
      cancelLabel: copy.cancelAction,
      severity: 'warning',
    });

    if (!confirmed) {
      return;
    }

    this.appPreferences.resetToDefaults();
    this.themeService.setTheme('system');
    this.themeService.setAccent('blue');
    this.dockPositionService.reset();
    this.catalogFilterService.setViewMode(DEFAULT_CATALOG_VIEW_MODE);
    this.catalogFilterService.setSortOption(DEFAULT_CATALOG_SORT);
    this.confirmDialog.resetSuppressed();
    this.statusMessage.set(copy.resetPrefsSuccess);
  }

  dismissStatus(): void {
    this.statusMessage.set(null);
  }

  async buildDiagnosticReport(): Promise<DiagnosticReportPayload> {
    const breakdown = await this.dataPortabilityService.computeStorageBreakdown();
    const win = this.document.defaultView;
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const isStandalone =
      typeof win?.matchMedia === 'function'
        ? win.matchMedia('(display-mode: standalone)').matches
        : false;

    return {
      appVersion: packageJson.version,
      exportedAt: new Date().toISOString(),
      environment: {
        userAgent: nav?.userAgent ?? 'unknown',
        language: nav?.language ?? 'unknown',
        viewportWidth: win?.innerWidth ?? 0,
        viewportHeight: win?.innerHeight ?? 0,
        online: nav?.onLine ?? false,
        standalonePwa: isStandalone,
      },
      storage: {
        engine: breakdown.engine,
        persistenceStatus: breakdown.persistenceStatus,
        totalBookstackBytes: breakdown.totalBookstackBytes,
        browserUsageBytes: breakdown.browserUsageBytes,
        browserQuotaBytes: breakdown.browserQuotaBytes,
        booksCount: breakdown.booksCount,
        coversCount: breakdown.coversCount,
        readingLogsCount: breakdown.readingLogsCount,
      },
      scanner: {
        nativeBarcodeDetectorSupported:
          typeof globalThis !== 'undefined' && 'BarcodeDetector' in globalThis,
      },
      preferences: {
        offlineMode: this.appPreferences.offlineMode(),
        coverMaxDimension: this.appPreferences.coverMaxDimension(),
        coverQuality: this.appPreferences.coverQuality(),
        metadataSearchQuota: this.appPreferences.metadataSearchQuota(),
        enabledProvidersCount: this.appPreferences.enabledMetadataProviders().length,
        reducedMotion: this.appPreferences.reducedMotion(),
        trackReadingTime: this.appPreferences.trackReadingTime(),
        includePreferencesInBackup: this.appPreferences.includePreferencesInBackup(),
      },
    };
  }

  async exportDiagnosticReport(): Promise<void> {
    if (this.isExportingDiagnostics()) {
      return;
    }

    this.isExportingDiagnostics.set(true);
    try {
      const payload = await this.buildDiagnosticReport();
      const dateStamp = payload.exportedAt.slice(0, 10);
      const filename = `bookstack-diagnostics-${dateStamp}.json`;
      const jsonContent = JSON.stringify(payload, null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = this.document.createElement('a');
      link.href = url;
      link.download = filename;
      this.document.body.appendChild(link);
      link.click();
      this.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.statusMessage.set(this.i18n.t().settings.advanced.diagnosticsSuccess);
    } finally {
      this.isExportingDiagnostics.set(false);
    }
  }
}
