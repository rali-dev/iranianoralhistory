import { Routes } from '@angular/router';

export const videoCatalogRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./video-list/video-list.component').then(
        (m) => m.VideoListComponent,
      ),
  },
];
