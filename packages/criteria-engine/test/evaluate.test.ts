import { describe, expect, it } from 'vitest';
import type { CriterionEvidence, CriterionId } from '@balise/schemas';
import { evaluate, evaluateCriterion } from '../src/evaluate.js';
import { accessPack, ecoPack } from './fixtures.js';

const id = (value: string) => value as CriterionId;

const noEvidence: CriterionEvidence = { metrics: {}, attestations: {} };
const measured: CriterionEvidence = {
  metrics: { request_count: 84, dom_node_count: 2140, third_party_share_pct: 38 },
  attestations: {},
};

function assessmentFor(criterionId: string, evidence: CriterionEvidence) {
  return evaluate(ecoPack, evidence).find((a) => a.criterionId === id(criterionId))!;
}

describe('evaluateCriterion', () => {
  it('answers an automated criterion from the measurement', () => {
    const passing = assessmentFor('3.1', measured);
    expect(passing.status).toBe('conforme');
    expect(passing.source).toBe('measured');
    expect(passing.requiresConfirmation).toBe(false);
    expect(passing.evidenceFr).toContain('request_count = 84');

    expect(assessmentFor('3.2', measured).status).toBe('non_conforme');
  });

  it('proposes an assisted answer but never counts it as one', () => {
    const proposal = assessmentFor('5.2', measured);
    expect(proposal.status).toBe('non_conforme');
    expect(proposal.requiresConfirmation).toBe(true);
  });

  it('never touches a declarative criterion', () => {
    const declarative = assessmentFor('1.2', measured);
    expect(declarative.status).toBe('non_evalue');
    expect(declarative.source).toBe('unevaluated');
    expect(declarative.evidenceFr).toMatch(/[Aa]ttestation humaine/);
  });

  it('says an unmeasured indicator is unmeasured rather than failing the criterion', () => {
    const missing = assessmentFor('3.3', measured);
    expect(missing.status).toBe('non_evalue');
    expect(missing.evidenceFr).toContain('js_execution_ms');
  });

  it('says so when it does not understand the rule, rather than guessing', () => {
    const unsupported = assessmentFor('5.9', measured);
    expect(unsupported.status).toBe('non_evalue');
    expect(unsupported.evidenceFr).toContain('static_analysis');
  });

  it('lets a human attestation stand, including over a measurement', () => {
    const evidence: CriterionEvidence = {
      metrics: { dom_node_count: 2140 },
      attestations: {
        '3.2': {
          status: 'non_applicable',
          justification: 'Hors périmètre du marché.',
          attestedBy: 'm. carbonne',
          attestedAt: '2026-08-15T10:00:00.000Z',
          evidenceRefs: [],
        },
      },
    };
    const assessment = evaluateCriterion(ecoPack, ecoPack.criteria[1]!, evidence);
    expect(assessment.status).toBe('non_applicable');
    expect(assessment.source).toBe('attested');
    expect(assessment.attestedBy).toBe('m. carbonne');
    expect(assessment.requiresConfirmation).toBe(false);
  });

  it('answers nothing at all without evidence', () => {
    const assessments = evaluate(ecoPack, noEvidence);
    expect(assessments.every((a) => a.status === 'non_evalue')).toBe(true);
  });

  it('binds every assessment to the pack version it was made under', () => {
    for (const assessment of evaluate(ecoPack, measured)) {
      expect(assessment.packId).toBe('fixture-eco');
      expect(assessment.packVersion).toBe('2024.1');
    }
  });

  it('knows nothing about any particular referential', () => {
    const assessments = evaluate(accessPack, measured);
    expect(assessments).toHaveLength(accessPack.criteria.length);
    expect(assessments.every((a) => a.status === 'non_evalue')).toBe(true);
    expect(assessments[0]!.packId).toBe('fixture-access');
  });
});

describe('comparison operators', () => {
  const cases = [
    { operator: 'lte' as const, value: 84, expected: 'conforme' },
    { operator: 'lt' as const, value: 84, expected: 'non_conforme' },
    { operator: 'gte' as const, value: 84, expected: 'conforme' },
    { operator: 'gt' as const, value: 84, expected: 'non_conforme' },
    { operator: 'eq' as const, value: 84, expected: 'conforme' },
  ];

  it.each(cases)('$operator against an exactly equal value is $expected', ({ operator, value, expected }) => {
    const pack = {
      ...ecoPack,
      criteria: [
        {
          ...ecoPack.criteria[0]!,
          evaluation: { type: 'metric_threshold' as const, metric: 'request_count' as const, operator, value },
        },
      ],
    };
    expect(evaluate(pack, measured)[0]!.status).toBe(expected);
  });
});
