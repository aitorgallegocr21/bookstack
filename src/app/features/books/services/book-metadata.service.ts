import { Injectable, inject } from '@angular/core';
import { BookMetadataCandidate, DuplicateLibraryMatch } from '../models/book-metadata.model';
import {
  parseGoogleBooksVolumesResponse,
  parseOpenLibraryBibkeyBatchResponse,
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
const MAX_CACHE_ENTRIES = 50;
const MAX_OPEN_LIBRARY_BATCH_SIZE = 20;

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

function extractPrimaryTitle(rawTitle: string): string {
  const primarySegment = rawTitle.split(/\s*[:–—]\s*|\s+-\s+/)[0] ?? rawTitle;
  return normalizeTextForComparison(primarySegment);
}

function isStrictTitleMatch(bookTitle: string, candidateTitle: string): boolean {
  const normBook = normalizeTextForComparison(bookTitle);
  const normCandidate = normalizeTextForComparison(candidateTitle);
  if (!normBook || !normCandidate) {
    return false;
  }

  if (normBook === normCandidate) {
    return true;
  }

  const primaryBook = extractPrimaryTitle(bookTitle);
  const primaryCandidate = extractPrimaryTitle(candidateTitle);

  return primaryBook.length >= 4 && primaryBook === primaryCandidate;
}

function isStrictAuthorMatch(bookAuthor: string, candidateAuthor: string): boolean {
  const normBook = normalizeTextForComparison(bookAuthor);
  const normCandidate = normalizeTextForComparison(candidateAuthor);
  if (!normBook || !normCandidate) {
    return false;
  }

  if (normBook === normCandidate) {
    return true;
  }

  const allBookTokens = normBook.split(' ').filter(Boolean);
  const significantBookTokens = allBookTokens.filter((token) => token.length >= 2);
  const tokensToMatch = significantBookTokens.length > 0 ? significantBookTokens : allBookTokens;

  const candidateTokenSet = new Set(normCandidate.split(' ').filter(Boolean));
  return tokensToMatch.every((token) => candidateTokenSet.has(token));
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

    const cached = this.getFromCache(this.isbnCache, normalizedIsbn);
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
      this.setInCache(this.isbnCache, normalizedIsbn, resolved);
    }

    return resolved;
  }

  /**
   * Queries Open Library's multi-bibkey endpoint in chunks of up to 20 normalized ISBNs,
   * reusing cached entries first and populating `isbnCache` for all resolved hits.
   */
  async lookupBatchByIsbns(
    rawIsbns: readonly string[]
  ): Promise<Map<string, BookMetadataCandidate>> {
    const result = new Map<string, BookMetadataCandidate>();
    const uncachedIsbns: string[] = [];
    const seen = new Set<string>();

    for (const rawIsbn of rawIsbns) {
      const normalized = normalizeIsbn(rawIsbn);
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);

      const cached = this.getFromCache(this.isbnCache, normalized);
      if (cached) {
        result.set(normalized, cached);
      } else {
        uncachedIsbns.push(normalized);
      }
    }

    for (let i = 0; i < uncachedIsbns.length; i += MAX_OPEN_LIBRARY_BATCH_SIZE) {
      const chunk = uncachedIsbns.slice(i, i + MAX_OPEN_LIBRARY_BATCH_SIZE);
      const bibkeys = chunk.map((isbn) => `ISBN:${isbn}`).join(',');
      const olUrl = `https://openlibrary.org/api/books?bibkeys=${bibkeys}&format=json&jscmd=data`;

      try {
        const payload = await this.fetchJsonWithTimeout(olUrl);
        const parsedMap = parseOpenLibraryBibkeyBatchResponse(payload, chunk);
        for (const [isbn, candidate] of parsedMap.entries()) {
          this.setInCache(this.isbnCache, isbn, candidate);
          result.set(isbn, candidate);
        }
      } catch {
        // Ignore transient batch chunk failures so callers can fall back per ISBN
      }
    }

    return result;
  }

  /**
   * Evaluates search candidates against a local book requiring a cover URL.
   * Prefers strict normalized title and author token agreement ranked by completeness
   * plus publisher/publicationYear bonuses, and falls back to the unique candidate when
   * exactly one candidate includes a cover image.
   */
  verifyStrictTitleAuthorCandidate(
    book: { title: string; author: string; publisher?: string; publicationYear?: number },
    candidates: readonly BookMetadataCandidate[]
  ): BookMetadataCandidate | null {
    const normalizedBookPublisher = normalizeTextForComparison(book.publisher);
    let bestCandidate: BookMetadataCandidate | null = null;
    let bestScore = -1;

    for (const candidate of candidates) {
      if (!candidate.coverUrl?.trim()) {
        continue;
      }
      if (
        !isStrictTitleMatch(book.title, candidate.title) ||
        !isStrictAuthorMatch(book.author, candidate.author)
      ) {
        continue;
      }

      let score = scoreCandidateCompleteness(candidate);
      if (book.publicationYear && candidate.publicationYear === book.publicationYear) {
        score += 4;
      }
      if (normalizedBookPublisher && candidate.publisher) {
        const normalizedCandPublisher = normalizeTextForComparison(candidate.publisher);
        if (
          normalizedCandPublisher &&
          (normalizedCandPublisher.includes(normalizedBookPublisher) ||
            normalizedBookPublisher.includes(normalizedCandPublisher))
        ) {
          score += 3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      return bestCandidate;
    }

    const candidatesWithCover = candidates.filter((candidate) =>
      Boolean(candidate.coverUrl?.trim())
    );
    if (candidatesWithCover.length === 1) {
      return candidatesWithCover[0];
    }

    return null;
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
    const cached = this.getFromCache(this.queryCache, cacheKey);
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

    this.setInCache(this.queryCache, cacheKey, ranked);
    return ranked;
  }

  private getFromCache<T>(cache: Map<string, T>, key: string): T | undefined {
    const value = cache.get(key);
    if (value !== undefined) {
      // Refresh insertion order for bounded LRU eviction
      cache.delete(key);
      cache.set(key, value);
    }
    return value;
  }

  private setInCache<T>(cache: Map<string, T>, key: string, value: T): void {
    if (cache.has(key)) {
      cache.delete(key);
    } else if (cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) {
        cache.delete(oldestKey);
      }
    }
    cache.set(key, value);
  }

  async resolveLocalCover(coverUrl?: string): Promise<string | undefined> {
    const trimmed = coverUrl?.trim();
    if (!trimmed) {
      return undefined;
    }

    const optimized = await this.imageOptimizer.optimizeRemoteUrl(trimmed);
    return optimized || undefined;
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
