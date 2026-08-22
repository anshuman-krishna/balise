import { describe, expect, it } from 'vitest';
import {
  budgetsFixture,
  canon,
  comparisonFixture,
  declarationFixture,
  documentsFixture,
  runDetailFixture,
} from '../fixtures/canon';
import { ledgerCanon } from '../fixtures/ledger-canon';
import { REF } from '../fixtures/ledger-refs';
import { latestEntryAt, longDateFr } from './declaration-view';
import {
  clockTime,
  fullTimestamp,
  lastRun,
  rebaselines,
  runMoment,
  shortDate,
} from './register-view';

describe('a run is a moment in the register', () => {
  it('reads the run every surface calls #4812', () => {
    const run = runMoment(REF.run);
    expect(run.id).toBe('#4812');
    expect(clockTime(run.at)).toBe('14:02');
  });

  it('gives the run detail its own entry, to the second', () => {
    expect(runDetailFixture.timestamp).toBe(fullTimestamp(runMoment(REF.run).at));
    expect(runDetailFixture.timestamp).toMatch(/UTC$/);
  });

  // the comparison read `09 Aug 03:00` for a run the register records on 14
  // august, and both dates were typed.
  it('dates both sides of the comparison from the register', () => {
    expect(comparisonFixture.baseline.run).toBe('#4790');
    expect(comparisonFixture.candidate.run).toBe('#4812');
    const baseline = runMoment(REF.baselineRun);
    const candidate = runMoment(REF.run);
    expect(baseline.at.getTime()).toBeLessThan(candidate.at.getTime());
    expect(comparisonFixture.baseline.date).toBe(
      `${shortDate(baseline.at)} ${clockTime(baseline.at)}`,
    );
  });
});

describe('the last run', () => {
  // the bar stated `14:02` beside `8 min ago`, and the register's latest entry
  // is 78 minutes after that run.
  it('counts from the run to the register, not from a typed number', () => {
    const run = lastRun();
    const expected = Math.round((latestEntryAt().getTime() - run.at.getTime()) / 60_000);
    expect(canon.appBar.lastRunMinutesAgo).toBe(expected);
    expect(canon.appBar.lastRunTime).toBe(clockTime(run.at));
    expect(expected).toBeGreaterThan(0);
  });

  it('is the newest run the register holds', () => {
    expect(lastRun().id).toBe('#4812');
  });
});

describe('the re-baseline rows', () => {
  const rows = rebaselines();

  it('reads the date, the branch, the run, the author and the reason from the entry', () => {
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ branch: 'main', toRun: '#4790', author: 'c. bellanger' });
    expect(rows[1]).toMatchObject({ branch: 'main', toRun: '#4612', reason: 'new hosting' });
  });

  it('is newest first, and every move follows the run it moved to', () => {
    expect(rows[0]!.at.getTime()).toBeGreaterThan(rows[1]!.at.getTime());
    expect(rows[0]!.at.getTime()).toBeGreaterThan(runMoment(REF.baselineRun).at.getTime());
    expect(rows[1]!.at.getTime()).toBeGreaterThan(runMoment(REF.previousBaselineRun).at.getTime());
  });

  it('is what the budgets screen renders', () => {
    expect(budgetsFixture.rebaselines.map((row) => row.move)).toEqual([
      'main → #4790',
      'main → #4612',
    ]);
  });
});

describe('the dates the documents print', () => {
  // three of them were typed: the declaration's "measured since", the annexe's
  // date and the preview's verification date.
  it('states no day outside the span the register covers', () => {
    const first = new Date(ledgerCanon.runs.firstAt);
    const last = latestEntryAt();
    const dates = [
      documentsFixture.declaration.since,
      documentsFixture.annexe.date,
      declarationFixture.preview.verifiedDate,
    ];
    for (const printed of dates) {
      expect(printed).toMatch(/\d{4}$/);
      const year = Number(printed.slice(-4));
      expect(year).toBeGreaterThanOrEqual(first.getUTCFullYear());
      expect(year).toBeLessThanOrEqual(last.getUTCFullYear());
    }
    expect(documentsFixture.declaration.since).toBe(longDateFr(first));
    expect(documentsFixture.annexe.date).toBe(longDateFr(last));
  });
});

describe('the deadline the dashboard shows', () => {
  // the card said 45 days to 30 SEP 2026, and had no way of following the
  // tracker when the tracker's own count was fixed.
  it('is the first date on the contract calendar', () => {
    expect(canon.deadline.days).toBe(46);
    // 30 september, read off the date rather than off a month name, which
    // changes with the locale.
    expect(canon.deadline.date.getUTCDate()).toBe(30);
    expect(canon.deadline.date.getUTCMonth()).toBe(8);
    expect(canon.deadline.contract).toBe('2026-SL-0417');
  });
});
