import { Book, ReadingLog } from '../../books/models/book.model';
import {
  BackupEnvelopeSchema,
  BackupPreferencesSchema,
  normalizeImportedBookCandidate,
  parseBackupJson,
} from './backup.schema';

const validBook: Book = {
  id: 'book-1',
  title: 'Dune',
  author: 'Frank Herbert',
  totalPages: 412,
  currentPage: 150,
  status: 'reading',
  createdAt: '2026-01-10T10:00:00.000Z',
  updatedAt: '2026-01-12T10:00:00.000Z',
};

const validLog: ReadingLog = {
  id: 'log-1',
  bookId: 'book-1',
  date: '2026-01-12',
  pagesRead: 45,
  timeSpentMinutes: 60,
  createdAt: '2026-01-12T10:00:00.000Z',
};

describe('BackupSchema & parseBackupJson', () => {
  it('should validate a full versioned BookstackBackupEnvelope', () => {
    const payload = {
      schemaVersion: 1,
      app: 'BookStack',
      exportedAt: '2026-11-16T10:00:00.000Z',
      books: [validBook],
      readingLogs: [validLog],
      readingGoals: {
        year: 2026,
        targetBooks: 24,
        targetPages: 6000,
      },
      preferences: {
        locale: 'es',
        theme: 'dark',
        catalogViewMode: 'grid',
        catalogSort: 'rating-desc',
      },
    };

    expect(BackupEnvelopeSchema.safeParse(payload).success).toBe(true);

    const result = parseBackupJson(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.validBooks).toEqual([validBook]);
      expect(result.data.validReadingLogs).toEqual([validLog]);
      expect(result.data.readingGoals).toEqual(payload.readingGoals);
      expect(result.data.preferences).toEqual(payload.preferences);
      expect(result.data.invalidBooksCount).toBe(0);
      expect(result.data.invalidLogsCount).toBe(0);
    }
  });

  it('should count malformed individual books and logs without rejecting the entire envelope', () => {
    const payload = {
      schemaVersion: 1,
      app: 'BookStack',
      exportedAt: '2026-11-16T10:00:00.000Z',
      books: [
        validBook,
        { id: 'bad-book', title: '', totalPages: 0 },
        { ...validBook, id: 'bad-rating', rating: 99 },
      ],
      readingLogs: [validLog, { id: 'bad-log', bookId: 'book-1', pagesRead: -10 }],
    };

    const result = parseBackupJson(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.validBooks).toEqual([validBook]);
      expect(result.data.validReadingLogs).toEqual([validLog]);
      expect(result.data.invalidBooksCount).toBe(2);
      expect(result.data.invalidLogsCount).toBe(1);
    }
  });

  it('should gracefully parse legacy raw Book[] JSON arrays', () => {
    const legacyArray = [validBook, { id: 'corrupt', title: 'Missing fields' }];

    const result = parseBackupJson(legacyArray);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.validBooks).toEqual([validBook]);
      expect(result.data.validReadingLogs).toEqual([]);
      expect(result.data.readingGoals).toBeNull();
      expect(result.data.preferences).toBeNull();
      expect(result.data.invalidBooksCount).toBe(1);
      expect(result.data.invalidLogsCount).toBe(0);
    }
  });

  it('should reject invalid envelope headers or primitive payloads', () => {
    expect(
      parseBackupJson({
        schemaVersion: 2,
        app: 'BookStack',
        exportedAt: '2026-11-16T10:00:00.000Z',
        books: [],
      }).success
    ).toBe(false);

    expect(
      parseBackupJson({
        schemaVersion: 1,
        app: 'OtherApp',
        exportedAt: '2026-11-16T10:00:00.000Z',
        books: [],
      }).success
    ).toBe(false);

    expect(parseBackupJson('not-an-object').success).toBe(false);
    expect(parseBackupJson(null).success).toBe(false);
  });

  it('should validate BackupPreferencesSchema enum values strictly', () => {
    expect(
      BackupPreferencesSchema.safeParse({
        locale: 'en',
        theme: 'light',
        catalogViewMode: 'compact',
        catalogSort: 'recent',
      }).success
    ).toBe(true);

    expect(BackupPreferencesSchema.safeParse({ locale: 'fr' }).success).toBe(false);
    expect(BackupPreferencesSchema.safeParse({ theme: 'sepia' }).success).toBe(false);
    expect(BackupPreferencesSchema.safeParse({ catalogViewMode: 'kanban' }).success).toBe(false);
  });

  it('normalizes AI/external book records with missing id, timestamps, status aliases, and unknown totalPages', () => {
    const result = parseBackupJson([
      {
        title: 'El Imperio Final',
        author: 'Brandon Sanderson',
        status: 'leído',
        totalPages: 0,
        currentPage: '0',
        publicationYear: '2006',
        rating: '9.5',
        genre: 'Fantasy; Epic',
        isbn: null,
      },
      {
        title: 'Fundación',
        author: 'Isaac Asimov',
        status: 'leyendo',
        totalPages: '255',
        currentPage: '300',
      },
    ]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.invalidBooksCount).toBe(0);
      expect(result.data.validBooks).toHaveLength(2);

      const mistborn = result.data.validBooks[0];
      expect(mistborn.id.length).toBeGreaterThan(0);
      expect(mistborn.createdAt.length).toBeGreaterThan(0);
      expect(mistborn.updatedAt.length).toBeGreaterThan(0);
      expect(mistborn.status).toBe('completed');
      expect(mistborn.totalPages).toBe(1);
      expect(mistborn.currentPage).toBe(0);
      expect(mistborn.publicationYear).toBe(2006);
      expect(mistborn.rating).toBe(9.5);
      expect(mistborn.genre).toEqual(['Fantasy', 'Epic']);
      expect(mistborn.isbn).toBeUndefined();

      const foundation = result.data.validBooks[1];
      expect(foundation.status).toBe('reading');
      expect(foundation.totalPages).toBe(255);
      expect(foundation.currentPage).toBe(255);
    }
  });

  it('keeps missing-author or missing-title objects untouched so BookSchema rejects them', () => {
    const missingAuthor = { title: 'Only Title' };
    expect(normalizeImportedBookCandidate(missingAuthor)).toBe(missingAuthor);
  });
});
