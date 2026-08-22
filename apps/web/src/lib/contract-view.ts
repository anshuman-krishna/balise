import { ledgerCanon } from '../fixtures/ledger-canon';
import type { Catalog } from '@balise/i18n';
import { fill, t, tFr } from '../i18n';
import {
  CONTRACT,
  contractReviewAt,
  quarterOf,
  reportingDeadlines,
  reportsDueBy,
  termEndsAt,
  type Quarter,
} from './contract-terms';
import { daysBetween, latestEntryAt, reviewDue } from './declaration-view';

/**
 * what the tracker and the execution report say about time.
 *
 * every date here is either the contract's own arithmetic or an entry in the
 * register. the calendar this replaces was five rows of typed dates with typed
 * countdowns, one of which stated 208 days to the same review the app bar,
 * counting properly, puts at 209.
 */

export { CONTRACT };

/** the window the agency calls near. a date inside it is the only urgent one. */
export const DEADLINE_WINDOW_DAYS = 30;

/** how many reporting periods a year, spelled the way the locale spells them. */
export function quarterShort(quarter: number, strings: Catalog = t): string {
  return fill(strings.contract.quarterShort, { n: quarter });
}

/** `T3 2026` on a document, which is french whatever the locale is. */
export function quarterLabelFr(period: Quarter): string {
  return `${quarterShort(period.quarter, tFr)} ${period.year}`;
}

export function currentQuarter(): Quarter {
  return quarterOf(latestEntryAt());
}

export interface ContractDate {
  at: Date;
  label: string;
  days: number;
  /** inside the window the agency watches, and the only reason a row is drawn in caution. */
  urgent: boolean;
}

/**
 * the dates this contract still owes, in the order they fall.
 *
 * the declaration review is the same date the app bar counts down to, read
 * from the declaration rather than typed here, because a tracker and a bar
 * disagreeing by a day about one date is the kind of thing an auditor opens
 * with.
 */
export function contractCalendar(): ContractDate[] {
  const now = latestEntryAt();
  const dated: { at: Date; label: string }[] = [
    ...reportingDeadlines()
      .filter((deadline) => deadline.at > now)
      .slice(0, 2)
      .map((deadline) => ({
        at: deadline.at,
        label: fill(t.contract.calendar.report, { quarter: quarterShort(deadline.period.quarter) }),
      })),
    { at: reviewDue(), label: t.contract.calendar.declarationReview },
    {
      at: contractReviewAt(),
      label: fill(t.contract.calendar.contractReview, { months: CONTRACT.conformityReviewMonths }),
    },
    { at: termEndsAt(), label: t.contract.calendar.termEnd },
  ];
  return dated
    .map((entry) => {
      const days = daysBetween(now, entry.at);
      return { ...entry, days, urgent: days <= DEADLINE_WINDOW_DAYS };
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

export interface ContractReport {
  refId: string;
  period: Quarter;
  from: Date;
  to: Date;
  /** relevés the register holds inside the period, counted rather than stated. */
  runs: number;
  generatedAt: Date;
}

/**
 * the execution reports the register holds for this contract, oldest first.
 *
 * the tracker's delivery squares count these. they used to be a typed 2 beside
 * a typed count of elapsed periods, on a register that held one report.
 */
export function contractReports(): ContractReport[] {
  return ledgerCanon.entries
    .filter((entry) => entry.kind === 'report_generated')
    .map((entry) => {
      const payload = entry.payload as {
        contract: string;
        period: string;
        runsInPeriod: number;
      };
      const [from = '', to = ''] = payload.period.split('/');
      const at = new Date(`${from}T00:00:00.000Z`);
      return {
        refId: entry.refId,
        period: quarterOf(at),
        from: at,
        to: new Date(`${to}T00:00:00.000Z`),
        runs: payload.runsInPeriod,
        generatedAt: new Date(entry.createdAt),
      };
    })
    .filter((report) => report.refId.includes(CONTRACT.ref.toLowerCase().replace(/-/g, '_')))
    .sort((a, b) => a.generatedAt.getTime() - b.generatedAt.getTime());
}

/** the report the document renders: the most recent one the register holds. */
export function latestReport(): ContractReport {
  const latest = contractReports().at(-1);
  if (latest === undefined) throw new Error('the register holds no execution report for this contract');
  return latest;
}

export interface ReportDelivery {
  /** reports the register holds. */
  delivered: number;
  /** reporting periods that had closed on the canon's today. */
  due: number;
  /** reports the contract asks for in a year. */
  perYear: number;
}

export function reportDelivery(): ReportDelivery {
  return {
    delivered: contractReports().length,
    due: reportsDueBy(latestEntryAt()).length,
    perYear: CONTRACT.reportsPerYear,
  };
}

/** `08/07`, the day of a period event, in the form the report prints. */
export function dayMonth(at: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(at.getUTCDate())}/${pad(at.getUTCMonth() + 1)}`;
}

/** `01/07 → 15/08/2026`, the period printed in a document header. */
export function periodText(report: ContractReport): string {
  const day = dayMonth;
  const from =
    report.from.getUTCFullYear() === report.to.getUTCFullYear()
      ? day(report.from)
      : `${day(report.from)}/${report.from.getUTCFullYear()}`;
  return `${from} → ${day(report.to)}/${report.to.getUTCFullYear()}`;
}

/**
 * `30 sept. 26`, the calendar column, uppercased in css rather than in the
 * string. the day is padded because the column is mono and a ragged left edge
 * on a column of dates reads as a mistake.
 */
export function calendarDate(at: Date): string {
  const day = String(at.getUTCDate()).padStart(2, '0');
  return `${day} ${t.months[at.getUTCMonth()] ?? ''} ${String(at.getUTCFullYear()).slice(-2)}`;
}
