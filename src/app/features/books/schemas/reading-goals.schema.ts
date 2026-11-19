import { z } from 'zod';
import { ReadingGoals, DEFAULT_READING_GOALS } from '../models/book.model';

export const ReadingGoalsSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  targetBooks: z.number().int().min(1).max(1000),
  targetPages: z.number().int().min(10).max(1000000),
});

/**
 * Validates and parses raw stored reading goals with Zod, falling back safely
 * to standard defaults for the requested or current calendar year.
 */
export function parseStoredReadingGoals(
  record: unknown,
  currentYear = new Date().getFullYear()
): ReadingGoals {
  const parsed = ReadingGoalsSchema.safeParse(record);

  if (parsed.success && parsed.data.year === currentYear) {
    return parsed.data;
  }

  return {
    ...DEFAULT_READING_GOALS,
    year: currentYear,
  };
}
