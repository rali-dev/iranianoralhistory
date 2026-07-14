import { TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from './theme.service';

// localStorage-Mock, damit der providedIn-root ThemeService instanziierbar ist.
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

async function render() {
  await TestBed.configureTestingModule({
    imports: [ThemeToggleComponent],
  }).compileComponents();
  const fixture = TestBed.createComponent(ThemeToggleComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('ThemeToggleComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('theme-anim');
    // @ts-expect-error — kein prefers-reduced-motion-Leak zwischen Tests.
    delete window.matchMedia;
  });

  it('rendert einen beschrifteten Umschalt-Button mit beiden Icons', async () => {
    const { fixture } = await render();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button.ioh-theme-toggle');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ioh-theme-toggle__sun')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.ioh-theme-toggle__moon')).toBeTruthy();
  });

  it('startet mit aria-pressed=false (Day) und schaltet per Klick auf Night', async () => {
    const { fixture, component } = await render();
    const theme = TestBed.inject(ThemeService);
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(btn.getAttribute('aria-pressed')).toBe('false');

    btn.click();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(theme.isDark()).toBe(true);
    expect(component.isDark()).toBe(true);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('das aria-label beschreibt die nächste Aktion (Ziel-Modus)', async () => {
    const { fixture } = await render();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const dayLabel = btn.getAttribute('aria-label');

    btn.click();
    TestBed.flushEffects();
    fixture.detectChanges();

    const nightLabel = btn.getAttribute('aria-label');
    expect(nightLabel).not.toBe(dayLabel);
    expect(dayLabel?.length).toBeGreaterThan(0);
    expect(nightLabel?.length).toBeGreaterThan(0);
  });
});
