import { de } from './de';
import { en } from './en';
import { fa } from './fa';

export type Lang = 'de' | 'en' | 'fa';
export type Translations = typeof de;

export const TRANSLATIONS: Record<Lang, Translations> = { de, en, fa };
