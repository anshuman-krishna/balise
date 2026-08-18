import type { EnvironmentFingerprint, ThrottleProfile } from '@balise/schemas';
import { profileFor } from './profiles.js';

/**
 * stamped when the runner is not executing inside the pinned container. it is
 * deliberately not digest-shaped: a local run is reproducible enough to
 * develop against and is not audit evidence, and nothing downstream should be
 * able to mistake one for the other.
 */
export const UNPINNED = 'unpinned-local';

export interface FingerprintInput {
  browserBuild: string;
  throttleProfile: ThrottleProfile;
  /** the container image digest, from the environment. */
  imageDigest?: string;
  region?: string;
}

export function buildFingerprint(input: FingerprintInput): EnvironmentFingerprint {
  const profile = profileFor(input.throttleProfile);
  return {
    browserBuild: input.browserBuild,
    imageDigest: input.imageDigest ?? UNPINNED,
    throttleProfile: profile.id,
    viewportWidth: profile.viewportWidth,
    viewportHeight: profile.viewportHeight,
    deviceScaleFactor: profile.deviceScaleFactor,
    locale: profile.locale,
    timezone: profile.timezone,
    region: input.region ?? UNPINNED,
  };
}

/** true only for a run made inside the pinned container in a known region. */
export function isAuditable(fingerprint: EnvironmentFingerprint): boolean {
  return fingerprint.imageDigest !== UNPINNED && fingerprint.region !== UNPINNED;
}

/**
 * invariant 3: two runs are comparable only when every field matches.
 * compared field by field rather than by serialisation, so a field added
 * later cannot be silently excluded from the check.
 */
export function fingerprintsMatch(a: EnvironmentFingerprint, b: EnvironmentFingerprint): boolean {
  return (
    a.browserBuild === b.browserBuild &&
    a.imageDigest === b.imageDigest &&
    a.throttleProfile === b.throttleProfile &&
    a.viewportWidth === b.viewportWidth &&
    a.viewportHeight === b.viewportHeight &&
    a.deviceScaleFactor === b.deviceScaleFactor &&
    a.locale === b.locale &&
    a.timezone === b.timezone &&
    a.region === b.region
  );
}
