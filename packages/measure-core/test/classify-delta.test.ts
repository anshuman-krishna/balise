import { describe, expect, it } from 'vitest';
import type { AggregatedMetric, NoiseFloor } from '@balise/schemas';
import { classifyDelta } from '../src/classify-delta.js';

function metric(overrides: Partial<AggregatedMetric> = {}): AggregatedMetric {
  return {
    metricId: 'transferred_bytes',
    unit: 'bytes',
    median: 1_114_000,
    mad: 6_000,
    min: 1_108_000,
    max: 1_121_000,
    sampleCount: 5,
    ...overrides,
  };
}

function establishedFloor(value: number): NoiseFloor {
  return {
    status: 'established',
    metricId: 'transferred_bytes',
    unit: 'bytes',
    value,
    sampleCount: 30,
    scalingFactor: 1.2,
  };
}

const noFloor: NoiseFloor = {
  status: 'insufficient-history',
  metricId: 'transferred_bytes',
  sampleCount: 4,
  requiredCount: 20,
};

describe('classifyDelta', () => {
  // The canon incident: +184 KB against a 7 KB floor is a real regression.
  it('classifies a growth far beyond the floor as a regression', () => {
    const delta = classifyDelta(
      metric({ median: 1_114_000 }),
      metric({ median: 1_298_000 }),
      establishedFloor(7_000),
    );
    expect(delta.classification).toBe('regression');
    expect(delta.value).toBe(184_000);
  });

  // The canon counter-example: -5 KB inside a 7 KB floor is not an improvement.
  it('reports a favourable-looking delta inside the floor as no significant change', () => {
    const delta = classifyDelta(
      metric({ median: 1_258_000 }),
      metric({ median: 1_253_000 }),
      establishedFloor(7_000),
    );
    expect(delta.classification).toBe('no-significant-change');
    expect(delta.value).toBe(-5_000);
  });

  it('classifies a shrink beyond the floor as an improvement', () => {
    const delta = classifyDelta(
      metric({ median: 1_298_000 }),
      metric({ median: 1_140_000 }),
      establishedFloor(7_000),
    );
    expect(delta.classification).toBe('improvement');
  });

  it('treats a delta exactly at the floor as not significant', () => {
    const delta = classifyDelta(
      metric({ median: 1_000_000 }),
      metric({ median: 1_007_000 }),
      establishedFloor(7_000),
    );
    expect(delta.classification).toBe('no-significant-change');
  });

  it('treats a delta one unit past the floor as significant', () => {
    const delta = classifyDelta(
      metric({ median: 1_000_000 }),
      metric({ median: 1_007_001 }),
      establishedFloor(7_000),
    );
    expect(delta.classification).toBe('regression');
  });

  it('treats a negative delta exactly at the floor as not significant', () => {
    const delta = classifyDelta(
      metric({ median: 1_007_000 }),
      metric({ median: 1_000_000 }),
      establishedFloor(7_000),
    );
    expect(delta.classification).toBe('no-significant-change');
  });

  it('classifies a zero delta as no significant change', () => {
    const delta = classifyDelta(
      metric({ median: 1_000_000 }),
      metric({ median: 1_000_000 }),
      establishedFloor(7_000),
    );
    expect(delta.classification).toBe('no-significant-change');
    expect(delta.value).toBe(0);
  });

  it('with a zero floor, any nonzero delta is significant', () => {
    const up = classifyDelta(
      metric({ median: 100 }),
      metric({ median: 101 }),
      establishedFloor(0),
    );
    expect(up.classification).toBe('regression');
    const flat = classifyDelta(
      metric({ median: 100 }),
      metric({ median: 100 }),
      establishedFloor(0),
    );
    expect(flat.classification).toBe('no-significant-change');
  });

  it('returns indeterminate when no floor is established, regardless of delta size', () => {
    const huge = classifyDelta(
      metric({ median: 1_000_000 }),
      metric({ median: 9_000_000 }),
      noFloor,
    );
    expect(huge.classification).toBe('indeterminate');
    const tiny = classifyDelta(metric({ median: 100 }), metric({ median: 100 }), noFloor);
    expect(tiny.classification).toBe('indeterminate');
  });

  it('keeps the floor it classified against, for audit and rendering', () => {
    const floor = establishedFloor(7_000);
    const delta = classifyDelta(
      metric({ median: 1_114_000 }),
      metric({ median: 1_298_000 }),
      floor,
    );
    expect(delta.floor).toEqual(floor);
  });

  it('throws on mismatched metrics', () => {
    expect(() =>
      classifyDelta(
        metric(),
        metric({ metricId: 'request_count', unit: 'count' }),
        establishedFloor(7_000),
      ),
    ).toThrow('mismatched metrics');
  });

  it('throws when the floor belongs to a different metric', () => {
    const floor: NoiseFloor = {
      status: 'established',
      metricId: 'request_count',
      unit: 'count',
      value: 2,
      sampleCount: 30,
      scalingFactor: 1.2,
    };
    expect(() => classifyDelta(metric(), metric(), floor)).toThrow('noise floor for');
  });
});
