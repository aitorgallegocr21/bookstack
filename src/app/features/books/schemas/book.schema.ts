import { z } from 'zod';
import { Book, ReadingLog } from '../models/book.model';

export const BookStatusSchema = z.enum(['pending', 'reading', 'completed', 'abandoned']);

export const BookFormatSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const BookSeriesSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  volumeNumber: z.number().optional(),
  notes: z.string().optional(),
});

export const SeriesInfoSchema = z.object({
  seriesName: z.string().min(1),
  orderInSeries: z.number(),
  prequelBookId: z.string().optional(),
  sequelBookId: z.string().optional(),
});

export function isSafeCoverUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) {
    return true;
  }

  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  );
}

export const BookSchema = z.object({
  id: z.string().min(1),
  isbn: z.string().optional(),
  title: z.string().min(1),
  author: z.string().min(1),
  publisher: z.string().optional(),
  publicationYear: z.number().optional(),
  totalPages: z.number().min(0),
  currentPage: z.number().min(0),
  totalWords: z.number().min(0).optional(),
  totalCharacters: z.number().min(0).optional(),
  currentWords: z.number().min(0).optional(),
  totalChapters: z.number().min(0).optional(),
  currentChapter: z.number().min(0).optional(),
  status: BookStatusSchema,
  format: z.union([BookFormatSchema, z.string()]).optional(),
  series: BookSeriesSchema.optional(),
  seriesInfo: SeriesInfoSchema.optional(),
  coverUrl: z
    .string()
    .refine(isSafeCoverUrl, { message: 'Unsupported or unsafe cover URL scheme' })
    .optional(),
  rating: z.number().min(0).max(10).optional(),
  genre: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const ReadingLogSchema = z.object({
  id: z.string().min(1),
  bookId: z.string().min(1),
  date: z.string().min(1),
  pagesRead: z.number().min(0),
  timeSpentMinutes: z.number().min(0).optional(),
  notes: z.string().optional(),
  createdAt: z.string().min(1),
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
