import { z } from 'zod';
import { Book, ReadingGoals, ReadingLog } from '../../books/models/book.model';
import { BookSchema, ReadingLogSchema } from '../../books/schemas/book.schema';
import { ReadingGoalsSchema } from '../../books/schemas/reading-goals.schema';
import { BackupPreferences } from '../models/data-portability.model';

export const BackupPreferencesSchema = z.object({
  locale: z.enum(['es', 'en']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
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
});

export const BackupEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  app: z.literal('BookStack'),
  exportedAt: z.string().min(1),
  books: z.array(z.unknown()),
  readingLogs: z.array(z.unknown()).default([]),
  readingGoals: ReadingGoalsSchema.nullable().optional(),
  preferences: BackupPreferencesSchema.optional(),
});

export interface ParsedBackupPayload {
  validBooks: Book[];
  validReadingLogs: ReadingLog[];
  readingGoals: ReadingGoals | null;
  preferences: BackupPreferences | null;
  invalidBooksCount: number;
  invalidLogsCount: number;
}

export type BackupParseResult =
  { success: true; data: ParsedBackupPayload } | { success: false; error: string };

function filterBooks(rawBooks: unknown[]): { validBooks: Book[]; invalidBooksCount: number } {
  const validBooks: Book[] = [];
  let invalidBooksCount = 0;

  for (const item of rawBooks) {
    const parsed = BookSchema.safeParse(item);
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
    const parsed = ReadingLogSchema.safeParse(item);
    if (parsed.success) {
      validReadingLogs.push(parsed.data);
    } else {
      invalidLogsCount += 1;
    }
  }

  return { validReadingLogs, invalidLogsCount };
}

/**
 * Parses either a full BookStack versioned backup envelope or a legacy raw Book[] array,
 * validating individual book and reading log records without rejecting the entire payload
 * when a subset of entries is malformed.
 */
export function parseBackupJson(raw: unknown): BackupParseResult {
  if (Array.isArray(raw)) {
    const { validBooks, invalidBooksCount } = filterBooks(raw);
    return {
      success: true,
      data: {
        validBooks,
        validReadingLogs: [],
        readingGoals: null,
        preferences: null,
        invalidBooksCount,
        invalidLogsCount: 0,
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

  return {
    success: true,
    data: {
      validBooks,
      validReadingLogs,
      readingGoals: envelope.data.readingGoals ?? null,
      preferences: envelope.data.preferences ?? null,
      invalidBooksCount,
      invalidLogsCount,
    },
  };
}
