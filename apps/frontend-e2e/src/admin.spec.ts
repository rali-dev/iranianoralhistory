import { test, expect } from './support/test';
import type { APIRequestContext, Page } from '@playwright/test';
import { promoteToAdmin, deleteUser, deleteVideoByVimeoId } from './support/db';

const API = 'http://localhost:3222/api';
const PASSWORD = 'AdminPass123!';

async function registerViaApi(request: APIRequestContext, email: string): Promise<void> {
  const res = await request.post(`${API}/auth/register`, { data: { email, password: PASSWORD } });
  expect(res.status()).toBe(201);
}

async function loginViaUi(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
}

test.describe('Admin — RBAC guard & CMS (live app)', () => {
  // Track created rows and clean them up unconditionally after every test, so a
  // failing test never leaks a user/video and no `try/finally` is needed inline.
  const emailsToDelete: string[] = [];
  const vimeoIdsToDelete: string[] = [];

  test.afterEach(async () => {
    for (const vimeoId of vimeoIdsToDelete.splice(0)) await deleteVideoByVimeoId(vimeoId);
    for (const email of emailsToDelete.splice(0)) await deleteUser(email);
  });

  test('a logged-in NON-admin is redirected away from /admin', async ({ page, request }) => {
    const email = `e2e-user-${Date.now()}@example.com`;
    emailsToDelete.push(email);

    await registerViaApi(request, email);
    await loginViaUi(page, email);
    await page.waitForURL(/\/videos/); // a normal USER lands on the archive

    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/admin/); // adminGuard bounces non-admins
  });

  test('an ADMIN reaches the CMS and can create a video', async ({ page, request }) => {
    const email = `e2e-admin-${Date.now()}@example.com`;
    const vimeoId = `${Date.now()}`;
    emailsToDelete.push(email);
    vimeoIdsToDelete.push(vimeoId);

    await registerViaApi(request, email);
    await promoteToAdmin(email);
    await loginViaUi(page, email);
    await page.waitForURL(/\/admin/); // an ADMIN is routed straight to the CMS

    // the admin shell renders
    await expect(page.locator('.admin-header__title')).toBeVisible();

    // create a video via the form on the default (videos) tab
    await page.locator('#video-vimeo').fill(vimeoId);
    await page.locator('#video-title-de').fill('E2E Video DE');
    await page.locator('#video-title-en').fill('E2E Video EN');
    await page.locator('#video-title-fa').fill('ویدیوی آزمایشی');

    await page
      .locator('.admin-card', { has: page.locator('#video-vimeo') })
      .locator('.admin-btn--primary')
      .click();

    // the create form reports success
    await expect(page.locator('.admin-alert--success')).toBeVisible();
  });

  test('the delete-confirm button renders with a visible (non-transparent) background', async ({ page, request }) => {
    const email = `e2e-admin-del-${Date.now()}@example.com`;
    const vimeoId = `${Date.now()}`;
    emailsToDelete.push(email);
    vimeoIdsToDelete.push(vimeoId);

    await registerViaApi(request, email);
    await promoteToAdmin(email);
    await loginViaUi(page, email);
    await page.waitForURL(/\/admin/);

    // seed a deletable row via the create form
    await page.locator('#video-vimeo').fill(vimeoId);
    await page.locator('#video-title-de').fill('E2E Delete DE');
    await page.locator('#video-title-en').fill('E2E Delete EN');
    await page.locator('#video-title-fa').fill('حذف آزمایشی');
    await page
      .locator('.admin-card', { has: page.locator('#video-vimeo') })
      .locator('.admin-btn--primary')
      .click();
    await expect(page.locator('.admin-alert--success')).toBeVisible();

    // open the delete confirmation on that video's row
    const row = page.locator('.admin-list-item', { hasText: `Vimeo: ${vimeoId}` });
    await expect(row).toBeVisible();
    await row.locator('.admin-btn--danger-outline').click();

    // Regression guard for the --danger token bug: the confirm button once
    // rendered white text on a transparent background (invisible). Playwright's
    // toBeVisible() still passes in that state — a laid-out button IS "visible" —
    // so we assert the COMPUTED background is not transparent, which is exactly
    // what the broken self-referential --danger token produced.
    const confirm = row.locator('.admin-btn--danger');
    await expect(confirm).toBeVisible();
    await expect(confirm).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    // We intentionally do not confirm the deletion; afterEach cleans up the row.
  });
});
