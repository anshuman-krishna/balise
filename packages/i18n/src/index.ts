import { en } from './locales/en.js';
import { fr } from './locales/fr.js';
import type { Catalog } from './locales/en.js';

export type { Catalog } from './locales/en.js';

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const catalogs: Record<Locale, Catalog> = { fr, en };

/**
 * fills {placeholders} in a catalog string. values are formatted at the call
 * site; this only substitutes.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

/**
 * a fragment of a filled sentence, carrying how it should be set. a measured
 * quantity and an identifier are typeset differently from the prose around
 * them, and the sentence is one translatable string rather than a chain of
 * fragments a translator cannot reorder.
 */
export interface TextPart {
  text: string;
  /** an identifier, path or hash: set in the mono face. */
  token?: boolean;
  /** a measured quantity: set strong. */
  measure?: boolean;
}

export type PartValue = TextPart | string | number;

/**
 * fills {placeholders} and keeps each substitution addressable, so a sentence
 * can mark its own identifiers and quantities without being cut into pieces at
 * the call site.
 */
export function fillParts(template: string, values: Record<string, PartValue>): TextPart[] {
  const parts: TextPart[] = [];
  let cursor = 0;

  for (const match of template.matchAll(/\{(\w+)\}/g)) {
    const key = match[1]!;
    const value = values[key];
    if (value === undefined) continue;

    const before = template.slice(cursor, match.index);
    if (before.length > 0) parts.push({ text: before });
    parts.push(typeof value === 'object' ? value : { text: String(value) });
    cursor = match.index + match[0].length;
  }

  const tail = template.slice(cursor);
  if (tail.length > 0) parts.push({ text: tail });
  return parts;
}
