import { Book } from '../../books/models/book.model';

export type SeriesPublicationStatus = 'ongoing' | 'completed' | 'hiatus';

export type SagaBentoScale = 'compact' | 'medium' | 'showcase';

export type SagaFilterStatus = 'all' | 'reading' | 'completed' | 'pending' | 'has-gaps';

export type SagaSortOption =
  'recent' | 'progress-desc' | 'volumes-desc' | 'rating-desc' | 'title-asc';

export interface SeriesMetadata {
  id: string;
  normalizedKey: string;
  name: string;
  expectedVolumes?: number;
  publicationStatus?: SeriesPublicationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SagaVolumeSlot {
  volumeNumber: number | null;
  kind: 'owned' | 'missing';
  book?: Book;
}

export interface SagaAggregation {
  id: string;
  normalizedKey: string;
  name: string;
  authors: string[];
  books: Book[];
  timelineSlots: SagaVolumeSlot[];
  metadata?: SeriesMetadata;
  ownedCount: number;
  expectedVolumes?: number;
  totalTargetVolumes: number;
  completedCount: number;
  readingCount: number;
  pendingCount: number;
  abandonedCount: number;
  missingVolumes: number[];
  totalPages: number;
  readPages: number;
  progressPercent: number;
  averageRating?: number;
  totalReadingMinutes: number;
  nextBookToRead: Book | null;
  statusCategory: 'reading' | 'completed' | 'pending';
  bentoScale: SagaBentoScale;
  lastActivityAt: string;
}

export interface SagaStatusCounts {
  all: number;
  reading: number;
  completed: number;
  pending: number;
  hasGaps: number;
}

export interface SagaFilterState {
  searchQuery: string;
  status: SagaFilterStatus;
  sort: SagaSortOption;
}
