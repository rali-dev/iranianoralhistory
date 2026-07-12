import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import {
  IdentityApiService,
  authStore,
} from '@iranianoralhistory/frontend-identity-data-access';
import { favoritesStore } from '@iranianoralhistory/frontend-video-data-access';
import { I18nService, type Lang } from '@iranianoralhistory/frontend-shared-i18n';
import { ImageLightboxService } from '@iranianoralhistory/frontend-shared-ui';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  private readonly identity = inject(IdentityApiService);
  private readonly router   = inject(Router);
  readonly i18n             = inject(I18nService);
  readonly lightbox         = inject(ImageLightboxService);

  readonly isAuthenticated    = authStore.isAuthenticated;
  readonly currentUser        = authStore.currentUser;
  readonly favoritesCount     = favoritesStore.count;
  readonly showFavoritesPanel = signal(false);
  readonly menuOpen           = signal(false);
  readonly langOpen           = signal(false);

  readonly isHomePage = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(() => this.router.url === '/'),
      startWith(this.router.url === '/'),
    ),
    { initialValue: this.router.url === '/' },
  );

  readonly langs: ReadonlyArray<{ code: Lang; label: string; ariaLabel: string; isFa: boolean }> = [
    { code: 'fa', label: 'فا', ariaLabel: 'فارسی',  isFa: true  },
    { code: 'en', label: 'EN', ariaLabel: 'English', isFa: false },
    { code: 'de', label: 'DE', ariaLabel: 'Deutsch', isFa: false },
  ];

  readonly activeLang = computed(() => this.langs.find(l => l.code === this.i18n.lang())!);

  setLang(lang: Lang): void {
    this.i18n.setLang(lang);
    this.langOpen.set(false);
    this.menuOpen.set(false);
  }

  toggleLang(): void {
    this.langOpen.update(v => !v);
  }

  logout(): void {
    this.closeMenu();
    this.identity.logout().subscribe({
      next:  () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/'),
    });
  }

  toggleMenu(): void {
    this.showFavoritesPanel.set(false);
    this.langOpen.set(false);
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.langOpen.set(false);
  }

  toggleFavoritesPanel(): void {
    this.showFavoritesPanel.update((v) => !v);
  }

  closeFavoritesPanel(): void {
    this.showFavoritesPanel.set(false);
  }

  goToFavorites(): void {
    this.closeFavoritesPanel();
    this.closeMenu();
    this.router.navigate(['/videos'], { queryParams: { favorites: 'true' } });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.lightbox.isOpen()) this.lightbox.close();
  }
}
