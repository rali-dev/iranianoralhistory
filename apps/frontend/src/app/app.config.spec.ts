import { APP_INITIALIZER } from '@angular/core';
import { of, throwError } from 'rxjs';
import { appConfig } from './app.config';
import { authStore } from '@iranianoralhistory/frontend-identity-data-access';
import { favoritesStore } from '@iranianoralhistory/frontend-video-data-access';

type InitProvider = { provide: unknown; useFactory: (...deps: unknown[]) => () => unknown };

function initFactory(): InitProvider['useFactory'] {
  const provider = (appConfig.providers as unknown[]).find(
    (p): p is InitProvider =>
      typeof p === 'object' && p !== null && (p as { provide?: unknown }).provide === APP_INITIALIZER,
  );
  if (!provider) throw new Error('APP_INITIALIZER provider not found in appConfig');
  return provider.useFactory;
}

/** Runs the initializer's Observable to completion (resolves on complete OR error). */
function run(init: () => unknown): Promise<void> {
  return new Promise((resolve) => {
    (init() as { subscribe: (o: { complete?: () => void; error?: () => void }) => void }).subscribe({
      complete: () => resolve(),
      error: () => resolve(),
    });
  });
}

describe('appConfig — initApp (APP_INITIALIZER)', () => {
  let setUser: jest.SpyInstance;
  let setIds: jest.SpyInstance;

  beforeEach(() => {
    setUser = jest.spyOn(authStore, 'setUser').mockImplementation(() => undefined);
    setIds = jest.spyOn(favoritesStore, 'setIds').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('hydrates the auth store and the favourites on boot', async () => {
    const user = { id: 'u1', email: 'a@b.de', role: 'USER' as const };
    const identity = { getMe: () => of(user) };
    const favoriteApi = { getFavoriteVideoIds: () => of(['v1', 'v2']) };

    await run(initFactory()(identity, favoriteApi));

    expect(setUser).toHaveBeenCalledWith(user);
    expect(setIds).toHaveBeenCalledWith(['v1', 'v2']);
  });

  it('swallows a failed getMe so the app still boots (no throw, stores untouched)', async () => {
    const identity = { getMe: () => throwError(() => new Error('401 not authenticated')) };
    const favoriteApi = { getFavoriteVideoIds: () => of([]) };

    await expect(run(initFactory()(identity, favoriteApi))).resolves.toBeUndefined();

    expect(setUser).not.toHaveBeenCalled();
    expect(setIds).not.toHaveBeenCalled();
  });
});
