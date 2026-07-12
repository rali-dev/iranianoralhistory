import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

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

function createService(): I18nService {
  TestBed.configureTestingModule({});
  return TestBed.inject(I18nService);
}

describe('I18nService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  describe('initial state', () => {
    it('defaults to "de" when localStorage has no saved lang', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const service = createService();

      expect(service.lang()).toBe('de');
    });

    it('restores the saved language from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('en');

      const service = createService();

      expect(service.lang()).toBe('en');
    });

    it('applies document attributes for the initial language', () => {
      localStorageMock.getItem.mockReturnValue(null);

      createService();

      expect(document.documentElement.lang).toBe('de');
      expect(document.documentElement.dir).toBe('ltr');
    });
  });

  describe('setLang()', () => {
    it('changes the lang signal', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const service = createService();

      service.setLang('en');

      expect(service.lang()).toBe('en');
    });

    it('updates document lang attribute', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const service = createService();

      service.setLang('fa');
      TestBed.flushEffects();

      expect(document.documentElement.lang).toBe('fa');
    });

    it('sets dir to rtl for Persian', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const service = createService();

      service.setLang('fa');
      TestBed.flushEffects();

      expect(document.documentElement.dir).toBe('rtl');
    });

    it('sets dir to ltr for German', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const service = createService();

      service.setLang('de');
      TestBed.flushEffects();

      expect(document.documentElement.dir).toBe('ltr');
    });

    it('persists the language to localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const service = createService();

      service.setLang('en');
      TestBed.flushEffects();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('ioh-lang', 'en');
    });
  });

  describe('isRtl computed', () => {
    it('is false for German', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      expect(service.isRtl()).toBe(false);
    });

    it('is false for English', () => {
      localStorageMock.getItem.mockReturnValue('en');
      const service = createService();

      expect(service.isRtl()).toBe(false);
    });

    it('is true for Persian', () => {
      localStorageMock.getItem.mockReturnValue('fa');
      const service = createService();

      expect(service.isRtl()).toBe(true);
    });

    it('updates when language changes', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      expect(service.isRtl()).toBe(false);
      service.setLang('fa');
      expect(service.isRtl()).toBe(true);
    });
  });

  describe('t()', () => {
    it('returns the German translation for a known key', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      const result = service.t('NAV.ARCHIVE');

      expect(result).toBe('Archiv');
    });

    it('returns the English translation after switching to en', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      service.setLang('en');
      const result = service.t('NAV.ARCHIVE');

      expect(result).not.toBe('');
      expect(typeof result).toBe('string');
    });

    it('returns the key when a path segment does not exist', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      const result = service.t('NONEXISTENT.KEY');

      expect(result).toBe('NONEXISTENT.KEY');
    });

    it('returns the key when the traversal hits a non-object node', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      const result = service.t('NAV.ARCHIVE.TOO.DEEP');

      expect(result).toBe('NAV.ARCHIVE.TOO.DEEP');
    });

    it('returns the key when the resolved value is not a string', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      const result = service.t('NAV');

      expect(result).toBe('NAV');
    });

    it('interpolates params into the translation string', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      const result = service.t('NAV.FAVORITES_COUNT_ONE', { n: 3 });

      expect(result).toContain('3');
      expect(result).not.toContain('{{n}}');
    });

    it('interpolates multiple params', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      const result = service.t('NAV.FAVORITES_COUNT_LABEL', { n: 5 });

      expect(result).toContain('5');
    });

    it('returns a non-parameterised translation unchanged when no params given', () => {
      localStorageMock.getItem.mockReturnValue('de');
      const service = createService();

      const text = service.t('NAV.LOGIN');

      expect(text).toBe('Anmelden');
    });
  });
});
