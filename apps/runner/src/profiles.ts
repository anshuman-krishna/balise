import { THROTTLE_PROFILES, type ThrottleProfile, type ThrottleProfileDefinition } from '@balise/schemas';

/**
 * what the runner adds to the shared profile definition: the one field only a
 * browser needs. the parameters themselves (viewport, device scale factor,
 * locale, timezone, cpu rate, network) are in `@balise/schemas`, because the
 * screens that state which environment a figure came from read the same table.
 * a runner-local copy is how a screen ends up quoting a link speed the runner
 * no longer applies.
 */
export interface ProfileDefinition extends ThrottleProfileDefinition {
  isMobile: boolean;
}

export const PROFILES: Record<ThrottleProfile, ProfileDefinition> = {
  'desktop-fibre': { ...THROTTLE_PROFILES['desktop-fibre'], isMobile: false },
  'mobile-4g': { ...THROTTLE_PROFILES['mobile-4g'], isMobile: true },
  'mobile-3g': { ...THROTTLE_PROFILES['mobile-3g'], isMobile: true },
};

export type { NetworkConditions } from '@balise/schemas';

// we say who we are and where to read about it on every request we make
// (the operating manual section 8).
export const USER_AGENT_TAG = 'Balise/0.1 (+https://balise.fr/robot)';

/**
 * the user agent is part of the profile, so it must not vary with the host
 * the runner happens to be on: a run from a laptop and a run from the
 * container have to ask the server the same question. only the chromium
 * major version varies, and a change there already shows up as a different
 * browserBuild on the fingerprint.
 */
export function userAgentFor(profile: ProfileDefinition, browserBuild: string): string {
  const major = browserBuild.split('.')[0] ?? '0';
  const platform = profile.isMobile
    ? 'Linux; Android 13; Pixel 7'
    : 'X11; Linux x86_64';
  const suffix = profile.isMobile ? 'Mobile Safari/537.36' : 'Safari/537.36';
  return (
    `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) ` +
    `Chrome/${major}.0.0.0 ${suffix} ${USER_AGENT_TAG}`
  );
}

export function profileFor(id: ThrottleProfile): ProfileDefinition {
  return PROFILES[id];
}
