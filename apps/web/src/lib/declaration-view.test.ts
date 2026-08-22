import { describe, expect, it } from 'vitest';
import { corpusCanon } from '../fixtures/corpus-canon';
import { ledgerCanon } from '../fixtures/ledger-canon';
import {
  badgeDate,
  dateWithYear,
  declarationHistory,
  declarationVersions,
  draftVersion,
  latestEntryAt,
  longDateFr,
  publishedVersion,
  reviewCountdown,
  reviewDue,
} from './declaration-view';

describe('the declaration versions', () => {
  it('reads the register hash for a published version and none for the draft', () => {
    const [v1, v2, v3] = declarationVersions();
    expect(v1!.ledger).toMatch(/^[0-9a-f]{8}…$/);
    expect(v2!.ledger).toMatch(/^[0-9a-f]{8}…$/);
    // a draft has been published nowhere, so there is nothing to record.
    expect(v3!.ledger).toBeNull();
  });

  it('names the draft and the version in force', () => {
    expect(draftVersion().tag).toBe('v3');
    expect(publishedVersion().tag).toBe('v2');
  });

  it('reads a history newest first', () => {
    expect(declarationHistory().map((version) => version.tag)).toEqual(['v3', 'v2', 'v1']);
  });
});

// the referential asks for a declaration updated annually. one rule, not a
// date typed beside each of the three surfaces that state it.
describe('the review date', () => {
  it('falls a year after the version in force', () => {
    const published = new Date(publishedVersion().establishedAt);
    const due = reviewDue();
    expect(due.getUTCFullYear()).toBe(published.getUTCFullYear() + 1);
    expect(due.getUTCMonth()).toBe(published.getUTCMonth());
    expect(due.getUTCDate()).toBe(published.getUTCDate());
  });

  it('is stated in the app register and in the document register', () => {
    expect(dateWithYear(reviewDue())).toBe('12 Mar 2027');
    expect(longDateFr(reviewDue())).toBe('12 mars 2027');
  });
});

describe('formatting a declaration date', () => {
  const established = draftVersion().establishedAt;

  it('carries the year, which a run detail date does not', () => {
    expect(dateWithYear(established)).toBe('15 Aug 2026');
  });

  it('writes a document date in full, in french', () => {
    expect(longDateFr(established)).toBe('15 août 2026');
  });

  it('pads the badge, which has room for nothing longer', () => {
    expect(badgeDate(established)).toBe('15.08.26');
    expect(badgeDate('2026-03-04T00:00:00.000Z')).toBe('04.03.26');
  });
});

// the bar is on every screen in the app, and it used to count down 47 days to
// a review nothing dated. the editor puts that review in march 2027.
describe('the review countdown', () => {
  const countdown = reviewCountdown();

  it('counts from the register, not from the wall clock', () => {
    const newest = latestEntryAt();
    const oldestFirst = [...ledgerCanon.entries].map((entry) => entry.createdAt).sort();
    expect(newest.toISOString()).toBe(oldestFirst.at(-1));
  });

  it('lands on the date the editor states', () => {
    const from = latestEntryAt();
    const due = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + countdown.days),
    );
    expect(dateWithYear(due)).toBe(dateWithYear(reviewDue()));
  });

  // the tone reads the same threshold the fleet reads, from the other end: a
  // version older than the due age is a review inside the remaining window.
  it('calls the declaration due on the threshold the fleet reads', () => {
    expect(countdown.ageDays).toBeLessThanOrEqual(corpusCanon.declarationDueDays);
    expect(countdown.due).toBe(false);
  });
});
