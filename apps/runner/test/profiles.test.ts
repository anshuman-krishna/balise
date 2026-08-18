import { describe, expect, it } from 'vitest';
import { ThrottleProfile } from '@balise/schemas';
import { PROFILES, USER_AGENT_TAG, userAgentFor } from '../src/profiles.js';

describe('PROFILES', () => {
  it('defines every profile the schema names', () => {
    for (const id of ThrottleProfile.options) {
      expect(PROFILES[id], `${id} has no definition`).toBeDefined();
      expect(PROFILES[id].id).toBe(id);
    }
  });

  it('fixes viewport, scale, locale and timezone on every profile', () => {
    for (const profile of Object.values(PROFILES)) {
      expect(profile.viewportWidth).toBeGreaterThan(0);
      expect(profile.viewportHeight).toBeGreaterThan(0);
      expect(profile.deviceScaleFactor).toBeGreaterThan(0);
      expect(profile.locale).not.toBe('');
      expect(profile.timezone).not.toBe('');
    }
  });

  it('throttles the mobile profiles and leaves fibre alone', () => {
    expect(PROFILES['desktop-fibre'].network).toBeNull();
    expect(PROFILES['desktop-fibre'].cpuThrottlingRate).toBe(1);
    expect(PROFILES['mobile-4g'].network).not.toBeNull();
    expect(PROFILES['mobile-3g'].network!.downloadBytesPerSecond).toBeLessThan(
      PROFILES['mobile-4g'].network!.downloadBytesPerSecond,
    );
  });
});

describe('userAgentFor', () => {
  it('says who we are and where to read about it', () => {
    expect(userAgentFor(PROFILES['mobile-4g'], '127.0.6533.88')).toContain(USER_AGENT_TAG);
    expect(USER_AGENT_TAG).toContain('https://');
  });

  it('does not vary with the host the runner runs on', () => {
    const desktop = userAgentFor(PROFILES['desktop-fibre'], '127.0.6533.88');
    expect(desktop).toContain('X11; Linux x86_64');
    expect(desktop).not.toContain('Macintosh');
  });

  it('carries the chromium major version only, so a patch bump does not change it', () => {
    const a = userAgentFor(PROFILES['mobile-4g'], '127.0.6533.88');
    const b = userAgentFor(PROFILES['mobile-4g'], '127.0.9999.1');
    expect(a).toBe(b);
    expect(a).toContain('Chrome/127.0.0.0');
    expect(userAgentFor(PROFILES['mobile-4g'], '128.0.1.1')).not.toBe(a);
  });

  it('marks the mobile profiles as mobile', () => {
    expect(userAgentFor(PROFILES['mobile-4g'], '127.0.0.0')).toContain('Mobile Safari');
    expect(userAgentFor(PROFILES['desktop-fibre'], '127.0.0.0')).not.toContain('Mobile Safari');
  });
});
