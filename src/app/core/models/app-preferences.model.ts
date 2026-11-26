export type ConfigurableMetadataProvider =
  'googlebooks' | 'openlibrary' | 'applebooks' | 'wikidata' | 'archive';

export const CONFIGURABLE_METADATA_PROVIDERS: readonly ConfigurableMetadataProvider[] = [
  'googlebooks',
  'openlibrary',
  'applebooks',
  'wikidata',
  'archive',
];

export interface MetadataProviderPreference {
  id: ConfigurableMetadataProvider;
  enabled: boolean;
}

export type ReducedMotionPreference = 'system' | 'reduce';

export type QuickPageStep = 1 | 5 | 10 | 25;

export type CoverMaxDimension = 300 | 360 | 400 | 600;

export type MetadataSearchQuota = 4 | 8 | 12;

export type DefaultBookFormat = 'physical' | 'ebook' | 'audiobook';

export type DefaultBookStatus = 'pending' | 'reading';

export interface AppPreferences {
  adaptiveCoverTint: boolean;
  reducedMotion: ReducedMotionPreference;
  defaultBookFormat: DefaultBookFormat;
  defaultBookStatus: DefaultBookStatus;
  showCardQuickActions: boolean;
  showCardProgressBar: boolean;
  quickPageStep: QuickPageStep;
  trackReadingTime: boolean;
  offlineMode: boolean;
  metadataProviders: MetadataProviderPreference[];
  scannerPreferPhotoMode: boolean;
  scannerAutoTorch: boolean;
  coverMaxDimension: CoverMaxDimension;
  coverQuality: number;
  metadataSearchQuota: MetadataSearchQuota;
  includePreferencesInBackup: boolean;
  lastBackupExportedAt: string | null;
}

export const DEFAULT_METADATA_PROVIDERS: readonly MetadataProviderPreference[] =
  CONFIGURABLE_METADATA_PROVIDERS.map((id) => ({ id, enabled: true }));

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  adaptiveCoverTint: true,
  reducedMotion: 'system',
  defaultBookFormat: 'physical',
  defaultBookStatus: 'pending',
  showCardQuickActions: true,
  showCardProgressBar: true,
  quickPageStep: 10,
  trackReadingTime: true,
  offlineMode: false,
  metadataProviders: DEFAULT_METADATA_PROVIDERS.map((provider) => ({ ...provider })),
  scannerPreferPhotoMode: false,
  scannerAutoTorch: false,
  coverMaxDimension: 360,
  coverQuality: 0.7,
  metadataSearchQuota: 8,
  includePreferencesInBackup: true,
  lastBackupExportedAt: null,
};
