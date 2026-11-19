# Task 7.1: Filter, Sort & Persistence Engine

**Phase:** Phase 07: Catalog Filtering, Search & View Density  
**Status:** Completed  
**Estimated Impact:** High (domain model contracts, storage adapter preference keys, pure reactive signal pipeline for search and filtering, i18n keys).

---

## 1. Technical Objectives

1. **Catalog Domain Types & Models:**
   - Define catalog filter and view models in `src/app/features/books/models/catalog-filter.model.ts`:
     - `CatalogViewMode = 'grid' | 'detailed' | 'compact'`
     - `CatalogSortOption = 'recent' | 'title-asc' | 'title-desc' | 'author-asc' | 'rating-desc' | 'progress-desc' | 'pages-desc'`
     - `CatalogFilterCriteria`:
       - `searchQuery: string`
       - `status: BookStatus | 'all'`
       - `format: BookFormat['name'] | 'all'`
       - `minRating: number` (0 to 5, where 0 means any rating)
       - `seriesId?: string`
2. **Persistent Preferences in `StorageAdapterService`:**
   - Add storage keys and getters/setters in `StorageAdapterService`:
     - `CATALOG_VIEW_MODE_KEY = 'bookstack_catalog_view_mode'` (defaults to `'detailed'`)
     - `CATALOG_SORT_KEY = 'bookstack_catalog_sort'` (defaults to `'recent'`)
   - Handle invalid/corrupt values gracefully with safe fallbacks.
3. **Reactive Filter & Sort Signal Engine:**
   - Implement pure filtering & sorting pipeline via dedicated `CatalogFilterService`:
     - Normalized search across `title`, `author`, and `seriesName` (case-insensitive, trimming whitespace, accent folding using `normalize("NFD").replace(/[\u0300-\u036f]/g, "")`).
     - Fast multi-criteria evaluation with early exits: status filter, format filter, minimum rating filter.
     - Deterministic sorting:
       - `recent`: Order by `updatedAt ?? createdAt` descending.
       - `title-asc`: Localized alphabetical title sort (`localeCompare`).
       - `title-desc`: Reverse alphabetical title sort.
       - `author-asc`: Localized alphabetical author sort (`localeCompare`).
       - `rating-desc`: Books with rating descending; unrated (0) books placed last.
       - `progress-desc`: Percentage progress (`currentPage / totalPages`) descending.
       - `pages-desc`: Total pages descending.
   - Compute dynamic counts by status signal (`all`, `reading`, `pending`, `completed`, `abandoned`) reflecting current search/format/rating filters or total library.
4. **Bilingual i18n Dictionary:**
   - Extend `src/app/core/i18n/es.ts`, `en.ts`, and `i18n.types.ts` with complete `catalog` translations:
     - Search placeholder & aria labels
     - View mode tooltips (Cuadrícula / Detallada / Compacta)
     - Sort option labels (Recientes, Título A-Z, Título Z-A, Autor A-Z, Mayor valoración, Mayor progreso, Número de páginas)
     - Status chips labels
     - Filter button, active filter badge, clear filters action
     - Result counter template ("Mostrando {count} de {total} libros")
     - Zero-match empty state title, description, and action

---

## 2. Verification Gate

- [x] `npm run check` (0 TypeScript errors)
- [x] `npm run lint` (0 ESLint warnings)
- [x] `npm run format` (Prettier code style confirmed)
- [x] `npm test` (30 test suites passing, 151 unit & component tests green)
- [x] `npm run build` (production build compiled in 16.9s)
