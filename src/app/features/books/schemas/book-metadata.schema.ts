import { z } from 'zod';
import { BookMetadataCandidate } from '../models/book-metadata.model';
import { cleanIsbnInput, isValidIsbn13, normalizeIsbn } from '../utils/isbn.utils';
import { isSafeCoverUrl } from './book.schema';

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePositiveInt(raw: unknown): number | undefined {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : undefined;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return undefined;
    }

    const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start && start > 0) {
        return end - start + 1;
      }
    }

    const numeric = Number(trimmed);
    return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : undefined;
  }

  return undefined;
}

function toStringArray(raw: string | string[] | undefined): string[] {
  if (!raw) {
    return [];
  }
  return Array.isArray(raw) ? raw : [raw];
}

/**
 * Sanitizes an external cover URL: trims whitespace, upgrades http:// to https://,
 * strips Google Books `&edge=curl` parameter, and validates safety with `isSafeCoverUrl`.
 */
export function sanitizeExternalCoverUrl(rawUrl?: string | null): string | undefined {
  if (!rawUrl) {
    return undefined;
  }

  let url = rawUrl.trim();
  if (!url) {
    return undefined;
  }

  if (url.startsWith('http://')) {
    url = `https://${url.slice(7)}`;
  }

  url = url.replace(/([?&])edge=curl(&|$)/gi, (_match, prefix: string, suffix: string) => {
    if (prefix === '?' && suffix === '&') {
      return '?';
    }
    return suffix === '&' ? '&' : '';
  });

  if (!isSafeCoverUrl(url)) {
    return undefined;
  }

  return url;
}

/**
 * Extracts a valid 4-digit publication year (1000..2100) from a date string or number.
 */
export function extractPublicationYear(rawDate?: string | number | null): number | undefined {
  if (rawDate === null || rawDate === undefined) {
    return undefined;
  }

  if (typeof rawDate === 'number') {
    return Number.isInteger(rawDate) && rawDate >= 1000 && rawDate <= 2100 ? rawDate : undefined;
  }

  const match = rawDate.match(/(?:^|\D)(\d{4})(?:\D|$)/);
  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  return year >= 1000 && year <= 2100 ? year : undefined;
}

function pickBestNormalizedIsbn(candidates: readonly (string | undefined)[]): string | undefined {
  let fallback: string | undefined;

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const cleaned = cleanIsbnInput(candidate);
    if (isValidIsbn13(cleaned)) {
      return cleaned;
    }

    if (!fallback) {
      fallback = normalizeIsbn(cleaned) ?? undefined;
    }
  }

  return fallback;
}

// ==========================================
// Open Library Bibkey API (/api/books)
// ==========================================

const OpenLibraryNamedEntitySchema = z
  .object({
    name: z.string().optional(),
  })
  .passthrough();

