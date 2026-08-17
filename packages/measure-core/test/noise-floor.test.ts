import { describe, expect, it } from 'vitest';
import type { AggregatedMetrics } from '@balise/schemas';
import {
  computeNoiseFloor,
  NOISE_FLOOR_MIN_HISTORY,
  PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR,
} from '../src/noise-floor.js';

function aggregation(mad: number): AggregatedMetrics {
  return {
    pass: 'cold',
    sampleCount: 5,
    metrics: [
      {
        metricId: 'transferred_bytes',
        unit: 'bytes',
        median: 1_258_000,
        mad,
        min: 1_250_000,
        max: 1_266_000,
        sampleCount: 5,
      },
    ],
  };
}

describe('computeNoiseFloor', () => {
  it('is not established below the minimum history', () => {
    const history = Array.from({ length: NOISE_FLOOR_MIN_HISTORY - 1 }, () => aggregation(6_000));
    const floor = computeNoiseFloor(history, 'transferred_bytes');
    expect(floor.status).toBe('insufficient-history');
    if (floor.status === 'insufficient-history') {
      expect(floor.sampleCount).toBe(NOISE_FLOOR_MIN_HISTORY - 1);
      expect(floor.requiredCount).toBe(NOISE_FLOOR_MIN_HISTORY);
    }
  });

  it('scales the median of historical MADs once history suffices', () => {
    const history = Array.from({ length: 25 }, () => aggregation(6_000));
    const floor = computeNoiseFloor(history, 'transferred_bytes');
    expect(floor.status).toBe('established');
    if (floor.status === 'established') {
      expect(floor.value).toBeCloseTo(PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR * 6_000, 10);
      expect(floor.sampleCount).toBe(25);
      expect(floor.scalingFactor).toBe(PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR);
    }
  });

  it('uses the median of MADs, so one noisy day does not widen the floor', () => {
    const history = [
      ...Array.from({ length: 24 }, () => aggregation(6_000)),
      aggregation(500_000),
    ];
    const floor = computeNoiseFloor(history, 'transferred_bytes');
    if (floor.status !== 'established') throw new Error('expected established floor');
    expect(floor.value).toBeCloseTo(PROVISIONAL_NOISE_FLOOR_SCALING_FACTOR * 6_000, 10);
  });

  it('ignores history entries that lack the metric', () => {
    const missing: AggregatedMetrics = { pass: 'cold', sampleCount: 5, metrics: [] };
    const history = [...Array.from({ length: 10 }, () => aggregation(6_000)), missing];
    const floor = computeNoiseFloor(history, 'transferred_bytes');
    expect(floor.status).toBe('insufficient-history');
    if (floor.status === 'insufficient-history') {
      expect(floor.sampleCount).toBe(10);
    }
  });

  it('honours an explicit scaling factor and minimum history', () => {
    const history = Array.from({ length: 5 }, () => aggregation(10_000));
    const floor = computeNoiseFloor(history, 'transferred_bytes', {
      scalingFactor: 2,
      minHistory: 5,
    });
    if (floor.status !== 'established') throw new Error('expected established floor');
    expect(floor.value).toBe(20_000);
    expect(floor.scalingFactor).toBe(2);
  });
});
