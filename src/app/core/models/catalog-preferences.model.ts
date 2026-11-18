export type CatalogViewMode = 'grid' | 'detailed' | 'compact';

export type CatalogSortOption =
  | 'recent'
  | 'title-asc'
  | 'title-desc'
  | 'author-asc'
  | 'rating-desc'
  | 'progress-desc'
  | 'pages-desc';

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

export function isCatalogViewMode(value: unknown): value is CatalogViewMode {
  return typeof value === 'string' && (CATALOG_VIEW_MODES as readonly string[]).includes(value);
}

export function isCatalogSortOption(value: unknown): value is CatalogSortOption {
  return typeof value === 'string' && (CATALOG_SORT_OPTIONS as readonly string[]).includes(value);
}
