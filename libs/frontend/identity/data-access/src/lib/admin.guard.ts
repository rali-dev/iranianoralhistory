import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { authStore } from './state/auth.store';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const user = authStore.currentUser();

  if (!user) {
    return router.createUrlTree(['/login']);
  }
  if (user.role !== 'ADMIN') {
    return router.createUrlTree(['/']);
  }
  return true;
};
