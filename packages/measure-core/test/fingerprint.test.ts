import { describe, expect, it } from 'vitest';
import { FINGERPRINT_FIELDS, THROTTLE_PROFILES, type EnvironmentFingerprint } from '@balise/schemas';
import {
  UNPINNED,
  buildFingerprint,
  fingerprintDifferences,
  fingerprintsMatch,
  isAuditable,
  sharedValue,
  summariseFingerprints,
  varyingFields,
} from '../src/fingerprint.js';

const PINNED = {
  browserBuild: '127.0.6533.88',
  imageDigest: 'sha256:4e91c2a7',
  region: 'eu-west-par',
} as const;

function pinned(overrides: Partial<Parameters<typeof buildFingerprint>[0]> = {}) {
  return buildFingerprint({ ...PINNED, throttleProfile: 'mobile-4g', ...overrides });
}

describe('buildFingerprint', () => {
  it('expands the named profile rather than taking a viewport from the caller', () => {
    const fingerprint = pinned();
    const profile = THROTTLE_PROFILES['mobile-4g'];
    expect(fingerprint.viewportWidth).toBe(profile.viewportWidth);
    expect(fingerprint.viewportHeight).toBe(profile.viewportHeight);
    expect(fingerprint.deviceScaleFactor).toBe(profile.deviceScaleFactor);
    expect(fingerprint.locale).toBe(profile.locale);
    expect(fingerprint.timezone).toBe(profile.timezone);
  });

  it('stamps an unpinned run rather than leaving the digest blank', () => {
    const local = buildFingerprint({ browserBuild: '127.0.6533.88', throttleProfile: 'mobile-4g' });
    expect(local.imageDigest).toBe(UNPINNED);
    expect(local.region).toBe(UNPINNED);
    expect(isAuditable(local)).toBe(false);
    expect(isAuditable(pinned())).toBe(true);
  });

  it('defaults coverage off, because instrumenting it changes the environment', () => {
    expect(pinned().coverageEnabled).toBe(false);
    expect(pinned({ coverageEnabled: true }).coverageEnabled).toBe(true);
  });

  it('fills every field the schema declares', () => {
    const fingerprint = pinned();
    for (const field of FINGERPRINT_FIELDS) {
      expect(fingerprint[field]).toBeDefined();
    }
  });
});

describe('fingerprintsMatch', () => {
  it('matches a fingerprint against itself', () => {
    expect(fingerprintsMatch(pinned(), pinned())).toBe(true);
    expect(fingerprintDifferences(pinned(), pinned())).toEqual([]);
  });

  it('refuses two runs that differ in any single field', () => {
    // driven from the field list so a field added later is covered from the
    // day it exists rather than the day someone remembers to add a case.
    const base = pinned();
    for (const field of FINGERPRINT_FIELDS) {
      const altered: EnvironmentFingerprint = {
        ...base,
        ...(typeof base[field] === 'boolean'
          ? { [field]: !base[field] }
          : typeof base[field] === 'number'
            ? { [field]: (base[field] as number) + 1 }
            : { [field]: `${String(base[field])}-other` }),
      };
      expect(fingerprintsMatch(base, altered), `${field} should break the match`).toBe(false);
      expect(fingerprintDifferences(base, altered)).toEqual([field]);
    }
  });

  it('treats coverage instrumentation as an environment difference', () => {
    // v8 precise coverage moves js_execution_ms, so a run measured with it and
    // one measured without it are two environments, not one run measured twice.
    expect(fingerprintsMatch(pinned(), pinned({ coverageEnabled: true }))).toBe(false);
    expect(fingerprintDifferences(pinned(), pinned({ coverageEnabled: true }))).toEqual([
      'coverageEnabled',
    ]);
  });

  it('separates two profiles even where the pages are identical', () => {
    const mobile = pinned();
    const desktop = pinned({ throttleProfile: 'desktop-fibre' });
    const differences = fingerprintDifferences(mobile, desktop);
    expect(differences).toContain('throttleProfile');
    expect(differences).toContain('viewportWidth');
    expect(differences).toContain('deviceScaleFactor');
  });
});

describe('summariseFingerprints', () => {
  it('reports one environment as uniform', () => {
    const summary = summariseFingerprints([pinned(), pinned(), pinned()]);
    expect(summary.count).toBe(3);
    expect(summary.uniform).toBe(true);
    expect(varyingFields(summary)).toEqual([]);
    expect(sharedValue(summary, 'throttleProfile')).toBe('mobile-4g');
  });

  it('names the field that varies and keeps the ones that do not', () => {
    const summary = summariseFingerprints([pinned(), pinned({ coverageEnabled: true })]);
    expect(summary.uniform).toBe(false);
    expect(varyingFields(summary)).toEqual(['coverageEnabled']);
    // the shared parts stay readable, which is the point of summarising rather
    // than refusing to say anything.
    expect(sharedValue(summary, 'browserBuild')).toBe('127.0.6533.88');
    expect(sharedValue(summary, 'region')).toBe('eu-west-par');
    expect(sharedValue(summary, 'coverageEnabled')).toBeUndefined();
  });

  it('does not call an empty set one environment', () => {
    const summary = summariseFingerprints([]);
    expect(summary.count).toBe(0);
    expect(summary.uniform).toBe(false);
  });

  it('lists every varying field, in schema order', () => {
    const summary = summariseFingerprints([pinned(), pinned({ throttleProfile: 'desktop-fibre' })]);
    expect(varyingFields(summary)).toEqual([
      'throttleProfile',
      'viewportWidth',
      'viewportHeight',
      'deviceScaleFactor',
    ]);
  });

  it('separates the two mobile profiles by name alone', () => {
    // mobile-4g and mobile-3g emulate the same handset on different links, so
    // every geometry field agrees and only the name differs. the name is what
    // carries the link speed, via the profile table, and the methodology
    // version recorded beside the run is what pins the table. that chain is
    // why changing a profile's parameters is a breaking change rather than a
    // tweak: it would silently redefine what a stored fingerprint meant.
    const summary = summariseFingerprints([pinned(), pinned({ throttleProfile: 'mobile-3g' })]);
    expect(varyingFields(summary)).toEqual(['throttleProfile']);
    expect(sharedValue(summary, 'viewportWidth')).toBe(390);
  });
});
