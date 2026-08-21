import {
  downloadMbps,
  throttleProfileFor,
  type EnvironmentFingerprint,
  type FingerprintField,
  type ThrottleProfile,
} from '@balise/schemas';
import {
  fingerprintDifferences,
  fingerprintsMatch,
  sharedValue,
  summariseFingerprints,
  varyingFields,
} from '@balise/measure-core';
import { fill, t } from '../i18n';
import { measurementCanon } from '../fixtures/measurement-canon';

/**
 * what the screens say about the environment a figure was measured in.
 *
 * nothing here decides comparability. `fingerprintsMatch` and
 * `summariseFingerprints` are the kernel's, because invariant 3 is a
 * measurement rule and a screen that reimplemented it would be a second
 * implementation of the rule that decides whether a comparison is allowed.
 */

export function scenarioFingerprint(scenarioId: string): EnvironmentFingerprint {
  const scenario = measurementCanon.scenarios.find((entry) => entry.id === scenarioId);
  if (scenario === undefined) {
    throw new Error(`the measurement canon holds no scenario "${scenarioId}"`);
  }
  return scenario.fingerprint;
}

/** cold or warm. it belongs to the scenario, which is where the runner set it. */
export function scenarioPass(scenarioId: string): 'cold' | 'warm' {
  const scenario = measurementCanon.scenarios.find((entry) => entry.id === scenarioId);
  if (scenario === undefined) {
    throw new Error(`the measurement canon holds no scenario "${scenarioId}"`);
  }
  return scenario.pass;
}

export function aggregationFingerprint(aggregationId: string): EnvironmentFingerprint {
  const aggregation = measurementCanon.aggregations.find((entry) => entry.id === aggregationId);
  if (aggregation === undefined) {
    throw new Error(`the measurement canon holds no aggregation "${aggregationId}"`);
  }
  return scenarioFingerprint(aggregation.scenarioId);
}

/**
 * the scenarios that belong to the audited service. the corpus services are
 * other people's, and the app bar describes this tenant's service rather than
 * everything the canon happens to hold.
 */
export const SERVICE_SCENARIOS = ['service', 'route-acte-naissance', 'journey-demande-acte'] as const;

export function serviceFingerprintSummary() {
  return summariseFingerprints(SERVICE_SCENARIOS.map(scenarioFingerprint));
}

/** whether two aggregations may be compared without an acknowledged flag. */
export function comparable(baselineId: string, candidateId: string): boolean {
  return fingerprintsMatch(aggregationFingerprint(baselineId), aggregationFingerprint(candidateId));
}

export function differences(baselineId: string, candidateId: string): FingerprintField[] {
  return fingerprintDifferences(
    aggregationFingerprint(baselineId),
    aggregationFingerprint(candidateId),
  );
}

/**
 * a profile with the two parameters a reader checks it by. the numbers come
 * from the profile table in `@balise/schemas`, the sentence from the catalog:
 * a screen that typed "1.6 Mbps" would keep saying it after the runner stopped
 * applying it.
 */
export function throttleText(profile: ThrottleProfile): string {
  const mbps = downloadMbps(profile);
  const cpu = String(throttleProfileFor(profile).cpuThrottlingRate);
  return mbps === null
    ? fill(t.fingerprint.throttleUnthrottled, { profile, cpu })
    : fill(t.fingerprint.throttle, { profile, mbps: mbps.toFixed(1), cpu });
}

export function coverageText(enabled: boolean): string {
  return enabled ? t.fingerprint.coverageOn : t.fingerprint.coverageOff;
}

export interface FingerprintRow {
  key: string;
  value: string;
}

/** the environment panel on a run: every field, in schema order, as it stands. */
export function fingerprintRows(fingerprint: EnvironmentFingerprint): FingerprintRow[] {
  const keys = t.fingerprint.keys;
  return [
    { key: keys.browser, value: fingerprint.browserBuild },
    { key: keys.image, value: fingerprint.imageDigest },
    { key: keys.throttle, value: throttleText(fingerprint.throttleProfile) },
    {
      key: keys.viewport,
      value: fill(t.fingerprint.viewport, {
        width: fingerprint.viewportWidth,
        height: fingerprint.viewportHeight,
        dpr: fingerprint.deviceScaleFactor,
      }),
    },
    { key: keys.locale, value: `${fingerprint.locale} · ${fingerprint.timezone}` },
    { key: keys.region, value: fingerprint.region },
    { key: keys.coverage, value: coverageText(fingerprint.coverageEnabled) },
  ];
}

/** a varying or differing field, in the interface's own words. */
export function fieldLabel(field: FingerprintField): string {
  return t.fingerprint.fields[field];
}

export function fieldList(fields: readonly FingerprintField[]): string {
  return fields.map(fieldLabel).join(', ');
}

/**
 * what the app bar says about the service. every field the scenarios share is
 * printed as itself; a field they do not share is named as varying, because a
 * bar that concatenated two profiles with a plus would be describing an
 * environment nothing was measured in.
 */
export interface ServiceEnvironment {
  rows: FingerprintRow[];
  uniform: boolean;
  varying: FingerprintField[];
  scenarioCount: number;
}

export function serviceEnvironment(): ServiceEnvironment {
  const summary = serviceFingerprintSummary();
  const varying = varyingFields(summary);
  const first = scenarioFingerprint(SERVICE_SCENARIOS[0]);
  const varies = new Set<FingerprintField>(varying);

  // the bar is one line, so it carries the four fields a reader checks
  // comparability by, not all ten. anything varying among them is named
  // rather than printed as a value one scenario happens to have.
  const shown: FingerprintField[] = ['browserBuild', 'imageDigest', 'throttleProfile', 'region'];
  const keys = t.fingerprint.keys;
  const label: Record<string, string> = {
    browserBuild: keys.browser,
    imageDigest: keys.image,
    throttleProfile: keys.throttle,
    region: keys.region,
  };

  // the bar carries the profile's name, not its parameters. the name is what
  // pins them, through the versioned table, and the parameters themselves are
  // on the run's environment panel where there is room for them.
  const rows = shown.map((field) => ({
    key: label[field]!,
    value: varies.has(field) ? t.fingerprint.variesLabel : String(first[field]),
  }));

  return { rows, uniform: summary.uniform, varying, scenarioCount: summary.count };
}

/**
 * the profile the whole corpus was measured on.
 *
 * throws where the corpus does not agree, rather than picking the first: the
 * public index ranks twelve services against each other, and a rank across two
 * throttle profiles would be ranking the profiles.
 */
export function corpusProfile(): ThrottleProfile {
  const corpus = measurementCanon.scenarios.filter(
    (scenario) => !SERVICE_SCENARIOS.includes(scenario.id as (typeof SERVICE_SCENARIOS)[number]) && scenario.id !== 'scan',
  );
  const summary = summariseFingerprints(corpus.map((scenario) => scenario.fingerprint));
  const profile = sharedValue(summary, 'throttleProfile');
  if (typeof profile !== 'string') {
    throw new Error(
      `the corpus was measured on more than one throttle profile; a rank across ${summary.count} services would rank the profiles`,
    );
  }
  return profile as ThrottleProfile;
}
