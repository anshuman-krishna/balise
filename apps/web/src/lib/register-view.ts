import { ledgerCanon } from '../fixtures/ledger-canon';
import { ledgerEntry } from '../fixtures/ledger-refs';
import { dateWithYear, latestEntryAt } from './declaration-view';

/**
 * the moments the register holds, read for a screen.
 *
 * every time this product prints is a claim about when something happened,
 * and the register is where that happened. the app bar's "last run 14:02 · 8
 * min ago", the run detail's timestamp, the two run dates on the comparison
 * and both re-baseline rows were all typed beside a chain that records the
 * moment of every one of them.
 */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** `14:02`, a clock time in UTC, which is the only timezone the register has. */
export function clockTime(at: Date): string {
  return `${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}`;
}

/** `15 Aug`, a day where the year is already established by its neighbours. */
export function shortDate(at: Date): string {
  return `${pad(at.getUTCDate())} ${monthOf(at)}`;
}

/** `15 Aug 14:02`, a run's moment where the year is already established. */
export function shortDateTime(at: Date): string {
  return `${shortDate(at)} ${clockTime(at)}`;
}

/** `15 Aug 2026 14:02:41 UTC`, the run detail's header, to the second. */
export function fullTimestamp(at: Date): string {
  return `${dateWithYear(at)} ${clockTime(at)}:${pad(at.getUTCSeconds())} UTC`;
}

function monthOf(at: Date): string {
  // the same catalog `dateWithYear` reads, so a month is spelled once.
  return dateWithYear(at).split(' ')[1] ?? '';
}

export interface RunMoment {
  /** `#4812`, the number every surface calls the run by. */
  id: string;
  at: Date;
}

export function runMoment(refId: string): RunMoment {
  const entry = ledgerEntry(refId);
  const payload = entry.payload as { runId: string };
  return { id: payload.runId, at: new Date(entry.createdAt) };
}

export interface LastRun extends RunMoment {
  /** minutes from the run to the canon's today, which is the register's last entry. */
  minutesAgo: number;
}

/**
 * the most recent run the register retains. the app bar stated `14:02` beside
 * `8 min ago`, and the register's own latest entry is 78 minutes after that
 * run, so the two halves of one sentence were measured from different clocks.
 */
export function lastRun(): LastRun {
  const entry = ledgerCanon.entries
    .filter((candidate) => candidate.kind === 'run')
    .reduce((newest, candidate) => (candidate.createdAt > newest.createdAt ? candidate : newest));
  const at = new Date(entry.createdAt);
  return {
    id: (entry.payload as { runId: string }).runId,
    at,
    minutesAgo: Math.round((latestEntryAt().getTime() - at.getTime()) / 60_000),
  };
}

export interface Rebaseline {
  at: Date;
  branch: string;
  toRun: string;
  author: string;
  reason: string;
}

/**
 * the branch baselines that were moved, newest first.
 *
 * the whole row was typed beside the entry that records it: the date, the
 * branch, the run, the author and the reason are all in the payload, and the
 * payload is hashed.
 */
export function rebaselines(): Rebaseline[] {
  return ledgerCanon.entries
    .filter((entry) => entry.kind === 'rebaseline')
    .map((entry) => {
      const payload = entry.payload as {
        branch: string;
        toRun: string;
        author: string;
        reason: string;
      };
      return { at: new Date(entry.createdAt), ...payload };
    })
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}
