import { describe, expect, it } from 'vitest';
import {
  CONTRACT,
  addMonths,
  contractReviewAt,
  notifiedAt,
  quarterEnd,
  quarterOf,
  quarterStart,
  reportPeriod,
  reportingDeadlines,
  reportsDueBy,
  termEndsAt,
} from './contract-terms';

const day = (at: Date) => at.toISOString().slice(0, 10);

describe('the contract term', () => {
  it('ends on the day of the month it began, a term later', () => {
    expect(day(notifiedAt())).toBe('2026-04-02');
    expect(day(termEndsAt())).toBe('2029-04-02');
  });

  it('places the contractual review at the review month, not at the term', () => {
    expect(day(contractReviewAt())).toBe('2027-04-02');
    expect(CONTRACT.conformityReviewMonths).toBeLessThan(CONTRACT.termMonths);
  });

  it('counts calendar months, so the end of a long month does not roll forward', () => {
    expect(day(addMonths(new Date('2026-01-31T00:00:00.000Z'), 1))).toBe('2026-03-03');
  });
});

describe('reporting periods', () => {
  it('numbers a period the way the contract does', () => {
    expect(quarterOf(new Date('2026-08-15T15:20:08.000Z'))).toEqual({ year: 2026, quarter: 3 });
    expect(day(quarterStart({ year: 2026, quarter: 3 }))).toBe('2026-07-01');
  });

  // a report covering a quarter that ends on 30 june counts what happened on
  // 30 june. reading the end as midnight loses a day of runs.
  it('runs the last day of the period to its end', () => {
    const end = quarterEnd({ year: 2026, quarter: 2 });
    expect(day(end)).toBe('2026-06-30');
    expect(end.getTime()).toBeGreaterThan(Date.parse('2026-06-30T23:00:00.000Z'));
  });

  it('asks for a report from the period it was notified in to the end of the term', () => {
    const deadlines = reportingDeadlines();
    expect(deadlines[0]).toMatchObject({ period: { year: 2026, quarter: 2 } });
    expect(day(deadlines[0]!.at)).toBe('2026-06-30');
    expect(day(deadlines.at(-1)!.at)).toBe('2029-03-31');
    expect(deadlines.length).toBe(12);
  });

  it('counts one period closed by the canon of the register', () => {
    expect(reportsDueBy(new Date('2026-08-15T15:20:08.000Z'))).toHaveLength(1);
  });
});

describe('what a report can cover', () => {
  it('starts at the notification when the contract began mid period', () => {
    const covered = reportPeriod({ year: 2026, quarter: 2 }, new Date('2026-07-15T09:40:00.000Z'));
    expect(day(covered.from)).toBe('2026-04-02');
    expect(day(covered.to)).toBe('2026-06-30');
  });

  // the report the register holds was established on 15 august and printed a
  // period ending 30 september, under a sentence saying it was established
  // from N relevés on that period.
  it('stops at the day it was established, never at a day that has not happened', () => {
    const covered = reportPeriod({ year: 2026, quarter: 3 }, new Date('2026-08-15T15:20:08.000Z'));
    expect(day(covered.from)).toBe('2026-07-01');
    expect(day(covered.to)).toBe('2026-08-15');
  });
});
