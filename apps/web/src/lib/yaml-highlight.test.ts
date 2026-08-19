import { describe, expect, it } from 'vitest';
import { budgetCanon } from '../fixtures/budget-canon';
import { highlightYaml, highlightYamlLine } from './yaml-highlight';

describe('colouring balise.yml', () => {
  it('marks a whole comment line', () => {
    expect(highlightYamlLine('# a header')).toEqual([{ text: '# a header', k: 'c' }]);
  });

  it('splits a key from its value', () => {
    expect(highlightYamlLine('version: 1')).toEqual([{ text: 'version:' }, { text: ' ' }, { text: '1', k: 'v' }]);
  });

  it('marks the values inside a flow mapping and leaves its keys alone', () => {
    expect(highlightYamlLine('    bytes: { warn: 860KB, fail: 900KB }')).toEqual([
      { text: '    bytes:' },
      { text: ' ' },
      { text: '{' },
      { text: ' ' },
      { text: 'warn' },
      { text: ':' },
      { text: ' ' },
      { text: '860KB', k: 'v' },
      { text: ',' },
      { text: ' ' },
      { text: 'fail' },
      { text: ':' },
      { text: ' ' },
      { text: '900KB', k: 'v' },
      { text: ' ' },
      { text: '}' },
    ]);
  });

  it('keeps a scope that carries its own colon in one piece', () => {
    expect(highlightYamlLine('  - scope: journey:demande-acte')).toEqual([
      { text: '  - scope:' },
      { text: ' ' },
      { text: 'journey:demande-acte', k: 'v' },
    ]);
  });

  it('marks a trailing comment without touching the value', () => {
    expect(highlightYamlLine('runs: 5 # five')).toEqual([
      { text: 'runs:' },
      { text: ' ' },
      { text: '5', k: 'v' },
      { text: ' # five', k: 'c' },
    ]);
  });

  it('leaves a blank line blank', () => {
    expect(highlightYamlLine('')).toEqual([]);
  });
});

describe('the canon file', () => {
  const lines = highlightYaml(budgetCanon.source);

  it('renders every line of the file that was read', () => {
    expect(lines).toHaveLength(budgetCanon.source.replace(/\n$/, '').split('\n').length);
  });

  it('loses no character of it', () => {
    const rebuilt = lines.map((segments) => segments.map((segment) => segment.text).join('')).join('\n');
    expect(`${rebuilt}\n`).toBe(budgetCanon.source);
  });
});
