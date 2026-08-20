import type { Confidence, DeltaClassification } from '@balise/schemas';
import { formatMeasured } from '@balise/schemas';
import { PROVISIONAL_FINDING_THRESHOLDS } from '@balise/measure-core';
import type { Catalog } from '@balise/i18n';
import { fill } from '../i18n';
import { corpusCanon } from '../fixtures/corpus-canon';
import { checkFailed } from './budget-view';

/**
 * the corpus, read for the fleet and the public index. this selects and
 * formats; it computes no position.
 *
 * the catalog is an argument because the public index is french whatever the
 * app locale is and the fleet is not, which is the same split the free scan
 * and the run detail already make.
 */

export type CorpusRow = (typeof corpusCanon)['rows'][number];
export type Sector = CorpusRow['sector'];

export function corpusRows(): readonly CorpusRow[] {
  return corpusCanon.rows;
}

/** the tenant agency's own services. the fleet is a subset of the index. */
export function fleetRows(): readonly CorpusRow[] {
  return corpusCanon.rows.filter((row) => row.inFleet);
}

export function corpusRow(domain: string): CorpusRow {
  const found = corpusCanon.rows.find((row) => row.domain === domain);
  if (found === undefined) throw new Error(`the corpus holds no ${domain}`);
  return found;
}

export const TONE_COLOR = {
  none: 'var(--text-secondary)',
  ok: 'var(--conforme)',
  caution: 'var(--caution)',
  breach: 'var(--breach)',
} as const;

export type Tone = keyof typeof TONE_COLOR;

/** kilobytes, through the one formatter every measured value goes through. */
export function weightText(row: CorpusRow): string {
  return formatMeasured(row.measured.transferredBytes, 'bytes');
}

export function confidenceText(confidence: Confidence, catalog: Catalog): string {
  return catalog.confidence[confidence];
}

export function confidenceTone(confidence: Confidence): Tone {
  // a grade is not a pass state, so it is never drawn in the pass colour.
  return confidence === 'high' ? 'none' : confidence === 'medium' ? 'caution' : 'caution';
}

/**
 * a movement below the floor is not a change, so no percentage is printed for
 * one. drawing it in a quieter grey would not be enough: a signed number in a
 * column headed "trend" reports a change whatever colour it is in, and that is
 * rule 2 lost to a stylesheet. read off the kernel's classification rather
 * than off the sign of the number.
 */
export function trendText(row: CorpusRow, catalog: Catalog): string {
  switch (row.trend.classification) {
    case 'indeterminate':
      return catalog.observatory.trendNa;
    case 'no-significant-change':
      return catalog.observatory.trendFlat;
    default: {
      const sign = row.trend.pct > 0 ? '+' : '−';
      return `${sign}${Math.abs(row.trend.pct).toFixed(1)}%`;
    }
  }
}

export function trendColor(classification: DeltaClassification): string {
  switch (classification) {
    case 'regression':
      return 'var(--breach)';
    case 'improvement':
      return 'var(--conforme)';
    case 'no-significant-change':
      return 'var(--text-secondary)';
    default:
      return 'var(--text-tertiary)';
  }
}

export function declarationText(row: CorpusRow, catalog: Catalog): string {
  if (row.declaration.version === null || row.declaration.ageDays === null) {
    return catalog.observatory.declarationNone;
  }
  return fill(catalog.observatory.declarationCell, {
    version: row.declaration.version,
    days: row.declaration.ageDays,
  });
}

export function declarationTone(row: CorpusRow): Tone {
  switch (row.declaration.state) {
    case 'current':
      return 'ok';
    case 'due':
      return 'caution';
    default:
      return 'breach';
  }
}

export function hostingText(row: CorpusRow, catalog: Catalog): string {
  return catalog.observatory.hosting[row.hosting.state];
}

export function hostingTone(row: CorpusRow): Tone {
  return row.hosting.state === 'verified' ? 'ok' : row.hosting.state === 'standard' ? 'none' : 'caution';
}

export interface Alert {
  text: string;
  tone: Tone;
}

/**
 * the worst thing the corpus knows about one of the agency's services.
 *
 * every branch is something measured or something recorded: a budget the check
 * engine failed, a declaration older than the year the referential gives it, a
 * third-party share past the threshold the findings engine uses, a scenario
 * with no floor. the column this replaces held "runner unstable 3 d" and
 * "3p share 41%" typed beside rows that carried neither figure.
 */
