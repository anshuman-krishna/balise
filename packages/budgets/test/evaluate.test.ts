import { describe, expect, it } from 'vitest';
import { BudgetAssessment, type BudgetConfig, type BudgetOverride } from '@balise/schemas';
import { evaluateBudgets, readConfig, summariseCheck, type ScenarioMeasurement } from '../src/index.js';
import { aggregate, floor, metric, noFloor, route } from './helpers.js';

function config(source: string): BudgetConfig {
  const result = readConfig(`version: 1\nservice: p\nprofiles: [mobile-4g]\nreference_model: swd@4.0\n${source}`);
  if (result.status !== 'ok') {
    throw new Error(result.issues.map((issue) => issue.message).join('; '));
  }
  return result.config;
}

const ACCUEIL = 'budgets:\n  - scope: /accueil\n    bytes: { warn: 860KB, fail: 900KB }\n';

function bytes(median: number): ScenarioMeasurement['candidate'] {
  return aggregate([metric('transferred_bytes', median)]);
}

describe('an absolute budget', () => {
  const scenarios = (median: number, floors = [floor('transferred_bytes', 7_000)]) => [
    route('/accueil', bytes(median), { floors }),
  ];

  it('passes under the warning', () => {
    const [assessment] = evaluateBudgets({ config: config(ACCUEIL), scenarios: scenarios(842_000) });
    expect(assessment).toMatchObject({ status: 'conforme', observed: 842_000, headroom: 58_000 });
    expect(() => BudgetAssessment.parse(assessment)).not.toThrow();
  });

  it('warns between the two thresholds', () => {
    const [assessment] = evaluateBudgets({ config: config(ACCUEIL), scenarios: scenarios(870_000) });
    expect(assessment).toMatchObject({ status: 'warn', headroom: 30_000 });
  });

  it('breaches past the failing threshold, with a negative headroom', () => {
    const [assessment] = evaluateBudgets({ config: config(ACCUEIL), scenarios: scenarios(925_000) });
    expect(assessment).toMatchObject({ status: 'breach', headroom: -25_000 });
  });

  it('says when the median is sitting on the line', () => {
    // 4 KB of headroom against a 7 KB floor: which side of the threshold this
    // run landed on is inside the measurement noise, and the screen says so.
    const [assessment] = evaluateBudgets({ config: config(ACCUEIL), scenarios: scenarios(896_000) });
    expect(assessment).toMatchObject({ status: 'warn', withinNoise: true });
  });

  it('does not call a comfortable pass noisy', () => {
    const [assessment] = evaluateBudgets({ config: config(ACCUEIL), scenarios: scenarios(842_000) });
    expect(assessment!.withinNoise).toBe(false);
  });
});

describe('what a budget refuses to decide', () => {
  it('decides nothing on a scenario with no established floor, and cannot fail a check', () => {
    // the rule from the statistics section: budgets activate once the floor is
    // established. before that a breach is unprovable, so it is not asserted.
    const assessments = evaluateBudgets({
      config: config(ACCUEIL),
      scenarios: [route('/accueil', bytes(1_400_000), { floors: [noFloor('transferred_bytes')] })],
    });
    expect(assessments[0]).toMatchObject({ status: 'non_evalue', reason: 'no-noise-floor', observed: null });

    const summary = summariseCheck(assessments, { blockMergeOn: 'fail', annotateFiles: false });
    expect(summary.conclusion).toBe('neutral');
    expect(summary.blocking).toEqual([]);
  });

  it('treats a missing floor for the metric exactly as an unestablished one', () => {
    const assessments = evaluateBudgets({
      config: config(ACCUEIL),
      scenarios: [route('/accueil', bytes(1_400_000), { floors: [] })],
    });
    expect(assessments[0]).toMatchObject({ status: 'non_evalue', reason: 'no-noise-floor' });
  });

  it('decides nothing on a metric that was not measured', () => {
    const assessments = evaluateBudgets({
      config: config('budgets:\n  - scope: /accueil\n    requests: { fail: 90 }\n'),
      scenarios: [route('/accueil', bytes(842_000), { floors: [floor('request_count', 2)] })],
    });
    expect(assessments[0]).toMatchObject({ status: 'non_evalue', reason: 'metric-not-measured' });
  });
});

