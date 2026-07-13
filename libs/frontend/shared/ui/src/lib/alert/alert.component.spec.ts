import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AlertComponent, AlertVariant } from './alert.component';

@Component({
  standalone: true,
  imports: [AlertComponent],
  template: `<lib-alert [variant]="variant"><span class="msg">Boom</span></lib-alert>`,
})
class HostComponent {
  variant: AlertVariant = 'danger';
}

async function render(variant: AlertVariant) {
  await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  const fixture = TestBed.createComponent(HostComponent);
  fixture.componentInstance.variant = variant;
  fixture.detectChanges();
  return fixture;
}

describe('AlertComponent', () => {
  it('projects its content', async () => {
    const fixture = await render('danger');
    expect(fixture.nativeElement.querySelector('.msg')?.textContent).toContain('Boom');
  });

  it('is an assertive alert for the danger variant', async () => {
    const fixture = await render('danger');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('applies the danger tokens by default', async () => {
    const fixture = await render('danger');
    const root = fixture.nativeElement.querySelector('div');
    expect(root.className).toContain('var(--danger-bg)');
    expect(root.className).toContain('var(--danger-fg)');
  });

  it('is a polite status for success and info', async () => {
    const success = await render('success');
    expect(success.nativeElement.querySelector('[role="status"]')).toBeTruthy();
    expect(success.nativeElement.querySelector('div').className).toContain('var(--success');

    TestBed.resetTestingModule();
    const info = await render('info');
    expect(info.nativeElement.querySelector('[role="status"]')).toBeTruthy();
  });

  it('renders an icon path for each variant', async () => {
    for (const v of ['danger', 'success', 'info'] as AlertVariant[]) {
      TestBed.resetTestingModule();
      const fixture = await render(v);
      const d = fixture.nativeElement.querySelector('path')?.getAttribute('d');
      expect(typeof d).toBe('string');
      expect((d as string).length).toBeGreaterThan(10);
    }
  });
});
