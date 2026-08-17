import { describe, expect, it } from 'vitest';
import { catalogs, fill } from '../src/index.js';

function flatten(value: unknown, path: string[] = []): Array<[string, string]> {
  if (typeof value === 'string') {
    return [[path.join('.'), value]];
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => flatten(child, [...path, key]));
  }
  return [];
}

describe('catalogs', () => {
  it('fr and en expose exactly the same keys', () => {
    const enKeys = flatten(catalogs.en).map(([key]) => key);
    const frKeys = flatten(catalogs.fr).map(([key]) => key);
    expect(frKeys).toEqual(enKeys);
  });

  it('no string in any catalog contains an em dash', () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      for (const [key, text] of flatten(catalog)) {
        expect(text.includes('—'), `${locale}:${key} contains an em dash`).toBe(false);
      }
    }
  });

  it('no string uses banned marketing vocabulary', () => {
    const banned = [/sustainab/i, /eco-friendly/i, /\bgreen\b/i, /planet/i, /seamless/i, /empower/i];
    // the green web foundation is the named source of the hosting dataset
    // (operating manual section 10); a data source citation is not marketing
    // vocabulary, so the exact proper noun is exempt
    const properNouns = [/Green Web Foundation/g];
    for (const [locale, catalog] of Object.entries(catalogs)) {
      for (const [key, text] of flatten(catalog)) {
        const scanned = properNouns.reduce((acc, noun) => acc.replace(noun, ''), text);
        for (const pattern of banned) {
          expect(pattern.test(scanned), `${locale}:${key} matches ${pattern}`).toBe(false);
        }
      }
    }
  });

  it('fill substitutes named placeholders and leaves unknown ones visible', () => {
    expect(fill('Continuous since {date} · {runs} runs retained', { date: '03 Mar', runs: '4 812' })).toBe(
      'Continuous since 03 Mar · 4 812 runs retained',
    );
    expect(fill('{missing} stays', {})).toBe('{missing} stays');
  });
});
