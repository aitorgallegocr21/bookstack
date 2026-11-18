import { expect, test } from '@playwright/test';

test.describe('Navigation and Theme persistence', () => {
  test('should show tablet/desktop sidebar, support collapse toggle, and persist theme across reload', async ({
    page,
  }) => {
    // Tablet regression: 768px must render the sidebar cleanly instead of leaving an empty margin
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const aside = page.locator('app-sidebar aside');
    await expect(aside).toBeVisible();
    await expect(page.locator('app-bottom-nav nav')).toBeHidden();

    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(aside).toHaveCSS('width', '240px');

    await page.getByRole('button', { name: 'Contraer barra lateral' }).click();
    await expect(aside).toHaveCSS('width', '68px');

    // Navigate via sidebar links
    await aside.getByRole('link', { name: 'Libros' }).click();
    await expect(page).toHaveURL(/\/books$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Biblioteca' })).toBeVisible();

    // Toggle dark theme and verify persistence across reload
    const themeToggle = aside.getByRole('button', { name: /Cambiar a tema oscuro/i });
    await themeToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should navigate using mobile bottom nav on narrow viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('app-sidebar aside')).toBeHidden();
    const bottomNav = page.locator('app-bottom-nav nav');
    await expect(bottomNav).toBeVisible();

    await bottomNav.getByRole('link', { name: 'Libros' }).click();
    await expect(page).toHaveURL(/\/books$/);

    await bottomNav.getByRole('link', { name: 'Stats' }).click();
    await expect(page).toHaveURL(/\/stats$/);

    await bottomNav.getByRole('link', { name: 'Inicio' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('should render /about privacy, legal, and attribution sections in ES and EN with zero horizontal overflow at 320px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/about');

    await expect(
      page.getByRole('heading', { name: 'Privacidad y Permisos del Dispositivo' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Aviso Legal, Licencia y Atribuciones' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'APIs de terceros y stack de código abierto' })
    ).toBeVisible();

    const overflowEs = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflowEs).toBe(false);

    // Switch language to English via /settings and verify /about in EN
    await page.goto('/settings');
    await page.locator('#settings-language').selectOption('en');
    await page.goto('/about');

    await expect(page.getByRole('heading', { name: 'Privacy & Device Permissions' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Legal Notice, License & Attributions' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Third-Party APIs & Open-Source Stack' })
    ).toBeVisible();

    const overflowEn = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflowEn).toBe(false);
  });
});
