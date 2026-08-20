import { z } from 'zod';

export const ThrottleProfile = z.enum(['desktop-fibre', 'mobile-4g', 'mobile-3g']);
export type ThrottleProfile = z.infer<typeof ThrottleProfile>;

// recorded on every run. two runs are only comparable when fingerprints match
// (invariant 3). comparing across fingerprints requires an explicit,
// user-acknowledged, ledger-recorded flag.
export const EnvironmentFingerprint = z.object({
  browserBuild: z.string().min(1),
  imageDigest: z.string().min(1),
  throttleProfile: ThrottleProfile,
  viewportWidth: z.number().int().positive(),
  viewportHeight: z.number().int().positive(),
  deviceScaleFactor: z.number().positive(),
  locale: z.string().min(1),
  timezone: z.string().min(1),
  region: z.string().min(1),
  /**
   * whether js and css coverage was instrumented on this run. v8's precise
   * coverage moves script execution time, so a run measured with it and a run
   * measured without it are two different environments and invariant 3 keeps
   * them apart.
   */
  coverageEnabled: z.boolean(),
});
export type EnvironmentFingerprint = z.infer<typeof EnvironmentFingerprint>;
