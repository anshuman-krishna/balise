import { describe, expect, it } from 'vitest';
import { parseYaml } from '../src/yaml.js';

function value(source: string) {
  const result = parseYaml(source);
  if (result.status !== 'ok') throw new Error(`expected ok, got ${result.issues[0]!.message}`);
  return result.value;
}

function refusal(source: string) {
  const result = parseYaml(source);
  if (result.status !== 'invalid') throw new Error('expected a refusal');
  return result.issues[0]!;
}

describe('the yaml subset', () => {
  it('reads a mapping of scalars, typed by what they are', () => {
    expect(value('version: 1\nservice: portail\nannotate: true\nempty: null')).toEqual({
      version: 1,
      service: 'portail',
      annotate: true,
      empty: null,
    });
  });

  it('leaves a quantity a string, because a unit is not a number', () => {
    expect(value('fail: 900KB\ngrowth: +3%\nmodel: swd@4.0')).toEqual({
      fail: '900KB',
      growth: '+3%',
      model: 'swd@4.0',
    });
  });

  it('nests by indentation', () => {
    expect(value('check:\n  block_merge_on: fail\n  annotate_files: true')).toEqual({
      check: { block_merge_on: 'fail', annotate_files: true },
    });
  });

  it('reads a sequence of mappings whose first key sits on the dash', () => {
    const source = ['budgets:', '  - scope: /accueil', '    bytes: 900KB', '  - scope: service'].join('\n');
    expect(value(source)).toEqual({
      budgets: [{ scope: '/accueil', bytes: '900KB' }, { scope: 'service' }],
    });
  });

  it('reads flow mappings and flow sequences', () => {
    expect(value('bytes: { warn: 860KB, fail: 900KB }\nprofiles: [desktop-fibre, mobile-4g]')).toEqual({
      bytes: { warn: '860KB', fail: '900KB' },
      profiles: ['desktop-fibre', 'mobile-4g'],
    });
  });

  it('reads an empty flow collection', () => {
    expect(value('a: {}\nb: []')).toEqual({ a: {}, b: [] });
  });

  it('drops comments, including one after a value', () => {
    expect(value('# a header\nversion: 1 # inline\nservice: portail')).toEqual({
      version: 1,
      service: 'portail',
    });
  });

  it('keeps a hash that is part of a value', () => {
    expect(value('anchor: "#fragment"\nplain: a#b')).toEqual({ anchor: '#fragment', plain: 'a#b' });
  });

  it('keeps a quoted value as a string whatever it looks like', () => {
    expect(value('a: "1"\nb: \'true\'\nc: "with: colon"')).toEqual({ a: '1', b: 'true', c: 'with: colon' });
  });

  it('records the line each key was written on', () => {
    const result = parseYaml('version: 1\nbudgets:\n  - scope: /accueil\n    bytes: 900KB');
    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.lines.get('version')).toBe(1);
    expect(result.lines.get('budgets.0.scope')).toBe(3);
    expect(result.lines.get('budgets.0.bytes')).toBe(4);
  });
});

describe('what the subset refuses', () => {
  // the point of a subset is that everything outside it is named, not guessed.
  it('refuses tab indentation', () => {
    expect(refusal('a:\n\tb: 1').message).toMatch(/tabs/);
  });

  it('refuses a second document', () => {
    expect(refusal('a: 1\n---\nb: 2').line).toBe(2);
  });

  it('refuses anchors and aliases', () => {
    expect(refusal('a: &anchor 1').message).toMatch(/anchors/);
    expect(refusal('a: *anchor').message).toMatch(/anchors/);
  });

  it('refuses tags', () => {
    expect(refusal('a: !!str 1').message).toMatch(/tags/);
  });

  it('refuses block scalars rather than reading half of one', () => {
    expect(refusal('a: |\n  text').message).toMatch(/block scalars/);
    expect(refusal('a: >-\n  text').message).toMatch(/block scalars/);
  });

  it('refuses merge keys', () => {
    expect(refusal('a:\n  <<: b').message).toMatch(/merge keys/);
  });

  it('refuses a key set twice, in a block and in a flow mapping', () => {
    expect(refusal('a: 1\na: 2').message).toMatch(/set twice/);
    expect(refusal('a: { b: 1, b: 2 }').message).toMatch(/set twice/);
  });

  it('refuses a line that is not a key and not a sequence item', () => {
    expect(refusal('a: 1\nnonsense').message).toMatch(/key: value/);
  });

  it('refuses an unclosed flow collection', () => {
    expect(refusal('a: { b: 1').message).toMatch(/expected `,` or `}`/);
    expect(refusal('a: [1, 2').message).toMatch(/expected `,` or `]`/);
  });

  it('refuses text after a closed flow collection', () => {
    expect(refusal('a: [1, 2] trailing').message).toMatch(/after the closing bracket/);
  });

  it('refuses indentation that goes nowhere', () => {
    expect(refusal('a: 1\n    b: 2').message).toMatch(/indentation/);
  });

  it('refuses a sequence item with no value', () => {
    expect(refusal('a:\n  -\nb: 1').message).toMatch(/no value/);
  });

  it('refuses an unterminated quoted string', () => {
    expect(refusal('a: { b: "open }').message).toMatch(/unterminated/);
  });

  it('reports the line it refused on', () => {
    expect(refusal('a: 1\nb: 2\nc: |\n  text').line).toBe(3);
  });
});
