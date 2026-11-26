import { TestBed } from '@angular/core/testing';
import { DEFAULT_APP_PREFERENCES } from '../models/app-preferences.model';
import { parseAppPreferences } from '../schemas/app-preferences.schema';
import { AppPreferencesService } from './app-preferences.service';
import { StorageAdapterService } from './storage-adapter.service';

describe('AppPreferencesService', () => {
  let service: AppPreferencesService;
  let storage: StorageAdapterService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageAdapterService);
    service = TestBed.inject(AppPreferencesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with default preferences when storage is empty', () => {
    expect(service.preferences()).toEqual(DEFAULT_APP_PREFERENCES);
    expect(service.adaptiveCoverTint()).toBe(true);
    expect(service.reducedMotion()).toBe('system');
    expect(service.quickPageStep()).toBe(10);
    expect(service.enabledMetadataProviders()).toEqual([
      'googlebooks',
      'openlibrary',
      'applebooks',
      'wikidata',
      'archive',
    ]);
    expect(service.isBackupOverdue()).toBe(true);
  });

  it('persists updates to StorageAdapterService and hydrates on fresh service', () => {
    service.updatePreferences({
      adaptiveCoverTint: false,
      reducedMotion: 'reduce',
      quickPageStep: 25,
      offlineMode: true,
    });

    expect(service.adaptiveCoverTint()).toBe(false);
    expect(service.reducedMotion()).toBe('reduce');
    expect(service.quickPageStep()).toBe(25);
    expect(service.offlineMode()).toBe(true);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(AppPreferencesService);
    expect(freshService.adaptiveCoverTint()).toBe(false);
    expect(freshService.reducedMotion()).toBe('reduce');
    expect(freshService.quickPageStep()).toBe(25);
    expect(freshService.offlineMode()).toBe(true);
  });

  it('normalizes malformed storage payloads, clamps coverQuality, and completes providers', () => {
    const parsed = parseAppPreferences({
      coverQuality: 1.5,
      quickPageStep: 999,
      metadataProviders: [
        { id: 'wikidata', enabled: false },
        { id: 'wikidata', enabled: true },
        { id: 'invalid-provider', enabled: false },
      ],
    });

    expect(parsed.coverQuality).toBe(0.95);
    expect(parsed.quickPageStep).toBe(10);
    expect(parsed.metadataProviders).toEqual([
      { id: 'wikidata', enabled: false },
      { id: 'googlebooks', enabled: true },
      { id: 'openlibrary', enabled: true },
      { id: 'applebooks', enabled: true },
      { id: 'archive', enabled: true },
    ]);

    expect(parseAppPreferences({ coverQuality: 0.1 }).coverQuality).toBe(0.5);
  });

  it('toggles and reorders metadata providers with boundary safety', () => {
    service.toggleMetadataProvider('openlibrary');
    expect(service.enabledMetadataProviders()).toEqual([
      'googlebooks',
      'applebooks',
      'wikidata',
      'archive',
    ]);

    service.moveMetadataProvider('googlebooks', 'up');
    expect(service.metadataProviders()[0].id).toBe('googlebooks');

    service.moveMetadataProvider('applebooks', 'up');
    expect(service.metadataProviders().map((p) => p.id)).toEqual([
      'googlebooks',
      'applebooks',
      'openlibrary',
      'wikidata',
      'archive',
    ]);

    service.moveMetadataProvider('archive', 'down');
    expect(service.metadataProviders()[4].id).toBe('archive');
  });

  it('computes isBackupOverdue accurately and updates on markBackupExported', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    service.setPreference('lastBackupExportedAt', tenDaysAgo);
    expect(service.isBackupOverdue()).toBe(false);

    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    service.setPreference('lastBackupExportedAt', thirtyOneDaysAgo);
    expect(service.isBackupOverdue()).toBe(true);

    service.setPreference('lastBackupExportedAt', 'not-a-date');
    expect(service.isBackupOverdue()).toBe(true);

    service.markBackupExported();
    expect(service.isBackupOverdue()).toBe(false);
    expect(service.lastBackupExportedAt()).toBeTruthy();
  });

  it('supports snapshot export/restore and resetToDefaults', () => {
    service.updatePreferences({
      defaultBookFormat: 'ebook',
      coverMaxDimension: 600,
      trackReadingTime: false,
    });
    const snapshot = service.getSnapshot();

    service.resetToDefaults();
    expect(service.preferences()).toEqual(DEFAULT_APP_PREFERENCES);
    expect(localStorage.getItem(storage.appPreferencesKey)).toBeNull();

    service.restoreSnapshot(snapshot);
    expect(service.defaultBookFormat()).toBe('ebook');
    expect(service.coverMaxDimension()).toBe(600);
    expect(service.trackReadingTime()).toBe(false);
  });
});
