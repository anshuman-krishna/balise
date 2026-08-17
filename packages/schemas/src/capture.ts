import { z } from 'zod';
import { CachePass } from './metrics.js';

export const CapturedResource = z.object({
  url: z.string().min(1),
  transferredBytes: z.number().finite().nonnegative(),
});
export type CapturedResource = z.infer<typeof CapturedResource>;

// What the runner hands to extraction. The raw capture in object storage holds
// far more (full HAR, CDP trace); this is the slice extraction needs.
export const RawCapture = z.object({
  // Origin of the audited service, e.g. "https://sevre-et-loire.fr".
  // Resources on any other origin are third party.
  serviceOrigin: z.string().min(1),
  pass: CachePass,
  resources: z.array(CapturedResource),
  // Requests can exceed resource entries (redirects, aborted requests).
  requestCount: z.number().int().nonnegative(),
  domNodeCountAtLoad: z.number().int().nonnegative(),
  domNodeCountAtNetworkIdle: z.number().int().nonnegative(),
  jsExecutionMs: z.number().finite().nonnegative(),
});
export type RawCapture = z.infer<typeof RawCapture>;
