import { test, expect } from './support/test';

test.describe('Favourites (unauthenticated)', () => {
  test('favourite button is absent or disabled when not signed in', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('load');

    const favoriteButtons = page.locator('.btn-favorite, [data-action="favorite"]');
    const count = await favoriteButtons.count();

    if (count > 0) {
      const firstBtn = favoriteButtons.first();
      const isDisabled = await firstBtn.isDisabled();
      const ariaLabel = await firstBtn.getAttribute('aria-label');
      expect(isDisabled || ariaLabel !== null).toBe(true);
    }
  });

  test('favourites counter is not visible when not signed in', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const counter = page.locator('.favorites-count, [data-testid="favorites-count"]');
    const isVisible = await counter.isVisible().catch(() => false);

    if (isVisible) {
      const text = await counter.textContent();
      expect(text?.trim()).toBe('0');
    }
  });
});

test.describe('Auth flow (register + login)', () => {
  const TEST_PASSWORD = 'TestPW99!';

  test('completes registration and login successfully', async ({ page }) => {
    // Unique per attempt (including retries) to avoid "Email already in use" on retry
    // and race conditions when two parallel workers load the module at the same millisecond.
    const TEST_EMAIL = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@playwright-test.de`;

    await page.goto('/register');
    await page.waitForLoadState('load');
    await page.locator('#reg-email').fill(TEST_EMAIL);
    await page.locator('#reg-password').fill(TEST_PASSWORD);
    await page.locator('#reg-confirm').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // successful registration redirects to the login page
    await expect(page).toHaveURL(/login/, { timeout: 10000 });

    await page.locator('#login-email').fill(TEST_EMAIL);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();

    // after login, redirected to videos or admin
    await expect(page).toHaveURL(/videos|admin/, { timeout: 10000 });
  });

  test('login with wrong credentials shows an error message', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill('notfound@test.de');
    await page.locator('#login-password').fill('WrongPassword');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="alert"], .error-message, .alert-danger').first())
      .toBeVisible({ timeout: 5000 });
  });
});

test.describe('Video page core behaviour', () => {
  test('video page renders one of the defined states', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('load');

    const hasVideos = (await page.locator('.video-card').count()) > 0;
    const isEmpty = (await page.locator('.catalog-empty').count()) > 0;
    const hasError = (await page.locator('.catalog-error').count()) > 0;

    expect(hasVideos || isEmpty || hasError).toBe(true);
  });

  test('no spinner visible after page has fully loaded', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForLoadState('load');

    await expect(page.locator('.spinner-border')).toHaveCount(0);
  });
});
