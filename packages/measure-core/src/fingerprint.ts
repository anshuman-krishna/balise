import {
  FINGERPRINT_FIELDS,
  THROTTLE_PROFILES,
  type EnvironmentFingerprint,
  type FingerprintField,
  type ThrottleProfile,
} from '@balise/schemas';

/**
 * stamped when a run was not made inside the pinned container. deliberately
 * not digest-shaped: a local run is reproducible enough to develop against and
 * is not audit evidence, and nothing downstream should be able to mistake one
 * for the other.
 */
export const UNPINNED = 'unpinned-local';

export interface FingerprintInput {
  browserBuild: string;
  throttleProfile: ThrottleProfile;
  /** the container image digest, from the environment. */
  imageDigest?: string;
  region?: string;
  /** coverage instrumentation, which is part of the environment, not of the run. */
  coverageEnabled?: boolean;
}

/**
 * expands the three things a caller knows into the full description of the
 * machine. everything else comes from the named profile, so two runs that name
 * the same profile cannot differ in viewport or locale without the profile
 * table itself having changed.
 */
export function buildFingerprint(input: FingerprintInput): EnvironmentFingerprint {
  const profile = THROTTLE_PROFILES[input.throttleProfile];
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
    coverageEnabled: input.coverageEnabled ?? false,
  };
}

/** true only for a run made inside the pinned container in a known region. */
export function isAuditable(fingerprint: EnvironmentFingerprint): boolean {
  return fingerprint.imageDigest !== UNPINNED && fingerprint.region !== UNPINNED;
}

/**
 * invariant 3, mechanically: which fields of two fingerprints differ.
 *
 * driven from `FINGERPRINT_FIELDS` rather than written out field by field, so
 * a field added to the shape is compared from the day it exists. the list is
 * held exhaustive by the compiler in `@balise/schemas`.
 */
export function fingerprintDifferences(
  a: EnvironmentFingerprint,
  b: EnvironmentFingerprint,
): FingerprintField[] {
  return FINGERPRINT_FIELDS.filter((field) => a[field] !== b[field]);
}

/**
 * invariant 3: two runs are comparable only when every field matches.
 * comparing them without a match requires an explicit, user-acknowledged,
 * ledger-recorded flag, and this function is what that flag overrides.
 */
export function fingerprintsMatch(
  a: EnvironmentFingerprint,
  b: EnvironmentFingerprint,
): boolean {
  return fingerprintDifferences(a, b).length === 0;
}

/** one field across a set of runs: either they agree, or they do not. */
export type FieldAgreement =
  | { field: FingerprintField; status: 'shared'; value: string | number | boolean }
  | { field: FingerprintField; status: 'varies'; values: (string | number | boolean)[] };

export interface FingerprintSummary {
  /** how many fingerprints were summarised. zero is a real answer. */
  count: number;
  /** every field, in schema order, agreeing or not. */
  fields: FieldAgreement[];
  /** true when a single environment describes all of them. */
  uniform: boolean;
}

/**
 * summarises the environments behind a set of runs.
 *
 * a service is measured under more than one environment: continuous monitoring
 * without coverage instrumentation, a pull request scenario with it. a surface
 * that states one fingerprint for such a service is claiming a comparability
 * that does not hold across it, so this returns what is shared and names what
 * is not, rather than concatenating the values into one line.
 */
export function summariseFingerprints(
  fingerprints: readonly EnvironmentFingerprint[],
): FingerprintSummary {
  const fields: FieldAgreement[] = FINGERPRINT_FIELDS.map((field) => {
    const values = [...new Set(fingerprints.map((fingerprint) => fingerprint[field]))];
    return values.length === 1
      ? { field, status: 'shared' as const, value: values[0]! }
      : { field, status: 'varies' as const, values };
  });

  return {
    count: fingerprints.length,
    fields,
    // an empty set has nothing that varies, and it also describes nothing. it
    // is reported as not uniform so that no caller reads "one environment"
    // from having measured none.
    uniform: fingerprints.length > 0 && fields.every((entry) => entry.status === 'shared'),
  };
}

/** the fields that differ across a set, in schema order. empty when uniform. */
export function varyingFields(summary: FingerprintSummary): FingerprintField[] {
  return summary.fields
    .filter((entry) => entry.status === 'varies')
    .map((entry) => entry.field);
}

/** the agreed value of one field, or undefined where the set does not agree. */
export function sharedValue(
  summary: FingerprintSummary,
  field: FingerprintField,
): string | number | boolean | undefined {
  const entry = summary.fields.find((candidate) => candidate.field === field);
  return entry !== undefined && entry.status === 'shared' ? entry.value : undefined;
}
