import type { AggregatedMetrics, MetricId, NoiseFloor } from '@balise/schemas';
import { getAggregatedMetric } from './aggregate.js';
import { median } from './statistics.js';

/**
 * provisional. the scaling factor is a product decision (the operating manual section
 * 29) and must be signed off before v1 ships. see PLAN.md decisions log,
 * 2026-08-17. it is an explicit parameter everywhere so no caller can depend
 * on the default silently.
 */
export const PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR = 1.2;

/** minimum historical aggregations before a floor exists (methodology rule 8). */
export const NOISE_FLOOR_MIN_HISTORY = 20;

export interface NoiseFloorOptions {
  scalingFactor?: number;
  minHistory?: number;
}

/**
 * the noise floor for a metric on a scenario: the median of historical mads,
 * scaled. not a fixed percentage, not guessed. with insufficient history the
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
