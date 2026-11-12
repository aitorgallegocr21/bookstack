import { expect, test } from '@playwright/test';

test.describe('End-to-end Book & Reading Log lifecycle', () => {
  test('should create a book, log reading progress, view details, edit, and delete', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/books');
    await expect(page.getByText('No hay libros todavía.')).toBeVisible();

    // Create a new book from global sidebar CTA
    await page.getByRole('button', { name: 'Crear nuevo libro' }).click();
    await expect(page.locator('#create-modal-title')).toBeVisible();

    await page.locator('#create-book-title').fill('Dune');
    await page.locator('#create-book-author').fill('Frank Herbert');
    await page.locator('#create-book-total-pages').fill('200');
    await page.getByRole('button', { name: 'Añadir libro', exact: true }).click();

    await expect(page.locator('#create-modal-title')).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Ver detalles: Dune', exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText('0 / 200 págs.')).toBeVisible();

    // Log a reading session (+80 pages => 40% & status transitions to "Leyendo")
    await page.getByRole('button', { name: 'Registrar lectura de Dune' }).click();
    await expect(page.getByRole('heading', { name: 'Registrar lectura' })).toBeVisible();

    await page.locator('app-reading-log-editor input[name="pagesRead"]').fill('80');
    await page.locator('app-reading-log-editor button[type="submit"]').click();

    await expect(page.locator('app-reading-log-editor dialog')).toBeHidden();
    await expect(page.getByText('80 / 200 págs.')).toBeVisible();
    await expect(page.getByText('40%')).toBeVisible();
    await expect(page.getByText('Leyendo')).toBeVisible();

    // Open details modal and transition into edit modal
    await page.getByRole('button', { name: 'Ver detalles: Dune', exact: true }).first().click();
    const detailPanel = page.locator('app-book-detail-modal .modal-panel');
    await expect(detailPanel).toBeVisible();
    await expect(detailPanel.getByText('80 páginas leídas')).toBeVisible();

    await detailPanel.getByRole('button', { name: 'Editar libro', exact: true }).click();
    const editPanel = page.locator('app-book-edit-modal .modal-panel');
    await expect(editPanel).toBeVisible();

    await page.locator('#edit-book-title').fill('Dune: Edición Revisada');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(editPanel).toBeHidden();

    // Close detail modal if still open so card is unobstructed
    if (await detailPanel.isVisible()) {
      await detailPanel.getByRole('button', { name: 'Cerrar' }).first().click();
      await expect(detailPanel).toBeHidden();
    }

    await expect(
      page
        .getByRole('button', { name: 'Ver detalles: Dune: Edición Revisada', exact: true })
        .first()
    ).toBeVisible();

    // Delete book and confirm return to empty state
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Eliminar Dune: Edición Revisada' }).click();
    await expect(page.getByText('No hay libros todavía.')).toBeVisible();
  });
});
