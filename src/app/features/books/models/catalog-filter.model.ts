import { BookFormat, BookStatus } from './book.model';

export type CatalogViewMode = 'grid' | 'detailed' | 'compact';

export type CatalogSortOption =
  | 'recent'
  | 'title-asc'
  | 'title-desc'
  | 'author-asc'
  | 'rating-desc'
  | 'progress-desc'
  | 'pages-desc';

export interface CatalogFilterCriteria {
  searchQuery: string;
  status: BookStatus | 'all';
  format: BookFormat['name'] | 'all';
  minRating: number;
  seriesId?: string;
}

export const CATALOG_VIEW_MODES: readonly CatalogViewMode[] = ['grid', 'detailed', 'compact'];

export const CATALOG_SORT_OPTIONS: readonly CatalogSortOption[] = [
  'recent',
  'title-asc',
  'title-desc',
  'author-asc',
  'rating-desc',
  'progress-desc',
  'pages-desc',
];

export const DEFAULT_CATALOG_VIEW_MODE: CatalogViewMode = 'detailed';
export const DEFAULT_CATALOG_SORT: CatalogSortOption = 'recent';

export const DEFAULT_CATALOG_FILTER_CRITERIA: Readonly<CatalogFilterCriteria> = Object.freeze({
  searchQuery: '',
  status: 'all',
  format: 'all',
  minRating: 0,
  seriesId: undefined,
});

export function isCatalogViewMode(value: unknown): value is CatalogViewMode {
  return typeof value === 'string' && (CATALOG_VIEW_MODES as readonly string[]).includes(value);
}

export function isCatalogSortOption(value: unknown): value is CatalogSortOption {
  return typeof value === 'string' && (CATALOG_SORT_OPTIONS as readonly string[]).includes(value);
}
