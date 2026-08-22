/**
 * the contract as signed, and the arithmetic its dates follow.
 *
 * nothing here reads the register, the measurements or the interface locale.
 * two generators and three screens need the same answer to "which quarter is
 * this, and when does its report fall due", and the register is built from
 * that answer rather than beside it.
 *
 * what this replaces: five calendar rows with their dates and their countdowns
 * typed, four of the five countdowns a day short of the day the register puts
 * them at, and the fifth refusing to count at all.
 */

export const CONTRACT = {
  ref: '2026-SL-0417',
  /** the day the contract was notified. every date in it counts from here. */
  notifiedAt: '2026-04-02T00:00:00.000Z',
  termMonths: 36,
  /** the article of the CCAP carrying the environmental execution clause. */
  article: '8.4',
  /** article 8.4 asks for one execution report per quarter. */
  reportsPerYear: 4,
  conformityTargetPct: 75,
  /** the review the conformity target is measured at, not the contract term. */
  conformityReviewMonths: 12,
} as const;

const MONTHS_PER_PERIOD = 12 / CONTRACT.reportsPerYear;

/** a reporting period, numbered the way the contract numbers it: from one. */
export interface Quarter {
  year: number;
  quarter: number;
}

export function notifiedAt(): Date {
  return new Date(CONTRACT.notifiedAt);
}

/** calendar months, so a term of 36 months ends on the day of the month it began. */
export function addMonths(at: Date, months: number): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + months, at.getUTCDate()));
}

export function termEndsAt(): Date {
  return addMonths(notifiedAt(), CONTRACT.termMonths);
}

export function contractReviewAt(): Date {
  return addMonths(notifiedAt(), CONTRACT.conformityReviewMonths);
}

export function quarterOf(at: Date): Quarter {
  return {
    year: at.getUTCFullYear(),
    quarter: Math.floor(at.getUTCMonth() / MONTHS_PER_PERIOD) + 1,
  };
}

export function quarterStart(period: Quarter): Date {
  return new Date(Date.UTC(period.year, (period.quarter - 1) * MONTHS_PER_PERIOD, 1));
}

/**
 * the end of the last day of the period, which is the day its report falls
 * due. the whole of that day is inside the period: a report covering a quarter
 * that ends on 30 june counts what happened on 30 june.
 */
export function quarterEnd(period: Quarter): Date {
  return new Date(Date.UTC(period.year, period.quarter * MONTHS_PER_PERIOD, 0, 23, 59, 59, 999));
}

export function nextQuarter(period: Quarter): Quarter {
  return period.quarter === CONTRACT.reportsPerYear
    ? { year: period.year + 1, quarter: 1 }
    : { year: period.year, quarter: period.quarter + 1 };
}

export interface ReportDeadline {
  period: Quarter;
  at: Date;
}

/**
 * every report the contract will ask for, from the period it was notified in
 * to the last one that closes inside the term.
 */
export function reportingDeadlines(): ReportDeadline[] {
  const last = termEndsAt();
  const deadlines: ReportDeadline[] = [];
  let period = quarterOf(notifiedAt());
  for (;;) {
    const at = quarterEnd(period);
    if (at > last) return deadlines;
    deadlines.push({ period, at });
    period = nextQuarter(period);
  }
}

/** the reports whose period had closed on a given day. */
export function reportsDueBy(at: Date): ReportDeadline[] {
  return reportingDeadlines().filter((deadline) => deadline.at <= at);
}

export interface ReportPeriod {
  period: Quarter;
  from: Date;
  to: Date;
}

/**
 * what a report established on a given day can cover: the period's own days,
 * cut at the notification on one end and at the moment the report was
 * established on the other.
 *
 * the cut at the far end is the point. the report the register holds was
 * established on 15 august and printed a period ending 30 september, under a
 * sentence saying it was established from N relevés on that period. forty-six
 * days of it had not happened.
 */
export function reportPeriod(period: Quarter, generatedAt: Date): ReportPeriod {
  const start = quarterStart(period);
  const end = quarterEnd(period);
  const notified = notifiedAt();
  return {
    period,
    from: start < notified ? notified : start,
    to: end < generatedAt ? end : generatedAt,
  };
}
