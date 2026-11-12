import { vi } from 'vitest';
import {
  BookSchema,
  ReadingLogSchema,
  parseStoredBooks,
  parseStoredReadingLogs,
} from './book.schema';

describe('book.schema', () => {
  const validBook = {
    id: 'b-1',
    title: 'Dune',
    author: 'Frank Herbert',
    totalPages: 688,
    currentPage: 120,
    status: 'reading',
    format: 'Físico',
    series: {
      id: 's-1',
      name: 'Dune Chronicles',
      volumeNumber: 1,
    },
    rating: 9.5,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
  };

  const validLog = {
    id: 'l-1',
    bookId: 'b-1',
    date: '2026-01-02',
    pagesRead: 45,
    timeSpentMinutes: 60,
    notes: 'Great opening chapters',
    createdAt: '2026-01-02T11:00:00.000Z',
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should accept valid Book and ReadingLog payloads', () => {
    expect(BookSchema.safeParse(validBook).success).toBe(true);
    expect(ReadingLogSchema.safeParse(validLog).success).toBe(true);
  });

  it('should reject invalid Book payloads (empty title, negative pages, invalid status, out-of-range rating, unsafe coverUrl)', () => {
    expect(BookSchema.safeParse({ ...validBook, title: '' }).success).toBe(false);
    expect(BookSchema.safeParse({ ...validBook, totalPages: -1 }).success).toBe(false);
    expect(BookSchema.safeParse({ ...validBook, status: 'archived' }).success).toBe(false);
    expect(BookSchema.safeParse({ ...validBook, rating: 11 }).success).toBe(false);
    expect(BookSchema.safeParse({ ...validBook, coverUrl: 'javascript:alert(1)' }).success).toBe(
      false
    );
    expect(
      BookSchema.safeParse({ ...validBook, coverUrl: 'data:text/html,<script>1</script>' }).success
    ).toBe(false);
    expect(
      BookSchema.safeParse({ ...validBook, coverUrl: 'data:image/webp;base64,abc' }).success
    ).toBe(true);
  });

  it('should reject invalid ReadingLog payloads', () => {
    expect(ReadingLogSchema.safeParse({ ...validLog, bookId: '' }).success).toBe(false);
    expect(ReadingLogSchema.safeParse({ ...validLog, pagesRead: -5 }).success).toBe(false);
  });

  it('should filter out corrupted records safely in parseStoredBooks and parseStoredReadingLogs', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const parsedBooks = parseStoredBooks([validBook, { id: 'broken', totalPages: -10 }, null]);
    expect(parsedBooks).toHaveLength(1);
    expect(parsedBooks[0].id).toBe('b-1');

    const parsedLogs = parseStoredReadingLogs([validLog, { id: 'bad-log', pagesRead: -1 }]);
    expect(parsedLogs).toHaveLength(1);
    expect(parsedLogs[0].id).toBe('l-1');

    expect(warnSpy).toHaveBeenCalledTimes(3);
  });
});
