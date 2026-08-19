import { describe, expect, it } from 'vitest';
import type { BudgetAssessment, BudgetStatus, CheckPolicy } from '@balise/schemas';
import { summariseCheck } from '../src/check.js';
import { floor } from './helpers.js';

const POLICY: CheckPolicy = { blockMergeOn: 'fail', annotateFiles: false };

function assessment(status: BudgetStatus): BudgetAssessment {
  return {
    scenarioId: '/accueil',
    scenarioLabel: '/accueil',
    pass: 'cold',
    rule: {
      kind: 'absolute',
      scope: { kind: 'route', pattern: '/accueil' },
      metricId: 'transferred_bytes',
      unit: 'bytes',
      warn: null,
      fail: { value: 900_000, sourceText: '900KB', line: 3 },
      line: 3,
    },
    metricId: 'transferred_bytes',
    unit: 'bytes',
    status,
    reason: status === 'non_evalue' ? 'no-noise-floor' : undefined,
    observed: status === 'non_evalue' ? null : 842_000,
    headroom: status === 'non_evalue' ? null : 58_000,
    withinNoise: false,
    floor: floor('transferred_bytes', 7_000),
    delta: null,
    override: null,
  };
}

describe('what the assessments do to a pull request', () => {
  it('passes when everything is conforme', () => {
    const summary = summariseCheck([assessment('conforme'), assessment('conforme')], POLICY);
    expect(summary.conclusion).toBe('success');
    expect(summary.counts).toEqual({ conforme: 2, warn: 0, breach: 0, nonEvalue: 0 });
  });

  it('fails on a breach under the default policy', () => {
    const summary = summariseCheck([assessment('conforme'), assessment('breach')], POLICY);
    expect(summary.conclusion).toBe('failure');
    expect(summary.blocking).toHaveLength(1);
  });

  it('stays neutral on a warning under the default policy', () => {
    expect(summariseCheck([assessment('warn')], POLICY).conclusion).toBe('neutral');
  });

  it('blocks on a warning when the file asks it to', () => {
    const summary = summariseCheck([assessment('warn')], { blockMergeOn: 'warn', annotateFiles: false });
    expect(summary.conclusion).toBe('failure');
  });

  it('blocks on nothing when the file says never, and still reports the breach', () => {
    const summary = summariseCheck([assessment('breach')], { blockMergeOn: 'never', annotateFiles: false });
    expect(summary.conclusion).toBe('neutral');
    expect(summary.counts.breach).toBe(1);
    expect(summary.blocking).toEqual([]);
  });

  it('will not report a green tick over a budget it could not evaluate', () => {
    // a pass has to mean the budgets were checked, not that nothing was.
    const summary = summariseCheck([assessment('conforme'), assessment('non_evalue')], POLICY);
    expect(summary.conclusion).toBe('neutral');
    expect(summary.counts.nonEvalue).toBe(1);
  });

  it('reports an empty set as a pass, because nothing was breached', () => {
    expect(summariseCheck([], POLICY).conclusion).toBe('success');
  });
});
