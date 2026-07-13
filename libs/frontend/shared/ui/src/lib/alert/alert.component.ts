import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type AlertVariant = 'danger' | 'success' | 'info';

/**
 * Geteilte Alert-Komponente des Design-Systems.
 *
 * Ersetzt die zuvor 5-fach duplizierten Fehler-/Hinweisblöcke (Auth-Formulare
 * etc.). Nutzt die semantischen Tokens (`--danger-*`, `--success`, `--accent`),
 * setzt die korrekte ARIA-Rolle (`alert` bei Fehlern, sonst `status`) und
 * projiziert beliebigen Inhalt via `<ng-content>`.
 *
 * Verwendung:
 *   <lib-alert>Etwas ist schiefgelaufen.</lib-alert>            <!-- danger -->
 *   <lib-alert variant="success">Gespeichert.</lib-alert>
 */
@Component({
  selector: 'lib-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="rootClass()" [attr.role]="role()">
      <svg class="flex-shrink-0" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
        <path [attr.d]="iconPath()"></path>
      </svg>
      <div class="min-w-0"><ng-content></ng-content></div>
    </div>
  `,
})
export class AlertComponent {
  readonly variant = input<AlertVariant>('danger');

  /** Fehler sind assertiv (`alert`), Erfolg/Info sind höflich (`status`). */
  readonly role = computed(() => (this.variant() === 'danger' ? 'alert' : 'status'));

  private readonly base =
    'flex items-center gap-2 py-3 px-[0.875rem] border rounded-[6px] ' +
    'font-[family-name:var(--font-ui)] text-[0.875rem] font-normal leading-[1.45]';

  readonly rootClass = computed(() => {
    switch (this.variant()) {
      case 'success':
        return (
          this.base +
          ' bg-[color-mix(in_srgb,var(--success,#2f6b4f)_10%,transparent)]' +
          ' border-[color-mix(in_srgb,var(--success,#2f6b4f)_35%,transparent)]' +
          ' text-[var(--success,#2f6b4f)]'
        );
      case 'info':
        return (
          this.base +
          ' bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]' +
          ' border-[color-mix(in_srgb,var(--accent)_18%,transparent)]' +
          ' text-[var(--text-secondary)]'
        );
      default:
        return (
          this.base +
          ' bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger-fg)]'
        );
    }
  });

  readonly iconPath = computed(() => {
    switch (this.variant()) {
      case 'success':
        return 'M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z';
      case 'info':
        return 'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-4-48V128a8,8,0,0,1,16,0v-.13a8,8,0,0,1-8,8h0A8,8,0,0,1,124,168Zm4-84a12,12,0,1,1-12,12A12,12,0,0,1,128,84Z';
      default:
        return 'M236.8,188.09,149.35,36.22a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM120,104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm8,88a12,12,0,1,1,12-12A12,12,0,0,1,128,192Z';
    }
  });
}
