import { BookStatus } from './book.model';

export type MetadataProviderSource = 'openlibrary' | 'googlebooks' | 'merged';

export type MetadataLookupMode = 'scan' | 'search';

export type BookMetadataApplyMode = 'fill-empty' | 'overwrite-public';

export interface BookMetadataCandidate {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  totalPages?: number;
  coverUrl?: string;
  source: MetadataProviderSource;
}

export interface DuplicateLibraryMatch {
  bookId: string;
  title: string;
  author: string;
  isbn?: string;
  status: BookStatus;
  matchReason: 'isbn' | 'title-author';
}
