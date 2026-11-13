import { expect, Page, test } from '@playwright/test';
import { Book, ReadingLog } from '../../src/app/features/books/models/book.model';

function createSeedData(): { books: Book[]; logs: ReadingLog[]; currentYear: number } {
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const books: Book[] = [
    {
      id: 'analytics-book-1',
      title: 'Dune',
      author: 'Frank Herbert',
      totalPages: 500,
      currentPage: 500,
      status: 'completed',
      format: 'Físico',
      rating: 9.5,
      startDate: `${currentYear}-01-05`,
      endDate: `${currentYear}-01-12`,
      createdAt: `${currentYear}-01-05T10:00:00.000Z`,
      updatedAt: `${currentYear}-01-12T18:00:00.000Z`,
    },
    {
      id: 'analytics-book-2',
      title: 'El Problema de los Tres Cuerpos',
      author: 'Cixin Liu',
      totalPages: 400,
      currentPage: 400,
      status: 'completed',
      format: 'Ebook',
      rating: 8.5,
      // Completed without ReadingLog entries to verify hybrid page counting
      startDate: `${currentYear}-02-01`,
      endDate: `${currentYear}-02-05`,
      createdAt: `${currentYear}-02-01T10:00:00.000Z`,
      updatedAt: `${currentYear}-02-05T16:00:00.000Z`,
    },
    {
      id: 'analytics-book-3',
      title: 'Foundation',
      author: 'Isaac Asimov',
      totalPages: 300,
      currentPage: 300,
      status: 'completed',
      format: 'Audiolibro',
      rating: 8,
      startDate: `${prevYear}-06-01`,
      endDate: `${prevYear}-06-07`,
      createdAt: `${prevYear}-06-01T10:00:00.000Z`,
      updatedAt: `${prevYear}-06-07T19:00:00.000Z`,
    },
    {
      id: 'analytics-book-4',
      title: 'Proyecto Hail Mary',
      author: 'Andy Weir',
      totalPages: 480,
      currentPage: 120,
      status: 'reading',
      format: 'Físico',
      createdAt: `${currentYear}-03-01T10:00:00.000Z`,
      updatedAt: `${currentYear}-03-10T10:00:00.000Z`,
    },
  ];

  const logs: ReadingLog[] = [
    {
      id: 'analytics-log-1',
      bookId: 'analytics-book-1',
      date: `${currentYear}-01-08T19:00:00.000Z`,
      pagesRead: 220,
      timeSpentMinutes: 120,
      createdAt: `${currentYear}-01-08T19:00:00.000Z`,
    },
    {
      id: 'analytics-log-2',
      bookId: 'analytics-book-4',
      date: `${currentYear}-03-04T20:00:00.000Z`,
      pagesRead: 120,
      timeSpentMinutes: 60,
      createdAt: `${currentYear}-03-04T20:00:00.000Z`,
    },
    {
      id: 'analytics-log-3',
      bookId: 'analytics-book-3',
      date: `${prevYear}-06-04T18:00:00.000Z`,
      pagesRead: 300,
      timeSpentMinutes: 150,
      createdAt: `${prevYear}-06-04T18:00:00.000Z`,
    },
  ];

  return { books, logs, currentYear };
}

