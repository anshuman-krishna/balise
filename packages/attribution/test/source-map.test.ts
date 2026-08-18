import { describe, expect, it } from 'vitest';
import { applySourceRoot, parseSourceMap } from '../src/source-map.js';

function map(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    version: 3,
    sources: ['src/main.ts'],
    names: [],
    mappings: 'AAAA',
    ...overrides,
  });
}

describe('parseSourceMap', () => {
  it('parses a well formed map from text or from an object', () => {
    const fromText = parseSourceMap(map());
    const fromObject = parseSourceMap(JSON.parse(map()) as unknown);
    expect(fromText.status).toBe('parsed');
    expect(fromObject.status).toBe('parsed');
  });

  it('strips the xssi guard some servers prefix', () => {
    expect(parseSourceMap(`)]}'\n${map()}`).status).toBe('parsed');
  });

  it.each([
    ['absent', undefined, 'no-source-map'],
    ['null', null, 'no-source-map'],
    ['empty', '', 'no-source-map'],
    ['not json', '{ nope', 'source-map-unreadable'],
    ['an array', '[]', 'source-map-unreadable'],
  ])('reports %s as %s', (_label, input, reason) => {
    const result = parseSourceMap(input);
    expect(result.status).toBe('unavailable');
    if (result.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe(reason);
  });

  it('names an index map instead of half handling it', () => {
    const result = parseSourceMap(JSON.stringify({ version: 3, sections: [] }));
    if (result.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('source-map-index-map');
  });

  it('refuses a version it does not implement, and says which', () => {
    const result = parseSourceMap(map({ version: 2 }));
    if (result.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('source-map-unsupported-version');
    expect(result.detail).toBe('2');
  });

  it('refuses a sources array that is not strings or nulls', () => {
    const result = parseSourceMap(map({ sources: [{ path: 'x' }] }));
    if (result.status !== 'unavailable') throw new Error('expected unavailable');
    expect(result.reason).toBe('source-map-unreadable');
    expect(result.detail).toBe('sources');
  });

  it('separates an empty mappings field from a malformed one', () => {
    const empty = parseSourceMap(map({ mappings: '' }));
    const malformed = parseSourceMap(map({ mappings: 'AA' }));
    if (empty.status !== 'unavailable' || malformed.status !== 'unavailable') {
      throw new Error('expected unavailable');
    }
    expect(empty.reason).toBe('source-map-mappings-empty');
    expect(malformed.reason).toBe('source-map-mappings-malformed');
  });

  it('keeps a null source, which the spec allows', () => {
    const result = parseSourceMap(map({ sources: [null] }));
    if (result.status !== 'parsed') throw new Error('expected parsed');
    expect(result.map.sources).toEqual([null]);
  });
});

describe('applySourceRoot', () => {
  it('joins a relative source', () => {
    expect(applySourceRoot('webpack://app', './src/a.ts')).toBe('webpack://app/./src/a.ts');
    expect(applySourceRoot('webpack://app/', './src/a.ts')).toBe('webpack://app/./src/a.ts');
  });

  it('leaves an absolute source alone', () => {
    expect(applySourceRoot('webpack://app', '/src/a.ts')).toBe('/src/a.ts');
    expect(applySourceRoot('webpack://app', 'file:///src/a.ts')).toBe('file:///src/a.ts');
  });

  it('is a no-op without a root', () => {
    expect(applySourceRoot(null, 'src/a.ts')).toBe('src/a.ts');
  });
});
