import { SupportedLocale } from '../../../core/i18n/i18n.types';
import { Book, ReadingGoals, ReadingLog } from '../../books/models/book.model';
import { CatalogSortOption, CatalogViewMode } from '../../books/models/catalog-filter.model';

export type ImportFormat = 'json' | 'csv';
export type ImportConflictMode = 'merge' | 'overwrite';
export type StorageHealthStatus = 'healthy' | 'moderate' | 'near-limit';
export type StorageEngineKind = 'indexeddb' | 'localstorage';

export interface BackupPreferences {
  locale?: SupportedLocale;
  theme?: 'light' | 'dark';
  catalogViewMode?: CatalogViewMode;
  catalogSort?: CatalogSortOption;
}

export interface BookstackBackupEnvelope {
  schemaVersion: 1;
  app: 'BookStack';
  exportedAt: string;
  books: Book[];
  readingLogs: ReadingLog[];
  readingGoals?: ReadingGoals | null;
  preferences?: BackupPreferences;
}

export interface ImportPreviewSummary {
  format: ImportFormat;
  fileName: string;
  validBooks: Book[];
  validReadingLogs: ReadingLog[];
  readingGoals: ReadingGoals | null;
  preferences: BackupPreferences | null;
  invalidBooksCount: number;
  invalidLogsCount: number;
  duplicateBooksCount: number;
  newBooksCount: number;
}

export interface ImportExecutionResult {
  mode: ImportConflictMode;
  format: ImportFormat;
  booksImported: number;
  logsImported: number;
  skippedRecords: number;
  goalsRestored: boolean;
  preferencesRestored: boolean;
}

export interface StorageBreakdownSummary {
  engine: StorageEngineKind;
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
