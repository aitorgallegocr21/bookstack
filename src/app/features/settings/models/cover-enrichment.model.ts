import { Book } from '../../books/models/book.model';

/**
 * Enrichment execution mode for automated cover and metadata resolution.
 */
export type CoverEnrichmentMode = 'isbn-strict' | 'title-author-strict' | 'integral-auto';

/**
 * Lifecycle state of the automated cover enrichment queue.
 */
export type CoverEnrichmentStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

/**
 * Explicit reason why an automated cover lookup or download did not succeed for a book.
 */
export type CoverEnrichmentFailureReason =
  | 'missing_isbn'
  | 'no_metadata_found'
  | 'no_cover_in_provider'
  | 'mismatch_verification'
  | 'invalid_cover_dimensions'
  | 'network_error';

/**
 * Verification report entry for a book skipped during automated cover enrichment.
 */
export interface CoverEnrichmentSkippedItem {
  bookId: string;
  title: string;
  author: string;
  isbn?: string;
  reason: CoverEnrichmentFailureReason;
}

/**
 * Reactive inventory of library books missing covers or core bibliographic metadata.
 */
export interface MissingCoverSummary {
  totalMissing: number;
  withValidIsbnCount: number;
  withoutValidIsbnCount: number;
  booksWithIsbn: Book[];
  booksWithoutIsbn: Book[];
  totalIncomplete: number;
  missingCoverCount: number;
  missingPagesCount: number;
  missingYearCount: number;
  missingPublisherCount: number;
  missingIsbnCount: number;
  incompleteBooks: Book[];
}

/**
 * Progress and outcome state of the bulk cover and metadata enrichment queue.
 */
export interface CoverEnrichmentState {
  status: CoverEnrichmentStatus;
  mode: CoverEnrichmentMode | null;
  processedCount: number;
  totalCount: number;
  downloadedCount: number;
  metadataUpdatedCount: number;
  skippedItems: CoverEnrichmentSkippedItem[];
}
