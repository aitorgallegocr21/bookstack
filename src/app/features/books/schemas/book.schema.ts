import { z } from 'zod';
import { Book, ReadingLog } from '../models/book.model';

export const BookStatusSchema = z.enum(['pending', 'reading', 'completed', 'abandoned']);

export const BookFormatSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
});

export const BookSeriesSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(300),
  volumeNumber: z.number().min(0).max(10_000).optional(),
  notes: z.string().max(5_000).optional(),
});

export const SeriesInfoSchema = z.object({
  seriesName: z.string().min(1).max(300),
  orderInSeries: z.number().min(0).max(10_000),
  prequelBookId: z.string().max(128).optional(),
  sequelBookId: z.string().max(128).optional(),
});

const SAFE_RASTER_DATA_URL_REGEX =
  /^data:image\/(webp|jpeg|jpg|png|gif|avif);base64,[a-z0-9+/=\s]+$/i;

export function isSafeCoverUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return true;
  }

  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    SAFE_RASTER_DATA_URL_REGEX.test(trimmed)
  );
}

export const BookSchema = z
  .object({
    id: z.string().min(1).max(128),
    isbn: z.string().max(32).optional(),
    title: z.string().min(1).max(500),
    author: z.string().min(1).max(500),
    publisher: z.string().max(300).optional(),
    publicationYear: z.number().int().min(0).max(2100).optional(),
    totalPages: z.number().int().min(1, 'totalPages must be at least 1').max(100_000),
    currentPage: z.number().int().min(0).max(100_000),
    totalWords: z.number().min(0).max(100_000_000).optional(),
    totalCharacters: z.number().min(0).max(500_000_000).optional(),
    currentWords: z.number().min(0).max(100_000_000).optional(),
    totalChapters: z.number().min(0).max(50_000).optional(),
    currentChapter: z.number().min(0).max(50_000).optional(),
    status: BookStatusSchema,
    format: z.union([BookFormatSchema, z.string().max(100)]).optional(),
    series: BookSeriesSchema.optional(),
    seriesInfo: SeriesInfoSchema.optional(),
    coverUrl: z
      .string()
      .max(500_000)
      .refine(isSafeCoverUrl, { message: 'Unsupported or unsafe cover URL scheme' })
      .optional(),
    rating: z.number().min(0).max(10).optional(),
    genre: z.array(z.string().max(100)).max(30).optional(),
    startDate: z.string().max(64).optional(),
    endDate: z.string().max(64).optional(),
    notes: z.string().max(20_000).optional(),
    createdAt: z.string().min(1).max(64),
    updatedAt: z.string().min(1).max(64),
  })
  .refine((data) => data.currentPage <= data.totalPages, {
    message: 'currentPage cannot exceed totalPages',
    path: ['currentPage'],
  });

export const ReadingLogSchema = z.object({
  id: z.string().min(1).max(128),
  bookId: z.string().min(1).max(128),
  date: z.string().min(1).max(64),
  pagesRead: z.number().min(0).max(100_000),
  timeSpentMinutes: z.number().min(0).max(10_080).optional(),
  notes: z.string().max(5_000).optional(),
  createdAt: z.string().min(1).max(64),
});

/**
 * Validates raw persisted book records with Zod, discarding corrupted items safely.
 */
export function parseStoredBooks(records: unknown[]): Book[] {
  const validBooks: Book[] = [];

  for (const record of records) {
    const parsed = BookSchema.safeParse(record);
    if (parsed.success) {
      validBooks.push(parsed.data);
    } else {
      console.warn('[BookSchema] Discarded invalid stored book record:', parsed.error.issues);
    }
  }

  return validBooks;
}

/**
 * Validates raw persisted reading log records with Zod, discarding corrupted items safely.
 */
export function parseStoredReadingLogs(records: unknown[]): ReadingLog[] {
  const validLogs: ReadingLog[] = [];

  for (const record of records) {
    const parsed = ReadingLogSchema.safeParse(record);
    if (parsed.success) {
      validLogs.push(parsed.data);
    } else {
      console.warn('[ReadingLogSchema] Discarded invalid stored reading log:', parsed.error.issues);
    }
  }

  return validLogs;
}
