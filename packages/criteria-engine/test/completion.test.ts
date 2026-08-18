import { describe, expect, it } from 'vitest';
import type { CriterionAssessment, CriterionEvidence, CriterionId } from '@balise/schemas';
import { evaluate } from '../src/evaluate.js';
import { blockingFindings, canPublish, completion, isAnswered } from '../src/completion.js';
import { ecoPack } from './fixtures.js';

const id = (value: string) => value as CriterionId;

const measured: CriterionEvidence = {
  metrics: { request_count: 84, dom_node_count: 2140, third_party_share_pct: 38 },
  attestations: {},
};

function assessment(overrides: Partial<CriterionAssessment>): CriterionAssessment {
  return {
    criterionId: id('3.1'),
    packId: 'fixture-eco',
    packVersion: '2024.1',
    tier: 'automated',
    status: 'conforme',
    source: 'measured',
    evidenceFr: 'fixture',
    requiresConfirmation: false,
    ...overrides,
  };
}

describe('isAnswered', () => {
  it('does not count an unevaluated criterion', () => {
    expect(isAnswered(assessment({ status: 'non_evalue' }))).toBe(false);
  });

  it('does not count a proposal nobody confirmed', () => {
    expect(isAnswered(assessment({ requiresConfirmation: true }))).toBe(false);
  });

  it('counts a non conforme answer, which is an answer', () => {
    expect(isAnswered(assessment({ status: 'non_conforme' }))).toBe(true);
  });
});

describe('completion', () => {
  it('splits by tier, so auto-answered criteria are never mistaken for a declaration', () => {
    const result = completion(evaluate(ecoPack, measured));
    const byTier = Object.fromEntries(result.byTier.map((entry) => [entry.tier, entry]));
    expect(byTier['automated']).toEqual({ tier: 'automated', answered: 2, total: 4 });
    // the assisted answer is proposed, not confirmed, so it counts for nothing
    expect(byTier['assisted']).toEqual({ tier: 'assisted', answered: 0, total: 1 });
    expect(byTier['declarative']).toEqual({ tier: 'declarative', answered: 0, total: 2 });
  });

  it('reports every tier even when the pack has none of it', () => {
    const result = completion([assessment({})]);
    expect(result.byTier.map((entry) => entry.tier)).toEqual([
      'automated',
      'assisted',
      'declarative',
    ]);
  });

  it('takes non applicable out of the denominator and leaves unevaluated in it', () => {
    const result = completion([
      assessment({ criterionId: id('a'), status: 'conforme' }),
      assessment({ criterionId: id('b'), status: 'non_applicable' }),
      assessment({ criterionId: id('c'), status: 'non_evalue' }),
    ]);
    expect(result.conforme).toBe(1);
    expect(result.applicable).toBe(2);
  });

  it('does not count an unconfirmed conforme proposal toward the rate', () => {
    const result = completion([
      assessment({ criterionId: id('a'), status: 'conforme', requiresConfirmation: true }),
    ]);
    expect(result.conforme).toBe(0);
    expect(result.applicable).toBe(1);
  });
});

describe('blockingFindings', () => {
  it('blocks on an unassessed criterion', () => {
    const findings = blockingFindings(ecoPack, evaluate(ecoPack, measured));
    const unassessed = findings.filter((finding) => finding.reason === 'unassessed-criterion');
    expect(unassessed.map((finding) => finding.criterionId).sort()).toEqual(['1.2', '1.3', '3.3', '5.9']);
  });

  it('blocks on a proposal that nobody confirmed', () => {
    const findings = blockingFindings(ecoPack, evaluate(ecoPack, measured));
    expect(findings.filter((f) => f.reason === 'unconfirmed-proposal').map((f) => f.criterionId)).toEqual(['5.2']);
  });

  it('blocks on anything not conforme that carries no justification', () => {
    const findings = blockingFindings(ecoPack, [
      assessment({ criterionId: id('3.2'), status: 'non_conforme' }),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.reason).toBe('missing-justification');
  });

  it('accepts a justification and stops blocking', () => {
    const findings = blockingFindings(ecoPack, [
      assessment({ criterionId: id('3.2'), status: 'non_conforme', justification: 'Correctif en cours.' }),
    ]);
    expect(findings).toEqual([]);
  });

  it('does not accept whitespace as a justification', () => {
    const findings = blockingFindings(ecoPack, [
      assessment({ criterionId: id('3.2'), status: 'non_conforme', justification: '   ' }),
    ]);
    expect(findings[0]!.reason).toBe('missing-justification');
  });

  it('requires a justification for non applicable too', () => {
    const findings = blockingFindings(ecoPack, [
      assessment({ criterionId: id('3.2'), status: 'non_applicable' }),
    ]);
    expect(findings[0]!.reason).toBe('missing-justification');
  });

  it('blocks when a criterion needs an artifact and has none', () => {
    const findings = blockingFindings(ecoPack, [
      assessment({ criterionId: id('1.2'), tier: 'declarative', status: 'conforme', source: 'measured' }),
    ]);
    expect(findings.map((finding) => finding.reason)).toContain('missing-evidence');
    expect(findings[0]!.detailFr).toContain('Politique éditoriale');
  });

  it('accepts an attested criterion as carrying its artifact', () => {
    const findings = blockingFindings(ecoPack, [
      assessment({ criterionId: id('1.2'), tier: 'declarative', status: 'conforme', source: 'attested' }),
    ]);
    expect(findings).toEqual([]);
  });

  it('reports a criterion the pack does not declare without crashing on it', () => {
    const findings = blockingFindings(ecoPack, [
      assessment({ criterionId: id('99.9'), status: 'non_conforme' }),
    ]);
    expect(findings.map((f) => f.reason)).toEqual(['missing-justification']);
  });
});

describe('canPublish', () => {
  it('refuses while anything is blocking', () => {
    expect(canPublish(blockingFindings(ecoPack, evaluate(ecoPack, measured)))).toBe(false);
  });

  it('allows once nothing is', () => {
    expect(canPublish([])).toBe(true);
  });
});
