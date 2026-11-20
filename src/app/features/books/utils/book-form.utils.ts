import { TranslationDictionary } from '../../../core/i18n/i18n.types';
import { BookMetadataApplyMode, BookMetadataCandidate } from '../models/book-metadata.model';
import {
  BOOK_RATING_MAX,
  BOOK_RATING_MIN,
  BookFormat,
  BookSeries,
  BookStatus,
} from '../models/book.model';

export const BOOK_STATUS_VALUES: readonly BookStatus[] = [
  'pending',
  'reading',
  'completed',
  'abandoned',
];

export interface CompletedAutofillInput {
  status: BookStatus | null;
  totalPages: number;
  currentPage: number;
  totalChapters: number;
  currentChapter: number;
  endDate: string | null;
}

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns auto-completed page, chapter, and end date defaults when status transitions to 'completed'.
 */
export function getCompletedAutofillValues(
  values: CompletedAutofillInput
): Partial<{ currentPage: number; currentChapter: number; endDate: string }> {
  if (values.status !== 'completed') {
    return {};
  }

  return {
    currentPage: Math.max(values.currentPage, values.totalPages),
    currentChapter: Math.max(values.currentChapter, values.totalChapters),
    endDate: values.endDate || getTodayIsoDate(),
  };
}

export function normalizeBookFormat(format?: BookFormat | string | null): string {
  if (typeof format === 'string') {
    return format.trim() || 'Físico';
  }

  return format?.name?.trim() || 'Físico';
}

export function translateBookFormat(
  format: BookFormat | string | null | undefined,
  formats: TranslationDictionary['bookForm']['formats']
): string {
  const raw = typeof format === 'string' ? format.trim() : format?.name?.trim();
  if (!raw) {
    return '';
  }

  switch (raw) {
    case 'Físico':
      return formats.physical;
    case 'Ebook':
      return formats.ebook;
    case 'Audiolibro':
      return formats.audiobook;
    default:
      return raw;
  }
}

export function normalizeBookRating(rawRating: unknown): number | undefined {
  if (typeof rawRating !== 'number' || !Number.isFinite(rawRating)) {
    return undefined;
  }

  return Math.min(BOOK_RATING_MAX, Math.max(BOOK_RATING_MIN, rawRating));
}

export function buildBookSeriesPayload(params: {
  enabled: boolean | null | undefined;
  name: string | null | undefined;
  volumeNumber: number | null | undefined;
  existingSeriesId?: string;
}): BookSeries | undefined {
  const trimmedName = params.name?.trim();
  if (!params.enabled || !trimmedName) {
    return undefined;
  }

  return {
    id: params.existingSeriesId || crypto.randomUUID(),
    name: trimmedName,
    volumeNumber: params.volumeNumber ? Number(params.volumeNumber) : undefined,
  };
}

export interface MetadataFormValuesSnapshot {
  title?: string | null;
  author?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  totalPages?: number | null;
  coverUrl?: string | null;
  seriesName?: string | null;
  seriesOrder?: number | null;
  genre?: string[] | null;
}

export interface MetadataFormPatch {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number | null;
  totalPages?: number | null;
  coverUrl?: string;
  seriesName?: string;
  seriesOrder?: number | null;
  genre?: string[];
}

/**
 * Builds a partial form patch from a public metadata candidate while respecting
 * `fill-empty` vs `overwrite-public` mode and never touching personal tracking fields.
 */
export function buildMetadataFormPatch(
  currentFormValues: MetadataFormValuesSnapshot,
  candidate: BookMetadataCandidate,
  applyMode: BookMetadataApplyMode
): MetadataFormPatch {
  const patch: MetadataFormPatch = {};
  const overwrite = applyMode === 'overwrite-public';

  const shouldApplyText = (
    current: string | null | undefined,
    next: string | undefined
  ): string | undefined => {
    const trimmedNext = next?.trim();
    if (!trimmedNext) {
      return undefined;
    }
    if (overwrite || !current?.trim()) {
      return trimmedNext;
    }
    return undefined;
  };

  const title = shouldApplyText(currentFormValues.title, candidate.title);
  if (title !== undefined) patch.title = title;

  const author = shouldApplyText(currentFormValues.author, candidate.author);
  if (author !== undefined) patch.author = author;

  const isbn = shouldApplyText(currentFormValues.isbn, candidate.isbn);
  if (isbn !== undefined) patch.isbn = isbn;

  const publisher = shouldApplyText(currentFormValues.publisher, candidate.publisher);
  if (publisher !== undefined) patch.publisher = publisher;

  const coverUrl = shouldApplyText(currentFormValues.coverUrl, candidate.coverUrl);
  if (coverUrl !== undefined) patch.coverUrl = coverUrl;

  if (
    typeof candidate.publicationYear === 'number' &&
    candidate.publicationYear > 0 &&
    (overwrite || !currentFormValues.publicationYear)
  ) {
    patch.publicationYear = candidate.publicationYear;
  }

  if (
    typeof candidate.totalPages === 'number' &&
    candidate.totalPages > 0 &&
    (overwrite ||
      currentFormValues.totalPages === null ||
      currentFormValues.totalPages === undefined ||
      currentFormValues.totalPages === 0)
  ) {
    patch.totalPages = candidate.totalPages;
  }

  const seriesName = shouldApplyText(currentFormValues.seriesName, candidate.seriesName);
  if (seriesName !== undefined) patch.seriesName = seriesName;

  if (
    typeof candidate.seriesOrder === 'number' &&
    candidate.seriesOrder > 0 &&
    (overwrite || !currentFormValues.seriesOrder)
  ) {
    patch.seriesOrder = candidate.seriesOrder;
  }

  if (
    Array.isArray(candidate.genre) &&
    candidate.genre.length > 0 &&
    (overwrite || !currentFormValues.genre?.length)
  ) {
    patch.genre = [...candidate.genre];
  }

  return patch;
}
