import { describe, expect, it } from 'vitest';
import { NARROW_NBSP } from '@balise/ui';
import { budgetCanon } from '../fixtures/budget-canon';
import { budgetRows, checkRows, checkStatusText, formatHeadroom, formatMeasured, overrideCard } from './budget-view';

describe('formatting a measured value', () => {
  it('shows bytes in kilobytes, and small ones in bytes', () => {
    expect(formatMeasured(1_298_000, 'bytes')).toBe(`1${NARROW_NBSP}298 KB`);
    expect(formatMeasured(840, 'bytes')).toBe('840 B');
  });

  it('keeps a decimal on a percentage, because that is what was measured', () => {
    expect(formatMeasured(38.70967741935484, 'pct')).toBe('38.7 %');
  });

  it('leaves a count alone', () => {
    expect(formatMeasured(84, 'count')).toBe('84');
  });
});

describe('formatting a headroom', () => {
  it('uses a share of the threshold when there is room', () => {
    expect(formatHeadroom(60_000, 900_000, 'bytes')).toBe('+7 %');
  });

  it('falls back to the unit when the share would round to nothing', () => {
    // 2 KB under 1 300 KB is 0.15 percent. "+0 %" would hide the one row worth
    // looking at.
    expect(formatHeadroom(2_000, 1_300_000, 'bytes')).toBe('+2 KB');
  });

  it('counts a share budget in points, never in percent of a percent', () => {
    expect(formatHeadroom(-8.71, 30, 'pct')).toBe('-8.7 pt');
  });
});

describe('the budgets table', () => {
  const rows = budgetRows();

  it('has one row per rule, not one per scenario', () => {
    expect(rows).toHaveLength(budgetCanon.config.rules.length);
  });

  it('names the scenario when a rule covers more than one', () => {
    const share = rows.find((row) => row.metric === 'third-party share');
    expect(share).toMatchObject({ scope: 'service', scenario: '/actualites', status: 'breach' });
    const accueil = rows.find((row) => row.scope === '/accueil');
    expect(accueil!.scenario).toBeNull();
  });

  it('reports the worst scenario a service rule found', () => {
    const share = rows.find((row) => row.metric === 'third-party share');
    expect(share!.current).toBe('38.7 %');
    expect(share!.headroom).toBe('-8.7 pt');
  });

  it('marks the row an override is holding open', () => {
    const actualites = rows.find((row) => row.scope === '/actualites');
    expect(actualites).toMatchObject({ status: 'breach', overridden: true, action: 'fail' });
  });

  it('shows the growth rule as undecided on a branch, with the reason', () => {
    const relative = rows.find((row) => row.metric === 'Δ vs baseline');
    expect(relative).toMatchObject({ status: 'non_evalue', reasonNote: 'no baseline', barPct: null });
    // nothing was decided, so no scenario is worse than any other.
    expect(relative!.scenario).toBeNull();
  });

  it('shows a threshold in the unit of the value beside it, and keeps what the file wrote', () => {
    const route = rows.find((row) => row.scope === '/demarches/*' && row.metric === 'bytes');
    expect(route).toMatchObject({ threshold: `1${NARROW_NBSP}300 KB`, thresholdSource: '1300KB' });
  });

  it('fills the bar from the measured value against its threshold', () => {
    const accueil = rows.find((row) => row.scope === '/accueil');
    expect(accueil!.barPct).toBeCloseTo((840_000 / 900_000) * 100);
  });
});

describe('the check rows', () => {
  const rows = checkRows();

  it('carries one row per scenario the pull request measured', () => {
    expect(rows.map((row) => row.scenarioId)).toEqual(['/accueil', '/demarches/acte-naissance', 'demande-acte']);
  });

  it('reports a delta under the floor as no significant change', () => {
    expect(rows[0]).toMatchObject({ deltaKb: 2, floorKb: 7, classification: 'no-significant-change', verdict: 'noSig' });
  });

  it('reports the route that grew as a warning, and the journey as a failure', () => {
    expect(rows[1]).toMatchObject({ baseKb: 1_114, headKb: 1_298, deltaKb: 184, verdict: 'warn' });
    expect(rows[2]).toMatchObject({ deltaKb: 184, verdict: 'fail' });
  });
});

describe('the check summary line', () => {
  it('counts what the engine found, and counts a scenario once', () => {
    expect(checkStatusText()).toBe('1 route over budget, 2 significant regressions');
  });
});

describe('the override card', () => {
  it('states what it is letting through, in figures', () => {
    expect(overrideCard()).toMatchObject({
      requestedIn: 'PR #401',
      scope: '/actualites',
      metric: 'bytes',
      past: '340 KB',
      by: 'm. carbonne',
    });
  });
});
