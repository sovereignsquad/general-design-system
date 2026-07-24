import { ar } from './ar';
import { de } from './de';
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { he } from './he';
import { hu } from './hu';
import { it } from './it';
import { ja } from './ja';
import { ko } from './ko';
import { ru } from './ru';
import { zh } from './zh';

export * from './en';
export * from './es';
export * from './hu';
export * from './de';
export * from './fr';
export * from './it';
export * from './ru';
export * from './he';
export * from './ar';
export * from './zh';
export * from './ja';
export * from './ko';

export const gdsLocales = {
  en,
  es,
  hu,
  de,
  fr,
  it,
  ru,
  he,
  ar,
  zh,
  ja,
  ko,
} as const;

export type GdsLocale = keyof typeof gdsLocales;

export function getGdsMessages(locale: GdsLocale | string) {
  return gdsLocales[locale as GdsLocale] ?? en;
}
