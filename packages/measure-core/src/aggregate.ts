import type { AggregatedMetric, AggregatedMetrics, MetricId, MetricSet } from '@balise/schemas';
import { median, medianAbsoluteDeviation } from './statistics.js';

/**
 * median + mad across runs of one scenario, one pass.
 *
 * cold and warm passes are different questions and are never averaged
 * together; mixing them here is a caller bug and throws. a metric missing
 * from any run also throws: extraction always emits the full set, so a gap
 * signals a corrupt input, and missing data is never imputed.
 */
export function aggregateRuns(runs: readonly MetricSet[]): AggregatedMetrics {
  if (runs.length === 0) {
    throw new Error('aggregateRuns requires at least one run');
  }
  const pass = runs[0]!.pass;
  if (runs.some((run) => run.pass !== pass)) {
    throw new Error('aggregateRuns received mixed cold and warm passes; they are never averaged together');
  }

  const byMetric = new Map<MetricId, { unit: AggregatedMetric['unit']; values: number[] }>();
  for (const value of runs[0]!.values) {
    byMetric.set(value.metricId, { unit: value.unit, values: [] });
  }

  for (const run of runs) {
    for (const [metricId, bucket] of byMetric) {
      const found = run.values.find((v) => v.metricId === metricId);
      if (found === undefined) {
        throw new Error(`metric ${metricId} missing from a run; missing data is never imputed`);
      }
      if (found.unit !== bucket.unit) {
        throw new Error(`metric ${metricId} has inconsistent units across runs`);
      }
      bucket.values.push(found.value);
    }
  }

  const metrics: AggregatedMetric[] = [];
  for (const [metricId, bucket] of byMetric) {
    metrics.push({
      metricId,
      unit: bucket.unit,
      median: median(bucket.values),
      mad: medianAbsoluteDeviation(bucket.values),
      min: Math.min(...bucket.values),
      max: Math.max(...bucket.values),
      sampleCount: bucket.values.length,
    });
  }

  return { pass, sampleCount: runs.length, metrics };
}

export function getAggregatedMetric(
  aggregate: AggregatedMetrics,
  metricId: MetricId,
): AggregatedMetric | undefined {
  return aggregate.metrics.find((m) => m.metricId === metricId);
}

/**
 * the run whose value for `metricId` is the median.
 *
 * an aggregate describes n runs and holds no capture of its own, so anything
 * that has to show one page (a resource inventory, a waterfall, a screenshot)
 * has to name a run. this is the one that sits on the reported median.
 *
 * null when the median falls between two runs, which is every even run count:
 * no capture recorded that page, and picking the nearer of the two would put
 * an inventory under a figure it does not add up to.
 */
export function medianRunIndex(
  runs: readonly MetricSet[],
  metricId: MetricId,
): number | null {
  const found = runs.map((run, index) => ({
    index,
    value: run.values.find((value) => value.metricId === metricId)?.value,
  }));
  if (found.some((entry) => entry.value === undefined)) {
    throw new Error(`metric ${metricId} missing from a run; missing data is never imputed`);
  }
  if (found.length === 0 || found.length % 2 === 0) {
    return null;
  }
  const sorted = [...found].sort((a, b) => a.value! - b.value!);
  return sorted[(sorted.length - 1) / 2]!.index;
}
