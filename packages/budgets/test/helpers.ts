import type { AggregatedMetric, AggregatedMetrics, MetricId, NoiseFloor } from '@balise/schemas';
import { METRIC_UNIT } from '@balise/schemas';
import type { ScenarioMeasurement } from '../src/index.js';

export function metric(metricId: MetricId, median: number, mad = 0): AggregatedMetric {
  return {
    metricId,
    unit: METRIC_UNIT[metricId],
    median,
    mad,
    min: median - mad,
    max: median + mad,
    sampleCount: 5,
  };
}

export function aggregate(metrics: AggregatedMetric[]): AggregatedMetrics {
  return { pass: 'cold', sampleCount: 5, metrics };
}

export function floor(metricId: MetricId, value: number): NoiseFloor {
  return {
    status: 'established',
    metricId,
    unit: METRIC_UNIT[metricId],
    value,
    sampleCount: 24,
    scalingFactor: 1.2,
  };
}

export function noFloor(metricId: MetricId): NoiseFloor {
  return { status: 'insufficient-history', metricId, sampleCount: 4, requiredCount: 20 };
}

export function route(
  id: string,
  candidate: AggregatedMetrics,
  options: Partial<ScenarioMeasurement> = {},
): ScenarioMeasurement {
  return { id, kind: 'route', label: id, candidate, floors: [], ...options };
}
