import { describe, expect, it } from 'vitest';
import { attributeBundle, utf8Length } from '../src/bundle.js';
import { buildBundle, byteLength } from './fixtures/bundle-builder.js';

const MODULES = [
  { source: 'webpack://selo/./src/main.ts', code: 'const app=document.querySelector("#app");' },
  { source: 'webpack://selo/./node_modules/date-fns/locale/fr/index.js', code: 'export const fr={code:"fr",months:["janvier","février","mars"]};' },
  { source: 'webpack://selo/./src/runtime.ts', code: 'boot(app);' },
];

describe('attributeBundle', () => {
  it('credits every source with the bytes its mappings cover', () => {
    const fixture = buildBundle('https://selo.fr/assets/app.a3f2.js', MODULES);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error(`expected resolved, got ${result.reason}`);

    for (const module of MODULES) {
      const attributed = result.sources.find((source) => source.rawPath === module.source);
      expect(attributed?.bytes).toBe(fixture.expectedBytes[module.source]);
    }
  });

  it('accounts for every byte of the file, with the remainder named as unattributed', () => {
    const fixture = buildBundle('https://selo.fr/assets/app.a3f2.js', MODULES);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');

    const attributed = result.sources.reduce((total, source) => total + source.bytes, 0);
    expect(result.unattributedBytes).toBe(fixture.expectedUnattributed);
    expect(attributed + result.unattributedBytes).toBe(result.totalBytes);
    expect(result.totalBytes).toBe(byteLength(fixture.content));
  });

  it('counts multi-byte characters as bytes, not as characters', () => {
    const withAccents = [{ source: 'src/a.ts', code: 'const mois="février";' }];
    const fixture = buildBundle('https://selo.fr/a.js', withAccents);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');
    expect(result.sources[0]!.bytes).toBe(byteLength(withAccents[0]!.code) + 1);
    expect(byteLength(withAccents[0]!.code)).toBeGreaterThan(withAccents[0]!.code.length);
  });

  it('names the package a module belongs to', () => {
    const fixture = buildBundle('https://selo.fr/a.js', MODULES);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');
    const locale = result.sources.find((source) => source.path.includes('date-fns'));
    expect(locale?.packageName).toBe('date-fns');
    expect(result.sources.find((source) => source.path === 'src/main.ts')?.packageName).toBeNull();
  });

  it('sorts by bytes so the largest contributor is first', () => {
    const fixture = buildBundle('https://selo.fr/a.js', MODULES);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');
    expect(result.sources[0]!.path).toContain('date-fns');
  });

  it('reports a missing bundle body rather than attributing from the map alone', () => {
    const fixture = buildBundle('https://selo.fr/a.js', MODULES);
    const result = attributeBundle({ url: fixture.url, sourceMap: fixture.sourceMap });
    if (result.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('bundle-content-unavailable');
  });

  it('reports a missing map by name', () => {
    const result = attributeBundle({ url: 'https://selo.fr/a.js', content: 'boot();' });
    if (result.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('no-source-map');
  });

  it('refuses a map that does not describe the file it was given', () => {
    const fixture = buildBundle('https://selo.fr/a.js', MODULES);
    const truncated = attributeBundle({
      url: fixture.url,
      content: fixture.content.split('\n')[0]!,
      sourceMap: fixture.sourceMap,
    });
    if (truncated.status !== 'unavailable') throw new Error('expected unavailable');
    expect(truncated.reason).toBe('source-map-content-mismatch');
    expect(truncated.detail).toBe('line');

    const shortLine = attributeBundle({
      url: fixture.url,
      content: '(function(){\nx\n})();',
      sourceMap: fixture.sourceMap,
    });
    if (shortLine.status !== 'unavailable') throw new Error('expected unavailable');
    expect(shortLine.reason).toBe('source-map-content-mismatch');
    expect(shortLine.detail).toBe('column');
  });

  it('refuses a source index the map has no entry for', () => {
    const fixture = buildBundle('https://selo.fr/a.js', MODULES);
    const broken = JSON.parse(fixture.sourceMap) as { sources: string[] };
    broken.sources = [broken.sources[0]!];
    const result = attributeBundle({
      url: fixture.url,
      content: fixture.content,
      sourceMap: JSON.stringify(broken),
    });
    if (result.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('source-map-source-out-of-range');
  });

  it('leaves bytes the map declares unknown as unattributed', () => {
    const fixture = buildBundle('https://selo.fr/a.js', MODULES);
    const withNull = JSON.parse(fixture.sourceMap) as { sources: (string | null)[] };
    withNull.sources[1] = null;
    const result = attributeBundle({
      url: fixture.url,
      content: fixture.content,
      sourceMap: JSON.stringify(withNull),
    });
    if (result.status !== 'resolved') throw new Error('expected resolved');
    expect(result.sources.some((source) => source.path.includes('date-fns'))).toBe(false);
    expect(result.unattributedBytes).toBe(
      fixture.expectedUnattributed + fixture.expectedBytes[MODULES[1]!.source]!,
    );
  });

  it('applies the sourceRoot before deciding module identity', () => {
    const fixture = buildBundle(
      'https://selo.fr/a.js',
      [{ source: './src/a.ts', code: 'boot();' }],
      { sourceRoot: 'webpack://selo' },
    );
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');
    expect(result.sources[0]!.rawPath).toBe('webpack://selo/./src/a.ts');
    expect(result.sources[0]!.path).toBe('src/a.ts');
  });
});

describe('utf8Length', () => {
  it('counts astral characters as four bytes', () => {
    expect(utf8Length('a')).toBe(1);
    expect(utf8Length('é')).toBe(2);
    expect(utf8Length('€')).toBe(3);
    expect(utf8Length('𝄞')).toBe(4);
    expect(utf8Length('\ud800')).toBe(3);
  });
});

describe('attributeBundle source spans', () => {
  it('reports the original lines the bundle takes a module from, counted from one', () => {
    const fixture = buildBundle('https://selo.fr/a.js', [
      { source: 'src/a.ts', code: 'const a=1;', originalLine: 0 },
      { source: 'src/b.ts', code: 'const b=2;', originalLine: 40 },
    ]);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');

    expect(result.sources.find((source) => source.path === 'src/a.ts')?.span).toEqual({ firstLine: 1, lastLine: 1 });
    // the map says line 40, which an editor calls line 41.
    expect(result.sources.find((source) => source.path === 'src/b.ts')?.span).toEqual({ firstLine: 41, lastLine: 41 });
  });

  it('spans only the lines that survived, not the whole file', () => {
    // one module, two pieces: a build that kept two exports out of a long file.
    const fixture = buildBundle('https://selo.fr/a.js', [
      { source: 'src/util.ts', code: 'export const one=1;', originalLine: 411 },
      { source: 'src/util.ts', code: 'export const two=2;', originalLine: 469 },
    ]);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');

    const util = result.sources.find((source) => source.path === 'src/util.ts');
    expect(util?.span).toEqual({ firstLine: 412, lastLine: 470 });
    expect(util?.bytes).toBe(fixture.expectedBytes['src/util.ts']);
  });

  it('does not widen a span with a position the bundle took no byte from', () => {
    // two segments at the same column: the first owns nothing.
    const fixture = buildBundle('https://selo.fr/a.js', [
      { source: 'src/a.ts', code: '', originalLine: 900 },
      { source: 'src/a.ts', code: 'const a=1;', originalLine: 4 },
    ]);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');
    expect(result.sources.find((source) => source.path === 'src/a.ts')?.span).toEqual({
      firstLine: 5,
      lastLine: 5,
    });
  });

  it('leaves a source unplaced when the map names it and gives it no byte', () => {
    const fixture = buildBundle('https://selo.fr/a.js', [
      { source: 'src/empty.ts', code: '', originalLine: 12 },
      { source: 'src/a.ts', code: 'const a=1;', originalLine: 0 },
    ]);
    const result = attributeBundle({ url: fixture.url, content: fixture.content, sourceMap: fixture.sourceMap });
    if (result.status !== 'resolved') throw new Error('expected resolved');

    const empty = result.sources.find((source) => source.path === 'src/empty.ts');
    expect(empty?.bytes).toBe(0);
    expect(empty?.span).toBeNull();
  });
});
