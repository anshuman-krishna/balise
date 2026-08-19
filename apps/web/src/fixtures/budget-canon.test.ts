import { describe, expect, it } from 'vitest';
import { BudgetAssessment, BudgetConfig, BudgetOverride, CheckSummary } from '@balise/schemas';
import { readConfig } from '@balise/budgets';
import { buildBudgetCanon } from '../../scripts/budget-canon-source';
import { attributionCanon } from './attribution-canon';
import { budgetCanon } from './budget-canon';
import { ledgerEntry, REF } from './ledger-refs';

// the generated file is data, and data drifts. this recomputes the whole
// evaluation from the same balise.yml and the same runs, so a hand edit or a
// change in @balise/budgets cannot pass unnoticed.
const canon = buildBudgetCanon();

function find(assessments: readonly BudgetAssessment[], scenarioId: string, metricId: string, kind = 'absolute') {
  const found = assessments.find(
    (assessment) =>
      assessment.scenarioId === scenarioId && assessment.metricId === metricId && assessment.rule.kind === kind,
  );
  if (found === undefined) throw new Error(`no ${kind} ${metricId} assessment for ${scenarioId}`);
  return found;
}

describe('the generated budget canon', () => {
  it('matches what the engine produces from the file and the runs', () => {
    expect(budgetCanon.source).toBe(canon.source);
    expect(budgetCanon.config).toEqual(canon.config);
    expect(budgetCanon.override).toEqual(canon.override);
    expect(budgetCanon.main).toEqual(canon.main);
    expect(budgetCanon.pull).toEqual(canon.pull);
  });

  it('holds shapes that satisfy the published contracts', () => {
    expect(() => BudgetConfig.parse(budgetCanon.config)).not.toThrow();
    expect(() => BudgetOverride.parse(budgetCanon.override)).not.toThrow();
    expect(() => BudgetAssessment.array().parse(budgetCanon.main.assessments)).not.toThrow();
    expect(() => CheckSummary.parse(budgetCanon.pull.summary)).not.toThrow();
  });

  it('carries a balise.yml the reader accepts', () => {
    expect(readConfig(budgetCanon.source).status).toBe('ok');
  });
});

describe('the branch view', () => {
  const { assessments, summary } = budgetCanon.main;

  it('measures the same route the attribution card explains', () => {
    // the budget table and the attribution card are two views of one run.
    const route = find(assessments, attributionCanon.route, 'transferred_bytes');
    expect(route.observed).toBe(1_114_000);
    expect(route.status).toBe('conforme');
  });

  it('reports the video hero as a breach and the override as lifting only the block', () => {
    const actualites = find(assessments, '/actualites', 'transferred_bytes');
    expect(actualites.status).toBe('breach');
    // 340 KB past a 900 KB budget, which is the figure the override quotes.
    expect(actualites.headroom).toBe(-340_000);
    expect(actualites.override).not.toBeNull();
    expect(summary.overridden).toHaveLength(1);
    expect(summary.counts.breach).toBe(2);
  });

  it('does not let an override on one metric cover another', () => {
    // the override was recorded for the transferred bytes. the third-party share
    // it also pushed past its limit is still reported, and still blocks.
    const share = find(assessments, '/actualites', 'third_party_share_pct');
    expect(share.status).toBe('breach');
    expect(share.override).toBeNull();
    expect(summary.blocking.map((entry) => entry.metricId)).toEqual(['third_party_share_pct']);
  });

  it('decides nothing about growth on a branch with nothing to compare to', () => {
    const relative = assessments.filter((assessment) => assessment.rule.kind === 'relative');
    expect(relative).toHaveLength(4);
    expect(relative.every((assessment) => assessment.status === 'non_evalue')).toBe(true);
    expect(relative.every((assessment) => assessment.reason === 'no-baseline')).toBe(true);
  });
});

describe('the pull request', () => {
  const { assessments, summary } = budgetCanon.pull;

  it('says nothing happened on the route where nothing did', () => {
    const relative = find(assessments, '/accueil', 'transferred_bytes', 'relative');
    expect(relative.delta!.classification).toBe('no-significant-change');
    expect(relative.status).toBe('conforme');
  });

  it('warns on the route that grew, and says it is sitting on the line', () => {
    const route = find(assessments, attributionCanon.route, 'transferred_bytes');
    expect(route.observed).toBe(1_298_000);
    // 2 KB under a 1 300 KB limit, against a 7 KB floor.
    expect(route).toMatchObject({ status: 'warn', headroom: 2_000, withinNoise: true });

    const growth = find(assessments, attributionCanon.route, 'transferred_bytes', 'relative');
    expect(growth.delta!.classification).toBe('regression');
    expect(growth.status).toBe('warn');
  });

  it('blocks the merge on the journey, which is the only thing over a limit', () => {
    const journey = find(assessments, 'demande-acte', 'transferred_bytes');
    expect(journey).toMatchObject({ status: 'breach', headroom: -42_000 });
    expect(summary.conclusion).toBe('failure');
    expect(summary.blocking).toHaveLength(1);
    expect(summary.blocking[0]!.scenarioId).toBe('demande-acte');
  });

  it('leaves nothing undecided, because every scenario has a floor and a baseline', () => {
    expect(summary.counts.nonEvalue).toBe(0);
  });
});

describe('the override', () => {
  it('is the ledger entry, not a copy of it', () => {
    const entry = ledgerEntry(REF.override);
    expect(budgetCanon.override.reason).toBe(entry.payload.reason);
    expect(budgetCanon.override.by).toBe(entry.payload.authorisedBy);
    expect(budgetCanon.override.requestedIn).toBe(entry.payload.pullRequest);
    expect(budgetCanon.override.recordedAt).toBe(entry.createdAt);
    expect(budgetCanon.override.ledgerRef).toBe(entry.entryHash.slice(0, 8));
  });
});
