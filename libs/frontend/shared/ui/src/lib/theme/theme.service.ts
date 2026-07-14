import { Injectable, computed, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

/** LocalStorage-Schlüssel für die vom Nutzer gewählte Farbschema-Präferenz. */
const STORAGE_KEY = 'ioh-theme';

/**
 * Zentrale, signalbasierte Steuerung des Farbschemas (Day/Night).
 *
 * Analog zum {@link ImageLightboxService} und zum `I18nService`:
 *  - Single Source of Truth als Angular-Signal (kein NgRx),
 *  - persistiert die explizite Nutzerwahl in `localStorage`,
 *  - respektiert beim Erststart die System-Präferenz (`prefers-color-scheme`),
 *  - spiegelt den Zustand als `data-theme`-Attribut auf `<html>`, worauf die
 *    Token-Override-Schicht in `styles.css` reagiert (alle `var(--…)`-Flächen
 *    kippen dadurch automatisch — keine komponentenweite Farblogik nötig).
 *
 * Der Service ist bewusst frei von Timern/Animations-Nebenwirkungen, damit er
 * deterministisch testbar bleibt; die visuelle Übergangsanimation lebt in der
 * {@link ThemeToggleComponent}.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.resolveInitial());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    this.apply(this._theme());
    effect(() => this.apply(this._theme()));
  }

  /** Wechselt zwischen Day- und Night-Modus. */
  toggle(): void {
    this._theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  /** Setzt das Farbschema explizit. */
  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  /** Gespeicherte Wahl > System-Präferenz > Light (aktuelles UI als Default). */
  private resolveInitial(): Theme {
    const stored = this.readStored();
    if (stored === 'light' || stored === 'dark') return stored;
    return this.prefersDark() ? 'dark' : 'light';
  }

  private readStored(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private prefersDark(): boolean {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    } catch {
      return false;
    }
  }

  private apply(theme: Theme): void {
    try {
      document.documentElement.setAttribute('data-theme', theme);
    } catch {
      /* Nicht-DOM-Umgebung — ignorieren. */
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Speicher nicht verfügbar — ignorieren. */
    }
  }
}
