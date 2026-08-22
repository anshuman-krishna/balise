import { corpusCanon } from '../fixtures/corpus-canon';
import { criteriaCanon } from '../fixtures/criteria-canon';
import { ledgerCanon } from '../fixtures/ledger-canon';
import { REF, shortHash } from '../fixtures/ledger-refs';
import { t, tFr } from '../i18n';

/**
 * every date and count that describes a version of the declaration.
 *
 * a version is the assessment state on the day it was established, so its
 * conformity count is the engine answering that day's evidence rather than a
 * figure carried backwards from today. the counts were typed before this: v1
 * read 28 where the engine says 26, and every attestation in the canon was
 * dated five months after v1 and v2 were published, which made the count
 * unreachable rather than merely wrong.
 */
export interface DeclarationVersion {
  tag: string;
  draft: boolean;
  establishedAt: string;
  conforme: number;
  answered: number;
  applicable: number;
  total: number;
  /** the register entry, where the version was published rather than drafted. */
  ledger: string | null;
}

const LEDGER_REF: Record<string, string> = {
  v1: REF.declarationV1,
  v2: REF.declarationV2,
  v3: REF.declarationV3,
};

export function declarationVersions(): DeclarationVersion[] {
  return criteriaCanon.versions.map((version) => ({
    ...version,
    // a draft is not in the register: nothing has been published to record.
    ledger: version.draft ? null : `${shortHash(LEDGER_REF[version.tag] ?? '')}…`,
  }));
}

/** newest first, which is the order a history is read in. */
export function declarationHistory(): DeclarationVersion[] {
  return [...declarationVersions()].reverse();
}

export function draftVersion(): DeclarationVersion {
  const draft = declarationHistory().find((version) => version.draft);
  if (draft === undefined) throw new Error('the declaration canon holds no draft version');
  return draft;
}

export function publishedVersion(): DeclarationVersion {
  const published = declarationHistory().find((version) => !version.draft);
  if (published === undefined) throw new Error('the declaration canon holds no published version');
  return published;
}

/**
 * the referential asks for a declaration updated annually, so the review falls
 * a year after the version in force. one rule, one place, rather than a date
 * typed beside each surface that states it.
 */
export function reviewDue(): Date {
  const at = new Date(publishedVersion().establishedAt);
  return new Date(Date.UTC(at.getUTCFullYear() + 1, at.getUTCMonth(), at.getUTCDate()));
}

/** `12 Mar 2026`, the app register's date with its year. */
export function dateWithYear(iso: string | Date): string {
  const at = iso instanceof Date ? iso : new Date(iso);
  return `${at.getUTCDate()} ${t.months[at.getUTCMonth()] ?? ''} ${at.getUTCFullYear()}`;
}

/** `15 août 2026`, the document register's date, french in both locales. */
export function longDateFr(iso: string | Date): string {
  const at = iso instanceof Date ? iso : new Date(iso);
  return `${at.getUTCDate()} ${tFr.monthsLong[at.getUTCMonth()] ?? ''} ${at.getUTCFullYear()}`;
}

/** `03/03/2026`, the form a printed footer uses for a range of days. */
export function slashDate(iso: string | Date): string {
  const at = iso instanceof Date ? iso : new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(at.getUTCDate())}/${pad(at.getUTCMonth() + 1)}/${at.getUTCFullYear()}`;
}

/** `15.08.26`, the embeddable badge, which has room for nothing longer. */
export function badgeDate(iso: string | Date): string {
  const at = iso instanceof Date ? iso : new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(at.getUTCDate())}.${pad(at.getUTCMonth() + 1)}.${String(at.getUTCFullYear()).slice(-2)}`;
}

/**
 * the canon's today: the moment the last thing in the register happened. the
 * app used to count down "47 d" to a review it never dated, on a bar that is
 * on every screen, five months out from a review the editor puts in march 2027.
 */
export function latestEntryAt(): Date {
  const latest = ledgerCanon.entries.reduce((newest, entry) =>
    entry.createdAt > newest.createdAt ? entry : newest,
  );
  return new Date(latest.createdAt);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function utcMidnight(at: Date): number {
  return Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
}

/**
 * whole days between two dates, not between two instants. "due in 208 days"
 * read off a timestamp at 15:20 is a different date from the one the editor
 * prints, and the reader counts calendar days.
 */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((utcMidnight(to) - utcMidnight(from)) / DAY_MS);
}

export interface ReviewCountdown {
  /** days from the canon's today to the annual review. */
  days: number;
  /** how old the version in force is, in days. */
  ageDays: number;
  /**
   * true once the version in force is past the age the fleet calls due. the
   * same constant, read from the other end: an age over the threshold and a
   * review inside the remaining window are one fact.
   */
  due: boolean;
}

export function reviewCountdown(): ReviewCountdown {
  const now = latestEntryAt();
  const ageDays = daysBetween(new Date(publishedVersion().establishedAt), now);
  return {
    days: daysBetween(now, reviewDue()),
    ageDays,
    due: ageDays > corpusCanon.declarationDueDays,
  };
}

export interface MeasurementSpan {
  /** the day the register's first run was recorded. */
  since: Date;
  /** whole days from that day to the register's latest entry. */
  days: number;
  /** runs the register retains. */
  runs: number;
}

/**
 * "continuous measurement since X, N days, M runs", which the dashboard and
 * the tender both state. it is a fact about the register, so it is read from
 * the register rather than typed twice beside it.
 */
export function measurementSpan(): MeasurementSpan {
  const { runs } = ledgerCanon;
  const since = new Date(runs.firstAt);
  return { since, days: daysBetween(since, latestEntryAt()), runs: runs.count };
}
