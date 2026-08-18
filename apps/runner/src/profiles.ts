import type { ThrottleProfile } from '@balise/schemas';

export interface NetworkConditions {
  downloadBytesPerSecond: number;
  uploadBytesPerSecond: number;
  latencyMs: number;
}

export interface ProfileDefinition {
  id: ThrottleProfile;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  locale: string;
  timezone: string;
  /** cdp multiplier. 1 is no throttling. */
  cpuThrottlingRate: number;
  /** null means the link is not throttled at all. */
  network: NetworkConditions | null;
}

const KBPS = 1024 / 8;
const MBPS = (1024 * 1024) / 8;

/**
 * provisional. the exact parameters of a named profile are a methodology
 * decision and are frozen only when METHODOLOGY.md v1 is signed off; changing
 * one after that is a breaking change to every historical comparison. the
 * values here are the ones the scenario canon already quotes.
 *
 * viewport, device scale factor, locale and timezone are part of the profile
 * for the same reason: a run is only comparable to another run made under an
 * identical description of a machine.
 */
export const PROFILES: Record<ThrottleProfile, ProfileDefinition> = {
  'desktop-fibre': {
    id: 'desktop-fibre',
    viewportWidth: 1440,
    viewportHeight: 900,
    deviceScaleFactor: 1,
    isMobile: false,
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
    isMobile: true,
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
    isMobile: true,
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
