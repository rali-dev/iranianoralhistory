import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

// Deterministischer localStorage-Mock (wie im i18n-Spec), damit resolveInitial
// und apply() ohne echte Browser-Storage-API laufen.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

/** matchMedia in jsdom simulieren; `dark` steuert prefers-color-scheme. */
function mockMatchMedia(dark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: jest.fn((query: string) => ({
      matches: dark && query.includes('dark'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

function createService(): ThemeService {
  TestBed.configureTestingModule({ providers: [ThemeService] });
  return TestBed.inject(ThemeService);
}

describe('ThemeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-theme');
    // @ts-expect-error — Reset zwischen Tests, damit kein matchMedia leakt.
    delete window.matchMedia;
  });

  describe('initialisierung', () => {
    it('startet im Light-Modus, wenn nichts gespeichert ist und das System kein Dark bevorzugt', () => {
      mockMatchMedia(false);
      const service = createService();
      expect(service.theme()).toBe('light');
      expect(service.isDark()).toBe(false);
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('übernimmt die System-Präferenz (dark) beim Erststart ohne gespeicherte Wahl', () => {
      mockMatchMedia(true);
      const service = createService();
      expect(service.theme()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('bevorzugt die gespeicherte Nutzerwahl vor der System-Präferenz', () => {
      mockMatchMedia(true); // System will dark …
      localStorageMock.getItem.mockReturnValueOnce('light'); // … Nutzer wählte light
      const service = createService();
      expect(service.theme()).toBe('light');
    });

    it('ist robust, wenn matchMedia in der Umgebung fehlt', () => {
      const service = createService();
      expect(service.theme()).toBe('light');
    });
  });

  describe('toggle & setTheme', () => {
    it('toggle() wechselt light → dark → light und spiegelt das Attribut', () => {
      const service = createService();

      service.toggle();
      TestBed.flushEffects();
      expect(service.theme()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      service.toggle();
      TestBed.flushEffects();
      expect(service.theme()).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('persistiert die Wahl in localStorage', () => {
      const service = createService();
      service.setTheme('dark');
      TestBed.flushEffects();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('ioh-theme', 'dark');
    });

    it('setTheme() setzt den Wert direkt', () => {
      const service = createService();
      service.setTheme('dark');
      expect(service.theme()).toBe('dark');
      service.setTheme('light');
      expect(service.theme()).toBe('light');
    });
  });
});
