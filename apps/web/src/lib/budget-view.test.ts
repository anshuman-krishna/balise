import { describe, expect, it } from 'vitest';
import { NARROW_NBSP } from '@balise/ui';
import { budgetCanon } from '../fixtures/budget-canon';
import {
  budgetRows,
  checkRows,
  checkRunOutput,
  checkStatusText,
  formatHeadroom,
  formatMeasured,
  overrideCard,
} from './budget-view';

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
    // the median of the shares the runs measured, not the ratio of two
    // medians: the share is extracted per run like any other metric. the two
    // agree here because the middle run sits on both centres, which is the
    // property that lets a capture be published beside an aggregate at all.
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
    expect(checkStatusText()).toBe('1 budget over its limit, 2 significant regressions');
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

describe('the artifact the check posts', () => {
  const output = checkRunOutput();

  it('reports the same verdict as the screen, from the same summary', () => {
    expect(output.conclusion).toBe('failure');
    expect(output.title).toBe(checkStatusText());
  });

  it('carries the same figures as the rendered rows', () => {
    const journey = checkRows().find((row) => row.scenarioId === 'demande-acte');
    expect(output.text).toContain(`1${NARROW_NBSP}442 KB`);
    expect(journey).toMatchObject({ headKb: 1_442, verdict: 'fail' });
  });

  it('carries the attribution sentence the comparison screen shows', () => {
    expect(output.text).toContain('date-fns');
  });

  it('links the ledger entry the footer of every document links to', () => {
    expect(output.text).toContain(budgetCanon.provenance.verificationUrl);
  });

  it('annotates the line of balise.yml that decided', () => {
    const line = budgetCanon.config.rules.find(
      (rule) => rule.scope.kind === 'journey' && rule.metricId === 'transferred_bytes',
    )?.fail?.line;
    expect(output.annotations[0]).toMatchObject({ path: 'balise.yml', level: 'failure', startLine: line });
  });

  it('annotates the source file attribution placed, at the lines it measured', () => {
    const placed = output.annotations.filter((annotation) => annotation.path !== 'balise.yml');
    expect(placed).toEqual([
      expect.objectContaining({
        path: 'src/lib/dates.ts',
        startLine: 1,
        endLine: 104,
        level: 'notice',
      }),
    ]);
  });

  it('annotates no dependency, though three of them are in the diff', () => {
    const paths = output.annotations.map((annotation) => annotation.path);
    expect(paths.some((path) => path.includes('node_modules'))).toBe(false);
  });
});
