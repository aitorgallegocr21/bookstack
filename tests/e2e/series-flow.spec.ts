import { expect, Page, test } from '@playwright/test';
import * as fs from 'node:fs/promises';
import { Book, ReadingLog } from '../../src/app/features/books/models/book.model';
import { SeriesMetadata } from '../../src/app/features/series/models/series.model';

async function seedSeriesLibrary(
  page: Page,
  books: Book[],
  logs: ReadingLog[] = [],
  seriesMetadata: SeriesMetadata[] = []
): Promise<void> {
  await page.goto('/series');
  await page.evaluate(
    async ({ bookList, logList, metaList }) => {
      return new Promise<void>((resolve, reject) => {
        const openReq = indexedDB.open('bookstackDB', 2);
        openReq.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('books')) {
            db.createObjectStore('books', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('readingLogs')) {
            db.createObjectStore('readingLogs', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('seriesMetadata')) {
            db.createObjectStore('seriesMetadata', { keyPath: 'id' });
          }
        };
        openReq.onerror = () => reject(openReq.error);
        openReq.onsuccess = () => {
          const db = openReq.result;
          const storeNames = ['books', 'readingLogs', 'seriesMetadata'].filter((s) =>
            db.objectStoreNames.contains(s)
          );
          const tx = db.transaction(storeNames, 'readwrite');
          if (db.objectStoreNames.contains('books')) {
            const store = tx.objectStore('books');
            store.clear();
            for (const item of bookList) {
              store.put(item);
            }
          }
          if (db.objectStoreNames.contains('readingLogs')) {
            const store = tx.objectStore('readingLogs');
            store.clear();
            for (const item of logList) {
              store.put(item);
            }
          }
          if (db.objectStoreNames.contains('seriesMetadata')) {
            const store = tx.objectStore('seriesMetadata');
            store.clear();
            for (const item of metaList) {
              store.put(item);
            }
          }
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      });
    },
    { bookList: books, logList: logs, metaList: seriesMetadata }
  );
  await page.reload();
}

function makeSeedBook(overrides: Partial<Book>): Book {
  return {
    id: overrides.id ?? 'seed-1',
    title: overrides.title ?? 'Libro',
    author: overrides.author ?? 'Autor',
    status: overrides.status ?? 'pending',
    totalPages: overrides.totalPages ?? 300,
    currentPage: overrides.currentPage ?? 0,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-02T10:00:00.000Z',
    ...overrides,
  };
}

test.describe('Sagas, Series & Collections (/series)', () => {
  test('Scenario 1: creates books with series autocomplete and navigates to /series via sidebar', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/books');

    // Create Vol 1
    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-modal-title')).toBeVisible();
    await page.locator('#create-book-title').fill('El imperio final');
    await page.locator('#create-book-author').fill('Brandon Sanderson');
    await page.locator('#create-book-total-pages').fill('600');
    await page.locator('label[for="create-book-series-enabled"]').click();
    await page.locator('#create-book-series-name').fill('Nacidos de la bruma');
    await page.locator('#create-book-series-volume').fill('1');
    await page.getByRole('button', { name: 'Añadir libro', exact: true }).click();
    await expect(page.locator('#create-modal-title')).toBeHidden();

    // Create Vol 2 using quick-pick autocomplete button
    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-modal-title')).toBeVisible();
    await page.locator('#create-book-title').fill('El pozo de la ascensión');
    await page.locator('#create-book-author').fill('Brandon Sanderson');
    await page.locator('#create-book-total-pages').fill('700');
    await page.locator('label[for="create-book-series-enabled"]').click();
    await page.getByRole('button', { name: /Nacidos de la bruma/ }).click();
    await expect(page.locator('#create-book-series-name')).toHaveValue('Nacidos de la bruma');
    await expect(page.locator('#create-book-series-volume')).toHaveValue('2');
    await page.getByRole('button', { name: 'Añadir libro', exact: true }).click();
    await expect(page.locator('#create-modal-title')).toBeHidden();

    // Navigate to /series via desktop sidebar
    await page.locator('aside').getByRole('link', { name: 'Sagas' }).click();
    await expect(page).toHaveURL(/\/series$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Sagas y Series' })).toBeVisible();
    await expect(page.getByText('Nacidos de la bruma')).toBeVisible();
    await expect(page.getByText('2 volúmenes', { exact: true })).toBeVisible();
  });

  test('Scenario 2: renders variable-scale Bento gallery on desktop and zero-overflow segmented switcher on 375px mobile', async ({
    page,
  }) => {
    const books: Book[] = [
      // Compact (2 vols)
      makeSeedBook({
        id: 'c1',
        title: 'Dune',
        author: 'Frank Herbert',
        series: { id: 's-compact', name: 'Crónicas de Dune', volumeNumber: 1 },
      }),
      makeSeedBook({
        id: 'c2',
        title: 'El mesías de Dune',
        author: 'Frank Herbert',
        series: { id: 's-compact', name: 'Crónicas de Dune', volumeNumber: 2 },
      }),
      // Medium (4 vols)
      ...[1, 2, 3, 4].map((vol) =>
        makeSeedBook({
          id: `m${vol}`,
          title: `Fundación ${vol}`,
          author: 'Isaac Asimov',
          series: { id: 's-medium', name: 'Saga de la Fundación', volumeNumber: vol },
        })
      ),
      // Showcase (6 vols)
      ...[1, 2, 3, 4, 5, 6].map((vol) =>
        makeSeedBook({
          id: `sh${vol}`,
          title: `Mundodisco ${vol}`,
          author: 'Terry Pratchett',
          series: { id: 's-showcase', name: 'Mundodisco', volumeNumber: vol },
        })
      ),
    ];

    await page.setViewportSize({ width: 1280, height: 800 });
    await seedSeriesLibrary(page, books);

    const cards = page.locator('app-saga-bento-card');
    await expect(cards).toHaveCount(3);

    const cardClasses = await cards.evaluateAll((els) => els.map((el) => el.className));
    expect(cardClasses.some((c) => c.includes('lg:col-span-4'))).toBe(true);
    expect(
      cardClasses.some((c) => c.includes('lg:col-span-8') && !c.includes('md:row-span-2'))
    ).toBe(true);
    expect(cardClasses.some((c) => c.includes('md:row-span-2'))).toBe(true);

    // Switch to 375px mobile viewport and test segmented switcher + overflow safety
    await page.setViewportSize({ width: 375, height: 812 });
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasHorizontalOverflow).toBe(false);

    const mobileSwitcher = page.getByRole('navigation', { name: 'Menú principal' });
    await expect(mobileSwitcher).toBeVisible();
    await mobileSwitcher.getByRole('link', { name: 'Libros' }).click();
    await expect(page).toHaveURL(/\/books$/);

    await page
      .getByRole('navigation', { name: 'Menú principal' })
      .getByRole('link', { name: 'Sagas' })
      .click();
    await expect(page).toHaveURL(/\/series$/);
  });

  test('Scenario 3: filters by missing volumes, searches, sorts, and resets filters', async ({
    page,
  }) => {
    const books: Book[] = [
      makeSeedBook({
        id: 'g1',
        title: 'El nombre del viento',
        author: 'Patrick Rothfuss',
        status: 'completed',
        currentPage: 800,
        totalPages: 800,
        series: { id: 's-kkc', name: 'Crónica del Asesino de Reyes', volumeNumber: 1 },
      }),
      makeSeedBook({
        id: 'g3',
        title: 'Las puertas de piedra',
        author: 'Patrick Rothfuss',
        status: 'pending',
        series: { id: 's-kkc', name: 'Crónica del Asesino de Reyes', volumeNumber: 3 },
      }),
      makeSeedBook({
        id: 'ok1',
        title: 'La comunidad del anillo',
        author: 'J.R.R. Tolkien',
        status: 'reading',
        currentPage: 150,
        totalPages: 450,
        series: { id: 's-lotr', name: 'El Señor de los Anillos', volumeNumber: 1 },
      }),
    ];

    await page.setViewportSize({ width: 1280, height: 800 });
    await seedSeriesLibrary(page, books);

    await expect(page.locator('app-saga-bento-card')).toHaveCount(2);

    // Filter by Con volúmenes faltantes
    await page.getByRole('tab', { name: /Con volúmenes faltantes/ }).click();
    await expect(page.locator('app-saga-bento-card')).toHaveCount(1);
    await expect(page.getByText('Crónica del Asesino de Reyes')).toBeVisible();

    // Search for non-matching query -> zero-match state -> reset
    const searchInput = page.getByRole('textbox', { name: 'Buscar sagas' });
    await searchInput.fill('Inexistente');
    await expect(page.getByText('Ninguna saga coincide con los filtros')).toBeVisible();

    await page.getByRole('button', { name: 'Restablecer filtros' }).last().click();
    await expect(page.locator('app-saga-bento-card')).toHaveCount(2);

    // Sort by title-asc
    await page.getByLabel('Ordenar sagas').selectOption('title-asc');
    const firstCardTitle = await page.locator('app-saga-bento-card h2').first().textContent();
    expect(firstCardTitle?.trim()).toBe('Crónica del Asesino de Reyes');
  });

  test('Scenario 4: opens Saga Detail Modal, sets expectedVolumes, fills ghost slot, and links standalone book', async ({
    page,
  }) => {
    const books: Book[] = [
      makeSeedBook({
        id: 'b-vol1',
        title: 'El imperio final',
        author: 'Brandon Sanderson',
        status: 'completed',
        currentPage: 600,
        totalPages: 600,
        series: { id: 's-mistborn', name: 'Nacidos de la bruma', volumeNumber: 1 },
      }),
      makeSeedBook({
        id: 'b-standalone',
        title: 'Elantris',
        author: 'Brandon Sanderson',
        status: 'pending',
        totalPages: 650,
      }),
    ];

    await page.setViewportSize({ width: 1280, height: 800 });
    await seedSeriesLibrary(page, books);

    await page.getByRole('button', { name: /Abrir detalles de la saga/ }).click();
    const modal = page.locator('app-saga-detail-modal .modal-panel');
    await expect(modal).toBeVisible();

    // Edit expectedVolumes to 3
    await modal.getByRole('button', { name: 'Metadatos de la colección' }).click();
    await modal.locator('#saga-edit-expected').fill('3');
    await modal.getByRole('button', { name: 'Guardar saga' }).click();

    // Ghost slot Vol. 2 should appear
    const addVol2Btn = modal.getByRole('button', { name: '+ Añadir Vol. 2' });
    await expect(addVol2Btn).toBeVisible();
    await addVol2Btn.click();

    // BookCreateModal opens prefilled
    await expect(page.locator('#create-modal-title')).toBeVisible();
    await expect(page.locator('#create-book-series-name')).toHaveValue('Nacidos de la bruma');
    await expect(page.locator('#create-book-series-volume')).toHaveValue('2');

    await page.locator('#create-book-title').fill('El pozo de la ascensión');
    await page.locator('#create-book-author').fill('Brandon Sanderson');
    await page.locator('#create-book-total-pages').fill('700');
    await page.getByRole('button', { name: 'Añadir libro', exact: true }).click();
    await expect(page.locator('#create-modal-title')).toBeHidden();

    // Ghost slot Vol. 2 should be resolved into owned book
    await expect(modal.getByText('El pozo de la ascensión')).toBeVisible();
    await expect(modal.getByRole('button', { name: '+ Añadir Vol. 2' })).toHaveCount(0);

    // Link standalone book via Bulk Linker
    await modal.getByRole('button', { name: 'Vincular libros existentes' }).click();
    await expect(modal.getByText('Elantris')).toBeVisible();
    await modal.getByRole('button', { name: 'Vincular', exact: true }).click();
    await expect(modal.getByText('3 libros en esta saga')).toBeVisible();
  });

  test('Scenario 5: exports JSON backup with seriesMetadata, factory resets, and restores intact', async ({
    page,
  }) => {
    const books: Book[] = [
      makeSeedBook({
        id: 'bk-1',
        title: 'El ojo del mundo',
        author: 'Robert Jordan',
        series: { id: 's-wot', name: 'La Rueda del Tiempo', volumeNumber: 1 },
      }),
    ];
    const metadata: SeriesMetadata[] = [
      {
        id: 's-wot',
        normalizedKey: 'la rueda del tiempo',
        name: 'La Rueda del Tiempo',
        expectedVolumes: 14,
        publicationStatus: 'completed',
        notes: 'Fantasía épica clásica',
        createdAt: '2026-01-01T10:00:00.000Z',
        updatedAt: '2026-01-02T10:00:00.000Z',
      },
    ];

    await page.setViewportSize({ width: 1280, height: 800 });
    await seedSeriesLibrary(page, books, [], metadata);

    // Export JSON backup from /settings
    await page.goto('/settings');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('export-json-btn').click(),
    ]);
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const exportedJson = await fs.readFile(downloadPath as string, 'utf-8');
    const parsed = JSON.parse(exportedJson) as { seriesMetadata?: SeriesMetadata[] };
    expect(parsed.seriesMetadata?.length).toBe(1);
    expect(parsed.seriesMetadata?.[0]?.expectedVolumes).toBe(14);

    // Factory reset
    await page.getByTestId('factory-reset-btn').click();
    await page.getByTestId('confirm-danger-reset-btn').click();
    await expect(page.getByTestId('danger-zone-status-banner')).toBeVisible();

    // Re-import the exported JSON backup
    await page.getByTestId('import-file-input').setInputFiles({
      name: 'bookstack-series-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedJson, 'utf-8'),
    });
    await expect(page.getByTestId('import-preview-panel')).toBeVisible();
    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('portability-status-banner')).toBeVisible();

    // Verify metadata restored in /series
    await page.goto('/series');
    await expect(page.getByText('La Rueda del Tiempo')).toBeVisible();
    await page.getByRole('button', { name: /Abrir detalles de la saga/ }).click();
    const modal = page.locator('app-saga-detail-modal .modal-panel');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Finalizada')).toBeVisible();
    await expect(modal.getByText('Fantasía épica clásica')).toBeVisible();
    await expect(modal.getByText('de 14')).toBeVisible();
  });
});
