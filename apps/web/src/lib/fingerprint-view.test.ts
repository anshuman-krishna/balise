import { describe, expect, it } from 'vitest';
import { EnvironmentFingerprint, THROTTLE_PROFILES } from '@balise/schemas';
import { measurementCanon } from '../fixtures/measurement-canon';
import {
  SERVICE_SCENARIOS,
  corpusProfile,
  scenarioPass,
  aggregationFingerprint,
  comparable,
  differences,
  fieldList,
  fingerprintRows,
  scenarioFingerprint,
  serviceEnvironment,
  serviceFingerprintSummary,
  throttleText,
} from './fingerprint-view';

describe('the canon carries a real environment per scenario', () => {
  it('parses every scenario fingerprint through the schema', () => {
    for (const scenario of measurementCanon.scenarios) {
      expect(() => EnvironmentFingerprint.parse(scenario.fingerprint)).not.toThrow();
    }
  });

  it('never states a viewport the named profile does not have', () => {
    // the whole point of expanding a profile through the kernel: a fixture
    // cannot describe a machine the runner would not produce.
    for (const scenario of measurementCanon.scenarios) {
      const profile = THROTTLE_PROFILES[scenario.fingerprint.throttleProfile];
      expect(scenario.fingerprint.viewportWidth).toBe(profile.viewportWidth);
      expect(scenario.fingerprint.viewportHeight).toBe(profile.viewportHeight);
      expect(scenario.fingerprint.deviceScaleFactor).toBe(profile.deviceScaleFactor);
      expect(scenario.fingerprint.locale).toBe(profile.locale);
      expect(scenario.fingerprint.timezone).toBe(profile.timezone);
    }
  });

  it('resolves an aggregation to the environment of the scenario it belongs to', () => {
    expect(aggregationFingerprint('candidate')).toEqual(
      scenarioFingerprint('route-acte-naissance'),
    );
    expect(aggregationFingerprint('baseline')).toEqual(aggregationFingerprint('candidate'));
  });

  it('refuses an aggregation the canon does not hold', () => {
    expect(() => aggregationFingerprint('no-such-run')).toThrow(/no aggregation/);
  });
});

describe('comparability', () => {
  it('permits the comparison the screen actually draws', () => {
    // baseline and candidate are two aggregations of one scenario, so they are
    // one environment by construction. the chip that says so is computed.
    expect(comparable('baseline', 'candidate')).toBe(true);
    expect(differences('baseline', 'candidate')).toEqual([]);
  });

  it('separates the pull request scenario from the continuously measured one', () => {
    // the route runs with coverage instrumentation and the service median does
    // not. v8 precise coverage moves js_execution_ms, so these are two
    // environments and a figure from one is not compared to the other.
    expect(comparable('candidate', 'service')).toBe(false);
    expect(differences('candidate', 'service')).toEqual(['coverageEnabled']);
  });
});

describe('the service environment', () => {
  const summary = serviceFingerprintSummary();

  it('summarises exactly the audited service scenarios', () => {
    expect(summary.count).toBe(SERVICE_SCENARIOS.length);
  });

  it('is not uniform, and names coverage as what varies', () => {
    expect(summary.uniform).toBe(false);
    expect(serviceEnvironment().varying).toEqual(['coverageEnabled']);
  });

  it('prints a shared field as itself and never invents a combined value', () => {
    const rows = serviceEnvironment().rows;
    const values = rows.map((row) => row.value);
    expect(values).toContain('127.0.6533.88');
    expect(values).toContain('eu-west-par');
    // the string this replaced read "desktop-fibre + mobile-4g", which is two
    // profiles at once and no fingerprint at all.
    expect(values.some((value) => value.includes('+'))).toBe(false);
  });

  it('names a varying field rather than printing one scenario value for all', () => {
    expect(fieldList(serviceEnvironment().varying)).toBe('coverage');
  });
});

describe('throttleText', () => {
  it('states the link speed and cpu multiplier from the profile table', () => {
    const text = throttleText('mobile-4g');
    expect(text).toContain('mobile-4g');
    expect(text).toContain('1.6 Mbps');
    expect(text).toContain('4');
  });

  it('says a profile does not throttle rather than printing a speed it has not got', () => {
    expect(THROTTLE_PROFILES['desktop-fibre'].network).toBeNull();
    expect(throttleText('desktop-fibre')).not.toMatch(/Mbps/);
  });
});

describe('fingerprintRows', () => {
  const rows = fingerprintRows(scenarioFingerprint('route-acte-naissance'));

  it('shows the coverage state, because it is part of the environment', () => {
    const coverage = rows.find((row) => row.key === 'coverage');
    expect(coverage?.value).toMatch(/js/);
  });

  it('carries every value as a non-empty string', () => {
    for (const row of rows) {
      expect(row.value.length).toBeGreaterThan(0);
    }
  });
});

describe('the corpus', () => {
  it('was measured on one profile, so a rank ranks the services', () => {
    expect(corpusProfile()).toBe('mobile-4g');
  });
});

describe('scenarioPass', () => {
  it('reads the cache pass off the scenario rather than off a screen', () => {
    expect(scenarioPass('route-acte-naissance')).toBe('cold');
    expect(scenarioPass('scan')).toBe('cold');
  });

  it('refuses a scenario the canon does not hold', () => {
    expect(() => scenarioPass('no-such-scenario')).toThrow(/no scenario/);
  });
});