describe('a growth limit against the baseline', () => {
  const GROWTH = 'budgets:\n  - scope: /accueil\n    relative_to_baseline: { fail: +3% }\n';

  function scenario(before: number, after: number, floorBytes: number): ScenarioMeasurement {
    return route('/accueil', bytes(after), {
      baseline: bytes(before),
      floors: [floor('transferred_bytes', floorBytes)],
    });
  }

  it('cannot be broken by a delta the kernel does not call a change', () => {
    // +4% of a million bytes is 40 KB, over the 3% allowance. the floor is
    // 50 KB, so there is no change to be over the allowance with.
    const [assessment] = evaluateBudgets({
      config: config(GROWTH),
      scenarios: [scenario(1_000_000, 1_040_000, 50_000)],
    });
    expect(assessment!.delta!.classification).toBe('no-significant-change');
    expect(assessment!.status).toBe('conforme');
    expect(assessment!.observed).toBeCloseTo(4);
  });

  it('breaches when the growth is real and over the allowance', () => {
    const [assessment] = evaluateBudgets({
      config: config(GROWTH),
      scenarios: [scenario(1_000_000, 1_040_000, 7_000)],
    });
    expect(assessment!.delta!.classification).toBe('regression');
    expect(assessment).toMatchObject({ status: 'breach' });
    expect(assessment!.headroom).toBeCloseTo(-1);
  });

  it('passes a real regression that stays inside the allowance', () => {
    const [assessment] = evaluateBudgets({
      config: config(GROWTH),
      scenarios: [scenario(1_000_000, 1_020_000, 7_000)],
    });
    expect(assessment!.delta!.classification).toBe('regression');
    expect(assessment).toMatchObject({ status: 'conforme' });
  });

  it('never fails on an improvement', () => {
    const [assessment] = evaluateBudgets({
      config: config(GROWTH),
      scenarios: [scenario(1_000_000, 900_000, 7_000)],
    });
    expect(assessment!.delta!.classification).toBe('improvement');
    expect(assessment).toMatchObject({ status: 'conforme' });
  });

  it('decides nothing with no baseline to grow from', () => {
    const [assessment] = evaluateBudgets({
      config: config(GROWTH),
      scenarios: [route('/accueil', bytes(1_040_000), { floors: [floor('transferred_bytes', 7_000)] })],
    });
    expect(assessment).toMatchObject({ status: 'non_evalue', reason: 'no-baseline' });
  });

  it('decides nothing when the baseline is zero, where a percentage means nothing', () => {
    const [assessment] = evaluateBudgets({
      config: config(GROWTH),
      scenarios: [scenario(0, 1_040_000, 7_000)],
    });
    expect(assessment).toMatchObject({ status: 'non_evalue', reason: 'no-baseline' });
  });
});

describe('scopes', () => {
  const scenarios: ScenarioMeasurement[] = [
    route('/accueil', bytes(842_000), { floors: [floor('transferred_bytes', 7_000)] }),
    route('/demarches/acte-naissance', bytes(1_298_000), { floors: [floor('transferred_bytes', 7_000)] }),
    {
      id: 'demande-acte',
      kind: 'journey',
      label: "journey: demande d'acte",
      candidate: bytes(1_442_000),
      floors: [floor('transferred_bytes', 7_000)],
    },
  ];

  it('applies a route pattern to the routes it matches and to nothing else', () => {
    const assessments = evaluateBudgets({
      config: config('budgets:\n  - scope: /demarches/*\n    bytes: { fail: 1300KB }\n'),
      scenarios,
    });
    expect(assessments.map((a) => a.scenarioId)).toEqual(['/demarches/acte-naissance']);
  });

  it('applies a journey scope only to that journey', () => {
    const assessments = evaluateBudgets({
      config: config('budgets:\n  - scope: journey:demande-acte\n    bytes: { fail: 1400KB }\n'),
      scenarios,
    });
    expect(assessments.map((a) => a.scenarioId)).toEqual(['demande-acte']);
    expect(assessments[0]!.status).toBe('breach');
  });

  it('applies a service scope everywhere it was measured', () => {
    // a service-wide limit checked against an aggregate could hold while a
    // single route breached it, so it is checked on each scenario.
    const assessments = evaluateBudgets({
      config: config('budgets:\n  - scope: service\n    bytes: { fail: 1300KB }\n'),
      scenarios,
    });
    expect(assessments).toHaveLength(3);
    expect(assessments.map((a) => a.status)).toEqual(['conforme', 'conforme', 'breach']);
  });
});

describe('an override', () => {
  const override: BudgetOverride = {
    scope: { kind: 'route', pattern: '/accueil' },
    metricId: 'transferred_bytes',
    reason: 'video hero mandated for the 14 july campaign, removal scheduled 01 sep',
    by: 'm. carbonne',
    recordedAt: '2026-07-08T09:12:00+02:00',
    expiresAt: '2026-09-01T00:00:00+02:00',
    ledgerRef: 'a1b2c3d4',
  };

  const scenarios = [route('/accueil', bytes(1_240_000), { floors: [floor('transferred_bytes', 7_000)] })];

  it('lifts the merge block and never the breach', () => {
    const assessments = evaluateBudgets({
      config: config(ACCUEIL),
      scenarios,
      overrides: [override],
      evaluatedAt: '2026-08-19T10:00:00+02:00',
    });
    expect(assessments[0]).toMatchObject({ status: 'breach', override: { by: 'm. carbonne' } });

    const summary = summariseCheck(assessments, { blockMergeOn: 'fail', annotateFiles: false });
    expect(summary.conclusion).toBe('neutral');
    expect(summary.blocking).toEqual([]);
    expect(summary.overridden).toHaveLength(1);
    expect(summary.counts.breach).toBe(1);
  });

  it('stops applying once it has expired', () => {
    const assessments = evaluateBudgets({
      config: config(ACCUEIL),
      scenarios,
      overrides: [override],
      evaluatedAt: '2026-09-02T10:00:00+02:00',
    });
    expect(assessments[0]!.override).toBeNull();
    expect(summariseCheck(assessments, { blockMergeOn: 'fail', annotateFiles: false }).conclusion).toBe('failure');
  });

  it('does not apply to another scope or another metric', () => {
    const elsewhere = evaluateBudgets({
      config: config('budgets:\n  - scope: /autre\n    bytes: { fail: 900KB }\n'),
      scenarios: [route('/autre', bytes(1_240_000), { floors: [floor('transferred_bytes', 7_000)] })],
      overrides: [override],
      evaluatedAt: '2026-08-19T10:00:00+02:00',
    });
    expect(elsewhere[0]!.override).toBeNull();
  });
});
