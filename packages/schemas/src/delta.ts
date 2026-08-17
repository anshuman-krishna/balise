import { z } from 'zod';
import { MetricId, Unit } from './metrics.js';
import { NoiseFloor } from './noise.js';

// 'indeterminate' is the honest degradation when no noise floor is established:
// no floor, no verdict. it is never rendered as a change in any direction.
export const DeltaClassification = z.enum([
  'regression',
  'improvement',
  'no-significant-change',
  'indeterminate',
]);
export type DeltaClassification = z.infer<typeof DeltaClassification>;

export const Delta = z.object({
  metricId: MetricId,
  unit: Unit,
  before: z.number().finite(),
  after: z.number().finite(),
  value: z.number().finite(),
  classification: DeltaClassification,
  // the floor the classification was made against, kept for rendering
  // "vs noise" and for audit.
  floor: NoiseFloor,
});
export type Delta = z.infer<typeof Delta>;
