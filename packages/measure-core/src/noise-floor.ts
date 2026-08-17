import type { AggregatedMetrics, MetricId, NoiseFloor } from '@balise/schemas';
import { getAggregatedMetric } from './aggregate.js';
import { median } from './statistics.js';

/**
 * PROVISIONAL. The scaling factor is a product decision (CLAUDE.md section
 * 29) and must be signed off before V1 ships. See PLAN.md decisions log,
 * 2026-08-17. It is an explicit parameter everywhere so no caller can depend
 * on the default silently.
 */
export const PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR = 1.2;

/** Minimum historical aggregations before a floor exists (METHODOLOGY rule 8). */
export const NOISE_FLOOR_MIN_HISTORY = 20;

export interface NoiseFloorOptions {
  scalingFactor?: number;
  minHistory?: number;
}

/**
 * The noise floor for a metric on a scenario: the median of historical MADs,
 * scaled. Not a fixed percentage, not guessed. With insufficient history the
 * floor is not established, everything on the scenario is low confidence, and
 * no verdict or budget failure can rest on it.
 */
export function computeNoiseFloor(
  history: readonly AggregatedMetrics[],
  metricId: MetricId,
  options: NoiseFloorOptions = {},
): NoiseFloor {
  const scalingFactor = options.scalingFactor ?? PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR;
  const minHistory = options.minHistory ?? NOISE_FLOOR_MIN_HISTORY;

  const entries = history
    .map((aggregate) => getAggregatedMetric(aggregate, metricId))
    .filter((metric) => metric !== undefined);

  if (entries.length < minHistory) {
    return {
      status: 'insufficient-history',
      metricId,
      sampleCount: entries.length,
      requiredCount: minHistory,
    };
  }

  const historicalMads = entries.map((metric) => metric.mad);
  return {
    status: 'established',
    metricId,
    unit: entries[0]!.unit,
    value: scalingFactor * median(historicalMads),
    sampleCount: entries.length,
    scalingFactor,
  };
}
