import type { Confidence, MetricId, NoiseFloor, Unit } from '@balise/schemas';

/**
 * the shapes the generated measurement canon is written in. they live here
 * rather than in the generator so the generated file and the application can
 * both name them without the app reaching into scripts/.
 */

export interface CanonHistoryPoint {
  median: number;
  low: number;
  high: number;
  mad: number;
}

export interface CanonMetric {
  metricId: MetricId;
  unit: Unit;
  median: number;
  mad: number;
  min: number;
  max: number;
  sampleCount: number;
  /** the runs behind the aggregate, in the order they were measured. */
  runValues: readonly number[];
  floor: NoiseFloor;
  confidence: Confidence;
  /** past aggregations, oldest first. kept only where a surface draws them. */
  history?: readonly CanonHistoryPoint[];
}