export function alertFor(row: CorpusRow, catalog: Catalog): Alert {
  if (row.domain === AUDITED_DOMAIN && checkFailed()) {
    return { text: catalog.fleet.alerts.budget, tone: 'breach' };
  }
  if (row.declaration.state === 'none') {
    return { text: catalog.fleet.alerts.declarationMissing, tone: 'breach' };
  }
  if (row.declaration.state === 'expired') {
    return {
      text: fill(catalog.fleet.alerts.declarationExpired, { days: row.declaration.ageDays! }),
      tone: 'breach',
    };
  }
  const share = row.measured.thirdPartySharePct / 100;
  if (share >= PROVISIONAL_FINDING_THRESHOLDS.thirdPartyShare.breach) {
    return {
      text: fill(catalog.fleet.alerts.thirdParty, {
        share: `${row.measured.thirdPartySharePct.toFixed(0)} %`,
      }),
      tone: 'breach',
    };
  }
  if (row.trend.classification === 'indeterminate') {
    return { text: catalog.fleet.alerts.noFloor, tone: 'caution' };
  }
  if (row.declaration.state === 'due') {
    return {
      text: fill(catalog.fleet.alerts.declarationDue, { days: row.declaration.ageDays! }),
      tone: 'caution',
    };
  }
  if (share >= PROVISIONAL_FINDING_THRESHOLDS.thirdPartyShare.caution) {
    return {
      text: fill(catalog.fleet.alerts.thirdParty, {
        share: `${row.measured.thirdPartySharePct.toFixed(0)} %`,
      }),
      tone: 'caution',
    };
  }
  return { text: catalog.fleet.alerts.none, tone: 'none' };
}

/** the service the rest of the application measures in depth. */
export const AUDITED_DOMAIN = 'sevre-et-loire.fr';

export interface FleetSummary {
  breaches: number;
  staleDeclarations: number;
}

/** counted from the rows below them, so the strip cannot contradict the table. */
export function fleetSummary(catalog: Catalog): FleetSummary {
  const rows = fleetRows();
  return {
    breaches: rows.filter((row) => alertFor(row, catalog).tone === 'breach').length,
    staleDeclarations: rows.filter(
      (row) => row.declaration.state === 'expired' || row.declaration.state === 'none',
    ).length,
  };
}

export interface BenchmarkBar {
  /** left edge and width as fractions of the axis. */
  x: number;
  width: number;
  /** height as a fraction of the tallest bucket. */
  height: number;
  count: number;
}

export interface BenchmarkView {
  bars: readonly BenchmarkBar[];
  /** the audited service and the corpus median, as fractions of the axis. */
  marker: number;
  median: number;
  markerLabel: string;
  medianLabel: string;
  axis: readonly string[];
  caption: string;
}

/**
 * the corpus's distribution of measured page weight, as fractions.
 *
 * fractions rather than coordinates: the version of this carried twelve
 * x/y/height triples from a mockup, a marker at x=99 and a percentile of 38,
 * four numbers about a distribution that was never computed and could not have
 * agreed with each other if it had been.
 */
export function benchmark(catalog: Catalog): BenchmarkView {
  const { buckets, max, median } = corpusCanon.benchmark;
  const tallest = Math.max(...buckets.map((bucket) => bucket.count));
  const audited = corpusRow(AUDITED_DOMAIN);

  return {
    bars: buckets.map((bucket) => ({
      x: bucket.from / max,
      width: (bucket.to - bucket.from) / max,
      height: tallest === 0 ? 0 : bucket.count / tallest,
      count: bucket.count,
    })),
    marker: audited.measured.transferredBytes / max,
    median: median / max,
    markerLabel: `${audited.domain} · ${weightText(audited)}`,
    medianLabel: fill(catalog.fleet.medianLabel, { value: formatMeasured(median, 'bytes') }),
    axis: [formatMeasured(0, 'bytes'), formatMeasured(max / 2, 'bytes'), formatMeasured(max, 'bytes')],
    caption: fill(catalog.fleet.benchmarkCaption, {
      n: corpusCanon.size,
      domain: audited.domain,
      rank: audited.rank,
    }),
  };
}
