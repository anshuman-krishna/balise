import { z } from 'zod';

export const MetricId = z.enum([
  'transferred_bytes',
  'request_count',
  'dom_node_count',
  'js_execution_ms',
  'third_party_bytes',
  'third_party_share_pct',
]);
export type MetricId = z.infer<typeof MetricId>;

export const Unit = z.enum(['bytes', 'count', 'ms', 'pct', 'gCO2e', 'score', 'grade']);
export type Unit = z.infer<typeof Unit>;

export const Confidence = z.enum(['high', 'medium', 'low']);
export type Confidence = z.infer<typeof Confidence>;

// Canonical unit for each metric. Units live in names and in data, never implied.
export const METRIC_UNIT: Record<MetricId, Unit> = {
  transferred_bytes: 'bytes',
  request_count: 'count',
  dom_node_count: 'count',
  js_execution_ms: 'ms',
  third_party_bytes: 'bytes',
  third_party_share_pct: 'pct',
};

// Direction of harm. Every V0 metric regresses when it grows.
export const MetricDirection = z.enum(['lower-is-better', 'higher-is-better']);
export type MetricDirection = z.infer<typeof MetricDirection>;

export const METRIC_DIRECTION: Record<MetricId, MetricDirection> = {
  transferred_bytes: 'lower-is-better',
  request_count: 'lower-is-better',
  dom_node_count: 'lower-is-better',
  js_execution_ms: 'lower-is-better',
  third_party_bytes: 'lower-is-better',
  third_party_share_pct: 'lower-is-better',
};

export const MetricValue = z.object({
  metricId: MetricId,
  value: z.number().finite(),
  unit: Unit,
});
export type MetricValue = z.infer<typeof MetricValue>;

export const CachePass = z.enum(['cold', 'warm']);
export type CachePass = z.infer<typeof CachePass>;

// The output of one measurement run after extraction. Raw, unrounded.
export const MetricSet = z.object({
  pass: CachePass,
  values: z.array(MetricValue),
});
export type MetricSet = z.infer<typeof MetricSet>;

// Median and MAD across n runs of one scenario. Never mean, never a single run.
export const AggregatedMetric = z.object({
  metricId: MetricId,
  unit: Unit,
  median: z.number().finite(),
  mad: z.number().finite().nonnegative(),
  min: z.number().finite(),
  max: z.number().finite(),
  sampleCount: z.number().int().positive(),
});
export type AggregatedMetric = z.infer<typeof AggregatedMetric>;

export const AggregatedMetrics = z.object({
  pass: CachePass,
  sampleCount: z.number().int().positive(),
  metrics: z.array(AggregatedMetric),
});
export type AggregatedMetrics = z.infer<typeof AggregatedMetrics>;
