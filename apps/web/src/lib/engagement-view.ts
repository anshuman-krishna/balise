import type { DeltaClassification } from '@balise/schemas';
import { formatMeasured } from '@balise/schemas';
import { formatNumber } from '@balise/ui';
import type { Catalog } from '@balise/i18n';
import { fill } from '../i18n';
import { engagementCanon } from '../fixtures/engagement-canon';
import type { Engagement } from '../../scripts/engagement-canon-source';

/**
 * the contractual engagements, read for a screen. this selects and formats; it
 * computes no margin, no status and no gauge.
 *
 * three surfaces read it: the tender workspace proposes, the contract tracker
 * carries, the execution report reports. each of them used to author its own
 * copy of the same four rows.
 */

export type { Engagement };

/** everything proposed, including what the bid director did not take. */
export function proposedEngagements(): readonly Engagement[] {
  return engagementCanon.engagements;
}

/** only what was signed. a contract surface never shows anything else. */
export function signedEngagements(): readonly Engagement[] {
  return engagementCanon.offered;
}

export function engagement(id: string): Engagement {
  const found = engagementCanon.engagements.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`the engagement canon holds no ${id}`);
  return found;
}

/**
 * a measured value in its own unit, through the one formatter every measured
 * value in the product goes through.
 */
export function valueText(engagement: Engagement, value: number): string {
  switch (engagement.unit) {
    case 'bytes':
      return formatMeasured(value, 'bytes');
    case 'gCO2e':
      return formatNumber(value, 3);
    case 'pct':
      return `${formatNumber(value, 0)}%`;
    default:
      return formatNumber(value, 0);
  }
}

export function measuredText(engagement: Engagement): string {
  if (engagement.basis.kind === 'process') return '–';
  return valueText(engagement, engagement.measured.value);
}

export function thresholdText(engagement: Engagement, catalog: Catalog): string {
  if (engagement.basis.kind === 'process') {
    return fill(catalog.engagements.perYear, { count: engagement.threshold });
  }
  const operator = engagement.direction === 'lte' ? '≤' : '≥';
  return `${operator} ${valueText(engagement, engagement.threshold)}`;
}

export function marginText(engagement: Engagement, catalog: Catalog): string {
  switch (engagement.margin.kind) {
    case 'headroom':
      return fill(catalog.engagements.margins.headroom, {
        pct: formatNumber(engagement.margin.pct, 0),
      });
    case 'stretch':
      return fill(catalog.engagements.margins.stretch, {
        points: formatNumber(engagement.margin.points, 0),
      });
    case 'notMet':
      return fill(catalog.engagements.margins.notMet, {
        points: formatNumber(engagement.margin.points, 0),
      });
    default:
      return catalog.engagements.margins.process;
  }
}

export function marginColor(engagement: Engagement): string {
  switch (engagement.margin.kind) {
    case 'headroom':
      return 'var(--conforme)';
    case 'stretch':
      return 'var(--caution)';
    case 'notMet':
      return 'var(--breach)';
    default:
      return 'var(--text-secondary)';
  }
}

export function statusText(engagement: Engagement, catalog: Catalog): string {
  // an engagement nobody signed has no contractual state, so it is named as
  // what it is rather than given one of the contract's words.
  if (engagement.status === null) return catalog.engagements.notSigned;
  return catalog.engagements.status[engagement.status];
}

export function statusColor(engagement: Engagement): string {
  switch (engagement.status) {
    case 'tenu':
      return 'var(--conforme)';
    case 'enCours':
      return 'var(--caution)';
    case 'nonTenu':
      return 'var(--breach)';
    default:
      return 'var(--text-tertiary)';
  }
}

export function gaugeTone(engagement: Engagement): 'held' | 'caution' | 'breach' {
  switch (engagement.status) {
    case 'nonTenu':
      return 'breach';
    case 'enCours':
      return 'caution';
    default:
      return 'held';
  }
}

/** the delivery squares for a process engagement, filled and outstanding. */
export function deliverySquares(engagement: Engagement): { delivered: number; total: number } | null {
  if (engagement.basis.kind !== 'process') return null;
  return { delivered: engagement.basis.delivered, total: engagement.threshold };
}

export interface TrendLine {
  /** points on a unit box, oldest first, with y measured downward. */
  points: string;
  classification: DeltaClassification;
  periods: number;
}

/**
 * the engagement's own history as a polyline on a unit box, scaled by the
 * caller. null where the scenario kept no history, and then no line is drawn
 * rather than a flat one at zero.
 *
 * the y range is the history's own extremes, not the threshold, because a
 * quarterly tracker is asking whether the figure moved and a line pinned to a
 * ceiling answers a different question at one pixel of amplitude.
 */
export function trendLine(engagement: Engagement, width: number, height: number): TrendLine | null {
  const history = engagement.history;
  if (history === null || history.length < 2 || engagement.trend === null) return null;

  const low = Math.min(...history);
  const high = Math.max(...history);
  const span = high - low;
  const points = history
    .map((value, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = span === 0 ? height / 2 : height - ((value - low) / span) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return { points, classification: engagement.trend.classification, periods: history.length };
}

/**
 * a trend is coloured only where the kernel called it a change. a flat line
 * drawn in breach red is rule 2 lost on a sparkline.
 */
export function trendColor(classification: DeltaClassification): string {
  switch (classification) {
    case 'regression':
      return 'var(--breach)';
    case 'improvement':
      return 'var(--conforme)';
    default:
      return 'var(--text-secondary)';
  }
}

export function headroomDefinition(): string {
  return engagementCanon.headroomDefinitionFr;
}
