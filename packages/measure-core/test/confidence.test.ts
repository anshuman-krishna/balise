import { describe, expect, it } from 'vitest';
import type { AggregatedMetric, NoiseFloor } from '@balise/schemas';
import { gradeConfidence } from '../src/confidence.js';

function established(): NoiseFloor {
  return {
    metricId: 'transferred_bytes',
    unit: 'bytes',
    status: 'established',
    value: 7_200,
    sampleCount: 24,
    scalingFactor: 1.2,
  };
}

function unestablished(sampleCount = 11): NoiseFloor {
  return {
    metricId: 'transferred_bytes',
    status: 'insufficient-history',
    sampleCount,
    requiredCount: 20,
  };
}

function metric(overrides: Partial<AggregatedMetric> = {}): AggregatedMetric {
  return {
    metricId: 'transferred_bytes',
    unit: 'bytes',
    median: 1_258_000,
    mad: 6_000,
    min: 1_250_000,
    max: 1_266_000,
    sampleCount: 5,
    ...overrides,
  };
}

describe('gradeConfidence', () => {
  // METHODOLOGY.md section 7: below the minimum history there is no floor, and
  // everything on that scenario is low confidence. the version of this that
  // graded on dispersion alone called eleven weeks of a hospital's home page
  // high confidence while the same scenario could not say whether anything on
  // it had changed.
  it('is low on a scenario whose floor is not established, however tight the runs', () => {
    expect(gradeConfidence(metric({ mad: 0 }), { fingerprintStable: true, noiseFloor: unestablished() })).toBe(
      'low',
    );
  });

  it('is low with no floor at all, which is a scenario with no history', () => {
    expect(gradeConfidence(metric({ mad: 0 }), { fingerprintStable: true, noiseFloor: null })).toBe('low');
  });

  it('grades a tight five-run aggregate on a stable fingerprint as high', () => {
    expect(gradeConfidence(metric(), { fingerprintStable: true, noiseFloor: established() })).toBe('high');
  });

  it('is never high on an unstable fingerprint, regardless of dispersion', () => {
    expect(gradeConfidence(metric({ mad: 0 }), { fingerprintStable: false, noiseFloor: established() })).toBe('low');
  });

  it('is low below three runs', () => {
    expect(gradeConfidence(metric({ sampleCount: 2, mad: 0 }), { fingerprintStable: true, noiseFloor: established() })).toBe(
      'low',
    );
  });

  it('caps at medium below five runs even when dispersion is tight', () => {
    expect(gradeConfidence(metric({ sampleCount: 4, mad: 0 }), { fingerprintStable: true, noiseFloor: established() })).toBe(
      'medium',
    );
  });

  it('degrades to medium on moderate dispersion', () => {
    // relative mad 0.10: above the high bar, inside the medium bar
    expect(
      gradeConfidence(metric({ median: 100, mad: 10 }), { fingerprintStable: true, noiseFloor: established() }),
    ).toBe('medium');
  });

  it('degrades to low on wide dispersion', () => {
    expect(
      gradeConfidence(metric({ median: 100, mad: 20 }), { fingerprintStable: true, noiseFloor: established() }),
    ).toBe('low');
  });

  it('treats a zero median with zero dispersion as perfectly stable', () => {
    expect(
      gradeConfidence(metric({ median: 0, mad: 0 }), { fingerprintStable: true, noiseFloor: established() }),
    ).toBe('high');
  });

  it('treats a zero median with any dispersion as low', () => {
    expect(
      gradeConfidence(metric({ median: 0, mad: 1 }), { fingerprintStable: true, noiseFloor: established() }),
    ).toBe('low');
  });
});
