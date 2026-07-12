import { Route } from '@angular/router';
import { adminGuard } from '@iranianoralhistory/frontend-identity-data-access';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('@iranianoralhistory/frontend-home-feature-home').then((m) => m.HomeComponent),
  },
  {
    path: 'videos',
    loadChildren: () =>
      import('@iranianoralhistory/frontend-video-feature-catalog').then(
        (m) => m.videoCatalogRoutes,
      ),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('@iranianoralhistory/frontend-about-feature-about').then(
        (m) => m.AboutComponent,
      ),
  },
  {
    path: 'boulorian',
    loadComponent: () =>
      import('@iranianoralhistory/frontend-boulorian-feature-boulorian').then(
        (m) => m.BoulorianComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@iranianoralhistory/frontend-identity-feature-auth').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('@iranianoralhistory/frontend-identity-feature-auth').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('@iranianoralhistory/frontend-identity-feature-auth').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () =>
      import('@iranianoralhistory/frontend-video-feature-admin').then(
        (m) => m.adminRoutes,
      ),
  },
];
