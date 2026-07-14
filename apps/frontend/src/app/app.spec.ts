import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { App } from './app';
import {
  IdentityApiService,
  authStore,
} from '@iranianoralhistory/frontend-identity-data-access';
import { favoritesStore } from '@iranianoralhistory/frontend-video-data-access';
import { ImageLightboxService } from '@iranianoralhistory/frontend-shared-ui';
import type { IUser } from '@iranianoralhistory/shared-contracts';

// Mirror the localStorage mock used by the i18n service spec so the real
// I18nService (providedIn root) can read/write "ioh-lang" without throwing.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockIdentity = {
  logout: jest.fn().mockReturnValue(of({ message: 'Logout successful' })),
};

function buildUser(role: 'USER' | 'ADMIN' = 'USER'): IUser {
  return {
    id: 'u-1',
    email: 'user@test.de',
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as IUser;
}

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([]),
      { provide: IdentityApiService, useValue: mockIdentity },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(App);
  return { fixture, component: fixture.componentInstance };
}

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    authStore.clear();
    favoritesStore.setIds([]);
    document.documentElement.lang = '';
    document.documentElement.dir = '';
    document.documentElement.removeAttribute('data-theme');
  });

  describe('creation & rendering', () => {
    it('creates the component', async () => {
      const { component } = await createComponent();
      expect(component).toBeTruthy();
    });

    it('renders the fixed nav bar and the brand logo', async () => {
      const { fixture } = await createComponent();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('nav.ioh-nav')).toBeTruthy();
      expect(el.querySelector('img[src="assets/brand/RAIOH_OH.png"]')).toBeTruthy();
    });

    it('sits the nav brand logo on the shared logo plate (stays legible in dark mode)', async () => {
      const { fixture } = await createComponent();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const logo = el.querySelector('img[src="assets/brand/RAIOH_OH.png"]');
      const plate = logo?.closest('.ioh-spin-border');
      // Same --logo-plate token as the home hero logo → black line-art emblem
      // never renders on a bare dark surface.
      expect(plate?.className).toContain('--logo-plate');
    });

    it('renders a <router-outlet /> for feature pages', async () => {
      const { fixture } = await createComponent();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    });

    it('renders the global day/night theme toggle in the nav', async () => {
      const { fixture } = await createComponent();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('lib-theme-toggle')).toBeTruthy();
      expect(el.querySelector('button.ioh-theme-toggle')).toBeTruthy();
    });
  });

  describe('initial signal state', () => {
    it('starts with all menus closed and no favorites panel', async () => {
      const { component } = await createComponent();

      expect(component.menuOpen()).toBe(false);
      expect(component.langOpen()).toBe(false);
      expect(component.showFavoritesPanel()).toBe(false);
    });

    it('defaults the active language to German', async () => {
      const { component } = await createComponent();

      expect(component.activeLang().code).toBe('de');
      expect(component.i18n.lang()).toBe('de');
    });
  });

  describe('auth-dependent navigation', () => {
    it('shows the Sign-In link (anchor) when logged out', async () => {
      const { fixture } = await createComponent();
      authStore.clear();
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('a.ioh-auth-btn')).toBeTruthy();
      expect(el.querySelector('button.ioh-auth-btn')).toBeNull();
    });

    it('shows the Sign-Out button when logged in', async () => {
      const { fixture } = await createComponent();
      authStore.setUser(buildUser());
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('button.ioh-auth-btn')).toBeTruthy();
      expect(el.querySelector('a.ioh-auth-btn')).toBeNull();
    });

    it('renders 2 menu items in the dropdown for guests (Archive + About)', async () => {
      const { component, fixture } = await createComponent();
      authStore.clear();
      component.toggleMenu();
      fixture.detectChanges();

      const dropdown = fixture.nativeElement.querySelector('#ioh-nav-dropdown');
      expect(dropdown).toBeTruthy();
      expect(dropdown.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
      expect(dropdown.querySelector('.ioh-drop-item--info')).toBeNull();
    });

    it('renders the user info row and 4 menu items for a logged-in USER', async () => {
      const { component, fixture } = await createComponent();
      authStore.setUser(buildUser('USER'));
      component.toggleMenu();
      fixture.detectChanges();

      const dropdown = fixture.nativeElement.querySelector('#ioh-nav-dropdown');
      const info = dropdown.querySelector('.ioh-drop-item--info');
      expect(info).toBeTruthy();
      expect(info.textContent).toContain('user@test.de');
      expect(dropdown.querySelectorAll('[role="menuitem"]')).toHaveLength(4);
    });

    it('renders an extra Admin entry (5 menu items) for a logged-in ADMIN', async () => {
      const { component, fixture } = await createComponent();
      authStore.setUser(buildUser('ADMIN'));
      component.toggleMenu();
      fixture.detectChanges();

      const dropdown = fixture.nativeElement.querySelector('#ioh-nav-dropdown');
      expect(dropdown.querySelectorAll('[role="menuitem"]')).toHaveLength(5);
    });

    it('shows the favorites count badge on the menu button when authenticated with favorites', async () => {
      const { fixture } = await createComponent();
      authStore.setUser(buildUser());
      favoritesStore.setIds(['v-1', 'v-2']);
      fixture.detectChanges();

      const menuBtn = fixture.nativeElement.querySelector('button[aria-haspopup="menu"]');
      expect(menuBtn.textContent).toContain('2');
    });
  });

  describe('menu toggles', () => {
    it('toggleMenu() opens then closes the menu', async () => {
      const { component } = await createComponent();

      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);

      component.toggleMenu();
      expect(component.menuOpen()).toBe(false);
    });

    it('toggleMenu() also closes the favorites panel and language dropdown', async () => {
      const { component } = await createComponent();
      component.showFavoritesPanel.set(true);
      component.langOpen.set(true);

      component.toggleMenu();

      expect(component.menuOpen()).toBe(true);
      expect(component.showFavoritesPanel()).toBe(false);
      expect(component.langOpen()).toBe(false);
    });

    it('closeMenu() closes both the menu and the language dropdown', async () => {
      const { component } = await createComponent();
      component.menuOpen.set(true);
      component.langOpen.set(true);

      component.closeMenu();

      expect(component.menuOpen()).toBe(false);
      expect(component.langOpen()).toBe(false);
    });

    it('toggleLang() toggles the language dropdown', async () => {
      const { component } = await createComponent();

      component.toggleLang();
      expect(component.langOpen()).toBe(true);

      component.toggleLang();
      expect(component.langOpen()).toBe(false);
    });

    it('toggleFavoritesPanel() / closeFavoritesPanel() control the panel signal', async () => {
      const { component } = await createComponent();

      component.toggleFavoritesPanel();
      expect(component.showFavoritesPanel()).toBe(true);

      component.closeFavoritesPanel();
      expect(component.showFavoritesPanel()).toBe(false);
    });
  });

  describe('language switching', () => {
    it('setLang() updates the language signal and the active language', async () => {
      const { component } = await createComponent();

      component.setLang('en');
      TestBed.flushEffects();

      expect(component.i18n.lang()).toBe('en');
      expect(component.activeLang().code).toBe('en');
    });

    it('setLang() closes the language dropdown and the menu', async () => {
      const { component } = await createComponent();
      component.langOpen.set(true);
      component.menuOpen.set(true);

      component.setLang('en');

      expect(component.langOpen()).toBe(false);
      expect(component.menuOpen()).toBe(false);
    });

    it('switching to Persian sets the document direction to RTL', async () => {
      const { component } = await createComponent();

      component.setLang('fa');
      TestBed.flushEffects();

      expect(component.i18n.isRtl()).toBe(true);
      expect(component.activeLang().isFa).toBe(true);
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('fa');
    });

    it('switching to German sets the document direction to LTR', async () => {
      const { component } = await createComponent();

      component.setLang('fa');
      TestBed.flushEffects();
      component.setLang('de');
      TestBed.flushEffects();

      expect(component.i18n.isRtl()).toBe(false);
      expect(document.documentElement.dir).toBe('ltr');
    });
  });

  describe('logout()', () => {
    it('calls the identity service, closes the menu and navigates home on success', async () => {
      const { component } = await createComponent();
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
      component.menuOpen.set(true);

      component.logout();

      expect(component.menuOpen()).toBe(false);
      expect(mockIdentity.logout).toHaveBeenCalledTimes(1);
      expect(navSpy).toHaveBeenCalledWith('/');
    });

    it('still navigates home when logout fails', async () => {
      mockIdentity.logout.mockReturnValueOnce(throwError(() => new Error('network')));
      const { component } = await createComponent();
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

      component.logout();

      expect(navSpy).toHaveBeenCalledWith('/');
    });
  });

  describe('goToFavorites()', () => {
    it('navigates to /videos with the favorites query param and closes menus', async () => {
      const { component } = await createComponent();
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
      component.menuOpen.set(true);
      component.showFavoritesPanel.set(true);

      component.goToFavorites();

      expect(navSpy).toHaveBeenCalledWith(['/videos'], { queryParams: { favorites: 'true' } });
      expect(component.menuOpen()).toBe(false);
      expect(component.showFavoritesPanel()).toBe(false);
    });
  });

  describe('image lightbox integration', () => {
    it('onEscapeKey() closes the lightbox when it is open', async () => {
      const { component } = await createComponent();
      const lightbox = TestBed.inject(ImageLightboxService);
      lightbox.open('assets/photo.jpg', 'caption');

      expect(lightbox.isOpen()).toBe(true);
      component.onEscapeKey();

      expect(lightbox.isOpen()).toBe(false);
    });

    it('onEscapeKey() does nothing when the lightbox is already closed', async () => {
      const { component } = await createComponent();
      const lightbox = TestBed.inject(ImageLightboxService);

      expect(() => component.onEscapeKey()).not.toThrow();
      expect(lightbox.isOpen()).toBe(false);
    });

    it('renders the lightbox overlay dialog when an image is open', async () => {
      const { component, fixture } = await createComponent();
      component.lightbox.open('assets/photo.jpg', 'Bildunterschrift', 'Alt');
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('div[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog.querySelector('img')?.getAttribute('src')).toBe('assets/photo.jpg');
    });
  });

  describe('isHomePage (toSignal over router NavigationEnd)', () => {
    // Real routes are required because isHomePage reads the live router.url on
    // every NavigationEnd — a mocked/empty router would never change it.
    async function createRoutedApp() {
      await TestBed.configureTestingModule({
        imports: [App],
        providers: [
          provideRouter([
            { path: '', component: RoutedStub },
            { path: 'videos', component: RoutedStub },
          ]),
          { provide: IdentityApiService, useValue: mockIdentity },
        ],
      }).compileComponents();

      const fixture = TestBed.createComponent(App);
      return { fixture, component: fixture.componentInstance, router: TestBed.inject(Router) };
    }

    it('reports true once a NavigationEnd lands on "/"', async () => {
      const { component, router } = await createRoutedApp();

      // Move away first, then home, so the assertion reflects a real
      // NavigationEnd emission rather than just the initialValue.
      await router.navigateByUrl('/videos');
      await router.navigateByUrl('/');
      TestBed.flushEffects();

      expect(component.isHomePage()).toBe(true);
    });

    it('reports false after navigating to a non-home route', async () => {
      const { component, router } = await createRoutedApp();

      await router.navigateByUrl('/videos');
      TestBed.flushEffects();

      expect(component.isHomePage()).toBe(false);
    });
  });
});

@Component({ template: '' })
class RoutedStub {}
