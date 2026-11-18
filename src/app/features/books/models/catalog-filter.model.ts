import { BookFormat, BookStatus } from './book.model';

export {
  CATALOG_SORT_OPTIONS,
  CATALOG_VIEW_MODES,
  DEFAULT_CATALOG_SORT,
  DEFAULT_CATALOG_VIEW_MODE,
  isCatalogSortOption,
  isCatalogViewMode,
} from '../../../core/models/catalog-preferences.model';
export type {
  CatalogSortOption,
  CatalogViewMode,
} from '../../../core/models/catalog-preferences.model';

export interface CatalogFilterCriteria {
  searchQuery: string;
  status: BookStatus | 'all';
  format: BookFormat['name'] | 'all';
  minRating: number;
  seriesId?: string;
}

export const DEFAULT_CATALOG_FILTER_CRITERIA: Readonly<CatalogFilterCriteria> = Object.freeze({
  searchQuery: '',
  status: 'all',
  format: 'all',
  minRating: 0,
  seriesId: undefined,
});
