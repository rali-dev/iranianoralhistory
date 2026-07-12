import { test as base, expect, type Page } from '@playwright/test';

/**
 * Transient, connection-level failures that can surface on the *first*
 * navigation of a worker, before any application code has run.
 *
 * Playwright drives the Angular/Vite dev-server, which can briefly stop
 * accepting TCP connections while it lazily compiles a route under
 * parallel-worker load. That shows up as `NS_ERROR_CONNECTION_REFUSED`
 * (Firefox) or `ERR_CONNECTION_REFUSED` (Chromium). These are always safe to
 * retry: the request never reached the application, so no state was mutated.
 */
const TRANSIENT_NAVIGATION_ERRORS = [
  'NS_ERROR_CONNECTION_REFUSED',
  'NS_ERROR_NET_RESET',
  'NS_ERROR_NET_INTERRUPT',
  'ERR_CONNECTION_REFUSED',
  'ERR_CONNECTION_RESET',
  'ECONNREFUSED',
  'ECONNRESET',
] as const;

const MAX_NAVIGATION_ATTEMPTS = 3;

function isTransientNavigationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return TRANSIENT_NAVIGATION_ERRORS.some((code) => message.includes(code));
}

/**
 * Runs a navigation call, retrying a bounded number of times when the
 * dev-server momentarily refuses the connection. The linear backoff gives the
 * server time to finish compiling the requested route before the next attempt.
 * Non-transient errors (assertion failures, real 4xx/5xx, timeouts) propagate
 * immediately so genuine regressions are never masked.
 */
async function withNavigationRetry<T>(
  page: Page,
  navigate: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_NAVIGATION_ATTEMPTS; attempt++) {
    try {
      return await navigate();
    } catch (error) {
      if (
        !isTransientNavigationError(error) ||
        attempt === MAX_NAVIGATION_ATTEMPTS
      ) {
        throw error;
      }
      lastError = error;
      await page.waitForTimeout(500 * attempt);
    }
  }

  // Unreachable — the loop above always returns or throws — but keeps the
  // compiler happy about the function's return type.
  throw lastError;
}

/**
 * Drop-in replacement for `@playwright/test` that hardens `page.goto` and
 * `page.reload` against transient dev-server connection failures.
 *
 * Every frontend-e2e spec imports `test`/`expect` from here instead of
 * `@playwright/test`, so the hardening is applied uniformly and in one place.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const originalGoto = page.goto.bind(page);
    const originalReload = page.reload.bind(page);

    page.goto = ((url, options) =>
      withNavigationRetry(page, () =>
        originalGoto(url, options),
      )) as Page['goto'];

    page.reload = ((options) =>
      withNavigationRetry(page, () =>
        originalReload(options),
      )) as Page['reload'];

    await use(page);
  },
});

export { expect };
