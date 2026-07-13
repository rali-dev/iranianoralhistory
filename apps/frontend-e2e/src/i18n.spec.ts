import { test, expect } from './support/test';
import type { Page } from '@playwright/test';

/**
 * Treibt den Sprachumschalter in der Nav: Menü öffnen → Sprach-Panel öffnen →
 * Sprache per aria-label wählen. setLang schließt danach das Menü.
 */
async function selectLanguage(page: Page, ariaLabel: string): Promise<void> {
  await page.locator('button[aria-haspopup="menu"]').click();
  await page.locator('button[aria-haspopup="listbox"]').click();
  await page.locator(`[role="option"][aria-label="${ariaLabel}"]`).click();
}

test.describe('i18n — language switching & RTL (live DOM)', () => {
  test('switching to Farsi sets dir=rtl and lang=fa on <html>', async ({ page }) => {
    await page.goto('/');
    await selectLanguage(page, 'فارسی');

    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('switching to English sets dir=ltr and lang=en', async ({ page }) => {
    await page.goto('/');
    await selectLanguage(page, 'English');

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('switching to German sets dir=ltr and lang=de', async ({ page }) => {
    await page.goto('/');
    await selectLanguage(page, 'Deutsch');

    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('the chosen language persists across a reload', async ({ page }) => {
    await page.goto('/');
    await selectLanguage(page, 'فارسی');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');

    await page.reload();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('nav copy actually changes between German and English', async ({ page }) => {
    await page.goto('/');

    await selectLanguage(page, 'Deutsch');
    await page.locator('button[aria-haspopup="menu"]').click();
    const deArchive = (await page.locator('#ioh-nav-dropdown a[href="/videos"]').innerText()).trim();

    await page.locator('button[aria-haspopup="menu"]').click(); // close menu
    await selectLanguage(page, 'English');
    await page.locator('button[aria-haspopup="menu"]').click();
    const enArchive = (await page.locator('#ioh-nav-dropdown a[href="/videos"]').innerText()).trim();

    expect(deArchive).not.toBe('');
    expect(enArchive).not.toBe('');
    expect(deArchive).not.toBe(enArchive);
  });
});
