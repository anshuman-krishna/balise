import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RulePack } from '@balise/schemas';
import { parsePack } from '@balise/criteria-engine';
import { packs, rgesn2024v2 } from '../src/index.js';

// the extracted spreadsheet, the input the module was generated from. holding
// the module to it is what stops a statement being quietly reworded.
const source = JSON.parse(
  readFileSync(fileURLToPath(new URL('../scripts/rgesn-2024-v2.source.json', import.meta.url)), 'utf8'),
) as {
  families: Record<string, string>;
  criteria: Record<string, { statement: string; priority: string | null }>;
};

describe('rgesn 2024 v2', () => {
  it('is a valid pack the engine accepts', () => {
    expect(() => RulePack.parse(rgesn2024v2)).not.toThrow();
    expect(() => parsePack(rgesn2024v2)).not.toThrow();
  });

  it('carries the referential it says it does', () => {
    expect(rgesn2024v2.id).toBe('rgesn');
    expect(rgesn2024v2.version).toBe('2024.2');
    expect(rgesn2024v2.locale).toBe('fr');
    expect(rgesn2024v2.source).toContain('ecoresponsable.numerique.gouv.fr');
  });

  it('has 78 criteria in 9 families', () => {
    expect(rgesn2024v2.criteria).toHaveLength(78);
    expect(rgesn2024v2.families).toHaveLength(9);
  });

  it('states every criterion verbatim, exactly as the referential publishes it', () => {
    for (const criterion of rgesn2024v2.criteria) {
      const published = source.criteria[criterion.id];
      expect(published, `${criterion.id} is not in the published source`).toBeDefined();
      expect(criterion.statementFr).toBe(published!.statement);
    }
  });

  it('covers every criterion the published source contains, and invents none', () => {
    const ours = rgesn2024v2.criteria.map((criterion) => criterion.id).sort();
    expect(ours).toEqual(Object.keys(source.criteria).sort());
  });

  it('keeps the official numbering, never renumbering a criterion', () => {
    for (const criterion of rgesn2024v2.criteria) {
      expect(criterion.id).toMatch(/^\d{1,2}\.\d{1,2}$/);
      expect(criterion.family).toBe(
        rgesn2024v2.families[Number(criterion.id.split('.')[0]) - 1]?.id,
      );
    }
  });

  it('carries the referential priority on every criterion', () => {
    for (const criterion of rgesn2024v2.criteria) {
      expect(criterion.priority, `${criterion.id} has no priority`).toBeDefined();
    }
  });

  it('ships with its tiers unsigned, so nothing is answered automatically', () => {
    expect(rgesn2024v2.tiersSignedOff).toBe(false);
  });

  it('does not inflate the automated count', () => {
    const automated = rgesn2024v2.criteria.filter((criterion) => criterion.tier === 'automated');
    // every automated criterion has to be answerable outright, which today
    // means a metric_threshold rule the engine can run
    expect(automated.length).toBeLessThan(rgesn2024v2.criteria.length / 3);
  });

  it('requires a named person for every declarative criterion', () => {
    const declarative = rgesn2024v2.criteria.filter((criterion) => criterion.tier === 'declarative');
    expect(declarative.length).toBeGreaterThan(0);
    for (const criterion of declarative) {
      expect(
        criterion.evidenceRequired.some((item) => item.kind === 'attestation'),
        `${criterion.id} asks for no attestation`,
      ).toBe(true);
    }
  });

  it('is the only pack this build carries', () => {
    expect(packs).toEqual([rgesn2024v2]);
  });
});
