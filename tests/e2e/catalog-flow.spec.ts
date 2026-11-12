import { expect, Page, test } from '@playwright/test';
import { Book } from '../../src/app/features/books/models/book.model';

const SEED_BOOKS: Book[] = [
  {
    id: 'seed-book-1',
    title: 'El Quijote',
    author: 'Miguel de Cervantes',
    totalPages: 800,
    currentPage: 200,
    status: 'reading',
    format: 'Físico',
    rating: 9,
    series: { id: 'classics', name: 'Clásicos Universales' },
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'seed-book-2',
    title: 'Cien Años de Soledad',
    author: 'Gabriel García Márquez',
    totalPages: 450,
    currentPage: 450,
    status: 'completed',
    format: 'Ebook',
    rating: 10,
    createdAt: '2026-01-10T10:00:00.000Z',
    updatedAt: '2026-03-05T10:00:00.000Z',
  },
  {
    id: 'seed-book-3',
    title: 'Dune',
    author: 'Frank Herbert',
    totalPages: 600,
    currentPage: 0,
    status: 'pending',
    format: 'Audiolibro',
    rating: undefined,
    series: { id: 'dune-series', name: 'Dune Chronicles' },
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'seed-book-4',
    title: 'La Metamorfosis',
    author: 'Franz Kafka',
    totalPages: 120,
    currentPage: 60,
    status: 'abandoned',
    format: 'Físico',
    rating: 6,
    createdAt: '2025-12-01T10:00:00.000Z',
    updatedAt: '2025-12-15T10:00:00.000Z',
  },
  {
    id: 'seed-book-5',
    title: 'Ángeles y Demonios',
    author: 'Dan Brown',
    totalPages: 550,
    currentPage: 0,
    status: 'pending',
    format: 'Ebook',
    rating: 7,
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z',
  },
];

async function seedIndexedDbBooks(page: Page, books: Book[]): Promise<void> {
  await page.goto('/books');
  await page.evaluate(async (bookList) => {
    localStorage.removeItem('bookstack_catalog_view_mode');
    localStorage.removeItem('bookstack_catalog_sort');

    return new Promise<void>((resolve, reject) => {
      const openReq = indexedDB.open('bookstackDB', 1);
      openReq.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('readingLogs')) {
          db.createObjectStore('readingLogs', { keyPath: 'id' });
        }
      };
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('books', 'readwrite');
        const store = tx.objectStore('books');
        store.clear();
        for (const item of bookList) {
          store.put(item);
        }
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      };
      openReq.onerror = () => reject(openReq.error);
    });
  }, books);

  await page.reload();
  await page.waitForSelector('app-catalog-toolbar');
}

