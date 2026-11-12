import { expect, test } from '@playwright/test';

test.describe('Dashboard Interactive Hub Flow', () => {
  test('should guide a new user through empty states, fast progress updates, streaks, and goals on desktop', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // 1. Initial Empty State: Welcome Card
    await expect(page.getByText('¡Te damos la bienvenida a BookStack!')).toBeVisible();
    const addFirstBookBtn = page.getByRole('button', { name: 'Añadir mi primer libro' });
    await expect(addFirstBookBtn).toBeVisible();

    // 2. Open Create Modal from Dashboard Welcome CTA
    await addFirstBookBtn.click();
    await expect(page.locator('#create-modal-title')).toBeVisible();

    // Create a pending book
    await page.locator('#create-book-title').fill('El Alquimista');
    await page.locator('#create-book-author').fill('Paulo Coelho');
    await page.locator('#create-book-total-pages').fill('180');
    await page.getByRole('button', { name: 'Añadir libro', exact: true }).click();
    await expect(page.locator('#create-modal-title')).toBeHidden();

    // 3. Second Empty State: Pick Next Read from Pending Books
    await expect(page.getByText('Sin lecturas en curso')).toBeVisible();
    await expect(page.getByText('El Alquimista')).toBeVisible();
    const startReadingBtn = page.getByRole('button', { name: 'Empezar a leer' });
    await expect(startReadingBtn).toBeVisible();

    // Start reading book
    await startReadingBtn.click();

    // 4. Hero Card is now active
    await expect(page.getByText('Leyendo ahora')).toBeVisible();
    await expect(page.getByText('0% • 0 / 180 págs.')).toBeVisible();

    // 5. Fast Page Update via Hero Input
    const pageInput = page.getByLabel('Número de página actual');
    await expect(pageInput).toBeVisible();
    await pageInput.fill('45');
    await page.getByRole('button', { name: 'Actualizar', exact: true }).click();

    // Verify progress updated
    await expect(page.getByText('25% • 45 / 180 págs.')).toBeVisible();

    // Verify Recent Activity Feed updated
    const recentActivity = page.locator('app-recent-activity-feed');
    await expect(recentActivity.getByText('+45 págs.')).toBeVisible();

    // Verify Reading Streak updated
    const streakWidget = page.locator('app-reading-streak-widget');
    await expect(streakWidget.getByText('¡Lectura de hoy completada!')).toBeVisible();

    // 6. Annual Goals Modal Edit & Persistence
    const goalsCard = page.locator('app-annual-goal-card');
    await expect(goalsCard).toBeVisible();
    await page.getByRole('button', { name: 'Editar metas' }).click();

    const goalsModal = page.locator('#goal-modal-title');
    await expect(goalsModal).toBeVisible();

    await page.locator('#goal-books-input').fill('15');
    await page.locator('#goal-pages-input').fill('3500');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(goalsModal).toBeHidden();

    await expect(goalsCard.getByText('0 / 15 (0%)')).toBeVisible();
    await expect(goalsCard.getByText('45 / 3500 (1%)')).toBeVisible();

    // 7. Complete Book via Fast Page Update and Verify Confirmation Modal
    await pageInput.fill('180');
    await page.getByRole('button', { name: 'Actualizar', exact: true }).click();

    // Confirmation dialog should appear
    await expect(page.getByRole('heading', { name: '¿Has terminado este libro?' })).toBeVisible();
    await page.getByRole('button', { name: 'Sí, completar libro' }).click();

    // Now all books are completed => Library is up to date state
    await expect(page.getByText('¡Biblioteca al día!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Añadir nuevo libro' })).toBeVisible();
  });

  test('should display dashboard on mobile with zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('main');

    // Welcome card displays cleanly
    await expect(page.getByText('¡Te damos la bienvenida a BookStack!')).toBeVisible();

    // Verify zero horizontal overflow at 375px
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
  });
});
