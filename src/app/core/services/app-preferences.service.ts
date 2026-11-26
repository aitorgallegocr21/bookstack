import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AppPreferences,
  ConfigurableMetadataProvider,
  DEFAULT_APP_PREFERENCES,
} from '../models/app-preferences.model';
import { parseAppPreferences } from '../schemas/app-preferences.schema';
import { StorageAdapterService } from './storage-adapter.service';

const BACKUP_OVERDUE_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class AppPreferencesService {
  private readonly storage = inject(StorageAdapterService);

  private readonly _preferences = signal<AppPreferences>(this.storage.loadAppPreferences());
  readonly preferences = this._preferences.asReadonly();

  readonly adaptiveCoverTint = computed(() => this._preferences().adaptiveCoverTint);
  readonly reducedMotion = computed(() => this._preferences().reducedMotion);
  readonly defaultBookFormat = computed(() => this._preferences().defaultBookFormat);
  readonly defaultBookStatus = computed(() => this._preferences().defaultBookStatus);
  readonly showCardQuickActions = computed(() => this._preferences().showCardQuickActions);
  readonly showCardProgressBar = computed(() => this._preferences().showCardProgressBar);
  readonly quickPageStep = computed(() => this._preferences().quickPageStep);
  readonly trackReadingTime = computed(() => this._preferences().trackReadingTime);
  readonly offlineMode = computed(() => this._preferences().offlineMode);
  readonly metadataProviders = computed(() => this._preferences().metadataProviders);
  readonly enabledMetadataProviders = computed<ConfigurableMetadataProvider[]>(() =>
    this._preferences()
      .metadataProviders.filter((provider) => provider.enabled)
      .map((provider) => provider.id)
  );
  readonly scannerPreferPhotoMode = computed(() => this._preferences().scannerPreferPhotoMode);
  readonly scannerAutoTorch = computed(() => this._preferences().scannerAutoTorch);
  readonly coverMaxDimension = computed(() => this._preferences().coverMaxDimension);
  readonly coverQuality = computed(() => this._preferences().coverQuality);
  readonly metadataSearchQuota = computed(() => this._preferences().metadataSearchQuota);
  readonly includePreferencesInBackup = computed(
    () => this._preferences().includePreferencesInBackup
  );
  readonly lastBackupExportedAt = computed(() => this._preferences().lastBackupExportedAt);

  readonly isBackupOverdue = computed(() => {
    const exportedAt = this._preferences().lastBackupExportedAt;
    if (!exportedAt) {
      return true;
    }
    const parsedTime = Date.parse(exportedAt);
    if (!Number.isFinite(parsedTime)) {
      return true;
    }
    return Date.now() - parsedTime > BACKUP_OVERDUE_MS;
  });

  updatePreferences(patch: Partial<AppPreferences>): void {
    const next = parseAppPreferences({
      ...this._preferences(),
      ...patch,
    });
    this._preferences.set(next);
    this.storage.saveAppPreferences(next);
  }

  setPreference<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): void {
    this.updatePreferences({ [key]: value } as Partial<AppPreferences>);
  }

  toggleMetadataProvider(id: ConfigurableMetadataProvider): void {
    const nextProviders = this._preferences().metadataProviders.map((provider) =>
      provider.id === id ? { ...provider, enabled: !provider.enabled } : provider
    );
    this.updatePreferences({ metadataProviders: nextProviders });
  }

  moveMetadataProvider(id: ConfigurableMetadataProvider, direction: 'up' | 'down'): void {
    const list = [...this._preferences().metadataProviders];
    const index = list.findIndex((provider) => provider.id === id);
    if (index === -1) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) {
      return;
    }
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);
    this.updatePreferences({ metadataProviders: list });
  }

  markBackupExported(isoTimestamp: string = new Date().toISOString()): void {
    this.updatePreferences({ lastBackupExportedAt: isoTimestamp });
  }

  resetToDefaults(): void {
    const defaults = parseAppPreferences(DEFAULT_APP_PREFERENCES);
    this._preferences.set(defaults);
    this.storage.clearAppPreferences();
  }

  getSnapshot(): AppPreferences {
    return parseAppPreferences(this._preferences());
  }

  restoreSnapshot(raw: unknown): AppPreferences {
    const restored = parseAppPreferences(raw);
    this._preferences.set(restored);
    this.storage.saveAppPreferences(restored);
    return restored;
  }
}
