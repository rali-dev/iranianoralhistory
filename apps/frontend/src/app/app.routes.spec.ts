import { adminGuard } from '@iranianoralhistory/frontend-identity-data-access';
import { appRoutes } from './app.routes';

/**
 * Pure config/unit test: assert the shape of the route table without
 * bootstrapping the app or resolving any lazy chunk.
 */
describe('appRoutes (route table config)', () => {
  const byPath = (path: string) => appRoutes.find((r) => r.path === path);

  const EXPECTED_PATHS = [
    '',
    'videos',
    'about',
    'boulorian',
    'login',
    'register',
    'forgot-password',
    'admin',
  ];

  it('declares every expected top-level path exactly once', () => {
    const paths = appRoutes.map((r) => r.path);
    for (const path of EXPECTED_PATHS) {
      expect(paths.filter((p) => p === path)).toHaveLength(1);
    }
  });

  it('declares no unexpected top-level paths', () => {
    expect(appRoutes.map((r) => r.path).sort()).toEqual([...EXPECTED_PATHS].sort());
  });

  it.each(EXPECTED_PATHS)('lazy-loads the "%s" route via a loader function', (path) => {
    const route = byPath(path)!;
    expect(route).toBeDefined();

    const loader = route.loadComponent ?? route.loadChildren;
    expect(typeof loader).toBe('function');
    // A lazy route should expose exactly one kind of loader.
    expect(Boolean(route.loadComponent) !== Boolean(route.loadChildren)).toBe(true);
  });

  it('guards the admin route with adminGuard and lazy-loads its children', () => {
    const admin = byPath('admin')!;
    expect(admin.canActivate).toContain(adminGuard);
    expect(typeof admin.loadChildren).toBe('function');
  });

  it('leaves every non-admin route unguarded', () => {
    for (const path of EXPECTED_PATHS.filter((p) => p !== 'admin')) {
      expect(byPath(path)!.canActivate).toBeUndefined();
    }
  });
});
