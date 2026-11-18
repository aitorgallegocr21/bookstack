import { deflateSync } from 'node:zlib';
import { expect, Page, test } from '@playwright/test';
import { Book, ReadingLog } from '../../src/app/features/books/models/book.model';

const SAMPLE_BASE64_COVER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createSolidPngBuffer(width: number, height: number): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB

  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = 79;
      raw[px + 1] = 70;
      raw[px + 2] = 229;
    }
  }

  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

async function seedLibrary(page: Page, books: Book[], logs: ReadingLog[]): Promise<void> {
  await page.goto('/settings');
  await page.evaluate(
    async ({ bookList, logList }) => {
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
          const storeNames: string[] = [];
          if (db.objectStoreNames.contains('books')) storeNames.push('books');
          if (db.objectStoreNames.contains('readingLogs')) storeNames.push('readingLogs');
          const tx = db.transaction(storeNames, 'readwrite');
          if (db.objectStoreNames.contains('books')) {
            const bookStore = tx.objectStore('books');
            bookStore.clear();
            for (const b of bookList) {
              bookStore.put(b);
            }
          }
          if (db.objectStoreNames.contains('readingLogs')) {
            const logStore = tx.objectStore('readingLogs');
            logStore.clear();
            for (const l of logList) {
              logStore.put(l);
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
    { bookList: books, logList: logs }
  );
  await page.reload();
}

test.describe('Settings, Data Portability & Backup Engine (/settings)', () => {
  test('updates language, theme, and default catalog view mode and persists across routes', async ({
    page,
  }) => {
    await seedLibrary(
      page,
      [
        {
          id: 'pref-book-1',
          title: 'Elantris',
          author: 'Brandon Sanderson',
          totalPages: 600,
          currentPage: 150,
          status: 'reading',
          format: 'Físico',
          createdAt: '2026-01-10T10:00:00.000Z',
          updatedAt: '2026-01-10T10:00:00.000Z',
        },
      ],
      []
    );

    await expect(page.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeVisible();

    // Switch language to English and verify reactive heading
    await page.locator('#settings-language').selectOption('en');
    await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible();

    // Switch back to Spanish
    await page.locator('#settings-language').selectOption('es');
    await expect(page.getByRole('heading', { level: 1, name: 'Ajustes' })).toBeVisible();

    // Toggle dark theme and verify root class
    await page.getByTestId('theme-dark-btn').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Change default catalog view to compact
    await page.locator('#settings-default-view').selectOption('compact');

    // Navigate to /books and verify compact view + dark theme persist
    await page.goto('/books');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.locator('app-book-compact-row')).toHaveCount(1);
    await expect(page.getByText('Elantris')).toBeVisible();
  });

  test('displays non-zero storage quota breakdown for seeded books, Base64 cover, and logs', async ({
    page,
  }) => {
    const books: Book[] = [
      {
        id: 'quota-book-1',
        title: 'Dune',
        author: 'Frank Herbert',
        totalPages: 500,
        currentPage: 250,
        status: 'reading',
        format: 'Físico',
        coverUrl: SAMPLE_BASE64_COVER,
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-02-01T10:00:00.000Z',
      },
    ];
    const logs: ReadingLog[] = [
      {
        id: 'quota-log-1',
        bookId: 'quota-book-1',
        date: '2026-02-02T19:00:00.000Z',
        pagesRead: 50,
        timeSpentMinutes: 45,
        createdAt: '2026-02-02T19:00:00.000Z',
      },
    ];

    await seedLibrary(page, books, logs);

    await expect(page.getByTestId('storage-total-used')).not.toHaveText(/^0 B$/);
    await expect(page.getByTestId('storage-card-metadata')).toContainText('1');
    await expect(page.getByTestId('storage-card-covers')).toContainText('1');
    await expect(page.getByTestId('storage-card-logs')).toContainText('1');
  });

  test('imports JSON backup with Merge mode and CSV catalog with Overwrite mode', async ({
    page,
  }) => {
    await seedLibrary(
      page,
      [
        {
          id: 'existing-book-1',
          title: 'Libro Existente',
          author: 'Autor Uno',
          totalPages: 200,
          currentPage: 50,
          status: 'reading',
          createdAt: '2026-01-01T10:00:00.000Z',
          updatedAt: '2026-01-01T10:00:00.000Z',
        },
      ],
      []
    );

    const jsonBackup = {
      schemaVersion: 1,
      app: 'BookStack',
      exportedAt: '2026-03-01T12:00:00.000Z',
      books: [
        {
          id: 'imported-json-1',
          title: 'Fundación',
          author: 'Isaac Asimov',
          totalPages: 320,
          currentPage: 320,
          status: 'completed',
          format: 'Ebook',
          rating: 9,
          createdAt: '2026-03-01T12:00:00.000Z',
          updatedAt: '2026-03-01T12:00:00.000Z',
        },
      ],
      readingLogs: [
        {
          id: 'imported-log-1',
          bookId: 'imported-json-1',
          date: '2026-03-01T12:00:00.000Z',
          pagesRead: 120,
          createdAt: '2026-03-01T12:00:00.000Z',
        },
      ],
    };

    // 1. Upload JSON and Merge
    await page.getByTestId('import-file-input').setInputFiles({
      name: 'bookstack-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(jsonBackup), 'utf-8'),
    });

    await expect(page.getByTestId('import-preview-panel')).toBeVisible();
    await expect(page.getByTestId('import-preview-format')).toContainText(/json/i);
    await page.getByTestId('import-mode-merge').click();
    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('portability-status-banner')).toBeVisible();

    await page.goto('/books');
    await expect(page.getByText('Libro Existente')).toBeVisible();
    await expect(page.getByText('Fundación')).toBeVisible();

    // 2. Upload CSV and Overwrite
    await page.goto('/settings');
    const csvContent = [
      'id,title,author,totalPages,currentPage,status,format,rating',
      'csv-book-1,Neuromante,William Gibson,271,271,completed,Físico,8.5',
    ].join('\n');

    await page.getByTestId('import-file-input').setInputFiles({
      name: 'catalog.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent, 'utf-8'),
    });

    await expect(page.getByTestId('import-preview-panel')).toBeVisible();
    await expect(page.getByTestId('import-preview-format')).toContainText(/csv/i);
    await page.getByTestId('import-mode-overwrite').click();
    await expect(page.getByTestId('import-overwrite-warning')).toBeVisible();
    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('portability-status-banner')).toBeVisible();

    await page.goto('/books');
    await expect(page.getByText('Neuromante')).toBeVisible();
    await expect(page.getByText('Libro Existente')).toHaveCount(0);
    await expect(page.getByText('Fundación')).toHaveCount(0);
  });

  test('executes Danger Zone session reset (with Escape check) and full factory reset', async ({
    page,
  }) => {
    await seedLibrary(
      page,
      [
        {
          id: 'danger-book-1',
          title: 'Solaris',
          author: 'Stanislaw Lem',
          totalPages: 240,
          currentPage: 100,
          status: 'reading',
          createdAt: '2026-01-01T10:00:00.000Z',
          updatedAt: '2026-01-01T10:00:00.000Z',
        },
      ],
      [
        {
          id: 'danger-log-1',
          bookId: 'danger-book-1',
          date: '2026-01-02T10:00:00.000Z',
          pagesRead: 40,
          createdAt: '2026-01-02T10:00:00.000Z',
        },
      ]
    );

    // Open Clear Reading Sessions modal and verify Escape closes it
    await page.getByTestId('reset-sessions-btn').click();
    await expect(page.getByTestId('danger-reset-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('danger-reset-modal')).toHaveCount(0);

    // Reopen and confirm session deletion
    await page.getByTestId('reset-sessions-btn').click();
    await page.getByTestId('confirm-danger-reset-btn').click();
    await expect(page.getByTestId('danger-reset-modal')).toHaveCount(0);
    await expect(page.getByTestId('danger-zone-status-banner')).toBeVisible();
    await expect(page.getByTestId('storage-card-metadata')).toContainText('1 libros');
    await expect(page.getByTestId('storage-card-logs')).toContainText('0 sesiones');

    // Open Factory Reset modal and confirm full wipe
    await page.getByTestId('factory-reset-btn').click();
    await expect(page.getByTestId('danger-reset-modal')).toBeVisible();
    await page.getByTestId('confirm-danger-reset-btn').click();
    await expect(page.getByTestId('danger-reset-modal')).toHaveCount(0);
    await expect(page.getByTestId('danger-zone-status-banner')).toBeVisible();
    await expect(page.getByTestId('storage-card-metadata')).toContainText('0 libros');

    await page.goto('/books');
    await expect(page.getByText('Solaris')).toHaveCount(0);
  });

  test('has zero CSP console violations and zero horizontal overflow across 320px-1280px', async ({
    page,
  }) => {
    const cspErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /content security policy|csp|violated/i.test(msg.text())) {
        cspErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      if (/content security policy|csp/i.test(err.message)) {
        cspErrors.push(err.message);
      }
    });

    const viewports = [
      { width: 320, height: 640 },
      { width: 375, height: 812 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/settings');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow, `Horizontal overflow detected at ${vp.width}px`).toBe(false);

      // Verify vertical spacing (>= 20px) between all 5 settings cards
      const cards = page.locator('app-settings-page section');
      await expect(cards).toHaveCount(5);
      const cardBoxes = await Promise.all(
        [0, 1, 2, 3, 4].map(async (index) => {
          const box = await cards.nth(index).boundingBox();
          expect(box, `Card ${index} boundingBox missing at ${vp.width}px`).not.toBeNull();
          return box!;
        })
      );
      for (let i = 1; i < cardBoxes.length; i++) {
        const gap = cardBoxes[i].y - (cardBoxes[i - 1].y + cardBoxes[i - 1].height);
        expect(
          gap,
          `Card ${i - 1} -> ${i} vertical gap too small at ${vp.width}px`
        ).toBeGreaterThanOrEqual(20);
      }

      // Verify all 3 interface preference controls share exact 44px height
      const languageControl = page.locator('#settings-language');
      const themeControl = page.locator('[role="group"][aria-labelledby="settings-theme-label"]');
      const viewControl = page.locator('#settings-default-view');
      const controlBoxes = await Promise.all([
        languageControl.boundingBox(),
        themeControl.boundingBox(),
        viewControl.boundingBox(),
      ]);
      for (const box of controlBoxes) {
        expect(box).not.toBeNull();
        expect(
          Math.abs(box!.height - 44),
          `Control height ${box!.height}px != 44px at ${vp.width}px`
        ).toBeLessThanOrEqual(1);
      }

      // On tablet/desktop multi-column layout, verify single-line labels & aligned controls
      if (vp.width >= 768) {
        const labels = page.locator('app-settings-preferences-section .field-label');
        await expect(labels).toHaveCount(3);
        const labelBoxes = await Promise.all(
          [0, 1, 2].map(async (index) => {
            const box = await labels.nth(index).boundingBox();
            expect(box).not.toBeNull();
            return box!;
          })
        );
        const baseLabelY = labelBoxes[0].y;
        const baseLabelHeight = labelBoxes[0].height;
        for (let i = 1; i < labelBoxes.length; i++) {
          expect(Math.abs(labelBoxes[i].y - baseLabelY)).toBeLessThanOrEqual(1);
          expect(Math.abs(labelBoxes[i].height - baseLabelHeight)).toBeLessThanOrEqual(1);
        }

        const baseControlY = controlBoxes[0]!.y;
        for (let i = 1; i < controlBoxes.length; i++) {
          expect(Math.abs(controlBoxes[i]!.y - baseControlY)).toBeLessThanOrEqual(1);
        }
      }
    }

    expect(cspErrors).toEqual([]);
  });

  test('enriches missing covers post-import via strict ISBN queue, verification report, and visual assistant', async ({
    page,
  }) => {
    const validPng = createSolidPngBuffer(100, 150);

    await page.route('https://openlibrary.org/api/books**', async (route) => {
      const url = route.request().url();
      const body = url.includes('9780141036144')
        ? {
            'ISBN:9780141036144': {
              title: '1984',
              authors: [{ name: 'George Orwell' }],
              cover: { large: 'https://covers.openlibrary.org/b/id/1001-L.jpg' },
            },
          }
        : {};
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    await page.route('https://openlibrary.org/search.json**', async (route) => {
      const url = decodeURIComponent(route.request().url());
      if (url.includes('El imperio final')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            docs: [
              {
                key: '/works/OL100W',
                title: 'The Final Empire',
                author_name: ['Brandon Sanderson'],
                cover_i: 2002,
                first_publish_year: 2006,
                publisher: ['Tor Books'],
              },
            ],
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          docs: [
            {
              key: '/works/OL46125W',
              title: 'Foundation',
              author_name: ['Isaac Asimov'],
              cover_i: 2002,
              first_publish_year: 1951,
              publisher: ['Gnome Press'],
            },
            {
              key: '/works/OL46126W',
              title: 'Foundation (Collector Edition)',
              author_name: ['Isaac Asimov'],
              cover_i: 2003,
              first_publish_year: 1991,
              publisher: ['Bantam'],
            },
          ],
        }),
      });
    });

    await page.route('https://www.googleapis.com/books/v1/volumes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.route('https://covers.openlibrary.org/**', async (route) => {
      const url = route.request().url();
      if (
        !url.includes('1001-L.jpg') &&
        !url.includes('2002-L.jpg') &&
        !url.includes('2003-L.jpg')
      ) {
        await route.fulfill({ status: 404 });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: validPng,
      });
    });

    await seedLibrary(page, [], []);

    const backupPayload = {
      schemaVersion: 1,
      app: 'BookStack',
      exportedAt: '2026-03-01T12:00:00.000Z',
      books: [
        {
          id: 'enrich-isbn-book',
          title: '1984',
          author: 'George Orwell',
          isbn: '9780141036144',
          totalPages: 328,
          currentPage: 0,
          status: 'pending',
          createdAt: '2026-03-01T12:00:00.000Z',
          updatedAt: '2026-03-01T12:00:00.000Z',
        },
        {
          id: 'enrich-single-cover-book',
          title: 'El imperio final',
          author: 'Brandon Sanderson',
          totalPages: 672,
          currentPage: 0,
          status: 'pending',
          createdAt: '2026-03-01T12:00:00.000Z',
          updatedAt: '2026-03-01T12:00:00.000Z',
        },
        {
          id: 'enrich-unmatched-isbn-book',
          title: 'Foundation',
          author: 'Isaac Asimov',
          isbn: '9780553293357',
          totalPages: 255,
          currentPage: 0,
          status: 'pending',
          createdAt: '2026-03-01T12:00:00.000Z',
          updatedAt: '2026-03-01T12:00:00.000Z',
        },
      ],
      readingLogs: [],
    };

    await page.getByTestId('import-file-input').setInputFiles({
      name: 'missing-covers-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backupPayload), 'utf-8'),
    });

    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('post-import-cover-enrichment-callout')).toBeVisible();
    await page.getByTestId('post-import-enrich-covers-btn').click();

    await expect(page.getByTestId('missing-with-isbn-badge')).toContainText('2');

    // Run automated strict ISBN enrichment (1984 succeeds, Foundation is skipped)
    await page.getByTestId('start-isbn-enrichment-btn').click();
    await expect(page.getByTestId('missing-with-isbn-badge')).toContainText('1');

    // Verify skipped/unmatched report lists Foundation
    await expect(page.getByTestId('toggle-enrichment-report-btn')).toBeVisible();
    await page.getByTestId('toggle-enrichment-report-btn').click();
    await expect(page.getByTestId('enrichment-skipped-report')).toContainText('Foundation');

    // Resolve remaining book via Step-by-Step Visual Cover Assistant
    await page.getByTestId('start-visual-assistant-btn').click();
    await expect(page.getByTestId('visual-assistant-card')).toBeVisible();
    await expect(page.getByTestId('visual-assistant-card')).toContainText('Foundation');
    await page.getByTestId('visual-assistant-select-btn').first().click();

    await expect(page.getByTestId('cover-enrichment-all-complete')).toBeVisible();

    // Verify 320px mobile layout has zero horizontal overflow
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/settings');
    await expect(page.getByTestId('cover-enrichment-all-complete')).toBeVisible();
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });
});
