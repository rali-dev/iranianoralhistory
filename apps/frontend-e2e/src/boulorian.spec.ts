import { test, expect } from './support/test';

test.describe('Boulorian page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/boulorian');
    await page.waitForLoadState('load');
  });

  test('loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await expect(page).toHaveURL(/boulorian/);
    expect(errors).toHaveLength(0);
  });

  test('page content is visible', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();

    const hasContent =
      (await page.locator('main, article, header, section').count()) > 0;
    expect(hasContent).toBe(true);
  });

  test('renders the Boulorian letter heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /غنی بلوریان/ }),
    ).toBeVisible();
  });

  test('provides a link back to the about page', async ({ page }) => {
    await expect(page.locator('a[href="/about"]').first()).toBeVisible();
  });

  test('page does not show a 404 error', async ({ page }) => {
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('404');
    expect(pageText).not.toContain('Not Found');
  });
});
