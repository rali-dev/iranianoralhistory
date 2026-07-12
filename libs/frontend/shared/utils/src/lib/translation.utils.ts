import { IVideoTranslation } from '@iranianoralhistory/shared-contracts';

export function buildTranslation(de: string, en: string, fa: string): IVideoTranslation {
  return { de: de.trim(), en: en.trim(), fa: fa.trim() };
}

export function buildOptionalTranslation(
  de: string,
  en: string,
  fa: string,
): IVideoTranslation | undefined {
  const d = de.trim();
  const e = en.trim();
  const f = fa.trim();
  return d || e || f ? { de: d, en: e, fa: f } : undefined;
}
