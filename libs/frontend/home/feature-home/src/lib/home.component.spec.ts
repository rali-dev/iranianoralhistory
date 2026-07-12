// GSAP is loaded lazily inside afterNextRender() to drive scroll animations.
// jsdom has no real layout engine, so we stub the module to keep the animation
// lifecycle inert and error-free while still exercising the render path.
jest.mock('gsap', () => ({
  gsap: {
    registerPlugin: jest.fn(),
    from: jest.fn(),
    to: jest.fn(),
  },
}));
jest.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }));

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [HomeComponent],
    providers: [provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(HomeComponent);
  return {
    fixture,
    component: fixture.componentInstance,
    i18n: TestBed.inject(I18nService),
  };
}

describe('HomeComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  it('creates', async () => {
    const { component } = await createComponent();
    expect(component).toBeTruthy();
  });

  it('renders the hero, stats, mission and CTA sections', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.hero-section')).toBeTruthy();
    expect(el.querySelector('.stats-section')).toBeTruthy();
    expect(el.querySelector('.mission-grid')).toBeTruthy();
    expect(el.querySelector('.cta-section')).toBeTruthy();
    expect(el.querySelector('footer')).toBeTruthy();
  });

  it('renders the static Persian hero line', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent as string).toContain('شاهدان تاریخ');
  });

  it('renders the four scroll-counter stat targets', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const stats = fixture.nativeElement.querySelectorAll('.stat-number');
    expect(stats.length).toBe(4);
  });

  describe('heroWords()', () => {
    it('returns the German hero words by default', async () => {
      const { component } = await createComponent();
      expect(component.heroWords()).toEqual(['Zeugen', 'der', 'Geschichte']);
    });

    it('returns the English hero words after switching to en', async () => {
      const { component, i18n } = await createComponent();

      i18n.setLang('en');

      expect(component.heroWords()).toEqual(['Witnesses', 'of', 'History']);
    });

    it('returns the Persian hero words after switching to fa', async () => {
      const { component, i18n } = await createComponent();

      i18n.setLang('fa');

      expect(component.heroWords()).toEqual(['شاهدان', 'تاریخ']);
    });
  });

  it('renders one .hero-word span per computed hero word', async () => {
    const { fixture, component } = await createComponent();
    fixture.detectChanges();

    const spans = fixture.nativeElement.querySelectorAll('.hero-word');
    expect(spans.length).toBe(component.heroWords().length);
  });

  it('renders RouterLinks to the video catalogue', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a[routerLink="/videos"]');
    expect(links.length).toBeGreaterThan(0);
  });
});
