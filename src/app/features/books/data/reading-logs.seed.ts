import { ReadingLog } from '../models/book.model';

export const READING_LOGS_SEED: ReadingLog[] = [
  {
    id: 'log-001',
    bookId: 'book-001',
    date: '2026-01-14',
    pagesRead: 35,
    timeSpentMinutes: 55,
    notes: 'He recuperado el ritmo de lectura.',
    createdAt: '2026-01-14T10:00:00.000Z'
  },
  {
    id: 'log-002',
    bookId: 'book-002',
    date: '2026-02-03',
    pagesRead: 80,
    timeSpentMinutes: 105,
    notes: 'Sesión de cierre del libro.',
    createdAt: '2026-02-03T20:15:00.000Z'
  }
];
