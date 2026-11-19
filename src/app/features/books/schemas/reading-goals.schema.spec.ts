import { describe, it, expect } from 'vitest';
import { ReadingGoalsSchema, parseStoredReadingGoals } from './reading-goals.schema';
import { DEFAULT_READING_GOALS } from '../models/book.model';

describe('ReadingGoalsSchema', () => {
  it('should accept valid reading goals payload', () => {
    const valid = {
      year: 2026,
      targetBooks: 24,
      targetPages: 6000,
    };

    const parsed = ReadingGoalsSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual(valid);
    }
  });

  it('should reject invalid boundaries for year, books, and pages', () => {
    expect(
      ReadingGoalsSchema.safeParse({ year: 1999, targetBooks: 10, targetPages: 500 }).success
    ).toBe(false);
    expect(
      ReadingGoalsSchema.safeParse({ year: 2026, targetBooks: 0, targetPages: 500 }).success
    ).toBe(false);
    expect(
      ReadingGoalsSchema.safeParse({ year: 2026, targetBooks: 10, targetPages: 5 }).success
    ).toBe(false);
  });

  it('should return parsed goals if matching current year', () => {
    const record = { year: 2026, targetBooks: 30, targetPages: 8000 };
    const result = parseStoredReadingGoals(record, 2026);

    expect(result).toEqual({ year: 2026, targetBooks: 30, targetPages: 8000 });
  });

  it('should fallback to defaults when record is invalid or for another year', () => {
    const expiredRecord = { year: 2025, targetBooks: 50, targetPages: 12000 };
    const result = parseStoredReadingGoals(expiredRecord, 2026);

    expect(result).toEqual({
      ...DEFAULT_READING_GOALS,
      year: 2026,
    });

    const malformed = { year: 'not-a-number' };
    expect(parseStoredReadingGoals(malformed, 2026)).toEqual({
      ...DEFAULT_READING_GOALS,
      year: 2026,
    });
  });
});
