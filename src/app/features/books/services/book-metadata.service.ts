import { Injectable, inject } from '@angular/core';
import {
  BookMetadataCandidate,
  DuplicateLibraryMatch,
  MetadataProviderSource,
} from '../models/book-metadata.model';
import {
  parseAppleBooksSearchResponse,
  parseCrossrefWorksResponse,
  parseGoogleBooksVolumesResponse,
  parseInternetArchiveSearchResponse,
  parseOpenLibraryBibkeyBatchResponse,
  parseOpenLibraryBibkeyResponse,
  parseOpenLibrarySearchResponse,
  parseOpenLibraryWorkEditionsResponse,
  parseWikidataSparqlResponse,
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
const MAX_SEARCH_RESULTS = 8;
const MAX_CACHE_ENTRIES = 50;
const MAX_OPEN_LIBRARY_BATCH_SIZE = 20;
const PROVIDER_QUOTA_ORDER: readonly MetadataProviderSource[] = [
  'googlebooks',
  'openlibrary',
  'applebooks',
  'wikidata',
  'archive',
  'crossref',
];

export interface SearchQueryHints {
  title?: string;
  author?: string;
}

interface ParsedSearchHint {
  query: string;
  title?: string;
  author?: string;
}

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

function parseStructuredSearchHint(
  rawQuery: string,
  explicit?: SearchQueryHints
): ParsedSearchHint {
  const query = rawQuery.trim().replace(/\s+/g, ' ');
  const explicitTitle = explicit?.title?.trim();
  const explicitAuthor = explicit?.author?.trim();

  if (explicitTitle || explicitAuthor) {
    return {
      query,
      title: explicitTitle || undefined,
      author: explicitAuthor || undefined,
    };
  }

  const delimiterMatch = /^(.{2,}?)\s+(?:—|-|by|por)\s+(.{2,})$/i.exec(query);
  if (delimiterMatch) {
    return {
      query,
      title: delimiterMatch[1].trim(),
      author: delimiterMatch[2].trim(),
    };
  }

  return { query };
}

function collectCandidateSources(candidate: BookMetadataCandidate): MetadataProviderSource[] {
  if (candidate.sources && candidate.sources.length > 0) {
    return candidate.sources.filter((src) => src !== 'merged');
  }
  return candidate.source !== 'merged' ? [candidate.source] : [];
}

function selectRealisticPageCount(
  primaryPages?: number,
  secondaryPages?: number
): number | undefined {
  if (primaryPages && primaryPages > 1) {
    return primaryPages;
  }
  if (secondaryPages && secondaryPages > 1) {
    return secondaryPages;
  }
  return primaryPages ?? secondaryPages;
}

function mergeCandidates(
  primary: BookMetadataCandidate,
  secondary: BookMetadataCandidate
): BookMetadataCandidate {
  const uniqueSources = Array.from(
    new Set([...collectCandidateSources(primary), ...collectCandidateSources(secondary)])
  );
  const mergedGenres = Array.from(new Set([...(primary.genre ?? []), ...(secondary.genre ?? [])]));

  return {
    id: primary.id,
    title: primary.title || secondary.title,
    author: primary.author || secondary.author,
    isbn: primary.isbn || secondary.isbn,
    publisher: primary.publisher || secondary.publisher,
    publicationYear: primary.publicationYear ?? secondary.publicationYear,
    totalPages: selectRealisticPageCount(primary.totalPages, secondary.totalPages),
    coverUrl: primary.coverUrl || secondary.coverUrl,
    ...(primary.workKey || secondary.workKey
      ? { workKey: primary.workKey || secondary.workKey }
      : {}),
    ...(primary.seriesName || secondary.seriesName
      ? { seriesName: primary.seriesName || secondary.seriesName }
      : {}),
    ...(primary.seriesOrder !== undefined || secondary.seriesOrder !== undefined
      ? { seriesOrder: primary.seriesOrder ?? secondary.seriesOrder }
      : {}),
    ...(mergedGenres.length > 0 ? { genre: mergedGenres } : {}),
    source: uniqueSources.length >= 2 ? 'merged' : (uniqueSources[0] ?? primary.source),
    ...(uniqueSources.length > 0 ? { sources: uniqueSources } : {}),
  };
}

function scoreCandidateCompleteness(candidate: BookMetadataCandidate): number {
  let score = 0;
  if (candidate.coverUrl) score += 3;
  if (candidate.totalPages && candidate.totalPages > 1) score += 2;
  if (candidate.isbn) score += 2;
  if (candidate.publisher) score += 1;
  if (candidate.publicationYear) score += 1;
  if (candidate.seriesName) score += 1;
  if (candidate.genre && candidate.genre.length > 0) score += 1;
  if (candidate.source === 'merged') score += 1;
  return score;
}

function rankBalancedCandidates(
  candidates: readonly BookMetadataCandidate[],
  limit = MAX_SEARCH_RESULTS
): BookMetadataCandidate[] {
  const sorted = [...candidates].sort(
    (a, b) => scoreCandidateCompleteness(b) - scoreCandidateCompleteness(a)
  );
  const selected: BookMetadataCandidate[] = [];
  const selectedIds = new Set<string>();

  const bestMerged = sorted.find((candidate) => candidate.source === 'merged');
  if (bestMerged) {
    selected.push(bestMerged);
    selectedIds.add(bestMerged.id);
  }

  for (const provider of PROVIDER_QUOTA_ORDER) {
    if (selected.length >= limit) {
      break;
    }
    const topForProvider = sorted.find(
      (candidate) => candidate.source === provider && !selectedIds.has(candidate.id)
    );
    if (topForProvider) {
      selected.push(topForProvider);
      selectedIds.add(topForProvider.id);
    }
  }

  for (const candidate of sorted) {
    if (selected.length >= limit) {
      break;
    }
    if (!selectedIds.has(candidate.id)) {
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  return selected;
}

function escapeSparqlLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\s+/g, ' ').trim();
}

function buildWikidataTitleSearchSparql(query: string): string {
  const escaped = escapeSparqlLiteral(query);
  return `
SELECT DISTINCT ?item ?itemLabel ?authorLabel ?pages ?pubDate ?publisherLabel ?isbn13 ?isbn10 ?seriesLabel ?seriesOrdinal ?image WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:api "EntitySearch";
                    wikibase:endpoint "www.wikidata.org";
                    mwapi:search "${escaped}";
                    mwapi:language "es".
    ?item wikibase:apiOutputItem mwapi:item.
  }
  ?item wdt:P31/wdt:P279* wd:Q571 .
  OPTIONAL { ?item wdt:P50 ?author . }
  OPTIONAL { ?item wdt:P1104 ?pages . }
  OPTIONAL { ?item wdt:P577 ?pubDate . }
  OPTIONAL { ?item wdt:P123 ?publisher . }
  OPTIONAL { ?item wdt:P212 ?isbn13 . }
  OPTIONAL { ?item wdt:P957 ?isbn10 . }
  OPTIONAL {
    ?item p:P179 ?seriesStmt .
    ?seriesStmt ps:P179 ?series .
    OPTIONAL { ?seriesStmt pq:P1545 ?seriesOrdinal . }
  }
  OPTIONAL { ?item wdt:P18 ?image . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
LIMIT 6`.trim();
}

function buildWikidataIsbnSparql(normalizedIsbn: string): string {
  return `
SELECT DISTINCT ?item ?itemLabel ?authorLabel ?pages ?pubDate ?publisherLabel ?isbn13 ?isbn10 ?seriesLabel ?seriesOrdinal ?image WHERE {
  {
    ?item wdt:P212 ?isbnRaw .
  } UNION {
    ?item wdt:P957 ?isbnRaw .
  }
  FILTER(REPLACE(STR(?isbnRaw), "-", "") = "${normalizedIsbn}")
  OPTIONAL { ?item wdt:P50 ?author . }
  OPTIONAL { ?item wdt:P1104 ?pages . }
  OPTIONAL { ?item wdt:P577 ?pubDate . }
  OPTIONAL { ?item wdt:P123 ?publisher . }
  OPTIONAL { ?item wdt:P212 ?isbn13 . }
  OPTIONAL { ?item wdt:P957 ?isbn10 . }
  OPTIONAL {
    ?item p:P179 ?seriesStmt .
    ?seriesStmt ps:P179 ?series .
    OPTIONAL { ?seriesStmt pq:P1545 ?seriesOrdinal . }
  }
  OPTIONAL { ?item wdt:P18 ?image . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
LIMIT 3`.trim();
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

    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${normalizedIsbn}&format=json&jscmd=data`;
    const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${normalizedIsbn}&maxResults=3`;

    const [olResult, gbResult] = await Promise.allSettled([
      this.fetchJsonWithTimeout(olUrl).then((payload) =>
        parseOpenLibraryBibkeyResponse(payload, normalizedIsbn)
      ),
      this.fetchJsonWithTimeout(gbUrl).then((payload) => {
        const gbCandidates = parseGoogleBooksVolumesResponse(payload);
        return (
          gbCandidates.find((item) => areIsbnsEquivalent(item.isbn, normalizedIsbn)) ??
          gbCandidates[0] ??
          null
        );
      }),
    ]);

    if (olResult.status === 'rejected' && gbResult.status === 'rejected') {
      throw new BookMetadataError(
        'LOOKUP_FAILED',
        'Both metadata providers failed during ISBN lookup.'
      );
    }

    const olCandidate = olResult.status === 'fulfilled' ? olResult.value : null;
    const gbCandidate = gbResult.status === 'fulfilled' ? gbResult.value : null;

    let resolved: BookMetadataCandidate | null = null;
    if (olCandidate && gbCandidate) {
      resolved = mergeCandidates(olCandidate, gbCandidate);
    } else {
      resolved = olCandidate ?? gbCandidate;
    }

    if (!resolved || !hasAllKeyFields(resolved)) {
      const secondaryRequests: Promise<BookMetadataCandidate[]>[] = [
        this.fetchWikidataIsbnCandidates(normalizedIsbn),
        this.fetchCrossrefIsbnCandidates(normalizedIsbn),
      ];

      if (resolved?.workKey) {
        secondaryRequests.push(
          this.fetchOpenLibraryWorkEditions(resolved.workKey, {
            title: resolved.title,
            author: resolved.author,
          })
        );
      }

      const secondarySettled = await Promise.allSettled(secondaryRequests);
      for (const settled of secondarySettled) {
        if (settled.status !== 'fulfilled') {
          continue;
        }
        for (const extra of settled.value) {
          resolved = resolved ? mergeCandidates(resolved, extra) : extra;
        }
      }
    }

    if (resolved && !resolved.coverUrl) {
      const probedCover = await this.probeOpenLibraryIsbnCover(normalizedIsbn);
      if (probedCover) {
        resolved = { ...resolved, coverUrl: probedCover };
      }
    }

    if (resolved) {
      this.setInCache(this.isbnCache, normalizedIsbn, resolved);
    }

    return resolved;
  }

  /**
   * Queries Open Library's multi-bibkey endpoint in chunks of up to 20 normalized ISBNs,
   * reusing cached entries first and running multi-source `lookupByIsbn()` fallback for
   * missing or incomplete records so batch callers receive complete merged metadata.
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
          result.set(isbn, candidate);
          if (candidate.coverUrl && candidate.totalPages) {
            this.setInCache(this.isbnCache, isbn, candidate);
          }
        }
      } catch {
        // Ignore transient batch chunk failures so per-ISBN fallback can recover
      }

      const incompleteInChunk = chunk.filter((isbn) => {
        const current = result.get(isbn);
        return !current || !current.coverUrl || !current.totalPages;
      });

      if (incompleteInChunk.length > 0) {
        const fallbackResults = await Promise.allSettled(
          incompleteInChunk.map(async (isbn) => ({
            isbn,
            candidate: await this.lookupByIsbn(isbn),
          }))
        );

        for (const settled of fallbackResults) {
          if (settled.status !== 'fulfilled' || !settled.value.candidate) {
            continue;
          }
          const { isbn, candidate } = settled.value;
          const existing = result.get(isbn);
          const merged = existing ? mergeCandidates(existing, candidate) : candidate;
          this.setInCache(this.isbnCache, isbn, merged);
          result.set(isbn, merged);
        }
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

  async searchByQuery(
    rawQuery: string,
    hints?: SearchQueryHints
  ): Promise<BookMetadataCandidate[]> {
    const parsedHint = parseStructuredSearchHint(rawQuery, hints);
    const { query } = parsedHint;
    if (query.length < 2) {
      return [];
    }

    if (isValidIsbn(query)) {
      const match = await this.lookupByIsbn(query);
      return match ? [match] : [];
    }

    const cacheKey =
      hints?.title || hints?.author
        ? `${query.toLowerCase()}|t:${parsedHint.title?.toLowerCase() ?? ''}|a:${parsedHint.author?.toLowerCase() ?? ''}`
        : query.toLowerCase();
    const cached = this.getFromCache(this.queryCache, cacheKey);
    if (cached) {
      return cached;
    }

    const settled = await Promise.allSettled([
      this.fetchOpenLibrarySearchCandidates(parsedHint),
      this.fetchGoogleBooksSearchCandidates(parsedHint),
      this.fetchAppleBooksSearchCandidates(query),
      this.fetchWikidataSearchCandidates(query),
      this.fetchArchiveAndCrossrefCandidates(query),
    ]);

    if (settled.every((result) => result.status === 'rejected')) {
      throw new BookMetadataError('LOOKUP_FAILED', 'All metadata providers failed during search.');
    }

    const combined: BookMetadataCandidate[] = settled.flatMap((result) =>
      result.status === 'fulfilled' ? result.value : []
    );

    const fused = this.fuseEquivalentCandidates(combined);
    const ranked = rankBalancedCandidates(fused, MAX_SEARCH_RESULTS);

    this.setInCache(this.queryCache, cacheKey, ranked);
    return ranked;
  }

  private async fetchOpenLibrarySearchCandidates(
    hint: ParsedSearchHint
  ): Promise<BookMetadataCandidate[]> {
    const fields =
      'key,title,author_name,isbn,publisher,first_publish_year,number_of_pages_median,cover_i';
    let candidates: BookMetadataCandidate[] = [];

    if (hint.title && hint.author) {
      const structuredUrl =
        `https://openlibrary.org/search.json?title=${encodeURIComponent(hint.title)}` +
        `&author=${encodeURIComponent(hint.author)}&limit=8&fields=${fields}`;
      const structuredPayload = await this.fetchJsonWithTimeout(structuredUrl);
      candidates = parseOpenLibrarySearchResponse(structuredPayload);
    }

    if (candidates.length === 0) {
      const broadUrl =
        `https://openlibrary.org/search.json?q=${encodeURIComponent(hint.query)}` +
        `&limit=8&fields=${fields}`;
      const broadPayload = await this.fetchJsonWithTimeout(broadUrl);
      candidates = parseOpenLibrarySearchResponse(broadPayload);
    }

    const top = candidates[0];
    if (top && top.workKey && (!top.totalPages || !top.coverUrl)) {
      try {
        const editions = await this.fetchOpenLibraryWorkEditions(top.workKey, {
          title: top.title,
          author: top.author,
        });
        if (editions.length > 0) {
          let enrichedTop = top;
          for (const edition of editions) {
            enrichedTop = mergeCandidates(enrichedTop, edition);
            if (hasAllKeyFields(enrichedTop)) {
              break;
            }
          }
          candidates[0] = enrichedTop;
        }
      } catch {
        // Ignore work editions enrichment failure so base Open Library hits remain available
      }
    }

    return candidates;
  }

  private async fetchOpenLibraryWorkEditions(
    workKey: string,
    fallbackWorkInfo?: { title?: string; author?: string }
  ): Promise<BookMetadataCandidate[]> {
    const normalizedWorkKey = workKey.startsWith('/') ? workKey : `/works/${workKey}`;
    const url = `https://openlibrary.org${normalizedWorkKey}/editions.json?limit=10`;
    const payload = await this.fetchJsonWithTimeout(url);
    return parseOpenLibraryWorkEditionsResponse(payload, fallbackWorkInfo);
  }

  private async fetchGoogleBooksSearchCandidates(
    hint: ParsedSearchHint
  ): Promise<BookMetadataCandidate[]> {
    if (hint.title && hint.author) {
      const structuredQ = `intitle:"${hint.title}" inauthor:"${hint.author}"`;
      const structuredUrl =
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(structuredQ)}` +
        '&maxResults=8&printType=books';
      const structuredPayload = await this.fetchJsonWithTimeout(structuredUrl);
      const structuredCandidates = parseGoogleBooksVolumesResponse(structuredPayload);
      if (structuredCandidates.length > 0) {
        return structuredCandidates;
      }
    }

    const broadUrl =
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(hint.query)}` +
      '&maxResults=8&printType=books';
    const broadPayload = await this.fetchJsonWithTimeout(broadUrl);
    return parseGoogleBooksVolumesResponse(broadPayload);
  }

  private async fetchAppleBooksSearchCandidates(query: string): Promise<BookMetadataCandidate[]> {
    const url =
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}` +
      '&media=ebook&entity=ebook&country=ES&limit=5';
    const payload = await this.fetchJsonWithTimeout(url);
    return parseAppleBooksSearchResponse(payload);
  }

  private async fetchWikidataSearchCandidates(query: string): Promise<BookMetadataCandidate[]> {
    const sparql = buildWikidataTitleSearchSparql(query);
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
    const payload = await this.fetchJsonWithTimeout(url);
    return parseWikidataSparqlResponse(payload);
  }

  private async fetchWikidataIsbnCandidates(
    normalizedIsbn: string
  ): Promise<BookMetadataCandidate[]> {
    const sparql = buildWikidataIsbnSparql(normalizedIsbn);
    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
    const payload = await this.fetchJsonWithTimeout(url);
    return parseWikidataSparqlResponse(payload);
  }

  private async fetchCrossrefIsbnCandidates(
    normalizedIsbn: string
  ): Promise<BookMetadataCandidate[]> {
    const url = `https://api.crossref.org/works?filter=isbn:${encodeURIComponent(normalizedIsbn)}&rows=3`;
    const payload = await this.fetchJsonWithTimeout(url);
    return parseCrossrefWorksResponse(payload);
  }

  private async fetchArchiveAndCrossrefCandidates(query: string): Promise<BookMetadataCandidate[]> {
    const archiveUrl =
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}` +
      '&fl[]=identifier,title,creator,publisher,year,isbn,subject&rows=5&output=json';
    const crossrefUrl = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=5`;

    const [archiveResult, crossrefResult] = await Promise.allSettled([
      this.fetchJsonWithTimeout(archiveUrl).then((payload) =>
        parseInternetArchiveSearchResponse(payload)
      ),
      this.fetchJsonWithTimeout(crossrefUrl).then((payload) => parseCrossrefWorksResponse(payload)),
    ]);

    if (archiveResult.status === 'rejected' && crossrefResult.status === 'rejected') {
      throw new Error('Both Internet Archive and Crossref failed.');
    }

    return [
      ...(archiveResult.status === 'fulfilled' ? archiveResult.value : []),
      ...(crossrefResult.status === 'fulfilled' ? crossrefResult.value : []),
    ];
  }

  private async probeOpenLibraryIsbnCover(normalizedIsbn: string): Promise<string | undefined> {
    const probeUrl = `https://covers.openlibrary.org/b/isbn/${normalizedIsbn}-L.jpg?default=false`;
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(probeUrl, {
        method: 'HEAD',
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      });
      return response.ok ? probeUrl : undefined;
    } catch {
      return undefined;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  private fuseEquivalentCandidates(
    candidates: readonly BookMetadataCandidate[]
  ): BookMetadataCandidate[] {
    const deduplicated: BookMetadataCandidate[] = [];
    for (const incoming of candidates) {
      const existingIndex = deduplicated.findIndex((existing) =>
        this.areCandidatesSameEdition(existing, incoming)
      );
      if (existingIndex === -1) {
        deduplicated.push(incoming);
      } else {
        deduplicated[existingIndex] = mergeCandidates(deduplicated[existingIndex], incoming);
      }
    }

    const groups: BookMetadataCandidate[][] = [];
    for (const candidate of deduplicated) {
      const group = groups.find((existingGroup) =>
        existingGroup.some(
          (member) =>
            isStrictTitleMatch(member.title, candidate.title) &&
            isStrictAuthorMatch(member.author, candidate.author)
        )
      );
      if (group) {
        group.push(candidate);
      } else {
        groups.push([candidate]);
      }
    }

    const result: BookMetadataCandidate[] = [...deduplicated];
    for (const group of groups) {
      if (group.length < 2) {
        continue;
      }

      const sortedGroup = [...group].sort(
        (a, b) => scoreCandidateCompleteness(b) - scoreCandidateCompleteness(a)
      );
      let fused = sortedGroup[0];
      for (let i = 1; i < sortedGroup.length; i++) {
        fused = mergeCandidates(fused, sortedGroup[i]);
      }

      const synthesized: BookMetadataCandidate = {
        ...fused,
        id: fused.id.startsWith('merged:') ? fused.id : `merged:${fused.id}`,
        source: 'merged',
      };

      const alreadyHasEquivalentMerged = result.some(
        (item) => item.source === 'merged' && item.id === synthesized.id
      );
      if (!alreadyHasEquivalentMerged) {
        result.push(synthesized);
      }
    }

    return result;
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
