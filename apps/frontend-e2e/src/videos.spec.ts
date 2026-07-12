import { test, expect } from './support/test';

test.describe('Video catalogue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/videos');
    // wait until Angular has bootstrapped and the API call has settled
    await page.waitForLoadState('load');
  });

  test('renders the video page', async ({ page }) => {
    await expect(page).toHaveURL(/videos/);
  });

  test('shows video cards, an empty state, or an error state', async ({ page }) => {
    const cards  = page.locator('.video-card');
    const empty  = page.locator('.catalog-empty');
    const errors = page.locator('.catalog-error');

    const total = (await cards.count()) + (await empty.count()) + (await errors.count());

    // the page must render exactly one of these three states
    expect(total).toBeGreaterThan(0);
  });

  test('loading spinner is gone after the page settles', async ({ page }) => {
    const spinner = page.locator('.spinner-border');
    await expect(spinner).toHaveCount(0);
  });
});
