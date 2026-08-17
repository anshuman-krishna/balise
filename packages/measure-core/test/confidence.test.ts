import { describe, expect, it } from 'vitest';
import type { AggregatedMetric } from '@balise/schemas';
import { gradeConfidence } from '../src/confidence.js';

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
  it('grades a tight five-run aggregate on a stable fingerprint as high', () => {
    expect(gradeConfidence(metric(), { fingerprintStable: true })).toBe('high');
  });

  it('is never high on an unstable fingerprint, regardless of dispersion', () => {
    expect(gradeConfidence(metric({ mad: 0 }), { fingerprintStable: false })).toBe('low');
  });

  it('is low below three runs', () => {
    expect(gradeConfidence(metric({ sampleCount: 2, mad: 0 }), { fingerprintStable: true })).toBe(
      'low',
    );
  });

  it('caps at medium below five runs even when dispersion is tight', () => {
    expect(gradeConfidence(metric({ sampleCount: 4, mad: 0 }), { fingerprintStable: true })).toBe(
      'medium',
    );
  });

  it('degrades to medium on moderate dispersion', () => {
    // relative mad 0.10: above the high bar, inside the medium bar
    expect(
      gradeConfidence(metric({ median: 100, mad: 10 }), { fingerprintStable: true }),
    ).toBe('medium');
  });

  it('degrades to low on wide dispersion', () => {
    expect(
      gradeConfidence(metric({ median: 100, mad: 20 }), { fingerprintStable: true }),
    ).toBe('low');
  });

  it('treats a zero median with zero dispersion as perfectly stable', () => {
    expect(
      gradeConfidence(metric({ median: 0, mad: 0 }), { fingerprintStable: true }),
    ).toBe('high');
  });

  it('treats a zero median with any dispersion as low', () => {
    expect(
      gradeConfidence(metric({ median: 0, mad: 1 }), { fingerprintStable: true }),
    ).toBe('low');
  });
});
