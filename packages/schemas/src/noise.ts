import { z } from 'zod';
import { MetricId, Unit } from './metrics.js';

// the dispersion below which a delta is not a change. computed per metric per
// scenario from a rolling window of historical aggregations, never guessed,
// never a fixed percentage. when history is insufficient there is no floor,
// and without a floor there are no verdicts.
export const NoiseFloor = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('established'),
    metricId: MetricId,
    unit: Unit,
    value: z.number().finite().nonnegative(),
    sampleCount: z.number().int().positive(),
    scalingFactor: z.number().positive(),
  }),
  z.object({
    status: z.literal('insufficient-history'),
    metricId: MetricId,
    sampleCount: z.number().int().nonnegative(),
    requiredCount: z.number().int().positive(),
  }),
]);
export type NoiseFloor = z.infer<typeof NoiseFloor>;
