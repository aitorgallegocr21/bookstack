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

  test('should dock desktop shell across all 4 edges (left, right, top, bottom) and persist across reload', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const aside = page.locator('app-sidebar aside');
    await expect(aside).toBeVisible();

    // Switch to right via quick-dock popover
    await aside.getByRole('button', { name: 'Cambiar posición del dock' }).click();
    await aside.getByRole('menuitemradio', { name: 'Derecha' }).click();
    await expect.poll(async () => (await aside.boundingBox())?.x ?? 0).toBeGreaterThan(900);

    // Switch to top via quick-dock popover
    await aside.getByRole('button', { name: 'Cambiar posición del dock' }).click();
    await aside.getByRole('menuitemradio', { name: 'Arriba' }).click();
    await expect
      .poll(async () => {
        const b = await aside.boundingBox();
        return b ? b.y < 80 && b.width > b.height : false;
      })
      .toBe(true);

    // Switch to bottom via quick-dock popover and verify persistence across reload
    await aside.getByRole('button', { name: 'Cambiar posición del dock' }).click();
    await aside.getByRole('menuitemradio', { name: 'Abajo' }).click();
    await expect.poll(async () => (await aside.boundingBox())?.y ?? 0).toBeGreaterThan(600);

    await page.reload();
    await expect.poll(async () => (await aside.boundingBox())?.y ?? 0).toBeGreaterThan(600);

    // Reset back to left via quick-dock popover
    await aside.getByRole('button', { name: 'Cambiar posición del dock' }).click();
    await aside.getByRole('menuitemradio', { name: 'Izquierda' }).click();
    await expect.poll(async () => (await aside.boundingBox())?.x ?? 999).toBeLessThan(20);
  });

  test('should support unified mobile dock top/bottom toggle at 320px and 375px with zero horizontal overflow', async ({
    page,
  }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 667 });
      await page.goto('/');

      const mobileDock = page.locator('app-bottom-nav nav');
      await expect(mobileDock).toBeVisible();
      await expect(page.locator('app-sidebar aside')).toBeHidden();

      // Default is bottom
      await expect.poll(async () => (await mobileDock.boundingBox())?.y ?? 0).toBeGreaterThan(400);

      // Verify symmetric left/right dock inset and >= 44x44px touch targets
      const dockShell = mobileDock.getByTestId('mobile-dock-shell');
      const dockRow = mobileDock.getByTestId('mobile-dock-row');
      const shellBox = await dockShell.boundingBox();
      const homeBox = await dockRow.locator('a[href="/"]').boundingBox();
      const menuBox = await dockRow
        .getByRole('button', { name: 'Más opciones de navegación' })
        .boundingBox();
      expect(shellBox).not.toBeNull();
      expect(homeBox).not.toBeNull();
      expect(menuBox).not.toBeNull();
      if (shellBox && homeBox && menuBox) {
        const leftInset = homeBox.x - shellBox.x;
        const rightInset = shellBox.x + shellBox.width - (menuBox.x + menuBox.width);
        expect(Math.abs(leftInset - rightInset)).toBeLessThanOrEqual(2);

        const topInset = homeBox.y - shellBox.y;
        const bottomInset = shellBox.y + shellBox.height - (homeBox.y + homeBox.height);
        expect(Math.abs(topInset - bottomInset)).toBeLessThanOrEqual(2);
      }

      const controlsCount = await dockRow.locator('> *').count();
      expect(controlsCount).toBe(6);
      for (let i = 0; i < controlsCount; i++) {
        const box = await dockRow.locator('> *').nth(i).boundingBox();
        expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      }

      // Open overflow menu and move dock to top
      await mobileDock.getByRole('button', { name: 'Más opciones de navegación' }).click();
      await mobileDock.getByRole('menuitem', { name: 'Mover arriba' }).click();

      await expect.poll(async () => (await mobileDock.boundingBox())?.y ?? 999).toBeLessThan(100);

      const overflowTop = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflowTop).toBe(false);

      // Reload and verify top position persisted and vertical inset remains symmetric
      await page.reload();
      await expect.poll(async () => (await mobileDock.boundingBox())?.y ?? 999).toBeLessThan(100);

      const topShellBox = await dockShell.boundingBox();
      const topHomeBox = await dockRow.locator('a[href="/"]').boundingBox();
      expect(topShellBox).not.toBeNull();
      expect(topHomeBox).not.toBeNull();
      if (topShellBox && topHomeBox) {
        const topInset = topHomeBox.y - topShellBox.y;
        const bottomInset = topShellBox.y + topShellBox.height - (topHomeBox.y + topHomeBox.height);
        expect(Math.abs(topInset - bottomInset)).toBeLessThanOrEqual(2);
      }

      // Open overflow menu and click another dock route to verify auto-close
      await mobileDock.getByRole('button', { name: 'Más opciones de navegación' }).click();
      await expect(mobileDock.getByRole('menu')).toBeVisible();
      await dockRow.locator('a[href="/books"]').click();
      await expect(mobileDock.getByRole('menu')).toBeHidden();
      await dockRow.locator('a[href="/"]').click();
      await expect(page).toHaveURL(/\/$/);

      // Move back to bottom
      await mobileDock.getByRole('button', { name: 'Más opciones de navegación' }).click();
      await mobileDock.getByRole('menuitem', { name: 'Mover abajo' }).click();

      await expect.poll(async () => (await mobileDock.boundingBox())?.y ?? 0).toBeGreaterThan(400);

      const overflowBottom = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflowBottom).toBe(false);
    }
  });

  test('should persist accent palette and light/dark/system theme modes from /settings across reload', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/settings');

    // Select editorial amber accent and dark theme
    await page.getByTestId('accent-swatch-amber').click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'amber');

    await page.getByTestId('theme-dark-btn').click();
    await expect
      .poll(() => page.locator('html').evaluate((el) => el.classList.contains('dark')))
      .toBe(true);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'amber');
    await expect
      .poll(() => page.locator('html').evaluate((el) => el.classList.contains('dark')))
      .toBe(true);

    // Switch to rose accent and system mode, then light mode
    await page.getByTestId('accent-swatch-rose').click();
    await expect(page.locator('html')).toHaveAttribute('data-accent', 'rose');

    await page.getByTestId('theme-system-btn').click();
    await expect(page.getByTestId('theme-system-btn')).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('theme-light-btn').click();
    await expect
      .poll(() => page.locator('html').evaluate((el) => el.classList.contains('dark')))
      .toBe(false);
  });

  test('should pin desktop/mobile docks for view transitions and navigate rapidly without console errors or reduced-motion issues', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const aside = page.locator('app-sidebar aside');
    await expect(aside).toHaveCSS('view-transition-name', 'desktop-dock');
    await expect(page.locator('app-bottom-nav nav')).toHaveCSS(
      'view-transition-name',
      'mobile-dock'
    );

    // Rapidly click through all main routes
    for (const [label, urlPattern] of [
      ['Libros', /\/books$/],
      ['Sagas', /\/series$/],
      ['Stats', /\/stats$/],
      ['Ajustes', /\/settings$/],
      ['Acerca de', /\/about$/],
      ['Inicio', /\/$/],
    ] as const) {
      await aside.getByRole('link', { name: label }).click();
      await expect(page).toHaveURL(urlPattern);
    }

    // Verify navigation under prefers-reduced-motion: reduce
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await aside.getByRole('link', { name: 'Libros' }).click();
    await expect(page).toHaveURL(/\/books$/);
    await aside.getByRole('link', { name: 'Inicio' }).click();
    await expect(page).toHaveURL(/\/$/);

    expect(errors).toEqual([]);
  });
});
