import { TranslationDictionary } from '../../../core/i18n/i18n.types';
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
