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

/** the shaped link a profile emulates. null means the link is not throttled. */
export interface NetworkConditions {
  downloadBytesPerSecond: number;
  uploadBytesPerSecond: number;
  latencyMs: number;
}

/**
 * everything a named profile fixes about the machine a run was made on.
 * viewport, device scale factor, locale and timezone are part of it for the
 * same reason the network is: a run is comparable to another run only under an
 * identical description of the machine.
 */
export interface ThrottleProfileDefinition {
  id: ThrottleProfile;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  locale: string;
  timezone: string;
  /** cdp multiplier. 1 is no throttling. */
  cpuThrottlingRate: number;
  network: NetworkConditions | null;
}

const KBPS = 1024 / 8;
const MBPS = (1024 * 1024) / 8;

/**
 * provisional. the exact parameters of a named profile are a methodology
 * decision (METHODOLOGY.md section 4, open decision 3) and are frozen only when
 * v1 is signed off. changing one after that is a breaking change to every
 * historical comparison, because it changes what a stored measurement meant.
 *
 * the table lives in the shared contract rather than in the runner because two
 * things read it: the runner, which applies it, and every surface that states
 * which environment a figure came from. a screen that typed "1.6 Mbps" beside a
 * profile the runner had since changed would be stating an environment that
 * never existed.
 */
export const THROTTLE_PROFILES: Record<ThrottleProfile, ThrottleProfileDefinition> = {
  'desktop-fibre': {
    id: 'desktop-fibre',
    viewportWidth: 1440,
    viewportHeight: 900,
    deviceScaleFactor: 1,
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    cpuThrottlingRate: 1,
    network: null,
  },
  'mobile-4g': {
    id: 'mobile-4g',
    viewportWidth: 390,
    viewportHeight: 844,
    deviceScaleFactor: 3,
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    cpuThrottlingRate: 4,
    network: {
      downloadBytesPerSecond: 1.6 * MBPS,
      uploadBytesPerSecond: 750 * KBPS,
      latencyMs: 150,
    },
  },
  'mobile-3g': {
    id: 'mobile-3g',
    viewportWidth: 390,
    viewportHeight: 844,
    deviceScaleFactor: 3,
    locale: 'fr-FR',
    timezone: 'Europe/Paris',
    cpuThrottlingRate: 4,
    network: {
      downloadBytesPerSecond: 400 * KBPS,
      uploadBytesPerSecond: 400 * KBPS,
      latencyMs: 400,
    },
  },
};

export function throttleProfileFor(id: ThrottleProfile): ThrottleProfileDefinition {
  return THROTTLE_PROFILES[id];
}

/**
 * a profile's link speed in megabits, for a surface that states it, or null
 * where the profile does not throttle the link. the number is returned rather
 * than a sentence: the sentence is a translatable string and lives in i18n.
 */
export function downloadMbps(id: ThrottleProfile): number | null {
  const network = THROTTLE_PROFILES[id].network;
  return network === null ? null : (network.downloadBytesPerSecond * 8) / (1024 * 1024);
}

/**
 * every field of a fingerprint, as a list, so that a comparison over them
 * cannot silently omit one added later.
 */
export const FINGERPRINT_FIELDS = [
  'browserBuild',
  'imageDigest',
  'throttleProfile',
  'viewportWidth',
  'viewportHeight',
  'deviceScaleFactor',
  'locale',
  'timezone',
  'region',
  'coverageEnabled',
] as const satisfies readonly (keyof EnvironmentFingerprint)[];

export type FingerprintField = (typeof FINGERPRINT_FIELDS)[number];

type AssertNever<T extends never> = T;
/**
 * compile-time exhaustiveness. adding a field to `EnvironmentFingerprint`
 * without adding it to `FINGERPRINT_FIELDS` fails here, which is the point: a
 * field left off the list would be a field invariant 3 stopped checking.
 */
export type _EveryFingerprintFieldIsListed = AssertNever<
  Exclude<keyof EnvironmentFingerprint, FingerprintField>
>;