async function seedAnalyticsStore(page: Page, books: Book[], logs: ReadingLog[]): Promise<void> {
  await page.goto('/stats');
  await page.evaluate(
    async ({ bookList, logList }) => {
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

test.describe('Advanced Analytics (/stats) Flow', () => {
  test('should render empty state when library is empty and open create modal from CTA', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/stats');

    const emptyState = page.getByTestId('stats-empty-state');
    await expect(emptyState).toBeVisible();

    const ctaBtn = page.getByTestId('stats-empty-cta');
    await expect(ctaBtn).toBeVisible();
    await ctaBtn.click();

    await expect(page.locator('#create-modal-title')).toBeVisible();
  });

  test('should support hybrid analytics, period filters, interactive velocity chart, composition & habits panels', async ({
    page,
  }) => {
    const { books, logs, currentYear } = createSeedData();
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedAnalyticsStore(page, books, logs);

    // 1. KPI Cards in default "Este año" period (Dune 500p + Tres Cuerpos 400p + Hail Mary 120p = 1020p; 2 books completed; 180m = 3h)
    const completedCard = page.getByTestId('kpi-card-completed-books');
    const pagesCard = page.getByTestId('kpi-card-pages-read');
    const timeCard = page.getByTestId('kpi-card-reading-time');
    const streakCard = page.getByTestId('kpi-card-streak');

    await expect(completedCard).toContainText('2');
    await expect(pagesCard).toContainText('1020');
    await expect(timeCard).toContainText('3h');
    await expect(streakCard).toBeVisible();

    // 2. Period filter toggling: "Todo el historial" includes prevYear Foundation (3 books completed)
    await page.getByTestId('period-btn-all-time').click();
    await expect(completedCard).toContainText('3');
    await expect(pagesCard).toContainText('1320');
    await expect(timeCard).toContainText('5h 30m');

    // Toggle "Últimos 12 meses" and back to "Este año"
    await page.getByTestId('period-btn-last-12-months').click();
    await expect(page.getByTestId('period-btn-last-12-months')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByTestId('period-btn-current-year').click();
    await expect(completedCard).toContainText('2');

    // 3. Interactive Velocity Chart Flow
    await expect(page.getByTestId('velocity-period-total')).toContainText('1020');

    await page.getByTestId('velocity-metric-books').click();
    await expect(page.getByTestId('velocity-period-total')).toContainText('2');

    await page.getByTestId('velocity-metric-time').click();
    await expect(page.getByTestId('velocity-period-total')).toContainText('3h');

    await page.getByTestId('velocity-metric-pages').click();
    const janBar = page.getByTestId(`velocity-bar-${currentYear}-01`);
    await janBar.click();
    await expect(page.getByTestId('velocity-selected-detail')).toContainText('500');

    // 4. Composition & Habits Panels (in current year: 3 books — 2 completed, 1 reading)
    await expect(page.getByTestId('format-donut-total')).toHaveText('3');
    await expect(page.getByTestId('format-legend-item-physical')).toBeVisible();
    await expect(page.getByTestId('status-completion-rate')).toContainText('100%');
    await expect(page.getByTestId('ratings-average-badge')).toContainText('9.0 / 10');
    await expect(page.getByTestId('top-author-item-0')).toBeVisible();

    await expect(page.getByTestId('weekday-pace-panel')).toBeVisible();
    await expect(page.getByTestId('weekday-peak-badge')).toBeVisible();
    await expect(page.getByTestId('highlight-best-day')).toContainText('400 págs');
    await expect(page.getByTestId('highlight-longest-book')).toContainText('Dune');
    await expect(page.getByTestId('highlight-avg-days')).toBeVisible();
    await expect(page.getByTestId('highlight-top-rated')).toContainText('Dune');
    await expect(page.getByTestId('highlight-top-rated-badge')).toHaveText('9.5 / 10');
  });

  test('should preserve zero horizontal overflow across 320px, 375px, 768px, and 1280px in light and dark modes', async ({
    page,
  }) => {
    const { books, logs } = createSeedData();
    await page.setViewportSize({ width: 1280, height: 800 });
    await seedAnalyticsStore(page, books, logs);

    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    for (const mode of ['light', 'dark'] as const) {
      await page.evaluate((theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, mode);

      for (const vp of viewports) {
        await page.setViewportSize(vp);
        await expect(page.getByTestId('kpi-card-completed-books')).toBeVisible();
        await expect(page.getByTestId('reading-habits-section')).toBeVisible();

        const metrics = await page.evaluate(() => {
          const innerWidth = window.innerWidth;
          const offenders = Array.from(document.querySelectorAll('*'))
            .filter((el) => {
              const rect = el.getBoundingClientRect();
              return rect.right > innerWidth + 1 && el.children.length === 0;
            })
            .sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)
            .slice(0, 5)
            .map((el) => ({
              tag: el.tagName,
              testId: el.getAttribute('data-testid'),
              text: el.textContent?.trim().slice(0, 30),
              right: Math.round(el.getBoundingClientRect().right),
              cls: el.className?.toString().slice(0, 60),
            }));
          return {
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth,
            offenders,
          };
        });
        expect(
          metrics.scrollWidth,
          `Overflow detected at ${vp.width}px in ${mode} mode: ${JSON.stringify(metrics.offenders)}`
        ).toBeLessThanOrEqual(metrics.innerWidth);
      }
    }
  });
});
