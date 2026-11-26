import { SupportedLocale } from '../../../core/i18n/i18n.types';
import { AppPreferences } from '../../../core/models/app-preferences.model';
import { AccentPalette, ThemeMode } from '../../../core/services/theme.service';
import { DockPosition, MobileDockPosition } from '../../../core/utils/dock-snap.utils';
import { Book, ReadingGoals, ReadingLog } from '../../books/models/book.model';
import { CatalogSortOption, CatalogViewMode } from '../../books/models/catalog-filter.model';
import { SeriesMetadata } from '../../series/models/series.model';

export type ImportFormat = 'json' | 'csv' | 'zip';
export type EncryptedBackupPayloadType = 'json' | 'zip';
export type ImportConflictMode = 'merge' | 'overwrite';
export type StorageHealthStatus = 'healthy' | 'moderate' | 'near-limit';
export type StorageEngineKind = 'indexeddb' | 'localstorage';
export type StoragePersistenceStatus = 'persisted' | 'best-effort' | 'unsupported';
export type PersistentStorageRequestResult = 'persisted' | 'denied' | 'unsupported';

export interface EncryptedBackupEnvelope {
  format: 'bookstack-encrypted-backup';
  version: 1;
  payloadType: EncryptedBackupPayloadType;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  cipher: 'AES-GCM-256';
  salt: string;
  iv: string;
  ciphertext: string;
  exportedAt: string;
}

export interface BackupExportEncryptionOptions {
  password?: string;
}

export interface IndexedDbDiagnosticsInfo {
  dbName: string;
  version: number;
  objectStoresCount: number;
}

export interface BackupPreferences {
  locale?: SupportedLocale;
  theme?: ThemeMode;
  accent?: AccentPalette;
  desktopDockPosition?: DockPosition;
  mobileDockPosition?: MobileDockPosition;
  catalogViewMode?: CatalogViewMode;
  catalogSort?: CatalogSortOption;
  appPreferences?: Partial<AppPreferences>;
}

export interface BookstackBackupEnvelope {
  schemaVersion: 1;
  app: 'BookStack';
  exportedAt: string;
  books: Book[];
  readingLogs: ReadingLog[];
  seriesMetadata?: SeriesMetadata[];
  readingGoals?: ReadingGoals | null;
  preferences?: BackupPreferences;
}

export interface ImportPreviewSummary {
  format: ImportFormat;
  fileName: string;
  validBooks: Book[];
  validReadingLogs: ReadingLog[];
  validSeriesMetadata: SeriesMetadata[];
  readingGoals: ReadingGoals | null;
  preferences: BackupPreferences | null;
  hasPreferences: boolean;
  invalidBooksCount: number;
  invalidLogsCount: number;
  invalidSeriesMetadataCount: number;
  duplicateBooksCount: number;
  newBooksCount: number;
}

export interface ImportExecutionResult {
  mode: ImportConflictMode;
  format: ImportFormat;
  booksImported: number;
  logsImported: number;
  seriesMetadataImported: number;
  skippedRecords: number;
  goalsRestored: boolean;
  preferencesRestored: boolean;
  missingCoversCount: number;
  missingCoversWithIsbnCount: number;
  incompleteMetadataCount: number;
}

export interface StorageBreakdownSummary {
  engine: StorageEngineKind;
  persistenceStatus: StoragePersistenceStatus;
  indexedDbInfo: IndexedDbDiagnosticsInfo;
  totalBookstackBytes: number;
  booksMetadataBytes: number;
  coversBase64Bytes: number;
  readingLogsBytes: number;
  preferencesBytes: number;
  booksCount: number;
  coversCount: number;
  readingLogsCount: number;
  browserUsageBytes: number | null;
  browserQuotaBytes: number | null;
  healthStatus: StorageHealthStatus;
}
