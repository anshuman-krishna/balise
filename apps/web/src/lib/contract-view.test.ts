import { describe, expect, it } from 'vitest';
import { ledgerCanon } from '../fixtures/ledger-canon';
import {
  DEADLINE_WINDOW_DAYS,
  calendarDate,
  contractCalendar,
  contractReports,
  latestReport,
  periodText,
  quarterLabelFr,
  reportDelivery,
} from './contract-view';
import { daysBetween, latestEntryAt, reviewDue } from './declaration-view';
import { t } from '../i18n';
import { documentsFixture } from '../fixtures/canon';
import { ledgerEntry } from '../fixtures/ledger-refs';

describe('the contract calendar', () => {
  const calendar = contractCalendar();

  it('is in the order the dates fall', () => {
    const times = calendar.map((entry) => entry.at.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it('counts every date, including the far one', () => {
    // the row for the end of the term used to print a dash. it is 959 days
    // away, which is a number.
    expect(calendar.every((entry) => Number.isInteger(entry.days))).toBe(true);
    expect(calendar.at(-1)!.days).toBeGreaterThan(900);
  });

  // the tracker printed 208 days to the same review the app bar, counting
  // properly, puts at 209.
  it('counts the declaration review to the same day the app bar does', () => {
    const review = calendar.find((entry) => entry.at.getTime() === reviewDue().getTime());
    expect(review).toBeDefined();
    expect(review!.days).toBe(daysBetween(latestEntryAt(), reviewDue()));
  });

  it('calls a date urgent only inside the window the agency watches', () => {
    for (const entry of calendar) {
      expect(entry.urgent).toBe(entry.days <= DEADLINE_WINDOW_DAYS);
    }
    // nothing falls inside it today: the next report is due in 46 days, and
    // the row was drawn in caution because a fixture said so.
    expect(calendar.some((entry) => entry.urgent)).toBe(false);
  });

  // the rows this replaces were typed `30 SEP 26` and `02 APR 27`, which are
  // english month abbreviations on a french-first screen.
  it('takes its month name from the catalog, and pads the day', () => {
    expect(calendarDate(new Date('2026-09-30T23:59:59.999Z'))).toBe(`30 ${t.months[8]} 26`);
    expect(calendarDate(new Date('2027-04-02T00:00:00.000Z'))).toBe(`02 ${t.months[3]} 27`);
  });
});

describe('the reports the register holds', () => {
  const reports = contractReports();

  it('reads one per generation, oldest first', () => {
    expect(reports).toHaveLength(2);
    expect(reports[0]!.generatedAt.getTime()).toBeLessThan(reports[1]!.generatedAt.getTime());
  });

  it('counts the relevés inside the period rather than stating a number', () => {
    const runs = ledgerCanon.runs;
    for (const report of reports) {
      expect(report.runs).toBeGreaterThan(0);
      expect(report.runs).toBeLessThan(runs.count);
    }
    // the two periods do not overlap, so no run is counted twice.
    expect(reports[0]!.to.getTime()).toBeLessThan(reports[1]!.from.getTime());
  });

  it('stops the latest period at the day the report was established', () => {
    const report = latestReport();
    expect(report.to.toISOString().slice(0, 10)).toBe(
      report.generatedAt.toISOString().slice(0, 10),
    );
    expect(periodText(report)).toBe('01/07 → 15/08/2026');
  });

  it('names the period in french on a document, whatever the locale is', () => {
    expect(quarterLabelFr(latestReport().period)).toBe('T3 2026');
  });
});

describe('the events the report prints', () => {
  const events = documentsFixture.rapport.events.map((event) => ({
    ...event,
    at: new Date(ledgerEntry(event.ref).createdAt),
  }));

  // the three dates were typed, and they printed 15/08, 08/07, 03/08.
  it('reads each date from the register entry the event describes', () => {
    expect(events).toHaveLength(3);
    for (const event of events) {
      expect(Number.isNaN(event.at.getTime())).toBe(false);
    }
  });

  it('holds every event inside the period the report covers', () => {
    const report = latestReport();
    for (const event of events) {
      expect(event.at.getTime()).toBeGreaterThanOrEqual(report.from.getTime());
      expect(event.at.getTime()).toBeLessThanOrEqual(report.generatedAt.getTime());
    }
  });
});

describe('the delivery of execution reports', () => {
  it('counts what the register holds against the periods that have closed', () => {
    const delivery = reportDelivery();
    expect(delivery.delivered).toBe(contractReports().length);
    expect(delivery.due).toBe(1);
    expect(delivery.perYear).toBe(4);
  });
});
