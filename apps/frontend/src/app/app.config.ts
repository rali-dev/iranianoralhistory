import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import {
  IdentityApiService,
  authStore,
} from '@iranianoralhistory/frontend-identity-data-access';
import {
  FavoriteApiService,
  favoritesStore,
} from '@iranianoralhistory/frontend-video-data-access';
import { appRoutes } from './app.routes';

function initApp(identity: IdentityApiService, favoriteApi: FavoriteApiService) {
  return () =>
    identity.getMe().pipe(
      tap((user) => authStore.setUser(user)),
      switchMap(() => favoriteApi.getFavoriteVideoIds()),
      tap((ids) => favoritesStore.setIds(ids)),
      catchError(() => of(null)),
    );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor])),
    provideRouter(appRoutes, withComponentInputBinding()),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [IdentityApiService, FavoriteApiService],
      multi: true,
    },
  ],
};
