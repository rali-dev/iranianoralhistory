import { test, expect } from './support/test';

test.describe('Forgot-password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('load');
  });

  test('loads and shows the email form', async ({ page }) => {
    await expect(page).toHaveURL(/forgot-password/);
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('#fp-email')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.reload();
    await page.waitForLoadState('load');

    expect(errors).toHaveLength(0);
  });

  test('empty submit shows a validation error', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('an invalid email shows a validation error', async ({ page }) => {
    await page.locator('#fp-email').fill('not-an-email');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('provides a link back to the login page', async ({ page }) => {
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
  });

  test('link back to login navigates correctly', async ({ page }) => {
    await page.locator('a[href="/login"]').first().click();
    await expect(page).toHaveURL(/login/);
  });
});
