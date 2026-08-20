import type { AggregatedMetric, Confidence, MetricId, NoiseFloor } from '@balise/schemas';
import { t } from '../i18n';
import { measurementCanon } from '../fixtures/measurement-canon';
import type { CanonHistoryPoint, CanonMetric } from '../fixtures/measurement-types';

/**
 * what the screens read off the measurement canon.
 *
 * nothing here computes a statistic. the medians, dispersions, floors and
 * grades were computed by @balise/measure-core when the canon was generated;
 * this file selects them and converts units for display, which is a formatting
 * concern applied at the edge (invariant 6).
 */

export type Aggregation = (typeof measurementCanon.aggregations)[number];

export function aggregation(id: string): Aggregation {
  const found = measurementCanon.aggregations.find((entry) => entry.id === id);
  if (found === undefined) {
    throw new Error(`the measurement canon holds no aggregation "${id}"`);
  }
  return found;
}

export function metric(aggregationId: string, metricId: MetricId): CanonMetric {
  const found = aggregation(aggregationId).metrics.find((entry) => entry.metricId === metricId);
  if (found === undefined) {
    throw new Error(`aggregation "${aggregationId}" measured no ${metricId}`);
  }
  return found;
}

/** the kernel's own input shape, for the callers that classify a delta. */
export function asAggregate(entry: CanonMetric): AggregatedMetric {
  return {
    metricId: entry.metricId,
    unit: entry.unit,
    median: entry.median,
    mad: entry.mad,
    min: entry.min,
    max: entry.max,
    sampleCount: entry.sampleCount,
  };
}

export function floorOf(aggregationId: string, metricId: MetricId): NoiseFloor {
  return metric(aggregationId, metricId).floor;
}

/**
 * the floor's value, or null where the history has not established one. a
 * caller that wants a number for a chart has to handle the null: a scenario
 * with no floor draws no noise region rather than a region of nothing.
 */
export function floorValue(entry: CanonMetric): number | null {
  return entry.floor.status === 'established' ? entry.floor.value : null;
}

export function confidenceOf(aggregationId: string, metricId: MetricId): Confidence {
  return metric(aggregationId, metricId).confidence;
}

/** bytes to kilobytes, for the surfaces whose axis is drawn in kilobytes. */
export function kb(bytes: number): number {
  return bytes / 1000;
}

export interface TrendPoint {
  median: number;
  low: number;
  high: number;
}

/**
 * the last n aggregations of a scenario, most recent last, with the current one
 * at the end. the envelope is each aggregation's own run spread: the trend
 * never draws a bare line, because a line implies a precision the runs do not
 * have.
 */
export function trendPoints(aggregationId: string, metricId: MetricId, count: number): TrendPoint[] {
  const current = metric(aggregationId, metricId);
  const history = current.history ?? [];
  const past: readonly CanonHistoryPoint[] = history.slice(Math.max(0, history.length - (count - 1)));
  return [
    ...past.map((point) => ({ median: kb(point.median), low: kb(point.low), high: kb(point.high) })),
    { median: kb(current.median), low: kb(current.min), high: kb(current.max) },
  ];
}

/**
 * how many of the runs behind an aggregate differ from its median. the dom
 * tile reports this because a count that varies run to run is the reason its
 * confidence is not high, and saying so is more use than the grade alone.
 */
export function runsVaried(entry: CanonMetric): number {
  return entry.runValues.filter((value) => value !== entry.median).length;
}

/**
 * the grade's own label. a screen that wrote `t.confidence.high` beside a
 * computed grade would print the wrong word the moment the runs changed, which
 * is exactly what the fixtures this canon replaced did.
 */
export function confidenceLabel(grade: Confidence): string {
  return grade === 'high' ? t.confidence.high : grade === 'medium' ? t.confidence.medium : t.confidence.low;
}

/**
 * one edge of the noise region around a median, or undefined where no floor is
 * established. undefined rather than the median itself: a band asked to draw a
 * region of zero width would report a precision nothing measured.
 */
export function noiseEdge(median: number, floor: number | null, direction: 1 | -1): number | undefined {
  return floor === null ? undefined : median + direction * floor;
}
