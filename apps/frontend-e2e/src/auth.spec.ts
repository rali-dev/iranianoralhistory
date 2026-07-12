import { test, expect } from './support/test';

test.describe('App navigation', () => {
  test('home page renders the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('http://localhost:4200/');
  });

  test('videos page is directly accessible', async ({ page }) => {
    await page.goto('/videos');
    await expect(page).toHaveURL(/videos/);
  });

  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/videos');
    await page.waitForLoadState('load');
    expect(errors).toHaveLength(0);
  });
});

test.describe('Auth pages', () => {
  test('login page loads and shows the form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('register page loads and shows the form', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();
    await expect(page.locator('#reg-confirm')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('empty login form shows validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('empty register form shows validation errors', async ({ page }) => {
    await page.goto('/register');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });

  test('nav shows the sign-in link when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ioh-nav a[href="/login"]')).toBeVisible();
  });

  test('link from login to register navigates correctly', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a[href="/register"]').click();
    await expect(page).toHaveURL(/register/);
  });

  test('link from register to login navigates correctly', async ({ page }) => {
    await page.goto('/register');
    await page.locator('.auth-link[href="/login"]').click();
    await expect(page).toHaveURL(/login/);
  });
});
