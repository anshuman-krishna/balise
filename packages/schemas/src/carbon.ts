import { z } from 'zod';

// grid intensity is never silently assumed (the operating manual section 10). the source
// and zone travel with the value and are stated on every surface.
export const GridIntensity = z.object({
  gCO2ePerKwh: z.number().finite().positive(),
  source: z.enum(['declared-default', 'rum-derived']),
  zone: z.string().min(1),
});
export type GridIntensity = z.infer<typeof GridIntensity>;

export const ModelInput = z.object({
  transferredBytes: z.number().finite().nonnegative(),
  requestCount: z.number().int().nonnegative().optional(),
  domNodeCount: z.number().int().nonnegative().optional(),
  gridIntensity: GridIntensity,
  // 0 = grey or unverified hosting, 1 = verified green hosting.
  greenHostingFactor: z.number().min(0).max(1),
});
export type ModelInput = z.infer<typeof ModelInput>;

// assumptions are data, not documentation. they render on every surface where
// the model's output appears. if an assumption is not in this array, we are
// hiding it.
export const Assumption = z.object({
  id: z.string().min(1),
  textFr: z.string().min(1),
  textEn: z.string().min(1),
});
export type Assumption = z.infer<typeof Assumption>;

export const ModelOutput = z.object({
  value: z.number().finite(),
  unit: z.enum(['gCO2e', 'score', 'grade']),
  // the model's own stated uncertainty, if it publishes one.
  low: z.number().finite().optional(),
  high: z.number().finite().optional(),
  // ecoindex-style extras. present only when the model defines them.
  score: z.number().finite().optional(),
  grade: z.string().optional(),
  notes: z.array(z.string()),
});
export type ModelOutput = z.infer<typeof ModelOutput>;
