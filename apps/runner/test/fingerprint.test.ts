import { describe, expect, it } from 'vitest';
import { EnvironmentFingerprint } from '@balise/schemas';
import { buildFingerprint, fingerprintsMatch, isAuditable, UNPINNED } from '../src/fingerprint.js';
import { PROFILES } from '../src/profiles.js';

const base = { browserBuild: '127.0.6533.88', throttleProfile: 'mobile-4g' } as const;

describe('buildFingerprint', () => {
  it('produces a fingerprint that satisfies the schema', () => {
    expect(() => EnvironmentFingerprint.parse(buildFingerprint(base))).not.toThrow();
  });

  it('takes viewport, scale, locale and timezone from the profile', () => {
    const fingerprint = buildFingerprint(base);
    const profile = PROFILES['mobile-4g'];
    expect(fingerprint.viewportWidth).toBe(profile.viewportWidth);
    expect(fingerprint.viewportHeight).toBe(profile.viewportHeight);
    expect(fingerprint.deviceScaleFactor).toBe(profile.deviceScaleFactor);
    expect(fingerprint.locale).toBe(profile.locale);
    expect(fingerprint.timezone).toBe(profile.timezone);
  });

  it('marks a run made outside the pinned container', () => {
    const local = buildFingerprint(base);
    expect(local.imageDigest).toBe(UNPINNED);
    expect(local.region).toBe(UNPINNED);
    expect(isAuditable(local)).toBe(false);
  });

  it('is auditable only when both the image and the region are known', () => {
    expect(isAuditable(buildFingerprint({ ...base, imageDigest: 'sha256:4e91c2a7' }))).toBe(false);
    expect(isAuditable(buildFingerprint({ ...base, region: 'eu-west-par' }))).toBe(false);
    expect(
      isAuditable(buildFingerprint({ ...base, imageDigest: 'sha256:4e91c2a7', region: 'eu-west-par' })),
    ).toBe(true);
  });
});

describe('fingerprintsMatch', () => {
  it('matches a fingerprint against itself', () => {
    const fingerprint = buildFingerprint(base);
    expect(fingerprintsMatch(fingerprint, fingerprint)).toBe(true);
  });

  it('refuses a different browser build', () => {
    expect(
      fingerprintsMatch(buildFingerprint(base), buildFingerprint({ ...base, browserBuild: '128.0.1.1' })),
    ).toBe(false);
  });

  it('refuses a different profile', () => {
    expect(
      fingerprintsMatch(
        buildFingerprint(base),
        buildFingerprint({ ...base, throttleProfile: 'mobile-3g' }),
      ),
    ).toBe(false);
  });

  it('checks every field the schema declares', () => {
    const fields = Object.keys(EnvironmentFingerprint.shape);
    const fingerprint = buildFingerprint({
      ...base,
      imageDigest: 'sha256:4e91c2a7',
      region: 'eu-west-par',
    });
    for (const field of fields) {
      const mutated = { ...fingerprint, [field]: 'changed' };
      expect(fingerprintsMatch(fingerprint, mutated), `${field} is not compared`).toBe(false);
    }
  });
});
