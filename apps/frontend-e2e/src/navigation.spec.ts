import { test, expect } from './support/test';

test.describe('Navigation & routing', () => {
  test('home page loads the landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page).toHaveURL('http://localhost:4200/');
    await expect(page).not.toHaveURL(/error/);
  });

  test('navigation bar is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ioh-nav, nav')).toBeVisible();
  });

  test('videos link in the nav navigates to the video page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await page.locator('a[href="/videos"]').first().click();
    await page.waitForURL(/videos/);
    await expect(page).toHaveURL(/videos/);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('register page is accessible', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('about page is accessible', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveURL(/about/);
  });

  test('admin route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/login/);
  });

  test('unknown route is handled without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/this-route-does-not-exist');
    await page.waitForLoadState('load');

    expect(errors).toHaveLength(0);
  });

  test('browser back navigation works correctly', async ({ page }) => {
    await page.goto('/');
    await page.goto('/videos');
    await page.goBack();
    await expect(page).toHaveURL('http://localhost:4200/');
  });
});
