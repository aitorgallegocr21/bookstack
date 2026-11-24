import { expect, Page, test } from '@playwright/test';

const OPEN_LIBRARY_ISBN_9780141036144 = {
  'ISBN:9780141036144': {
    title: '1984',
    authors: [{ name: 'George Orwell' }],
    publishers: [{ name: 'Penguin Books' }],
    publish_date: '2008',
    // Omit number_of_pages so Google Books waterfall merges totalPages = 336
  },
};

const GOOGLE_BOOKS_ISBN_9780141036144 = {
  items: [
    {
      id: 'gb-1984',
      volumeInfo: {
        title: '1984',
        authors: ['George Orwell'],
        publisher: 'Penguin Books',
        publishedDate: '2008-07-03',
        pageCount: 336,
        industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780141036144' }],
      },
    },
  ],
};

const OPEN_LIBRARY_SEARCH_DUNE = {
  docs: [
    {
      key: '/works/OL893415W',
      title: 'Dune',
      author_name: ['Frank Herbert'],
      isbn: ['9780441172719'],
      publisher: ['Ace Books'],
      first_publish_year: 1965,
      number_of_pages_median: 688,
    },
  ],
};

const GOOGLE_BOOKS_SEARCH_DUNE = {
  items: [
    {
      id: 'gb-dune-2',
      volumeInfo: {
        title: 'Dune: Deluxe Edition',
        authors: ['Frank Herbert'],
        publisher: 'Ace Hardcover',
        publishedDate: '2019-10-01',
        pageCount: 688,
        industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780593099322' }],
      },
    },
  ],
};

async function mockExternalCatalogApis(page: Page): Promise<void> {
  const samplePng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  await page.route('https://openlibrary.org/api/books**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OPEN_LIBRARY_ISBN_9780141036144),
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
    const url = decodeURIComponent(route.request().url());
    if (url.toLowerCase().includes('viento') || url.toLowerCase().includes('rothfuss')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          docs: [
            {
              key: '/works/OL15320560W',
              title: 'El Nombre del Viento',
              author_name: ['Patrick Rothfuss'],
              isbn: ['9788401337208'],
              cover_i: 9999,
              publisher: ['Plaza & Janés'],
              first_publish_year: 2009,
              number_of_pages_median: 880,
            },
            {
              key: '/works/OL15320561W',
              title: 'El Nombre del Viento (Edición Ilustrada)',
              author_name: ['Patrick Rothfuss'],
              isbn: ['9788401352836'],
              publisher: ['Plaza & Janés'],
              first_publish_year: 2017,
              number_of_pages_median: 920,
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OPEN_LIBRARY_SEARCH_DUNE),
    });
  });

  await page.route('https://www.googleapis.com/books/v1/volumes**', async (route) => {
    const url = decodeURIComponent(route.request().url());
    if (url.toLowerCase().includes('viento') || url.toLowerCase().includes('rothfuss')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: 'gb-notw-es',
              volumeInfo: {
                title: 'El Nombre del Viento',
                authors: ['Patrick Rothfuss'],
                publisher: 'Plaza & Janés',
                publishedDate: '2009-05-01',
                pageCount: 880,
                industryIdentifiers: [{ type: 'ISBN_13', identifier: '9788401337208' }],
              },
            },
            {
              id: 'gb-notw-es-2',
              volumeInfo: {
                title: 'El Nombre del Viento (Edición Bolsillo)',
                authors: ['Patrick Rothfuss'],
                publisher: 'DeBolsillo',
                publishedDate: '2011-03-01',
                pageCount: 880,
                industryIdentifiers: [{ type: 'ISBN_13', identifier: '9788499082479' }],
              },
            },
          ],
        }),
      });
      return;
    }

    const payload = url.includes('isbn:9780141036144')
      ? GOOGLE_BOOKS_ISBN_9780141036144
      : GOOGLE_BOOKS_SEARCH_DUNE;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });

  await page.route('https://query.wikidata.org/**', async (route) => {
    const url = decodeURIComponent(route.request().url());
    if (url.toLowerCase().includes('viento') || url.toLowerCase().includes('rothfuss')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: {
            bindings: [
              {
                item: { value: 'http://www.wikidata.org/entity/Q381563' },
                itemLabel: { value: 'El Nombre del Viento' },
                authorLabel: { value: 'Patrick Rothfuss' },
                isbn13: { value: '9788401337208' },
                pages: { value: '880' },
                pubDate: { value: '2009-01-01T00:00:00Z' },
                publisherLabel: { value: 'Plaza & Janés' },
              },
            ],
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: { bindings: [] } }),
    });
  });

  await page.route('https://itunes.apple.com/**', async (route) => {
    const url = decodeURIComponent(route.request().url());
    if (url.toLowerCase().includes('viento') || url.toLowerCase().includes('rothfuss')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              trackId: 1001,
              trackName: 'El nombre del viento',
              artistName: 'Patrick Rothfuss',
              releaseDate: '2009-05-01T07:00:00Z',
              genres: ['Fantasía', 'Ficción'],
              artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/notw/100x100bb.jpg',
            },
            {
              trackId: 1002,
              trackName: 'El nombre del viento (Edición Especial)',
              artistName: 'Patrick Rothfuss',
              releaseDate: '2017-10-01T07:00:00Z',
              genres: ['Fantasía'],
              artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/notw2/100x100bb.jpg',
            },
          ],
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    });
  });

  await page.route('https://archive.org/**', async (route) => {
    const url = decodeURIComponent(route.request().url());
    if (url.toLowerCase().includes('viento') || url.toLowerCase().includes('rothfuss')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: {
            docs: [
              {
                identifier: 'name-of-wind-ia',
                title: 'The Name of the Wind (Archive)',
                creator: 'Patrick Rothfuss',
                publisher: 'DAW Books',
                year: 2007,
                number_of_pages: 662,
              },
            ],
          },
        }),
      });
      return;
    }

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

  await page.route('https://is1-ssl.mzstatic.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: samplePng,
    });
  });

  await page.route('https://covers.openlibrary.org/**', async (route) => {
    const url = route.request().url();
    if (url.includes('9788401337208') || url.includes('9999')) {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: samplePng,
      });
      return;
    }
    await route.fulfill({ status: 404 });
  });
}

