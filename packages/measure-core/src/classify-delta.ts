import type { AggregatedMetric, Delta, NoiseFloor } from '@balise/schemas';
import { METRIC_DIRECTION } from '@balise/schemas';

/**
 * the mechanical implementation of invariant 2: a delta below or at the noise
 * floor is not a change. this is the only implementation; the api and the
 * frontend call it, they never reimplement it. any change to this function
 * requires an adr.
 *
 * rules, in order:
 * 1. no established floor: 'indeterminate'. no floor, no verdict.
 * 2. |delta| must strictly exceed the floor to be significant. equality is
 *    not significant.
 * 3. direction of harm comes from metric_direction. every v0 metric
 *    regresses when it grows.
 */
export function classifyDelta(
  before: AggregatedMetric,
  after: AggregatedMetric,
  floor: NoiseFloor,
): Delta {
  if (before.metricId !== after.metricId) {
    throw new Error(
      `classifyDelta received mismatched metrics: ${before.metricId} vs ${after.metricId}`,
    );
  }
  if (before.unit !== after.unit) {
    throw new Error(`classifyDelta received mismatched units for ${before.metricId}`);
  }
  if (floor.metricId !== before.metricId) {
    throw new Error(
      `classifyDelta received a noise floor for ${floor.metricId}, expected ${before.metricId}`,
    );
  }

  const value = after.median - before.median;

  const base = {
    metricId: before.metricId,
    unit: before.unit,
    before: before.median,
    after: after.median,
    value,
    floor,
  };

  if (floor.status !== 'established') {
    return { ...base, classification: 'indeterminate' };
  }

  if (Math.abs(value) <= floor.value) {
    return { ...base, classification: 'no-significant-change' };
  }

  const grew = value > 0;
  const growthIsHarm = METRIC_DIRECTION[before.metricId] === 'lower-is-better';
  return {
    ...base,
    classification: grew === growthIsHarm ? 'regression' : 'improvement',
  };
}
