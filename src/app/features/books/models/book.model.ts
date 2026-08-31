// ==========================================
// Modelo de dominio de libros
// ==========================================

export type BookStatus = 'pending' | 'reading' | 'completed' | 'abandoned';

export interface BookFormat {
  id: string;
  name: string;
}

export interface BookSeries {
  id: string;
  name: string;
  volumeNumber?: number;
  notes?: string;
}

export interface SeriesInfo {
  seriesName: string;
  orderInSeries: number;
  prequelBookId?: string;
  sequelBookId?: string;
}

export const BOOK_RATING_MIN = 0;
export const BOOK_RATING_MAX = 10;
export const BOOK_RATING_STEP = 0.5;

export interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publicationYear?: number;

  totalPages: number;
  currentPage: number;
  totalWords?: number;
  totalCharacters?: number;
  currentWords?: number;
  totalChapters?: number;
  currentChapter?: number;

  status: BookStatus;
  format?: BookFormat | string;
  series?: BookSeries;
  seriesInfo?: SeriesInfo;
  coverUrl?: string;
  rating?: number;
  genre?: string[];

  startDate?: string;
  endDate?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface BookCreateDto {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  totalPages: number;
  currentPage: number;
  totalCharacters?: number;
  totalChapters?: number;
  currentChapter?: number;
  status: BookStatus;
  format?: BookFormat | string;
  series?: BookSeries;
  coverUrl?: string;
  rating?: number;
  genre?: string[];
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface BookUpdateDto extends Partial<BookCreateDto> {
  id: string;
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
