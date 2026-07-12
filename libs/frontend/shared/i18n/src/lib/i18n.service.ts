import { Injectable, signal, computed, effect } from '@angular/core';
import { TRANSLATIONS, type Lang } from './translations';

export type { Lang };

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _lang = signal<Lang>(
    (localStorage.getItem('ioh-lang') as Lang | null) ?? 'de',
  );

  readonly lang = this._lang.asReadonly();
  readonly isRtl = computed(() => this._lang() === 'fa');

  constructor() {
    this.applyDocAttrs(this._lang());
    effect(() => this.applyDocAttrs(this._lang()));
  }

  setLang(lang: Lang): void {
    this._lang.set(lang);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const lang = this._lang();
    const parts = key.split('.');
    let node: unknown = TRANSLATIONS[lang];
    for (const part of parts) {
      if (typeof node !== 'object' || node === null) return key;
      node = (node as Record<string, unknown>)[part];
    }
    if (typeof node !== 'string') return key;
    if (!params) return node;
    return Object.entries(params).reduce(
      (s, [k, v]) => s.split(`{{${k}}}`).join(String(v)),
      node,
    );
  }

  private applyDocAttrs(lang: Lang): void {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    try { localStorage.setItem('ioh-lang', lang); } catch { /* ignore */ }
  }
}