test.describe('Catalog Filtering, Omni-Search & View Modes', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedIndexedDbBooks(page, SEED_BOOKS);
  });

  test('should perform live omni-search with accent and case insensitivity, then clear', async ({
    page,
  }) => {
    const searchInput = page.getByRole('textbox', {
      name: 'Buscar en la biblioteca',
    });

    // 1. Search by title
    await searchInput.fill('Quijote');
    await expect(page.getByRole('heading', { name: 'El Quijote' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cien Años de Soledad' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Dune' })).toBeHidden();

    // 2. Search accent-insensitively for "soledad" / "anos"
    await searchInput.fill('anos');
    await expect(page.getByRole('heading', { name: 'Cien Años de Soledad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'El Quijote' })).toBeHidden();

    // 3. Search by author
    await searchInput.fill('kafka');
    await expect(page.getByRole('heading', { name: 'La Metamorfosis' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cien Años de Soledad' })).toBeHidden();

    // 4. Search by saga/series name
    await searchInput.fill('Chronicles');
    await expect(page.getByRole('heading', { name: 'Dune' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'La Metamorfosis' })).toBeHidden();

    // 5. Clear search via clear button
    const clearBtn = page.getByRole('button', { name: 'Limpiar búsqueda' });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    await expect(searchInput).toHaveValue('');
    await expect(page.getByRole('heading', { name: 'El Quijote' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cien Años de Soledad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dune' })).toBeVisible();
  });

  test('should filter books by status chips and show dynamic counters', async ({ page }) => {
    // 1. Filter by "Leyendo"
    const readingChip = page.getByRole('button', { name: /^Leyendo/ });
    await readingChip.click();

    await expect(page.getByRole('heading', { name: 'El Quijote' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cien Años de Soledad' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Dune' })).toBeHidden();
    await expect(page.locator('app-book-detailed-card')).toHaveCount(1);

    // 2. Filter by "Completados"
    const completedChip = page.getByRole('button', { name: /^Completados/ });
    await completedChip.click();

    await expect(page.getByRole('heading', { name: 'Cien Años de Soledad' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'El Quijote' })).toBeHidden();
    await expect(page.locator('app-book-detailed-card')).toHaveCount(1);

    // 3. Filter by "Por leer" (pending)
    const pendingChip = page.getByRole('button', { name: /^Por leer/ });
    await pendingChip.click();

    await expect(page.getByRole('heading', { name: 'Dune' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ángeles y Demonios' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'El Quijote' })).toBeHidden();
    await expect(page.locator('app-book-detailed-card')).toHaveCount(2);

    // 4. Return to "Todos"
    const allChip = page.getByRole('button', { name: /^Todos/ });
    await allChip.click();

    await expect(page.locator('app-book-detailed-card')).toHaveCount(5);
  });

  test('should toggle advanced filter drawer, apply format & rating, and reset', async ({
    page,
  }) => {
    // Open secondary filter panel
    const filterToggleBtn = page.getByRole('button', {
      name: 'Alternar panel de filtros secundarios',
    });
    await filterToggleBtn.click();

    // Select format "Audiolibro"
    const audioChip = page
      .locator('app-catalog-toolbar')
      .getByRole('button', { name: 'Audiolibro', exact: true });
    await expect(audioChip).toBeVisible();
    await audioChip.click();

    await expect(page.getByRole('heading', { name: 'Dune' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'El Quijote' })).toBeHidden();
    await expect(page.locator('app-book-detailed-card')).toHaveCount(1);
    await expect(page.getByText('Mostrando 1 de 5 libros')).toBeVisible();

    // Reset secondary filters via drawer reset button
    const resetDrawerBtn = page.getByRole('button', {
      name: 'Limpiar filtros',
    });
    await resetDrawerBtn.click();

    await expect(page.locator('app-book-detailed-card')).toHaveCount(5);
    await expect(page.getByText('Mostrando 5 de 5 libros')).toBeVisible();
  });

  test('should sort books deterministically by title and rating', async ({ page }) => {
    const sortSelect = page.getByRole('combobox', { name: 'Ordenar libros' });

    // 1. Sort by Title (A-Z)
    await sortSelect.selectOption('title-asc');

    const cardTitles = await page
      .locator('app-book-detailed-card h2')
      .evaluateAll((headings) => headings.map((h) => h.textContent?.trim()));

    expect(cardTitles).toEqual([
      'Ángeles y Demonios',
      'Cien Años de Soledad',
      'Dune',
      'El Quijote',
      'La Metamorfosis',
    ]);

    // 2. Sort by Title (Z-A)
    await sortSelect.selectOption('title-desc');

    const cardTitlesDesc = await page
      .locator('app-book-detailed-card h2')
      .evaluateAll((headings) => headings.map((h) => h.textContent?.trim()));

    expect(cardTitlesDesc).toEqual([
      'La Metamorfosis',
      'El Quijote',
      'Dune',
      'Cien Años de Soledad',
      'Ángeles y Demonios',
    ]);
  });

  test('should switch between Grid, Detailed, and Compact view modes and persist selection', async ({
    page,
  }) => {
    // 1. Default is Detailed Cards
    await expect(page.locator('app-book-detailed-card')).toHaveCount(5);

    // 2. Switch to Visual Bookshelf Grid
    const gridBtn = page.getByRole('button', { name: 'Vista de cuadrícula' });
    await gridBtn.click();

    await expect(page.locator('app-book-grid-card')).toHaveCount(5);
    await expect(page.locator('app-book-detailed-card')).toHaveCount(0);

    // 3. Switch to Compact List
    const compactBtn = page.getByRole('button', { name: 'Vista compacta' });
    await compactBtn.click();

    await expect(page.locator('app-book-compact-row')).toHaveCount(5);
    await expect(page.locator('app-book-grid-card')).toHaveCount(0);

    // 4. Reload page to verify LocalStorage persistence of 'compact' mode
    await page.reload();
    await expect(page.locator('app-book-compact-row')).toHaveCount(5);

    // 5. Restore back to Detailed
    const detailedBtn = page.getByRole('button', { name: 'Vista detallada' });
    await detailedBtn.click();
    await expect(page.locator('app-book-detailed-card')).toHaveCount(5);
  });

  test('should show zero-match empty state when search finds no books and restore on 1-click reset', async ({
    page,
  }) => {
    const searchInput = page.getByRole('textbox', {
      name: 'Buscar en la biblioteca',
    });

    await searchInput.fill('LibroInexistenteXYZ123');

    // Zero-match empty state appears
    await expect(page.getByRole('heading', { name: 'No se encontraron libros' })).toBeVisible();
    await expect(
      page.getByText('No hay libros que coincidan con los criterios de búsqueda')
    ).toBeVisible();

    const resetFiltersBtn = page.getByRole('button', { name: 'Restablecer filtros' });
    await expect(resetFiltersBtn).toBeVisible();

    // Click reset filters
    await resetFiltersBtn.click();

    // All books restored and search cleared
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('app-book-detailed-card')).toHaveCount(5);
    await expect(page.getByRole('heading', { name: 'No se encontraron libros' })).toBeHidden();
  });

  test('should preserve zero horizontal overflow on mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/books');
    await page.waitForSelector('app-catalog-toolbar');

    // Verify zero horizontal overflow in Detailed mode
    const detailedOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(detailedOverflow.scrollWidth).toBeLessThanOrEqual(detailedOverflow.innerWidth);

    // Switch to Grid mode on mobile
    await page.getByRole('button', { name: 'Vista de cuadrícula' }).click();
    const gridOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(gridOverflow.scrollWidth).toBeLessThanOrEqual(gridOverflow.innerWidth);

    // Switch to Compact mode on mobile
    await page.getByRole('button', { name: 'Vista compacta' }).click();
    const compactOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(compactOverflow.scrollWidth).toBeLessThanOrEqual(compactOverflow.innerWidth);
  });
});
