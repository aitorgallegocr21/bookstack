import { Book } from '../models/book.model';

export const BOOKS_SEED: Book[] = [
  {
    id: 'book-001',
    isbn: '9780140283334',
    title: 'La sombra del viento',
    author: 'Carlos Ruiz Zafón',
    totalPages: 512,
    currentPage: 120,
    status: 'reading',
    genre: ['Novela', 'Misterio'],
    format: 'Físico',
    coverUrl: '',
    rating: 5,
    startDate: '2026-01-14',
    createdAt: '2026-01-14T09:30:00.000Z',
    updatedAt: '2026-01-14T09:30:00.000Z'
  },
  {
    id: 'book-002',
    isbn: '9780765377067',
    title: 'El nombre del viento',
    author: 'Patrick Rothfuss',
    totalPages: 662,
    currentPage: 662,
    status: 'completed',
    genre: ['Fantasy'],
    format: 'Ebook',
    coverUrl: '',
    rating: 4,
    endDate: '2026-02-03',
    createdAt: '2026-01-18T12:00:00.000Z',
    updatedAt: '2026-02-03T12:00:00.000Z'
  }
];
