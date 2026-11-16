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

    candidates.push({
      id: `openlibrary:${doc.key ?? isbn ?? index}`,
      title,
      author,
      isbn,
      publisher: publisher || undefined,
      publicationYear: extractPublicationYear(doc.first_publish_year),
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
        authors: z.array(z.string()).optional(),
        publisher: z.string().optional(),
        publishedDate: z.string().optional(),
        pageCount: z.number().optional(),
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

    const title = stripHtmlTags(info.title);
    if (!title) {
      continue;
    }

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
      source: 'googlebooks',
    });
  }

  return candidates;
}
