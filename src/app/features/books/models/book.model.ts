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

// ==========================================
// Constantes de presentación y localización
// ==========================================

export const BOOK_STATUS_LABELS: Record<BookStatus, string> = {
  'pending': 'Por leer',
  'reading': 'Leyendo',
  'completed': 'Completado',
  'abandoned': 'Abandonado'
};

export interface StatusBadgeConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const BOOK_STATUS_CONFIG: Record<BookStatus, StatusBadgeConfig> = {
  'pending': {
    label: 'Por leer',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500'
  },
  'reading': {
    label: 'Leyendo',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotClass: 'bg-blue-500'
  },
  'completed': {
    label: 'Completado',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500'
  },
  'abandoned': {
    label: 'Abandonado',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500'
  }
};
