import { en } from './locales/en.js';
import { fr } from './locales/fr.js';
import type { Catalog } from './locales/en.js';

export type { Catalog } from './locales/en.js';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const catalogs: Record<Locale, Catalog> = { fr, en };

/**
 * Fills {placeholders} in a catalog string. Values are formatted at the call
 * site; this only substitutes.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}
