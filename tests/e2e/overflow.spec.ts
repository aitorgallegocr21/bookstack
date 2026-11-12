import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/books', '/stats', '/settings', '/about'] as const;
const VIEWPORTS = [
  { name: 'mobile-sm', width: 375, height: 667 },
  { name: 'mobile-md', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

test.describe('Responsive layout overflow & single-landmark guard', () => {
  for (const viewport of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`should render ${route} with zero horizontal overflow at ${viewport.name} (${viewport.width}px)`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route);
        await page.waitForSelector('main');

        const metrics = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          mainCount: document.querySelectorAll('main').length,
        }));

        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
        expect(metrics.mainCount).toBe(1);
      });
    }
  }
});
