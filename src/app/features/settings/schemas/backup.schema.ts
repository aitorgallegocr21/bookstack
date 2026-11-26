import { z } from 'zod';
import { Book, ReadingGoals, ReadingLog } from '../../books/models/book.model';
import { BookSchema, ReadingLogSchema } from '../../books/schemas/book.schema';
import {
  MIN_HISTORICAL_PUBLICATION_YEAR,
  getMaxAllowedYear,
  sanitizeFutureIsoDate,
  suggestCorrectedYear,
} from '../../books/utils/temporal-bounds.utils';
import { ReadingGoalsSchema } from '../../books/schemas/reading-goals.schema';
import { AppPreferencesSchema } from '../../../core/schemas/app-preferences.schema';
import { SeriesMetadata } from '../../series/models/series.model';
import { SeriesMetadataSchema } from '../../series/schemas/series.schema';
import { BackupPreferences } from '../models/data-portability.model';

export const BackupPreferencesSchema = z.object({
  locale: z.enum(['es', 'en']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accent: z.enum(['blue', 'indigo', 'emerald', 'amber', 'rose']).optional(),
  desktopDockPosition: z.enum(['left', 'right', 'top', 'bottom']).optional(),
  mobileDockPosition: z.enum(['top', 'bottom']).optional(),
  catalogViewMode: z.enum(['grid', 'detailed', 'compact']).optional(),
  catalogSort: z
    .enum([
      'recent',
      'title-asc',
      'title-desc',
      'author-asc',
      'rating-desc',
      'progress-desc',
      'pages-desc',
    ])
    .optional(),
  appPreferences: AppPreferencesSchema.partial().optional(),
});

export const ENCRYPTED_BACKUP_MIN_ITERATIONS = 100_000;
export const ENCRYPTED_BACKUP_MAX_ITERATIONS = 2_000_000;

export const EncryptedBackupEnvelopeSchema = z.object({
  format: z.literal('bookstack-encrypted-backup'),
  version: z.literal(1),
  payloadType: z.enum(['json', 'zip']),
  kdf: z.literal('PBKDF2-SHA256'),
  iterations: z
    .number()
    .int()
    .min(ENCRYPTED_BACKUP_MIN_ITERATIONS)
    .max(ENCRYPTED_BACKUP_MAX_ITERATIONS),
  cipher: z.literal('AES-GCM-256'),
  salt: z.string().min(1).max(256),
  iv: z.string().min(1).max(256),
  ciphertext: z.string().min(1),
  exportedAt: z.string().min(1).max(64),
});

export function isEncryptedBackupPayload(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return false;
  }
  return (raw as Record<string, unknown>)['format'] === 'bookstack-encrypted-backup';
}

const MAX_BACKUP_RECORDS = 25_000;

export const BackupEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  app: z.literal('BookStack'),
  exportedAt: z.string().min(1).max(64),
  books: z.array(z.unknown()).max(MAX_BACKUP_RECORDS),
  readingLogs: z
    .array(z.unknown())
    .max(MAX_BACKUP_RECORDS * 5)
    .default([]),
  seriesMetadata: z.array(z.unknown()).max(MAX_BACKUP_RECORDS).default([]),
  readingGoals: ReadingGoalsSchema.nullable().optional(),
  preferences: BackupPreferencesSchema.optional(),
});

export interface ParsedBackupPayload {
  validBooks: Book[];
  validReadingLogs: ReadingLog[];
  validSeriesMetadata: SeriesMetadata[];
  readingGoals: ReadingGoals | null;
  preferences: BackupPreferences | null;
  invalidBooksCount: number;
  invalidLogsCount: number;
  invalidSeriesMetadataCount: number;
}

export type BackupParseResult =
  { success: true; data: ParsedBackupPayload } | { success: false; error: string };

const STATUS_ALIAS_MAP: Record<string, 'pending' | 'reading' | 'completed' | 'abandoned'> = {
  pending: 'pending',
  pendiente: 'pending',
  'por leer': 'pending',
  'to-read': 'pending',
  'to read': 'pending',
  unread: 'pending',
  reading: 'reading',
  leyendo: 'reading',
  'en lectura': 'reading',
  'currently-reading': 'reading',
  'currently reading': 'reading',
  completed: 'completed',
  completado: 'completed',
  terminado: 'completed',
  finished: 'completed',
  leido: 'completed',
  leído: 'completed',
  read: 'completed',
  abandoned: 'abandoned',
  abandonado: 'abandoned',
  dropped: 'abandoned',
  dnf: 'abandoned',
};

function generateFallbackUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `book-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeStatusValue(value: unknown): 'pending' | 'reading' | 'completed' | 'abandoned' {
  if (typeof value !== 'string') {
    return 'pending';
  }
  const normalized = value.trim().toLowerCase();
  return STATUS_ALIAS_MAP[normalized] ?? 'pending';
}

function cleanOptionalFields(normalized: Record<string, unknown>): void {
  const nullableStringFields = [
    'isbn',
    'publisher',
    'coverUrl',
    'startDate',
    'endDate',
    'notes',
  ] as const;

  for (const field of nullableStringFields) {
    const val = normalized[field];
    if (val === null || (typeof val === 'string' && val.trim() === '')) {
      delete normalized[field];
    }
  }

  if (normalized['series'] === null) {
    delete normalized['series'];
  }
  if (normalized['seriesInfo'] === null) {
    delete normalized['seriesInfo'];
  }
  if (normalized['format'] === null || normalized['format'] === '') {
    delete normalized['format'];
  }
}

/**
 * Normalizes external or AI-generated book records prior to strict Zod validation so
 * missing IDs, timestamps, status aliases, numeric strings, or unknown `totalPages`
 * are safely defaulted instead of discarding valid catalog entries.
 */
export function normalizeImportedBookCandidate(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return raw;
  }

  const record = raw as Record<string, unknown>;
  const title = typeof record['title'] === 'string' ? record['title'].trim() : '';
  const author = typeof record['author'] === 'string' ? record['author'].trim() : '';

  if (!title || !author) {
    return raw;
  }

  const nowIso = new Date().toISOString();
  const normalized: Record<string, unknown> = {
    ...record,
    title,
    author,
    id:
      typeof record['id'] === 'string' && record['id'].trim().length > 0
        ? record['id'].trim()
        : generateFallbackUuid(),
    createdAt:
      typeof record['createdAt'] === 'string' && record['createdAt'].trim().length > 0
        ? record['createdAt'].trim()
        : nowIso,
    updatedAt:
      typeof record['updatedAt'] === 'string' && record['updatedAt'].trim().length > 0
        ? record['updatedAt'].trim()
        : nowIso,
    status: normalizeStatusValue(record['status']),
  };

  cleanOptionalFields(normalized);

  if (typeof normalized['startDate'] === 'string' && normalized['startDate'].trim().length > 0) {
    normalized['startDate'] = sanitizeFutureIsoDate(normalized['startDate']);
  }
  if (typeof normalized['endDate'] === 'string' && normalized['endDate'].trim().length > 0) {
    normalized['endDate'] = sanitizeFutureIsoDate(normalized['endDate']);
  }

  const parsedCurrentPage = parseFiniteNumber(record['currentPage']);
  let currentPage =
    parsedCurrentPage !== undefined && parsedCurrentPage >= 0 ? Math.floor(parsedCurrentPage) : 0;

  const parsedTotalPages = parseFiniteNumber(record['totalPages']);
  const totalPages =
    parsedTotalPages !== undefined && parsedTotalPages >= 1
      ? Math.floor(parsedTotalPages)
      : Math.max(1, currentPage);

  if (currentPage > totalPages && totalPages > 1) {
    currentPage = totalPages;
  }

  normalized['currentPage'] = currentPage;
  normalized['totalPages'] = totalPages;

  const parsedYear = parseFiniteNumber(record['publicationYear']);
  if (parsedYear !== undefined) {
    const truncatedYear = Math.trunc(parsedYear);
    if (truncatedYear > getMaxAllowedYear()) {
      normalized['publicationYear'] = suggestCorrectedYear(truncatedYear);
    } else if (truncatedYear >= MIN_HISTORICAL_PUBLICATION_YEAR) {
      normalized['publicationYear'] = truncatedYear;
    } else {
      delete normalized['publicationYear'];
    }
  } else if (record['publicationYear'] === null || record['publicationYear'] === '') {
    delete normalized['publicationYear'];
  }

  const parsedRating = parseFiniteNumber(record['rating']);
  if (parsedRating !== undefined) {
    normalized['rating'] = parsedRating;
  } else if (record['rating'] === null || record['rating'] === '') {
    delete normalized['rating'];
  }

  if (typeof record['genre'] === 'string') {
    const items = record['genre']
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    if (items.length > 0) {
      normalized['genre'] = items;
    } else {
      delete normalized['genre'];
    }
  } else if (record['genre'] === null) {
    delete normalized['genre'];
  }

  return normalized;
}

function filterBooks(rawBooks: unknown[]): { validBooks: Book[]; invalidBooksCount: number } {
  const validBooks: Book[] = [];
  let invalidBooksCount = 0;

  for (const item of rawBooks) {
    const parsed = BookSchema.safeParse(normalizeImportedBookCandidate(item));
    if (parsed.success) {
      validBooks.push(parsed.data);
    } else {
      invalidBooksCount += 1;
    }
  }

  return { validBooks, invalidBooksCount };
}

function filterReadingLogs(rawLogs: unknown[]): {
  validReadingLogs: ReadingLog[];
  invalidLogsCount: number;
} {
  const validReadingLogs: ReadingLog[] = [];
  let invalidLogsCount = 0;

  for (const item of rawLogs) {
    const candidate =
      item !== null &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      typeof (item as Record<string, unknown>)['date'] === 'string'
        ? {
            ...(item as Record<string, unknown>),
            date: sanitizeFutureIsoDate((item as Record<string, unknown>)['date'] as string),
          }
        : item;
    const parsed = ReadingLogSchema.safeParse(candidate);
    if (parsed.success) {
      validReadingLogs.push(parsed.data);
    } else {
      invalidLogsCount += 1;
    }
  }

  return { validReadingLogs, invalidLogsCount };
}

function filterSeriesMetadata(rawSeriesMetadata: unknown[]): {
  validSeriesMetadata: SeriesMetadata[];
  invalidSeriesMetadataCount: number;
} {
  const validSeriesMetadata: SeriesMetadata[] = [];
  let invalidSeriesMetadataCount = 0;

  for (const item of rawSeriesMetadata) {
    const parsed = SeriesMetadataSchema.safeParse(item);
    if (parsed.success) {
      validSeriesMetadata.push(parsed.data);
    } else {
      invalidSeriesMetadataCount += 1;
    }
  }

  return { validSeriesMetadata, invalidSeriesMetadataCount };
}

/**
 * Parses either a full BookStack versioned backup envelope or a legacy raw Book[] array,
 * validating individual book, reading log, and series metadata records without rejecting
 * the entire payload when a subset of entries is malformed.
 */
export function parseBackupJson(raw: unknown): BackupParseResult {
  if (Array.isArray(raw)) {
    const { validBooks, invalidBooksCount } = filterBooks(raw);
    return {
      success: true,
      data: {
        validBooks,
        validReadingLogs: [],
        validSeriesMetadata: [],
        readingGoals: null,
        preferences: null,
        invalidBooksCount,
        invalidLogsCount: 0,
        invalidSeriesMetadataCount: 0,
      },
    };
  }

  const envelope = BackupEnvelopeSchema.safeParse(raw);
  if (!envelope.success) {
    return {
      success: false,
      error: envelope.error.issues.map((issue) => issue.message).join('; '),
    };
  }

  const { validBooks, invalidBooksCount } = filterBooks(envelope.data.books);
  const { validReadingLogs, invalidLogsCount } = filterReadingLogs(envelope.data.readingLogs);
  const { validSeriesMetadata, invalidSeriesMetadataCount } = filterSeriesMetadata(
    envelope.data.seriesMetadata
  );

  return {
    success: true,
    data: {
      validBooks,
      validReadingLogs,
      validSeriesMetadata,
      readingGoals: envelope.data.readingGoals ?? null,
      preferences: envelope.data.preferences ?? null,
      invalidBooksCount,
      invalidLogsCount,
      invalidSeriesMetadataCount,
    },
  };
}
