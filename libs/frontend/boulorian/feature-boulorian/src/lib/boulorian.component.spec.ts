import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BoulorianComponent } from './boulorian.component';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';

async function createComponent() {
  await TestBed.configureTestingModule({
    imports: [BoulorianComponent],
    providers: [provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(BoulorianComponent);
  return { fixture, component: fixture.componentInstance };
}

describe('BoulorianComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates', async () => {
    const { component } = await createComponent();
    expect(component).toBeTruthy();
  });

  it('exposes the injected I18nService', async () => {
    const { component } = await createComponent();
    expect(component.i18n).toBeInstanceOf(I18nService);
  });

  it('renders the letter page title heading', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('متن کامل نامه غنی بلوریان به حزب کمونیست شوروی');
  });

  it('renders the addressee, salutation and signature blocks', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('رفقای گرامی');
    expect(text).toContain('غنی بلوریان، عضو هیأت سیاسی حزب توده ایران');
    expect(text).toContain('رونوشت به:');
  });

  it('renders the two scanned document figures', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const imgs = fixture.nativeElement.querySelectorAll('figure img');
    expect(imgs.length).toBe(2);
    expect((imgs[0] as HTMLImageElement).getAttribute('src')).toContain('boulorian-seite-1.gif');
    expect((imgs[1] as HTMLImageElement).getAttribute('src')).toContain('boulorian-seite-2.gif');
  });

  it('renders RouterLinks back to the about page', async () => {
    const { fixture } = await createComponent();
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a[routerLink="/about"]');
    expect(links.length).toBeGreaterThan(0);
  });
});
