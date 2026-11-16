import { Injectable, inject } from '@angular/core';
import { BookMetadataCandidate, DuplicateLibraryMatch } from '../models/book-metadata.model';
import {
  parseGoogleBooksVolumesResponse,
  parseOpenLibraryBibkeyResponse,
  parseOpenLibrarySearchResponse,
} from '../schemas/book-metadata.schema';
import { areIsbnsEquivalent, isValidIsbn, normalizeIsbn } from '../utils/isbn.utils';
import { BooksService } from './books.service';
import { ImageOptimizerService } from './image-optimizer.service';

export type BookMetadataErrorCode = 'INVALID_ISBN' | 'LOOKUP_FAILED';

export class BookMetadataError extends Error {
  constructor(
    public readonly code: BookMetadataErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'BookMetadataError';
  }
}

const DEFAULT_TIMEOUT_MS = 6500;
const MAX_SEARCH_RESULTS = 5;

function normalizeTextForComparison(value?: string | null): string {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAllKeyFields(candidate: BookMetadataCandidate): boolean {
  return Boolean(
    candidate.totalPages && candidate.coverUrl && candidate.publisher && candidate.publicationYear
  );
}

function mergeCandidates(
  primary: BookMetadataCandidate,
  secondary: BookMetadataCandidate
): BookMetadataCandidate {
  const sameSource = primary.source === secondary.source;
  return {
    id: primary.id,
    title: primary.title || secondary.title,
    author: primary.author || secondary.author,
    isbn: primary.isbn || secondary.isbn,
    publisher: primary.publisher || secondary.publisher,
    publicationYear: primary.publicationYear ?? secondary.publicationYear,
    totalPages: primary.totalPages ?? secondary.totalPages,
    coverUrl: primary.coverUrl || secondary.coverUrl,
    source: sameSource ? primary.source : 'merged',
  };
}

function scoreCandidateCompleteness(candidate: BookMetadataCandidate): number {
  let score = 0;
  if (candidate.coverUrl) score += 3;
  if (candidate.totalPages) score += 2;
  if (candidate.isbn) score += 2;
  if (candidate.publisher) score += 1;
  if (candidate.publicationYear) score += 1;
  if (candidate.source === 'merged') score += 1;
  return score;
}

@Injectable({ providedIn: 'root' })
export class BookMetadataService {
  private readonly booksService = inject(BooksService);
  private readonly imageOptimizer = inject(ImageOptimizerService);

  private readonly isbnCache = new Map<string, BookMetadataCandidate>();
  private readonly queryCache = new Map<string, BookMetadataCandidate[]>();

  clearSessionCache(): void {
    this.isbnCache.clear();
    this.queryCache.clear();
  }

  async lookupByIsbn(rawIsbn: string): Promise<BookMetadataCandidate | null> {
    const normalizedIsbn = normalizeIsbn(rawIsbn);
    if (!normalizedIsbn) {
      throw new BookMetadataError('INVALID_ISBN', 'Invalid ISBN checksum or format.');
    }

    const cached = this.isbnCache.get(normalizedIsbn);
    if (cached) {
      return cached;
    }

    let olCandidate: BookMetadataCandidate | null = null;
    let olFailed = false;

    try {
      const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=data`;
      const olPayload = await this.fetchJsonWithTimeout(olUrl);
      olCandidate = parseOpenLibraryBibkeyResponse(olPayload, normalizedIsbn);
    } catch {
      olFailed = true;
    }

    let gbCandidate: BookMetadataCandidate | null = null;
    let gbFailed = false;

    if (!olCandidate || !hasAllKeyFields(olCandidate)) {
      try {
        const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${normalizedIsbn}&maxResults=3`;
        const gbPayload = await this.fetchJsonWithTimeout(gbUrl);
        const gbCandidates = parseGoogleBooksVolumesResponse(gbPayload);
        gbCandidate =
          gbCandidates.find((item) => areIsbnsEquivalent(item.isbn, normalizedIsbn)) ??
          gbCandidates[0] ??
          null;
      } catch {
        gbFailed = true;
      }
    }

    if (olFailed && gbFailed) {
      throw new BookMetadataError(
        'LOOKUP_FAILED',
        'Both metadata providers failed during ISBN lookup.'
      );
    }

    let resolved: BookMetadataCandidate | null = null;
    if (olCandidate && gbCandidate) {
      resolved = mergeCandidates(olCandidate, gbCandidate);
    } else {
      resolved = olCandidate ?? gbCandidate;
    }

    if (resolved) {
      this.isbnCache.set(normalizedIsbn, resolved);
    }

    return resolved;
  }

  async searchByQuery(rawQuery: string): Promise<BookMetadataCandidate[]> {
    const query = rawQuery.trim().replace(/\s+/g, ' ');
    if (query.length < 2) {
      return [];
    }

    if (isValidIsbn(query)) {
      const match = await this.lookupByIsbn(query);
      return match ? [match] : [];
    }

    const cacheKey = query.toLowerCase();
    const cached = this.queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const olUrl =
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}` +
      '&limit=5&fields=key,title,author_name,isbn,publisher,first_publish_year,number_of_pages_median,cover_i';
    const gbUrl =
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}` +
      '&maxResults=5&printType=books';

    const [olResult, gbResult] = await Promise.allSettled([
      this.fetchJsonWithTimeout(olUrl).then((payload) => parseOpenLibrarySearchResponse(payload)),
      this.fetchJsonWithTimeout(gbUrl).then((payload) => parseGoogleBooksVolumesResponse(payload)),
    ]);

    if (olResult.status === 'rejected' && gbResult.status === 'rejected') {
      throw new BookMetadataError('LOOKUP_FAILED', 'Both metadata providers failed during search.');
    }

    const combined: BookMetadataCandidate[] = [
      ...(olResult.status === 'fulfilled' ? olResult.value : []),
      ...(gbResult.status === 'fulfilled' ? gbResult.value : []),
    ];

    const deduplicated: BookMetadataCandidate[] = [];
    for (const incoming of combined) {
      const existingIndex = deduplicated.findIndex((existing) =>
        this.areCandidatesSameEdition(existing, incoming)
      );
      if (existingIndex === -1) {
        deduplicated.push(incoming);
      } else {
        deduplicated[existingIndex] = mergeCandidates(deduplicated[existingIndex], incoming);
      }
    }

    const ranked = deduplicated
      .sort((a, b) => scoreCandidateCompleteness(b) - scoreCandidateCompleteness(a))
      .slice(0, MAX_SEARCH_RESULTS);

    this.queryCache.set(cacheKey, ranked);
    return ranked;
  }

  async resolveLocalCover(coverUrl?: string): Promise<string | undefined> {
    const trimmed = coverUrl?.trim();
    if (!trimmed) {
      return undefined;
    }
    return this.imageOptimizer.optimizeRemoteUrl(trimmed);
  }

  findDuplicateInLibrary(
    input: { isbn?: string | null; title?: string | null; author?: string | null },
    excludeBookId?: string
  ): DuplicateLibraryMatch | null {
    const library = this.booksService.books();

    if (input.isbn?.trim()) {
      const isbnMatch = library.find(
        (book) => book.id !== excludeBookId && areIsbnsEquivalent(book.isbn, input.isbn)
      );
      if (isbnMatch) {
        return {
          bookId: isbnMatch.id,
          title: isbnMatch.title,
          author: isbnMatch.author,
          isbn: isbnMatch.isbn,
          status: isbnMatch.status,
          matchReason: 'isbn',
        };
      }
    }

    const normalizedTitle = normalizeTextForComparison(input.title);
    const normalizedAuthor = normalizeTextForComparison(input.author);
    if (!normalizedTitle || !normalizedAuthor) {
      return null;
    }

    const titleAuthorMatch = library.find(
      (book) =>
        book.id !== excludeBookId &&
        normalizeTextForComparison(book.title) === normalizedTitle &&
        normalizeTextForComparison(book.author) === normalizedAuthor
    );

    if (!titleAuthorMatch) {
      return null;
    }

    return {
      bookId: titleAuthorMatch.id,
      title: titleAuthorMatch.title,
      author: titleAuthorMatch.author,
      isbn: titleAuthorMatch.isbn,
      status: titleAuthorMatch.status,
      matchReason: 'title-author',
    };
  }

  private areCandidatesSameEdition(a: BookMetadataCandidate, b: BookMetadataCandidate): boolean {
    if (a.isbn && b.isbn && areIsbnsEquivalent(a.isbn, b.isbn)) {
      return true;
    }

    const titleA = normalizeTextForComparison(a.title);
    const titleB = normalizeTextForComparison(b.title);
    const authorA = normalizeTextForComparison(a.author);
    const authorB = normalizeTextForComparison(b.author);

    return Boolean(titleA && authorA && titleA === titleB && authorA === authorB);
  }

  private async fetchJsonWithTimeout(
    url: string,
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Metadata request failed with status ${response.status}`);
      }

      return await response.json();
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }
}
