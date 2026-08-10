// ==========================================
// Modelo de dominio de libros
// ==========================================

export type BookStatus = 'pending' | 'reading' | 'completed' | 'abandoned';

export interface BookFormat {
  id: string;
  name: string;
}

export interface SeriesInfo {
  seriesName: string;
  orderInSeries: number;
  prequelBookId?: string;
  sequelBookId?: string;
}

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;

  totalPages: number;
  currentPage: number;
  totalWords?: number;
  totalCharacters?: number;
  currentWords?: number;

  status: BookStatus;
  seriesInfo?: SeriesInfo;
  coverUrl?: string;
  rating?: number;
  genre?: string[];
  format?: string;

  startDate?: string;
  endDate?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ReadingLog {
  id: string;
  bookId: string;
  date: string;
  pagesRead: number;
  timeSpentMinutes?: number;
  notes?: string;
  createdAt: string;
}

export interface ReadingStats {
  totalBooks: number;
  completedBooks: number;
  readingBooks: number;
  pendingBooks: number;
  totalPagesRead: number;
  totalTimeSpentMinutes: number;
  averagePagesPerDay: number;
  averageReadingSpeedPagesPerHour: number;
  monthlyPages: { month: string; pages: number }[];
  statusDistribution: { status: BookStatus; count: number }[];
}