const OpenLibraryBookDataSchema = z
  .object({
    title: z.string().optional(),
    authors: z.array(OpenLibraryNamedEntitySchema).optional(),
    publishers: z.array(OpenLibraryNamedEntitySchema).optional(),
    publish_date: z.string().optional(),
    number_of_pages: z.number().optional(),
    identifiers: z
      .object({
        isbn_13: z.array(z.string()).optional(),
        isbn_10: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
    cover: z
      .object({
        large: z.string().optional(),
        medium: z.string().optional(),
        small: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const OpenLibraryBibkeyResponseSchema = z.record(z.string(), OpenLibraryBookDataSchema);

function mapOpenLibraryBookData(
  entry: z.infer<typeof OpenLibraryBookDataSchema>,
  cleanedRequested: string,
  normalizedRequested: string | null
): BookMetadataCandidate | null {
  if (!entry?.title) {
    return null;
  }

  const title = stripHtmlTags(entry.title);
  if (!title) {
    return null;
  }

  const author = (entry.authors ?? [])
    .map((a) => (a.name ? stripHtmlTags(a.name) : ''))
    .filter(Boolean)
    .join(', ');

  const publisherRaw = entry.publishers?.find((p) => p.name)?.name;
  const publisher = publisherRaw ? stripHtmlTags(publisherRaw) : undefined;

  const isbn =
    pickBestNormalizedIsbn([
      ...(entry.identifiers?.isbn_13 ?? []),
      ...(entry.identifiers?.isbn_10 ?? []),
      normalizedRequested ?? undefined,
    ]) ??
    (cleanedRequested || undefined);

  const totalPages =
    typeof entry.number_of_pages === 'number' && entry.number_of_pages > 0
      ? Math.round(entry.number_of_pages)
      : undefined;

  const coverUrl = sanitizeExternalCoverUrl(
    entry.cover?.large ?? entry.cover?.medium ?? entry.cover?.small
  );

  return {
    id: `openlibrary:${isbn ?? cleanedRequested}`,
    title,
    author,
    isbn,
    publisher: publisher || undefined,
    publicationYear: extractPublicationYear(entry.publish_date),
    totalPages,
    coverUrl,
    source: 'openlibrary',
  };
}

/**
 * Validates and maps an Open Library `/api/books?bibkeys=...&jscmd=data` payload.
 */
export function parseOpenLibraryBibkeyResponse(
  payload: unknown,
  requestedIsbn: string
): BookMetadataCandidate | null {
  const parsed = OpenLibraryBibkeyResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return null;
  }

  const cleanedRequested = cleanIsbnInput(requestedIsbn);
  const normalizedRequested = normalizeIsbn(cleanedRequested);

  const entry =
    parsed.data[`ISBN:${cleanedRequested}`] ??
    (normalizedRequested ? parsed.data[`ISBN:${normalizedRequested}`] : undefined) ??
    Object.values(parsed.data)[0];

  if (!entry) {
    return null;
  }

  return mapOpenLibraryBookData(entry, cleanedRequested, normalizedRequested);
}

/**
 * Validates and maps a multi-ISBN Open Library `/api/books?bibkeys=ISBN:...,ISBN:...&jscmd=data`
 * batch payload into a Map keyed by normalized ISBN-13.
 */
export function parseOpenLibraryBibkeyBatchResponse(
  payload: unknown,
  requestedIsbns: readonly string[]
): Map<string, BookMetadataCandidate> {
  const results = new Map<string, BookMetadataCandidate>();
  const parsed = OpenLibraryBibkeyResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return results;
  }

  for (const rawIsbn of requestedIsbns) {
    const cleaned = cleanIsbnInput(rawIsbn);
    const normalized = normalizeIsbn(cleaned);
    if (!normalized) {
      continue;
    }

    const entry =
      parsed.data[`ISBN:${normalized}`] ??
      parsed.data[`ISBN:${cleaned}`] ??
      parsed.data[`ISBN:${rawIsbn.trim()}`];

    if (!entry) {
      continue;
    }

    const candidate = mapOpenLibraryBookData(entry, cleaned, normalized);
    if (candidate) {
      results.set(normalized, candidate);
    }
  }

  return results;
}

// ==========================================
// Open Library Search API (/search.json)
// ==========================================

const OpenLibrarySearchDocSchema = z
  .object({
    key: z.string().optional(),
    title: z.string().optional(),
    author_name: z.array(z.string()).optional(),
    isbn: z.array(z.string()).optional(),
    publisher: z.array(z.string()).optional(),
    first_publish_year: z.number().optional(),
    number_of_pages_median: z.number().optional(),
    cover_i: z.number().optional(),
  })
  .passthrough();

const OpenLibrarySearchResponseSchema = z
  .object({
    docs: z.array(OpenLibrarySearchDocSchema),
  })
  .passthrough();

/**
 * Validates and maps an Open Library `/search.json` payload into `BookMetadataCandidate[]`.
 */
export function parseOpenLibrarySearchResponse(payload: unknown): BookMetadataCandidate[] {
  const parsed = OpenLibrarySearchResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const candidates: BookMetadataCandidate[] = [];

  for (let index = 0; index < parsed.data.docs.length; index++) {
    const doc = parsed.data.docs[index];
    if (!doc.title) {
      continue;
    }

    const title = stripHtmlTags(doc.title);
    if (!title) {
      continue;
    }

    const author = (doc.author_name ?? [])
      .map((name) => stripHtmlTags(name))
      .filter(Boolean)
      .join(', ');

    const isbn = pickBestNormalizedIsbn(doc.isbn ?? []);
    const publisherRaw = doc.publisher?.find((p) => p.trim().length > 0);
    const publisher = publisherRaw ? stripHtmlTags(publisherRaw) : undefined;

    const totalPages =
      typeof doc.number_of_pages_median === 'number' && doc.number_of_pages_median > 0
        ? Math.round(doc.number_of_pages_median)
        : undefined;

    const coverUrl =
      typeof doc.cover_i === 'number' && doc.cover_i > 0
        ? sanitizeExternalCoverUrl(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`)
        : undefined;

    const workKey = doc.key?.startsWith('/works/') ? doc.key : undefined;

    candidates.push({
      id: `openlibrary:${doc.key ?? isbn ?? index}`,
      title,
      author,
      isbn,
      publisher: publisher || undefined,
      publicationYear: extractPublicationYear(doc.first_publish_year),
      totalPages,
      coverUrl,
      ...(workKey ? { workKey } : {}),
      source: 'openlibrary',
    });
  }

  return candidates;
}

// ==========================================
// Open Library Work Editions API (/works/{OLID}/editions.json)
// ==========================================

const OpenLibraryWorkEditionSchema = z
  .object({
    key: z.string().optional(),
    title: z.string().optional(),
    number_of_pages: z.number().optional(),
    publishers: z.array(z.union([z.string(), OpenLibraryNamedEntitySchema])).optional(),
    publish_date: z.string().optional(),
    isbn_13: z.array(z.string()).optional(),
    isbn_10: z.array(z.string()).optional(),
    covers: z.array(z.number()).optional(),
  })
  .passthrough();

const OpenLibraryWorkEditionsResponseSchema = z
  .object({
    entries: z.array(OpenLibraryWorkEditionSchema),
  })
  .passthrough();

/**
 * Validates and maps an Open Library `/works/{OLID}/editions.json` payload into `BookMetadataCandidate[]`.
 */
export function parseOpenLibraryWorkEditionsResponse(
  payload: unknown,
  fallbackWorkInfo?: { title?: string; author?: string }
): BookMetadataCandidate[] {
  const parsed = OpenLibraryWorkEditionsResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const fallbackTitle = fallbackWorkInfo?.title ? stripHtmlTags(fallbackWorkInfo.title) : '';
  const fallbackAuthor = fallbackWorkInfo?.author ? stripHtmlTags(fallbackWorkInfo.author) : '';
  const candidates: BookMetadataCandidate[] = [];

  for (let index = 0; index < parsed.data.entries.length; index++) {
    const entry = parsed.data.entries[index];
    const title = (entry.title ? stripHtmlTags(entry.title) : '') || fallbackTitle;
    if (!title) {
      continue;
    }

    const isbn = pickBestNormalizedIsbn([...(entry.isbn_13 ?? []), ...(entry.isbn_10 ?? [])]);

    const publisherRaw = entry.publishers
      ?.map((pub) => (typeof pub === 'string' ? pub : (pub.name ?? '')))
      .find((name) => name.trim().length > 0);
    const publisher = publisherRaw ? stripHtmlTags(publisherRaw) : undefined;

    const totalPages = parsePositiveInt(entry.number_of_pages);
    const coverId = entry.covers?.find((id) => typeof id === 'number' && id > 0);
    const coverUrl = coverId
      ? sanitizeExternalCoverUrl(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`)
      : undefined;

    candidates.push({
      id: `openlibrary:${entry.key ?? isbn ?? index}`,
      title,
      author: fallbackAuthor,
      isbn,
      publisher: publisher || undefined,
      publicationYear: extractPublicationYear(entry.publish_date),
      totalPages,
      coverUrl,
      source: 'openlibrary',
    });
  }

  return candidates;
}

// ==========================================
// Google Books Volumes API (/books/v1/volumes)
// ==========================================

const GoogleBooksVolumeItemSchema = z
  .object({
    id: z.string().optional(),
    volumeInfo: z
      .object({
        title: z.string().optional(),
        subtitle: z.string().optional(),
        authors: z.array(z.string()).optional(),
        publisher: z.string().optional(),
        publishedDate: z.string().optional(),
        pageCount: z.number().optional(),
        categories: z.array(z.string()).optional(),
        industryIdentifiers: z
          .array(
            z
              .object({
                type: z.string().optional(),
                identifier: z.string().optional(),
              })
              .passthrough()
          )
          .optional(),
        imageLinks: z
          .object({
            extraLarge: z.string().optional(),
            large: z.string().optional(),
            medium: z.string().optional(),
            small: z.string().optional(),
            thumbnail: z.string().optional(),
            smallThumbnail: z.string().optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();

const GoogleBooksVolumesResponseSchema = z
  .object({
    items: z.array(GoogleBooksVolumeItemSchema).optional(),
  })
  .passthrough();

/**
 * Validates and maps a Google Books `/books/v1/volumes` payload into `BookMetadataCandidate[]`.
 */
export function parseGoogleBooksVolumesResponse(payload: unknown): BookMetadataCandidate[] {
  const parsed = GoogleBooksVolumesResponseSchema.safeParse(payload);
  if (!parsed.success || !parsed.data.items) {
    return [];
  }

  const candidates: BookMetadataCandidate[] = [];

  for (let index = 0; index < parsed.data.items.length; index++) {
    const item = parsed.data.items[index];
    const info = item.volumeInfo;
    if (!info.title) {
      continue;
    }

    const baseTitle = stripHtmlTags(info.title);
    if (!baseTitle) {
      continue;
    }

    const subtitle = info.subtitle ? stripHtmlTags(info.subtitle) : '';
    const title =
      subtitle && !baseTitle.toLowerCase().includes(subtitle.toLowerCase())
        ? `${baseTitle}: ${subtitle}`
        : baseTitle;

    const author = (info.authors ?? [])
      .map((a) => stripHtmlTags(a))
      .filter(Boolean)
      .join(', ');

    const identifiers = info.industryIdentifiers ?? [];
    const isbn13Ids = identifiers.filter((id) => id.type === 'ISBN_13').map((id) => id.identifier);
    const isbn10Ids = identifiers.filter((id) => id.type === 'ISBN_10').map((id) => id.identifier);
    const otherIds = identifiers.map((id) => id.identifier);

    const isbn = pickBestNormalizedIsbn([...isbn13Ids, ...isbn10Ids, ...otherIds]);
    const publisher = info.publisher ? stripHtmlTags(info.publisher) : undefined;

    const totalPages =
      typeof info.pageCount === 'number' && info.pageCount > 0
        ? Math.round(info.pageCount)
        : undefined;

    const genreList = Array.from(
      new Set((info.categories ?? []).map((cat) => stripHtmlTags(cat)).filter(Boolean))
    );

    const coverUrl = sanitizeExternalCoverUrl(
      info.imageLinks?.extraLarge ??
        info.imageLinks?.large ??
        info.imageLinks?.medium ??
        info.imageLinks?.thumbnail ??
        info.imageLinks?.small ??
        info.imageLinks?.smallThumbnail
    );

    candidates.push({
      id: `googlebooks:${item.id ?? isbn ?? index}`,
      title,
      author,
      isbn,
      publisher: publisher || undefined,
      publicationYear: extractPublicationYear(info.publishedDate),
      totalPages,
      coverUrl,
      ...(genreList.length > 0 ? { genre: genreList } : {}),
      source: 'googlebooks',
    });
  }

  return candidates;
}

// ==========================================
// Wikidata SPARQL API (query.wikidata.org/sparql)
// ==========================================

const WikidataBindingValueSchema = z
  .object({
    value: z.string(),
  })
  .passthrough();

const WikidataSparqlResponseSchema = z
  .object({
    results: z
      .object({
        bindings: z.array(z.record(z.string(), WikidataBindingValueSchema)),
      })
      .passthrough(),
  })
  .passthrough();

function formatWikimediaCoverUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) {
    return undefined;
  }

  let url = rawUrl.trim();
  if (!url) {
    return undefined;
  }

  if (url.startsWith('http://')) {
    url = `https://${url.slice(7)}`;
  }

  if (url.includes('commons.wikimedia.org/wiki/Special:FilePath/') && !url.includes('width=')) {
    url = `${url}${url.includes('?') ? '&' : '?'}width=400`;
  }

  return sanitizeExternalCoverUrl(url);
}

/**
 * Validates and maps a Wikidata SPARQL JSON payload (`results.bindings`) into `BookMetadataCandidate[]`.
 */
export function parseWikidataSparqlResponse(payload: unknown): BookMetadataCandidate[] {
  const parsed = WikidataSparqlResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const candidates: BookMetadataCandidate[] = [];

  for (let index = 0; index < parsed.data.results.bindings.length; index++) {
    const binding = parsed.data.results.bindings[index];
    const rawTitle = binding['itemLabel']?.value;
    if (!rawTitle) {
      continue;
    }

    const title = stripHtmlTags(rawTitle);
    if (!title) {
      continue;
    }

    const rawItem = binding['item']?.value ?? '';
    const qidMatch = rawItem.match(/\/entity\/(Q\d+)$/i);
    const entityId = qidMatch ? qidMatch[1] : rawItem || String(index);

    const author = binding['authorLabel']?.value ? stripHtmlTags(binding['authorLabel'].value) : '';
    const isbn = pickBestNormalizedIsbn([binding['isbn13']?.value, binding['isbn10']?.value]);
    const totalPages = parsePositiveInt(binding['pages']?.value);
    const publicationYear = extractPublicationYear(binding['pubDate']?.value);
    const publisher = binding['publisherLabel']?.value
      ? stripHtmlTags(binding['publisherLabel'].value)
      : undefined;
    const seriesName = binding['seriesLabel']?.value
      ? stripHtmlTags(binding['seriesLabel'].value)
      : undefined;
    const seriesOrder = parsePositiveInt(binding['seriesOrdinal']?.value);
    const coverUrl = formatWikimediaCoverUrl(binding['image']?.value);

    candidates.push({
      id: `wikidata:${entityId}`,
      title,
      author,
      isbn,
      publisher: publisher || undefined,
      publicationYear,
      totalPages,
      coverUrl,
      ...(seriesName ? { seriesName } : {}),
      ...(seriesOrder !== undefined ? { seriesOrder } : {}),
      source: 'wikidata',
    });
  }

  return candidates;
}

// ==========================================
// Apple Books / iTunes Search API (itunes.apple.com/search)
// ==========================================

const AppleBooksItemSchema = z
  .object({
    trackId: z.union([z.number(), z.string()]).optional(),
    trackName: z.string().optional(),
    artistName: z.string().optional(),
    releaseDate: z.string().optional(),
    genres: z.array(z.string()).optional(),
    artworkUrl100: z.string().optional(),
    artworkUrl60: z.string().optional(),
  })
  .passthrough();

const AppleBooksSearchResponseSchema = z
  .object({
    results: z.array(AppleBooksItemSchema),
  })
  .passthrough();

function upgradeAppleArtworkUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) {
    return undefined;
  }
  const upgraded = rawUrl.trim().replace(/\/\d+x\d+bb[^/]*$/i, '/600x600bb.jpg');
  return sanitizeExternalCoverUrl(upgraded);
}

/**
 * Validates and maps an Apple Books / iTunes Search API payload into `BookMetadataCandidate[]`.
 */
export function parseAppleBooksSearchResponse(payload: unknown): BookMetadataCandidate[] {
  const parsed = AppleBooksSearchResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const candidates: BookMetadataCandidate[] = [];

  for (let index = 0; index < parsed.data.results.length; index++) {
    const item = parsed.data.results[index];
    if (!item.trackName) {
      continue;
    }

    const title = stripHtmlTags(item.trackName);
    if (!title) {
      continue;
    }

    const author = item.artistName ? stripHtmlTags(item.artistName) : '';
    const publicationYear = extractPublicationYear(item.releaseDate);
    const genreList = Array.from(
      new Set((item.genres ?? []).map((g) => stripHtmlTags(g)).filter(Boolean))
    );
    const coverUrl = upgradeAppleArtworkUrl(item.artworkUrl100 ?? item.artworkUrl60);

    candidates.push({
      id: `applebooks:${item.trackId ?? index}`,
      title,
      author,
      publicationYear,
      coverUrl,
      ...(genreList.length > 0 ? { genre: genreList } : {}),
      source: 'applebooks',
    });
  }

  return candidates;
}

// ==========================================
// Internet Archive Advanced Search API (archive.org/advancedsearch.php)
// ==========================================

const InternetArchiveDocSchema = z
  .object({
    identifier: z.string().optional(),
    title: z.union([z.string(), z.array(z.string())]).optional(),
    creator: z.union([z.string(), z.array(z.string())]).optional(),
    publisher: z.union([z.string(), z.array(z.string())]).optional(),
    year: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).optional(),
    date: z.union([z.string(), z.array(z.string())]).optional(),
    imagecount: z.union([z.number(), z.string()]).optional(),
    number_of_pages: z.union([z.number(), z.string()]).optional(),
    isbn: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .passthrough();

const InternetArchiveSearchResponseSchema = z
  .object({
    response: z
      .object({
        docs: z.array(InternetArchiveDocSchema),
      })
      .passthrough(),
  })
  .passthrough();

/**
 * Validates and maps an Internet Archive `/advancedsearch.php` payload into `BookMetadataCandidate[]`.
 */
export function parseInternetArchiveSearchResponse(payload: unknown): BookMetadataCandidate[] {
  const parsed = InternetArchiveSearchResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const candidates: BookMetadataCandidate[] = [];

  for (let index = 0; index < parsed.data.response.docs.length; index++) {
    const doc = parsed.data.response.docs[index];
    const rawTitle = toStringArray(doc.title)[0];
    if (!rawTitle) {
      continue;
    }

    const title = stripHtmlTags(rawTitle);
    if (!title) {
      continue;
    }

    const author = toStringArray(doc.creator)
      .map((c) => stripHtmlTags(c))
      .filter(Boolean)
      .join(', ');

    const publisherRaw = toStringArray(doc.publisher).find((p) => p.trim().length > 0);
    const publisher = publisherRaw ? stripHtmlTags(publisherRaw) : undefined;

    const rawYear = Array.isArray(doc.year) ? doc.year[0] : doc.year;
    const rawDate = toStringArray(doc.date)[0];
    const publicationYear = extractPublicationYear(rawYear ?? rawDate);

    const totalPages = parsePositiveInt(doc.number_of_pages ?? doc.imagecount);
    const isbn = pickBestNormalizedIsbn(toStringArray(doc.isbn));

    const identifier = doc.identifier?.trim();
    const coverUrl = identifier
      ? sanitizeExternalCoverUrl(
          `https://archive.org/services/img/${encodeURIComponent(identifier)}`
        )
      : undefined;

    candidates.push({
      id: `archive:${identifier || isbn || index}`,
      title,
      author,
      isbn,
      publisher: publisher || undefined,
      publicationYear,
      totalPages,
      coverUrl,
      source: 'archive',
    });
  }

  return candidates;
}

// ==========================================
// Crossref Works API (api.crossref.org/works)
// ==========================================

const CrossrefAuthorSchema = z
  .object({
    given: z.string().optional(),
    family: z.string().optional(),
    name: z.string().optional(),
  })
  .passthrough();

const CrossrefDateSchema = z
  .object({
    'date-parts': z.array(z.array(z.number())).optional(),
  })
  .passthrough();

const CrossrefWorkItemSchema = z
  .object({
    DOI: z.string().optional(),
    title: z.array(z.string()).optional(),
    author: z.array(CrossrefAuthorSchema).optional(),
    publisher: z.string().optional(),
    'published-print': CrossrefDateSchema.optional(),
    'published-online': CrossrefDateSchema.optional(),
    ISBN: z.array(z.string()).optional(),
    page: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

const CrossrefWorksResponseSchema = z
  .object({
    message: z
      .object({
        items: z.array(CrossrefWorkItemSchema),
      })
      .passthrough(),
  })
  .passthrough();

/**
 * Validates and maps a Crossref `/works` JSON payload into `BookMetadataCandidate[]`.
 */
export function parseCrossrefWorksResponse(payload: unknown): BookMetadataCandidate[] {
  const parsed = CrossrefWorksResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const candidates: BookMetadataCandidate[] = [];

  for (let index = 0; index < parsed.data.message.items.length; index++) {
    const item = parsed.data.message.items[index];
    const rawTitle = item.title?.[0];
    if (!rawTitle) {
      continue;
    }

    const title = stripHtmlTags(rawTitle);
    if (!title) {
      continue;
    }

    const author = (item.author ?? [])
      .map((a) => {
        const fullName = [a.given, a.family].filter(Boolean).join(' ').trim();
        return stripHtmlTags(fullName || a.name || '');
      })
      .filter(Boolean)
      .join(', ');

    const publisher = item.publisher ? stripHtmlTags(item.publisher) : undefined;
    const rawYear =
      item['published-print']?.['date-parts']?.[0]?.[0] ??
      item['published-online']?.['date-parts']?.[0]?.[0];
    const publicationYear = extractPublicationYear(rawYear);
    const isbn = pickBestNormalizedIsbn(item.ISBN ?? []);
    const totalPages = parsePositiveInt(item.page);

    candidates.push({
      id: `crossref:${item.DOI ?? isbn ?? index}`,
      title,
      author,
      isbn,
      publisher: publisher || undefined,
      publicationYear,
      totalPages,
      source: 'crossref',
    });
  }

  return candidates;
}
