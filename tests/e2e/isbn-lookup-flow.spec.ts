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
  await page.route('https://openlibrary.org/api/books**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OPEN_LIBRARY_ISBN_9780141036144),
    });
  });

  await page.route('https://openlibrary.org/search.json**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(OPEN_LIBRARY_SEARCH_DUNE),
    });
  });

  await page.route('https://www.googleapis.com/books/v1/volumes**', async (route) => {
    const url = route.request().url();
    const payload =
      url.includes('isbn%3A9780141036144') || url.includes('isbn:9780141036144')
        ? GOOGLE_BOOKS_ISBN_9780141036144
        : GOOGLE_BOOKS_SEARCH_DUNE;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });

  await page.route('https://covers.openlibrary.org/**', async (route) => {
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
    await expect(lookupPanel.getByText('Open Library')).toBeVisible();
    await expect(lookupPanel.getByText('Google Books')).toBeVisible();

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

    await lookupPanel.locator('input[type="search"]').fill('Dune');
    await lookupPanel.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(lookupPanel.getByText('Dune: Deluxe Edition')).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
