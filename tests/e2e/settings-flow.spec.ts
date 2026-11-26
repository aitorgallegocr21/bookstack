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

async function seedLibrary(
  page: Page,
  books: Book[],
  logs: ReadingLog[],
  tab: 'general' | 'catalog' | 'data' | 'privacy' | 'advanced' = 'general'
): Promise<void> {
  await page.goto(tab === 'general' ? '/settings' : `/settings?tab=${tab}`);
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

    // Switch to Catalog & Reading tab and change default catalog view to compact
    await page.getByTestId('settings-tab-catalog').click();
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

    await seedLibrary(page, books, logs, 'data');

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
      [],
      'data'
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
    const autoEnrichCheckbox = page.getByTestId('import-auto-enrich-checkbox');
    if (await autoEnrichCheckbox.isChecked()) {
      await autoEnrichCheckbox.uncheck();
    }
    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('portability-status-banner')).toBeVisible();

    await page.goto('/books');
    await expect(page.getByText('Libro Existente')).toBeVisible();
    await expect(page.getByText('Fundación')).toBeVisible();

    // 2. Upload CSV and Overwrite
    await page.goto('/settings?tab=data');
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
    if (await autoEnrichCheckbox.isChecked()) {
      await autoEnrichCheckbox.uncheck();
    }
    await page.getByTestId('confirm-import-btn').click();
    const overwriteConfirmDialog = page.locator('app-confirm-dialog [role="alertdialog"]');
    await expect(overwriteConfirmDialog).toBeVisible();
    await overwriteConfirmDialog.locator('button').last().click();
    await expect(overwriteConfirmDialog).toBeHidden();
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
      ],
      'advanced'
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

    await page.goto('/settings?tab=data');
    await expect(page.getByTestId('storage-card-metadata')).toContainText('1 libros');
    await expect(page.getByTestId('storage-card-logs')).toContainText('0 sesiones');

    // Open Factory Reset modal and confirm full wipe
    await page.goto('/settings?tab=advanced');
    await page.getByTestId('factory-reset-btn').click();
    await expect(page.getByTestId('danger-reset-modal')).toBeVisible();
    await page.getByTestId('confirm-danger-reset-btn').click();
    await expect(page.getByTestId('danger-reset-modal')).toHaveCount(0);
    await expect(page.getByTestId('danger-zone-status-banner')).toBeVisible();

    await page.goto('/settings?tab=data');
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

    const tabIds = ['general', 'catalog', 'data', 'privacy', 'advanced'] as const;

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/settings');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const tabTestIdPrefix = vp.width < 1024 ? 'settings-mobile-tab-' : 'settings-tab-';
      for (const tabId of tabIds) {
        if (tabId !== 'general') {
          await page.getByTestId(`${tabTestIdPrefix}${tabId}`).click();
        }
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasOverflow, `Horizontal overflow detected on tab=${tabId} at ${vp.width}px`).toBe(
          false
        );
      }

      // Verify vertical spacing (>= 20px) between top-level cards on ?tab=data
      await page.getByTestId(`${tabTestIdPrefix}data`).click();
      const dataCards = page.locator(
        'app-storage-quota-inspector > section, app-data-portability-section > section, app-cover-enrichment-section > section, app-data-health-section > section, [data-testid="data-danger-zone-card"]'
      );
      await expect(dataCards).toHaveCount(5);
      const cardBoxes = await Promise.all(
        [0, 1, 2, 3, 4].map(async (index) => {
          const box = await dataCards.nth(index).boundingBox();
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

      // Verify interface preference controls on General tab share exact 44px height
      await page.getByTestId(`${tabTestIdPrefix}general`).click();
      const languageControl = page.locator('#settings-language');
      const themeControl = page.locator('[role="group"][aria-labelledby="settings-theme-label"]');
      const controlBoxes = await Promise.all([
        languageControl.boundingBox(),
        themeControl.boundingBox(),
      ]);
      for (const box of controlBoxes) {
        expect(box).not.toBeNull();
        expect(
          Math.abs(box!.height - 44),
          `Control height ${box!.height}px != 44px at ${vp.width}px`
        ).toBeLessThanOrEqual(1);
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
      if (url.includes('Crimen y castigo')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            docs: [
              {
                key: '/works/OL100W',
                title: 'Crime and Punishment',
                author_name: ['Fyodor Dostoevsky'],
                cover_i: 2002,
                first_publish_year: 1866,
                publisher: ['Penguin Classics'],
              },
            ],
          }),
        });
        return;
      }

      if (url.includes('Libro Sin Portada')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ docs: [] }),
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

    await page.route('https://openlibrary.org/works/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ entries: [] }),
      });
    });

    await page.route('https://query.wikidata.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: { bindings: [] } }),
      });
    });

    await page.route('https://itunes.apple.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      });
    });

    await page.route('https://archive.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: { docs: [] } }),
      });
    });

    await page.route('https://api.crossref.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: { items: [] } }),
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

    await seedLibrary(page, [], [], 'data');

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
          title: 'Crimen y castigo',
          author: 'Fiódor Dostoyevski',
          totalPages: 672,
          currentPage: 0,
          status: 'pending',
          createdAt: '2026-03-01T12:00:00.000Z',
          updatedAt: '2026-03-01T12:00:00.000Z',
        },
        {
          id: 'enrich-unmatched-isbn-book',
          title: 'Fundación',
          author: 'Isaac Asimov',
          isbn: '9780553293357',
          totalPages: 255,
          currentPage: 0,
          status: 'pending',
          createdAt: '2026-03-01T12:00:00.000Z',
          updatedAt: '2026-03-01T12:00:00.000Z',
        },
        {
          id: 'enrich-zero-cover-book',
          title: 'Libro Sin Portada',
          author: 'Autor Desconocido',
          totalPages: 180,
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

    const autoEnrichCheckbox = page.getByTestId('import-auto-enrich-checkbox');
    if (await autoEnrichCheckbox.isChecked()) {
      await autoEnrichCheckbox.uncheck();
    }
    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('post-import-cover-enrichment-callout')).toBeVisible();
    await page.getByTestId('post-import-enrich-covers-btn').click();

    await expect(page.getByTestId('missing-with-isbn-badge')).toContainText('2');
    await expect(page.getByTestId('missing-without-isbn-badge')).toContainText('2');

    // 1. Run automated strict ISBN enrichment (1984 succeeds, Fundación is skipped)
    await page.getByTestId('start-isbn-enrichment-btn').click();
    await expect(page.getByTestId('missing-with-isbn-badge')).toContainText('1');

    // Verify skipped/unmatched report lists Fundación
    await expect(page.getByTestId('toggle-enrichment-report-btn')).toBeVisible();
    await page.getByTestId('toggle-enrichment-report-btn').click();
    await expect(page.getByTestId('enrichment-skipped-report')).toContainText('Fundación');

    // 2. Run automated Title + Author search: Crimen y castigo (single cover) is applied directly
    await page.getByTestId('open-strict-title-search-btn').click();
    await page.getByTestId('confirm-strict-title-search-btn').click();
    await expect(page.getByTestId('missing-without-isbn-badge')).toContainText('1');
    await expect(page.getByTestId('missing-with-isbn-badge')).toContainText('1');

    // 3. Visual Assistant shows ONLY Fundación (2 covers), then summarizes Libro Sin Portada (0 covers)
    await page.getByTestId('start-visual-assistant-btn').click();
    await expect(page.getByTestId('visual-assistant-card')).toBeVisible();
    await expect(page.getByTestId('visual-assistant-card')).toContainText('Fundación');
    await page.getByTestId('visual-assistant-select-btn').first().click();

    await expect(page.getByTestId('visual-assistant-card')).toHaveCount(0);
    await expect(page.getByTestId('visual-assistant-not-found-card')).toBeVisible();
    await expect(page.getByTestId('visual-assistant-not-found-list')).toContainText(
      'Libro Sin Portada'
    );

    // Verify 320px mobile layout with not-found summary open has zero horizontal overflow
    await page.setViewportSize({ width: 320, height: 640 });
    await expect
      .poll(async () =>
        page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth
        )
      )
      .toBe(false);

    await page.getByTestId('visual-assistant-close-btn').click();
    await expect(page.getByTestId('visual-assistant-not-found-card')).toHaveCount(0);
  });

  test('imports flexible AI JSON missing id/totalPages/year/cover and auto-enriches metadata & cover on confirm', async ({
    page,
  }) => {
    const validPng = createSolidPngBuffer(100, 140);

    await page.route('https://openlibrary.org/api/books**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });

    await page.route('https://openlibrary.org/works/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ entries: [] }),
      });
    });

    await page.route('https://openlibrary.org/search.json**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          docs: [
            {
              key: '/works/OL1168083W',
              title: '1984',
              author_name: ['George Orwell'],
              cover_i: 1001,
              first_publish_year: 1949,
              number_of_pages_median: 328,
              publisher: ['Secker & Warburg'],
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

    await page.route('https://query.wikidata.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: { bindings: [] } }),
      });
    });

    await page.route('https://itunes.apple.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      });
    });

    await page.route('https://archive.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ response: { docs: [] } }),
      });
    });

    await page.route('https://api.crossref.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: { items: [] } }),
      });
    });

    await page.route('https://covers.openlibrary.org/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: validPng,
      });
    });

    await seedLibrary(page, [], [], 'data');

    // Flexible AI-generated JSON array missing id, totalPages (0), publicationYear, publisher, coverUrl
    const flexibleAiJson = [
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '9780141036144',
        totalPages: 0,
        status: 'pending',
      },
    ];

    await page.getByTestId('import-file-input').setInputFiles({
      name: 'ai-reading-list.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(flexibleAiJson), 'utf-8'),
    });

    await expect(page.getByTestId('import-preview-panel')).toBeVisible();
    await expect(page.getByTestId('import-preview-panel')).toContainText('1');
    await expect(page.getByTestId('import-auto-enrich-checkbox')).toBeChecked();

    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('portability-status-banner')).toBeVisible();

    // Wait for auto-enrichment to finish backfilling metadata & cover
    await expect(page.getByTestId('enrichment-metadata-updated-badge')).toBeVisible({
      timeout: 10000,
    });

    await page.goto('/books');
    await expect(
      page.getByRole('button', { name: 'Ver detalles: 1984', exact: true }).first()
    ).toBeVisible();
    await page.getByRole('button', { name: 'Ver detalles: 1984', exact: true }).first().click();

    const detailPanel = page.locator('app-book-detail-modal .modal-panel');
    await expect(detailPanel).toContainText('328');
    await expect(detailPanel).toContainText('1949');
    await expect(detailPanel).toContainText('Secker & Warburg');
    await expect(detailPanel.locator('img')).toBeVisible();
  });

  test('exports lightweight JSON and offline .ZIP bundle, then restores 100% offline from .ZIP', async ({
    page,
  }) => {
    const books: Book[] = [
      {
        id: 'zip-book-1',
        title: 'Elantris Offline',
        author: 'Brandon Sanderson',
        totalPages: 638,
        currentPage: 120,
        status: 'reading',
        format: 'Físico',
        publisher: 'Nova',
        publicationYear: 2005,
        genre: ['Fantasía'],
        coverUrl: SAMPLE_BASE64_COVER,
        createdAt: '2026-03-01T10:00:00.000Z',
        updatedAt: '2026-03-01T10:00:00.000Z',
      },
    ];
    const logs: ReadingLog[] = [
      {
        id: 'zip-log-1',
        bookId: 'zip-book-1',
        date: '2026-03-02T18:00:00.000Z',
        pagesRead: 40,
        timeSpentMinutes: 35,
        createdAt: '2026-03-02T18:00:00.000Z',
      },
    ];

    await seedLibrary(page, books, logs, 'data');

    // 1. Export Lightweight JSON
    const lightDownloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-json-light-btn').click();
    const lightDownload = await lightDownloadPromise;
    expect(lightDownload.suggestedFilename()).toMatch(/\.json$/i);

    // 2. Export Offline .ZIP Bundle
    const zipDownloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-zip-btn').click();
    const zipDownload = await zipDownloadPromise;
    expect(zipDownload.suggestedFilename()).toMatch(/\.zip$/i);

    const zipPath = await zipDownload.path();
    expect(zipPath).toBeTruthy();
    const { readFileSync } = await import('node:fs');
    const zipBuffer = readFileSync(zipPath!);

    // 3. Clear library completely and restore 100% offline from the exported .ZIP
    await seedLibrary(page, [], [], 'data');
    await page.getByTestId('import-file-input').setInputFiles({
      name: zipDownload.suggestedFilename(),
      mimeType: 'application/zip',
      buffer: zipBuffer,
    });

    await expect(page.getByTestId('import-preview-panel')).toBeVisible();
    await expect(page.getByTestId('import-preview-format')).toContainText(/zip/i);
    await page.getByTestId('import-mode-overwrite').click();
    const autoEnrichCheckbox = page.getByTestId('import-auto-enrich-checkbox');
    if (await autoEnrichCheckbox.isChecked()) {
      await autoEnrichCheckbox.uncheck();
    }
    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('portability-status-banner')).toBeVisible();

    await page.goto('/books');
    await expect(page.getByText('Elantris Offline')).toBeVisible();
    await page
      .getByRole('button', { name: 'Ver detalles: Elantris Offline', exact: true })
      .first()
      .click();
    const detailPanel = page.locator('app-book-detail-modal .modal-panel');
    await expect(detailPanel).toContainText('Nova');
    await expect(detailPanel).toContainText('2005');
    await expect(detailPanel.locator('img')).toBeVisible();
  });

  test('should detect anomalous 2925 year and completed-book page mismatch in Data Health Auditor and auto-fix to 100%', async ({
    page,
  }) => {
    const anomalousBooks: Book[] = [
      {
        id: 'health-anomalous-1',
        title: 'Crónica de 2925',
        author: 'Autor Ejemplo',
        totalPages: 320,
        currentPage: 0,
        status: 'completed',
        format: 'Físico',
        startDate: '2925-01-05',
        endDate: '2925-01-12',
        createdAt: '2026-01-10T10:00:00.000Z',
        updatedAt: '2026-01-10T10:00:00.000Z',
      },
    ];

    await page.setViewportSize({ width: 1280, height: 800 });
    await seedLibrary(page, anomalousBooks, [], 'data');

    const scoreBadge = page.getByTestId('data-health-score-badge');
    await expect(scoreBadge).toBeVisible();
    await expect(scoreBadge).not.toContainText('100% Saludable');

    const fixAllBtn = page.getByTestId('data-health-fix-all-btn');
    await expect(fixAllBtn).toBeVisible();
    await fixAllBtn.click();

    const confirmDialog = page.locator('app-confirm-dialog [role="alertdialog"]');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.locator('button').last().click();
    await expect(confirmDialog).toBeHidden();

    await expect(page.getByTestId('data-health-feedback')).toBeVisible();
    await expect(scoreBadge).toContainText('100% Saludable');
    await expect(page.getByTestId('data-health-healthy-state')).toBeVisible();
  });

  test('renders symmetric theme buttons, 5-column accent grid, and non-overlapping 4-edge dock controls on desktop & mobile', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/settings');

    // 1. Theme Mode buttons have equal widths (<= 1px variance)
    const themeIds = ['theme-light-btn', 'theme-dark-btn', 'theme-system-btn'] as const;
    const themeBoxes = await Promise.all(themeIds.map((id) => page.getByTestId(id).boundingBox()));
    for (const box of themeBoxes) {
      expect(box).not.toBeNull();
    }
    const themeWidths = themeBoxes.map((b) => b!.width);
    expect(Math.max(...themeWidths) - Math.min(...themeWidths)).toBeLessThanOrEqual(1);

    // 2. All 5 Accent Swatches align in a single 5-column row with equal widths
    const accentIds = [
      'accent-swatch-blue',
      'accent-swatch-indigo',
      'accent-swatch-emerald',
      'accent-swatch-amber',
      'accent-swatch-rose',
    ] as const;
    const accentBoxes = await Promise.all(
      accentIds.map((id) => page.getByTestId(id).boundingBox())
    );
    for (const box of accentBoxes) {
      expect(box).not.toBeNull();
    }
    const accentYs = accentBoxes.map((b) => b!.y);
    const accentWidths = accentBoxes.map((b) => b!.width);
    expect(Math.max(...accentYs) - Math.min(...accentYs)).toBeLessThanOrEqual(1);
    expect(Math.max(...accentWidths) - Math.min(...accentWidths)).toBeLessThanOrEqual(1);

    // 3. All 4 Desktop Dock buttons have zero bounding-box overlap and zero clipped text
    const dockPositions = ['left', 'right', 'top', 'bottom'] as const;
    const dockBoxes = await Promise.all(
      dockPositions.map((pos) => page.getByTestId(`dock-desktop-${pos}`).boundingBox())
    );
    for (let i = 0; i < dockPositions.length; i++) {
      const btn = page.getByTestId(`dock-desktop-${dockPositions[i]}`);
      const box = dockBoxes[i];
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      const isClipped = await btn.evaluate((el) => el.scrollWidth > el.clientWidth + 1);
      expect(isClipped).toBe(false);
    }
    for (let i = 0; i < dockBoxes.length - 1; i++) {
      const curr = dockBoxes[i]!;
      const next = dockBoxes[i + 1]!;
      expect(curr.x + curr.width).toBeLessThanOrEqual(next.x + 0.5);
    }

    // 4. Mobile 375px & 320px zero horizontal overflow
    for (const width of [375, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/settings');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasOverflow, `Horizontal overflow at ${width}px`).toBe(false);
    }
  });

  test('supports 5-tab master-detail navigation, URL ?tab= deep-link hydration, and instant settings search', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/settings');

    await page.getByTestId('settings-tab-privacy').click();
    await expect(page).toHaveURL(/\/settings\?tab=privacy/);
    await expect(page.getByTestId('offline-mode-toggle')).toBeVisible();

    // Direct deep-link reload hydration
    await page.reload();
    await expect(page.getByTestId('offline-mode-toggle')).toBeVisible();

    // Mobile Bento tab switching without horizontal scroll or Experto badge
    await page.setViewportSize({ width: 375, height: 812 });
    const mobileTablistOverflow = await page.evaluate(() => {
      const list = document.querySelector('nav [role="tablist"]');
      return list ? list.scrollWidth > list.clientWidth + 1 : true;
    });
    expect(mobileTablistOverflow).toBe(false);

    const mobileAdvancedTab = page.getByTestId('settings-mobile-tab-advanced');
    await expect(mobileAdvancedTab).toBeVisible();
    await expect(mobileAdvancedTab).not.toContainText('Experto');
    await mobileAdvancedTab.click();
    await expect(page).toHaveURL(/\/settings\?tab=advanced/);
    await expect(page.getByTestId('export-diagnostics-btn')).toBeVisible();

    // Instant settings search with single custom clear button
    const searchInput = page.getByTestId('settings-search-input');
    await expect(searchInput).toHaveAttribute('type', 'text');
    await searchInput.fill('offline');
    await expect(page.getByTestId('settings-search-clear')).toHaveCount(1);
    await page.getByTestId('settings-search-clear').click();
    await expect(searchInput).toHaveValue('');

    await searchInput.fill('offline');
    await page.getByTestId('settings-search-result-privacy-offline').click();
    await expect(page).toHaveURL(/\/settings\?tab=privacy/);
    await expect(page.getByTestId('offline-mode-toggle')).toBeVisible();
  });

  test('persists adaptive cover tinting, reduced motion, and default book format/status into Create Book modal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/settings');

    await page.getByTestId('toggle-adaptive-tint').click();
    await page.getByTestId('reduced-motion-reduce-btn').click();
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'reduce');

    await page.getByTestId('settings-tab-catalog').click();
    await page.locator('#settings-default-format').selectOption('Ebook');
    await page.locator('#settings-default-status').selectOption('reading');

    await page.goto('/books');
    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-book-format')).toHaveValue('Ebook');
    await expect(page.locator('#create-book-status')).toHaveValue('reading');
  });

  test('enforces 100% Offline Mode by blocking external metadata requests', async ({ page }) => {
    let externalRequestCount = 0;
    await page.route('https://**/*', async (route) => {
      externalRequestCount++;
      await route.abort();
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/settings?tab=privacy');
    await page.getByTestId('offline-mode-toggle').click();
    await expect(page.getByTestId('offline-status-pill')).toBeVisible();

    await page.goto('/books');
    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();

    const lookupPanel = page.locator('app-book-metadata-lookup');
    await expect(lookupPanel).toBeVisible();
    await expect(lookupPanel).toContainText(/sin conexión|offline/i);
    expect(externalRequestCount).toBe(0);
  });

  test('completes encrypted JSON backup export, wrong-password rejection, and correct-password restore', async ({
    page,
  }) => {
    const books: Book[] = [
      {
        id: 'enc-book-1',
        title: 'El Archivo de las Tormentas',
        author: 'Brandon Sanderson',
        totalPages: 1200,
        currentPage: 300,
        status: 'reading',
        format: 'Físico',
        createdAt: '2026-04-01T10:00:00.000Z',
        updatedAt: '2026-04-01T10:00:00.000Z',
      },
    ];

    await page.setViewportSize({ width: 1280, height: 800 });
    await seedLibrary(page, books, [], 'data');

    await page.getByTestId('pref-backup-encryption').click();
    await page.getByTestId('export-encryption-password').fill('BookStack#2026');
    await page.getByTestId('export-encryption-confirm-password').fill('BookStack#2026');

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-json-btn').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/i);

    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const { readFileSync } = await import('node:fs');
    const encryptedBuffer = readFileSync(filePath!);

    await seedLibrary(page, [], [], 'data');

    await page.getByTestId('import-file-input').setInputFiles({
      name: download.suggestedFilename(),
      mimeType: 'application/json',
      buffer: encryptedBuffer,
    });

    await expect(page.getByTestId('encrypted-backup-prompt')).toBeVisible();

    // Wrong password shows error
    await page.getByTestId('decrypt-backup-password').fill('WrongPassword99');
    await page.getByTestId('decrypt-unlock-btn').click();
    await expect(page.getByTestId('portability-error-banner')).toBeVisible();

    // Correct password unlocks preview and restores book
    await page.getByTestId('decrypt-backup-password').fill('BookStack#2026');
    await page.getByTestId('decrypt-unlock-btn').click();
    await expect(page.getByTestId('import-preview-panel')).toBeVisible();

    const autoEnrichCheckbox = page.getByTestId('import-auto-enrich-checkbox');
    if (await autoEnrichCheckbox.isChecked()) {
      await autoEnrichCheckbox.uncheck();
    }
    await page.getByTestId('confirm-import-btn').click();
    await expect(page.getByTestId('portability-status-banner')).toBeVisible();

    await page.goto('/books');
    await expect(page.getByText('El Archivo de las Tormentas')).toBeVisible();
  });

  test('executes selective preferences reset without deleting books and exports anonymous diagnostics', async ({
    page,
  }) => {
    const books: Book[] = [
      {
        id: 'adv-book-1',
        title: 'Nacidos de la Bruma',
        author: 'Brandon Sanderson',
        totalPages: 672,
        currentPage: 100,
        status: 'reading',
        format: 'Físico',
        createdAt: '2026-04-02T10:00:00.000Z',
        updatedAt: '2026-04-02T10:00:00.000Z',
      },
    ];

    await page.setViewportSize({ width: 1280, height: 800 });
    await seedLibrary(page, books, [], 'advanced');

    await page.getByTestId('reset-all-preferences-btn').click();
    const confirmDialog = page.locator('app-confirm-dialog [role="alertdialog"]');
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.locator('button').last().click();
    await expect(confirmDialog).toBeHidden();
    await expect(page.getByTestId('advanced-status-banner')).toBeVisible();

    const diagDownloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-diagnostics-btn').click();
    const diagDownload = await diagDownloadPromise;
    expect(diagDownload.suggestedFilename()).toMatch(/^bookstack-diagnostics-.*\.json$/i);

    await page.goto('/books');
    await expect(page.getByText('Nacidos de la Bruma')).toBeVisible();
  });
});
