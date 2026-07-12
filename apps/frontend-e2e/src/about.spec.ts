import { test, expect } from './support/test';

test.describe('About page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('load');
  });

  test('loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await expect(page).toHaveURL(/about/);
    expect(errors).toHaveLength(0);
  });

  test('page content is visible', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();

    const hasContent =
      (await page.locator('.about-content, .about-page, main, article, section').count()) > 0;
    expect(hasContent).toBe(true);
  });

  test('page does not show a 404 error', async ({ page }) => {
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('404');
    expect(pageText).not.toContain('Not Found');
  });
});
