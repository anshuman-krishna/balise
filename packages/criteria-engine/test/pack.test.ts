import { describe, expect, it } from 'vitest';
import { parsePack, selectPack } from '../src/pack.js';
import { accessPack, ecoPack } from './fixtures.js';

describe('parsePack', () => {
  it('accepts a well formed pack', () => {
    expect(parsePack(ecoPack).criteria).toHaveLength(ecoPack.criteria.length);
  });

  it('refuses a pack that declares a criterion twice', () => {
    const duplicated = { ...ecoPack, criteria: [...ecoPack.criteria, ecoPack.criteria[0]] };
    expect(() => parsePack(duplicated)).toThrow(/declares criterion 3.1 twice/);
  });

  it('refuses a criterion in a family the pack does not declare', () => {
    const orphaned = {
      ...ecoPack,
      criteria: [{ ...ecoPack.criteria[0], family: 'inexistante' }],
    };
    expect(() => parsePack(orphaned)).toThrow(/does not declare/);
  });

  it('refuses a criterion with no statement, which is what an auditor reads', () => {
    const silent = { ...ecoPack, criteria: [{ ...ecoPack.criteria[0], statementFr: '' }] };
    expect(() => parsePack(silent)).toThrow();
  });

  it('keeps an evaluation type it does not understand, rather than dropping it', () => {
    const pack = parsePack(ecoPack);
    const unsupported = pack.criteria.find((criterion) => criterion.id === '5.9');
    expect(unsupported?.evaluation?.type).toBe('static_analysis');
  });
});

describe('selectPack', () => {
  it('selects an exact version', () => {
    expect(selectPack([ecoPack, accessPack], 'fixture-eco', '2024.1')).toBe(ecoPack);
  });

  it('has no notion of latest', () => {
    const newer = { ...ecoPack, version: '2025.1' };
    expect(() => selectPack([ecoPack, newer], 'fixture-eco', '2024.2')).toThrow(/no pack/);
  });

  it('says what it does have', () => {
    expect(() => selectPack([ecoPack], 'fixture-access', '4.1')).toThrow(/fixture-eco@2024.1/);
  });
});