test.describe('Phase 10: ISBN Lookup & Metadata Auto-Fill Flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockExternalCatalogApis(page);
  });

  test('should auto-fill from direct ISBN waterfall lookup, warn on duplicate ISBN, and support title/author search', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/books');

    // Scenario 1: Direct ISBN lookup & waterfall merge on Create
    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-modal-title')).toBeVisible();

    await page.locator('#create-book-isbn').fill('9780141036144');
    await page.getByRole('button', { name: 'Buscar metadatos para este ISBN' }).click();

    const lookupPanel = page.locator('app-book-metadata-lookup');
    await expect(lookupPanel.getByText('Ediciones encontradas')).toBeVisible();
    await expect(lookupPanel.getByRole('heading', { name: '1984', exact: true })).toBeVisible();
    await expect(lookupPanel.getByText('Combinado')).toBeVisible();

    await lookupPanel.getByRole('button', { name: 'Usar edición' }).first().click();

    await expect(page.locator('#create-book-title')).toHaveValue('1984');
    await expect(page.locator('#create-book-author')).toHaveValue('George Orwell');
    await expect(page.locator('#create-book-publisher')).toHaveValue('Penguin Books');
    await expect(page.locator('#create-book-publication-year')).toHaveValue('2008');
    await expect(page.locator('#create-book-total-pages')).toHaveValue('336');

    await page.getByRole('button', { name: 'Añadir libro', exact: true }).click();
    await expect(page.locator('#create-modal-title')).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Ver detalles: 1984', exact: true }).first()
    ).toBeVisible();

    // Scenario 3: Duplicate ISBN warning banner on Create
    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-modal-title')).toBeVisible();

    await page.locator('#create-book-isbn').fill('9780141036144');
    await page.getByRole('button', { name: 'Buscar metadatos para este ISBN' }).click();

    await expect(lookupPanel.getByText('Posible libro duplicado en tu biblioteca')).toBeVisible();
    await expect(lookupPanel.getByRole('heading', { name: '1984', exact: true })).toBeVisible();

    // Scenario 2: Title/Author search & edition selection
    const searchInput = lookupPanel.locator('input[type="search"]');
    await searchInput.fill('Dune Frank Herbert');
    await lookupPanel.getByRole('button', { name: 'Buscar', exact: true }).click();

    await expect(lookupPanel.getByText('Dune: Deluxe Edition')).toBeVisible();
    await expect(lookupPanel.getByText('Open Library', { exact: true })).toBeVisible();
    await expect(lookupPanel.getByText('Google Books', { exact: true })).toBeVisible();

    await lookupPanel.getByRole('button', { name: 'Usar edición' }).first().click();
    await expect(page.locator('#create-book-title')).toHaveValue('Dune');
    await expect(page.locator('#create-book-author')).toHaveValue('Frank Herbert');
    await expect(page.locator('#create-book-total-pages')).toHaveValue('688');
  });

  test('should protect existing title and personal fields when applying metadata in edit fill-empty mode', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/books');

    // Create a book with custom title, progress, rating, and notes (missing publisher & ISBN)
    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await page.locator('#create-book-title').fill('Mi Edición Especial de 1984');
    await page.locator('#create-book-author').fill('George Orwell');
    await page.locator('#create-book-total-pages').fill('320');
    await page.locator('#create-book-current-pages').fill('120');
    await page.locator('#create-book-rating').fill('9');
    await page
      .locator('app-book-create-modal textarea[formcontrolname="notes"]')
      .fill('Notas personales protegidas');
    await page.getByRole('button', { name: 'Añadir libro', exact: true }).click();
    await expect(page.locator('#create-modal-title')).toBeHidden();

    // Open details -> Edit modal
    await page
      .getByRole('button', { name: 'Ver detalles: Mi Edición Especial de 1984', exact: true })
      .first()
      .click();
    const detailPanel = page.locator('app-book-detail-modal .modal-panel');
    await detailPanel.getByRole('button', { name: 'Editar libro', exact: true }).click();

    const editPanel = page.locator('app-book-edit-modal .modal-panel');
    await expect(editPanel).toBeVisible();

    await page.locator('#edit-book-isbn').fill('9780141036144');
    await editPanel.getByRole('button', { name: 'Buscar metadatos para este ISBN' }).click();

    const lookupPanel = editPanel.locator('app-book-metadata-lookup');
    await expect(lookupPanel.getByText('Ediciones encontradas')).toBeVisible();
    await lookupPanel.getByRole('button', { name: 'Rellenar campos vacíos' }).first().click();

    // Missing public fields filled
    await expect(page.locator('#edit-book-publisher')).toHaveValue('Penguin Books');
    await expect(page.locator('#edit-book-publication-year')).toHaveValue('2008');

    // Existing title, totalPages, and personal fields preserved
    await expect(page.locator('#edit-book-title')).toHaveValue('Mi Edición Especial de 1984');
    await expect(page.locator('#edit-book-total-pages')).toHaveValue('320');
    await expect(page.locator('#edit-book-current-pages')).toHaveValue('120');
    await expect(page.locator('#edit-book-rating')).toHaveValue('9');
    await expect(editPanel.locator('textarea[formcontrolname="notes"]')).toHaveValue(
      'Notas personales protegidas'
    );
  });

  test('should render lookup accordion and edition cards with zero horizontal overflow at 375px mobile viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/books');

    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-modal-title')).toBeVisible();

    const lookupPanel = page.locator('app-book-metadata-lookup');
    await lookupPanel.getByRole('button', { name: /Expandir panel/ }).click();

    await expect(
      lookupPanel.getByText(
        'Las búsquedas consultan Open Library y Google Books directamente desde tu navegador y optimizan las portadas localmente.'
      )
    ).toBeVisible();

    await lookupPanel.locator('input[type="search"]').fill('Dune');
    await lookupPanel.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(lookupPanel.getByText('Dune: Deluxe Edition')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('should gate camera initialization behind explicit user consent in IsbnScannerComponent', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      let getUserMediaCalls = 0;
      (window as unknown as { __getUserMediaCalls: () => number }).__getUserMediaCalls = () =>
        getUserMediaCalls;
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: () => {
            getUserMediaCalls += 1;
            return Promise.reject(new Error('NotAllowedError'));
          },
          enumerateDevices: () => Promise.resolve([]),
        },
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/books');

    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-modal-title')).toBeVisible();

    const lookupPanel = page.locator('app-book-metadata-lookup');
    await lookupPanel.getByRole('button', { name: 'Escanear código' }).click();

    const consentButton = page.getByTestId('enable-camera-consent-btn');
    await expect(consentButton).toBeVisible();
    await expect(
      lookupPanel.getByText(
        'La cámara se procesa únicamente en tu navegador para leer códigos ISBN. No se graban ni envían imágenes.'
      )
    ).toBeVisible();

    const callsBeforeConsent = await page.evaluate(() =>
      (window as unknown as { __getUserMediaCalls: () => number }).__getUserMediaCalls()
    );
    expect(callsBeforeConsent).toBe(0);
  });

  test('should fuse 5-provider search results and populate totalPages, publicationYear, publisher, isbn, and coverUrl on selection', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/books');

    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-modal-title')).toBeVisible();

    const lookupPanel = page.locator('app-book-metadata-lookup');
    await lookupPanel.getByRole('button', { name: /Expandir panel/ }).click();

    await lookupPanel.locator('input[type="search"]').fill('El Nombre del Viento Patrick Rothfuss');
    await lookupPanel.getByRole('button', { name: 'Buscar', exact: true }).click();

    await expect(lookupPanel.getByText('Ediciones encontradas')).toBeVisible();
    await expect(lookupPanel.getByText(/Combinado/).first()).toBeVisible();
    await expect(lookupPanel.getByText('Google Books', { exact: true }).first()).toBeVisible();
    await expect(lookupPanel.getByText('Open Library', { exact: true }).first()).toBeVisible();
    await expect(lookupPanel.getByText('Apple Books', { exact: true }).first()).toBeVisible();

    await lookupPanel.getByRole('button', { name: 'Usar edición' }).first().click();

    await expect(page.locator('#create-book-title')).toHaveValue('El Nombre del Viento');
    await expect(page.locator('#create-book-author')).toHaveValue('Patrick Rothfuss');
    await expect(page.locator('#create-book-total-pages')).toHaveValue('880');
    await expect(page.locator('#create-book-publication-year')).toHaveValue('2009');
    await expect(page.locator('#create-book-publisher')).toHaveValue('Plaza & Janés');
    await expect(page.locator('#create-book-isbn')).toHaveValue('9788401337208');
    await expect(page.locator('app-book-create-modal app-cover-picker img').first()).toBeVisible();
  });

  test('should render metadata lookup and ISBN scanner controls without overlap or horizontal overflow at 320px and 375px', async ({
    page,
  }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 740 });
      await page.goto('/books');

      await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
      await expect(page.locator('#create-modal-title')).toBeVisible();

      const lookupPanel = page.locator('app-book-metadata-lookup');
      const scanBtn = lookupPanel.getByRole('button', { name: 'Escanear código', exact: true });
      const searchTabBtn = lookupPanel.getByRole('button', { name: 'Buscar libro', exact: true });
      const expandBtn = lookupPanel.getByRole('button', { name: /Expandir panel/i });

      await expect(scanBtn).toBeVisible();
      await expect(searchTabBtn).toBeVisible();
      await expect(expandBtn).toBeVisible();

      // Wait for modal entrance scale animation to settle so boundingBox reflects final >= 44px touch height
      await expect
        .poll(async () => (await scanBtn.boundingBox())?.height ?? 0)
        .toBeGreaterThanOrEqual(44);

      const scanBox = await scanBtn.boundingBox();
      const searchBox = await searchTabBtn.boundingBox();
      const expandBox = await expandBtn.boundingBox();
      expect(scanBox).not.toBeNull();
      expect(searchBox).not.toBeNull();
      expect(expandBox).not.toBeNull();

      // Buttons must not overlap horizontally and must meet >= 44px touch height
      expect(scanBox!.height).toBeGreaterThanOrEqual(44);
      expect(searchBox!.height).toBeGreaterThanOrEqual(44);
      expect(expandBox!.height).toBeGreaterThanOrEqual(44);
      expect(scanBox!.x + scanBox!.width).toBeLessThanOrEqual(searchBox!.x + 1);
      expect(searchBox!.x + searchBox!.width).toBeLessThanOrEqual(expandBox!.x + 1);

      // Expand search tab and verify zero horizontal overflow inside lookup panel & modal
      await searchTabBtn.click();
      await expect(lookupPanel.locator('input[type="search"]')).toBeVisible();

      const lookupSearchOverflow = await lookupPanel.evaluate(
        (el) => el.scrollWidth > el.clientWidth
      );
      expect(lookupSearchOverflow).toBe(false);

      const modalSearchOverflow = await page
        .locator('app-book-create-modal .modal-panel')
        .evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(modalSearchOverflow).toBe(false);

      // Switch to scanner tab and verify zero horizontal overflow inside lookup panel & modal
      await scanBtn.click();
      await expect(lookupPanel.locator('app-isbn-scanner')).toBeVisible();

      const lookupScannerOverflow = await lookupPanel.evaluate(
        (el) => el.scrollWidth > el.clientWidth
      );
      expect(lookupScannerOverflow).toBe(false);

      const modalScannerOverflow = await page
        .locator('app-book-create-modal .modal-panel')
        .evaluate((el) => el.scrollWidth > el.clientWidth);
      expect(modalScannerOverflow).toBe(false);
    }
  });
});
