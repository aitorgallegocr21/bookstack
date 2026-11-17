import { Book } from '../../books/models/book.model';
import {
  SagaAggregation,
  SagaBentoScale,
  SagaFilterStatus,
  SagaSortOption,
  SagaVolumeSlot,
} from '../models/series.model';

/**
 * Normalizes a series name into a canonical lookup key by removing diacritics,
 * trimming edges, collapsing repeated whitespace, and lowercasing.
 */
export function normalizeSeriesKey(name: string | null | undefined): string {
  if (!name) {
    return '';
  }
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Computes sorted missing positive integer volume numbers in `1..maxVolume`,
 * where `maxVolume = Math.max(highestOwned, expectedVolumes ?? 0)`.
 */
export function computeMissingVolumes(
  ownedVolumes: readonly number[],
  expectedVolumes?: number
): number[] {
  const validOwned = ownedVolumes.filter((v) => Number.isInteger(v) && v > 0);
  const highestOwned = validOwned.length > 0 ? Math.max(...validOwned) : 0;
  const normalizedExpected =
    typeof expectedVolumes === 'number' && Number.isInteger(expectedVolumes) && expectedVolumes > 0
      ? expectedVolumes
      : 0;
  const maxVolume = Math.max(highestOwned, normalizedExpected);

  if (maxVolume <= 0) {
    return [];
  }

  const ownedSet = new Set(validOwned);
  const missing: number[] = [];
  for (let volume = 1; volume <= maxVolume; volume++) {
    if (!ownedSet.has(volume)) {
      missing.push(volume);
    }
  }
  return missing;
}

/**
 * Maps total target volumes to the Bento Grid visual card scale.
 */
export function resolveSagaBentoScale(totalTargetVolumes: number): SagaBentoScale {
  if (totalTargetVolumes <= 2) {
    return 'compact';
  }
  if (totalTargetVolumes <= 5) {
    return 'medium';
  }
  return 'showcase';
}

/**
 * Sorts books belonging to a saga chronologically by volume number ascending,
 * breaking ties by publicationYear ascending, createdAt ascending, and title.
 */
export function sortSagaBooksChronologically(books: readonly Book[]): Book[] {
  return [...books].sort((a, b) => {
    const volA = a.series?.volumeNumber ?? Number.MAX_SAFE_INTEGER;
    const volB = b.series?.volumeNumber ?? Number.MAX_SAFE_INTEGER;
    if (volA !== volB) {
      return volA - volB;
    }

    const pubA = a.publicationYear ?? Number.MAX_SAFE_INTEGER;
    const pubB = b.publicationYear ?? Number.MAX_SAFE_INTEGER;
    if (pubA !== pubB) {
      return pubA - pubB;
    }

    const createdA = new Date(a.createdAt || 0).getTime();
    const createdB = new Date(b.createdAt || 0).getTime();
    if (createdA !== createdB) {
      return createdA - createdB;
    }

    return a.title.localeCompare(b.title);
  });
}

/**
 * Interleaves owned numbered books and missing volume slots in ascending volume order,
 * preserving unnumbered owned books cleanly at the end.
 */
export function buildTimelineSlots(
  sortedBooks: readonly Book[],
  missingVolumes: readonly number[]
): SagaVolumeSlot[] {
  const numberedBooks: Book[] = [];
  const unnumberedBooks: Book[] = [];

  for (const book of sortedBooks) {
    const vol = book.series?.volumeNumber;
    if (typeof vol === 'number' && Number.isFinite(vol) && vol > 0) {
      numberedBooks.push(book);
    } else {
      unnumberedBooks.push(book);
    }
  }

  const sortedMissing = [...missingVolumes]
    .filter((v) => Number.isInteger(v) && v > 0)
    .sort((a, b) => a - b);

  const slots: SagaVolumeSlot[] = [];
  let bookIdx = 0;
  let missingIdx = 0;

  while (bookIdx < numberedBooks.length && missingIdx < sortedMissing.length) {
    const book = numberedBooks[bookIdx];
    const bookVol = book.series?.volumeNumber ?? Number.MAX_SAFE_INTEGER;
    const missingVol = sortedMissing[missingIdx];

    if (bookVol <= missingVol) {
      slots.push({ volumeNumber: bookVol, kind: 'owned', book });
      bookIdx++;
    } else {
      slots.push({ volumeNumber: missingVol, kind: 'missing' });
      missingIdx++;
    }
  }

  while (bookIdx < numberedBooks.length) {
    const book = numberedBooks[bookIdx];
    slots.push({ volumeNumber: book.series?.volumeNumber ?? null, kind: 'owned', book });
    bookIdx++;
  }

  while (missingIdx < sortedMissing.length) {
    slots.push({ volumeNumber: sortedMissing[missingIdx], kind: 'missing' });
    missingIdx++;
  }

  for (const book of unnumberedBooks) {
    slots.push({ volumeNumber: null, kind: 'owned', book });
  }

  return slots;
}

/**
 * Checks whether a saga matches the search query across saga name, authors, book titles, or notes.
 */
export function matchesSagaSearch(saga: SagaAggregation, query: string): boolean {
  const normalizedQuery = normalizeSeriesKey(query);
  if (!normalizedQuery) {
    return true;
  }

  if (normalizeSeriesKey(saga.name).includes(normalizedQuery)) {
    return true;
  }

  if (saga.authors.some((author) => normalizeSeriesKey(author).includes(normalizedQuery))) {
    return true;
  }

  if (saga.books.some((book) => normalizeSeriesKey(book.title).includes(normalizedQuery))) {
    return true;
  }

  if (saga.metadata?.notes && normalizeSeriesKey(saga.metadata.notes).includes(normalizedQuery)) {
    return true;
  }

  return false;
}

/**
 * Checks whether a saga matches the selected status filter chip.
 */
export function matchesSagaStatusFilter(saga: SagaAggregation, status: SagaFilterStatus): boolean {
  switch (status) {
    case 'all':
      return true;
    case 'reading':
      return saga.statusCategory === 'reading';
    case 'completed':
      return saga.statusCategory === 'completed';
    case 'pending':
      return saga.statusCategory === 'pending';
    case 'has-gaps':
      return saga.missingVolumes.length > 0;
  }
}

/**
 * Deterministically sorts saga aggregations by the requested sort option.
 */
export function sortSagas(
  sagas: readonly SagaAggregation[],
  sortOption: SagaSortOption
): SagaAggregation[] {
  return [...sagas].sort((a, b) => {
    switch (sortOption) {
      case 'recent': {
        const timeA = new Date(a.lastActivityAt || 0).getTime();
        const timeB = new Date(b.lastActivityAt || 0).getTime();
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      case 'progress-desc': {
        if (b.progressPercent !== a.progressPercent) {
          return b.progressPercent - a.progressPercent;
        }
        if (b.completedCount !== a.completedCount) {
          return b.completedCount - a.completedCount;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      case 'volumes-desc': {
        if (b.ownedCount !== a.ownedCount) {
          return b.ownedCount - a.ownedCount;
        }
        if (b.totalTargetVolumes !== a.totalTargetVolumes) {
          return b.totalTargetVolumes - a.totalTargetVolumes;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      case 'rating-desc': {
        const ratingA = a.averageRating ?? -1;
        const ratingB = b.averageRating ?? -1;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        if (b.progressPercent !== a.progressPercent) {
          return b.progressPercent - a.progressPercent;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      case 'title-asc':
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    }
  });
}
