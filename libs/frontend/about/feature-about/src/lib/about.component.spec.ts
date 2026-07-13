import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AboutComponent } from './about.component';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { ImageLightboxService } from '@iranianoralhistory/frontend-shared-ui';
import { ARCHIVE_INDEX_INTRO, ARCHIVE_INDEX_SECTIONS } from './archive-index.data';

const mockI18n = {
  lang: jest.fn().mockReturnValue('de'),
  isRtl: jest.fn().mockReturnValue(false),
  t: jest.fn().mockImplementation((key: string) => key),
  setLang: jest.fn(),
};

const mockLightbox = {
  open: jest.fn(),
  close: jest.fn(),
};

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [AboutComponent],
    providers: [
      provideRouter([]),
      { provide: I18nService, useValue: mockI18n },
      { provide: ImageLightboxService, useValue: mockLightbox },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AboutComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('AboutComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18n.isRtl.mockReturnValue(false);
    mockI18n.lang.mockReturnValue('de');
    mockI18n.t.mockImplementation((key: string) => key);
    // jsdom does not implement these navigation side-effects.
    window.scrollTo = jest.fn() as unknown as typeof window.scrollTo;
    window.open = jest.fn() as unknown as typeof window.open;
  });

  it('creates and defaults to the overview section', async () => {
    const { component } = await createComponent();
    expect(component).toBeTruthy();
    expect(component.activeSection()).toBe('overview');
    expect(component.menuOpen()).toBe(false);
    expect(component.partiesIndexOpen()).toBe(false);
  });

  it('renders the header and the overview section by default', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header')).toBeTruthy();
    expect(el.querySelector('.about-section-anim')).toBeTruthy();
    expect(el.querySelector('nav')).toBeTruthy();
  });

  it('renders a sidebar button for every visible section', async () => {
    const { fixture, component } = await createComponent();
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('nav button');
    expect(buttons.length).toBe(component.visibleSections().length);
  });

  it('exposes the Persian archive index reference data', async () => {
    const { component } = await createComponent();
    expect(component.archiveIndexIntro).toBe(ARCHIVE_INDEX_INTRO);
    expect(component.archiveIndexSections).toBe(ARCHIVE_INDEX_SECTIONS);
  });

  it('defines the full testimonials and team rosters', async () => {
    const { component } = await createComponent();
    expect(component.testimonials).toHaveLength(6);
    expect(component.teamMembers).toHaveLength(7);
    expect(component.archivePdfLinks).toHaveLength(4);
  });

  describe('setSection()', () => {
    it('updates the active section and scrolls to top', async () => {
      const { component } = await createComponent();

      component.setSection('team');

      expect(component.activeSection()).toBe('team');
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('closes the mobile menu and the parties index panel', async () => {
      const { component } = await createComponent();
      component.menuOpen.set(true);
      component.partiesIndexOpen.set(true);

      component.setSection('contact');

      expect(component.menuOpen()).toBe(false);
      expect(component.partiesIndexOpen()).toBe(false);
    });
  });

  describe('menu + panel toggles', () => {
    it('toggleMenu() flips the menu open state', async () => {
      const { component } = await createComponent();

      component.toggleMenu();
      expect(component.menuOpen()).toBe(true);
      component.toggleMenu();
      expect(component.menuOpen()).toBe(false);
    });

    it('closeMenu() closes the menu', async () => {
      const { component } = await createComponent();
      component.menuOpen.set(true);

      component.closeMenu();

      expect(component.menuOpen()).toBe(false);
    });

    it('togglePartiesIndex() flips the parties index panel', async () => {
      const { component } = await createComponent();

      component.togglePartiesIndex();
      expect(component.partiesIndexOpen()).toBe(true);
      component.togglePartiesIndex();
      expect(component.partiesIndexOpen()).toBe(false);
    });
  });

  describe('toFa()', () => {
    it('converts Latin digits to Persian digits', async () => {
      const { component } = await createComponent();

      expect(component.toFa(0)).toBe('۰');
      expect(component.toFa(12)).toBe('۱۲');
      expect(component.toFa(2024)).toBe('۲۰۲۴');
    });
  });

  describe('lightbox + document openers', () => {
    it('openGhaniImage() opens the lightbox with the Ghani/Ahmadi photo', async () => {
      const { component } = await createComponent();

      component.openGhaniImage();

      expect(mockLightbox.open).toHaveBeenCalledWith(
        'assets/about/ghani-Hamid.jpg',
        'غنی بلوریان و حمید احمدی — پراگ، آخر بهار ۱۹۸۶',
      );
    });

    it('openAboutPdf() opens the given file in a new tab', async () => {
      const { component } = await createComponent();

      component.openAboutPdf('asnad.pdf');

      expect(window.open).toHaveBeenCalledWith(
        'assets/about/asnad.pdf',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('openAsnadPdf() opens the asnad PDF in a new tab', async () => {
      const { component } = await createComponent();

      component.openAsnadPdf();

      expect(window.open).toHaveBeenCalledWith(
        'assets/about/asnad.pdf',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('openConferencePdf() opens the oral-history conference PDF', async () => {
      const { component } = await createComponent();

      component.openConferencePdf();

      expect(window.open).toHaveBeenCalledWith(
        'assets/about/Internat-Oral-History-Conference-9.pdf',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('openAgreementPdf() and openTawafoghPdf() open their PDFs', async () => {
      const { component } = await createComponent();

      component.openAgreementPdf();
      component.openTawafoghPdf();

      expect(window.open).toHaveBeenCalledWith(
        'assets/about/agreement.pdf',
        '_blank',
        'noopener,noreferrer',
      );
      expect(window.open).toHaveBeenCalledWith(
        'assets/about/tawafognameh.pdf',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('openAlaviCoverGif() opens the Alavi cover GIF', async () => {
      const { component } = await createComponent();

      component.openAlaviCoverGif();

      expect(window.open).toHaveBeenCalledWith(
        'assets/about/alavi1.gif',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });

  describe('visibleSections()', () => {
    it('hides RTL-only sections outside Persian', async () => {
      mockI18n.isRtl.mockReturnValue(false);
      const { component } = await createComponent();

      const keys = component.visibleSections().map((s) => s.key);
      expect(keys).toContain('overview');
      expect(keys).not.toContain('genesis');
      expect(keys).not.toContain('finance');
    });

    it('includes RTL-only sections in Persian', async () => {
      mockI18n.isRtl.mockReturnValue(true);
      const { component } = await createComponent();

      const keys = component.visibleSections().map((s) => s.key);
      expect(keys).toContain('genesis');
      expect(keys).toContain('finance');
    });
  });

  describe('active-section fallback effect', () => {
    it('resets to overview when the active section becomes hidden', async () => {
      mockI18n.isRtl.mockReturnValue(false);
      const { component } = await createComponent();

      component.activeSection.set('genesis'); // RTL-only, hidden in German
      TestBed.flushEffects();

      expect(component.activeSection()).toBe('overview');
    });

    it('keeps an RTL-only section active in Persian', async () => {
      mockI18n.isRtl.mockReturnValue(true);
      const { component } = await createComponent();

      component.activeSection.set('genesis');
      TestBed.flushEffects();

      expect(component.activeSection()).toBe('genesis');
    });
  });
});
