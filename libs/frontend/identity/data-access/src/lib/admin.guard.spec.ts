import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { adminGuard } from './admin.guard';
import { authStore } from './state/auth.store';
import { IUser } from '@iranianoralhistory/shared-contracts';

const USER: IUser = {
  id: 'user-uuid-1',
  email: 'user@example.de',
  role: 'USER',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const ADMIN: IUser = { ...USER, id: 'admin-uuid', role: 'ADMIN' };

function runGuard() {
  return TestBed.runInInjectionContext(() =>
    adminGuard({} as never, {} as never),
  );
}

describe('adminGuard', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    router = TestBed.inject(Router);
    authStore.clear();
  });

  it('redirects unauthenticated visitors to /login', () => {
    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('redirects a non-admin user to the home page', () => {
    authStore.setUser(USER);

    const result = runGuard();

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('allows an admin user through', () => {
    authStore.setUser(ADMIN);

    const result = runGuard();

    expect(result).toBe(true);
  });

  it('redirects to /login again once the admin logs out', () => {
    authStore.setUser(ADMIN);
    expect(runGuard()).toBe(true);

    authStore.clear();

    const result = runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});
