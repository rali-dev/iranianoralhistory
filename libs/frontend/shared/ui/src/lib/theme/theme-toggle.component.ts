import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { I18nService } from '@iranianoralhistory/frontend-shared-i18n';
import { ThemeService } from './theme.service';

/**
 * Wiederverwendbarer Day/Night-Umschalter des Design-Systems.
 *
 * Zeigt den *aktuellen* Zustand: eine Sonne im Day-Modus, einen (nicht vollen)
 * Halbmond im Night-Modus. Der weiche Icon-Übergang (Rotation + Cross-Fade)
 * wird rein per CSS über den `[data-theme]`-Vorfahren gesteuert (siehe
 * `.ioh-theme-toggle__*` in `styles.css`) und respektiert
 * `prefers-reduced-motion`.
 *
 * Stil-Parität mit den übrigen Nav-Buttons über `ioh-nav-btn-border`; alle
 * Farben laufen über Design-Tokens, damit der Button in beiden Modi passt.
 *
 * Verwendung:  `<lib-theme-toggle />`
 */
@Component({
  selector: 'lib-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="ioh-theme-toggle ioh-nav-btn-border relative inline-flex items-center justify-center w-[47px] h-[47px] flex-shrink-0 bg-transparent border-0 cursor-pointer transition-[color,background] duration-200 text-[color-mix(in_srgb,var(--ink)_65%,transparent)] hover:text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-[3px]"
      (click)="toggle()"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      [attr.aria-pressed]="isDark()"
    >
      <span class="ioh-theme-toggle__icon" aria-hidden="true">
        <!-- Sonne (Day) -->
        <svg class="ioh-theme-toggle__sun" viewBox="0 0 256 256" fill="currentColor">
          <path
            d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm8,24a64,64,0,1,0,64,64A64.07,64.07,0,0,0,128,64Zm0,112a48,48,0,1,1,48-48A48.05,48.05,0,0,1,128,176ZM61.66,73A8,8,0,0,0,73,61.66L56,44.69A8,8,0,0,0,44.69,56Zm0,110L44.69,200A8,8,0,0,0,56,211.31L73,194.34A8,8,0,0,0,61.66,183ZM192,72a8,8,0,0,0,5.66-2.34l17-17A8,8,0,0,0,203.31,41.37l-17,17A8,8,0,0,0,192,72Zm5.66,111A8,8,0,0,0,183,194.34l17,17A8,8,0,0,0,211.31,200ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z"
          />
        </svg>
        <!-- Halbmond (Night) -->
        <svg class="ioh-theme-toggle__moon" viewBox="0 0 256 256" fill="currentColor">
          <path
            d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z"
          />
        </svg>
      </span>
    </button>
  `,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  private readonly i18n = inject(I18nService);

  readonly isDark = this.themeService.isDark;

  /** ARIA/Tooltip beschreibt die Aktion (Ziel-Modus), nicht den Ist-Zustand. */
  readonly label = computed(() =>
    this.i18n.t(this.isDark() ? 'THEME.TO_LIGHT' : 'THEME.TO_DARK'),
  );

  toggle(): void {
    this.animateThemeChange();
    this.themeService.toggle();
  }

  /**
   * Aktiviert für ~480 ms einen globalen Farb-Übergang (Klasse `theme-anim` auf
   * `<html>`, siehe `styles.css`). Bleibt in der UI-Schicht, damit der
   * {@link ThemeService} timer-/nebenwirkungsfrei testbar bleibt.
   */
  private animateThemeChange(): void {
    if (typeof document === 'undefined') return;
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const el = document.documentElement;
    el.classList.add('theme-anim');
    window.setTimeout(() => el.classList.remove('theme-anim'), 480);
  }
}
