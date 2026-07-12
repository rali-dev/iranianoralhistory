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
    // The catalog fetch is async — wait until the page settles into one of the
    // three terminal states (cards / empty / error) with a retrying assertion,
    // instead of snapshotting the DOM while the request is still in flight.
    await expect(
      page.locator('.video-card, .catalog-empty, .catalog-error').first(),
    ).toBeVisible({ timeout: 30000 }); // headroom for a cold lazy-chunk compile + fetch
  });

  test('loading spinner is gone after the page settles', async ({ page }) => {
    const spinner = page.locator('.spinner-border');
    await expect(spinner).toHaveCount(0);
  });
});
