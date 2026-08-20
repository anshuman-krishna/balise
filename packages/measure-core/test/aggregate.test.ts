import { describe, expect, it } from 'vitest';
import type { MetricSet } from '@balise/schemas';
import { aggregateRuns, getAggregatedMetric, medianRunIndex } from '../src/aggregate.js';

function run(bytes: number, pass: 'cold' | 'warm' = 'cold'): MetricSet {
  return {
    pass,
    values: [
      { metricId: 'transferred_bytes', value: bytes, unit: 'bytes' },
      { metricId: 'request_count', value: 84, unit: 'count' },
    ],
  };
}

describe('aggregateRuns', () => {
  it('reports median and MAD, never mean', () => {
    // mean would be 1_202_000; median must be 1_000_000
    const result = aggregateRuns([
      run(1_000_000),
      run(1_001_000),
      run(999_000),
      run(1_000_000),
      run(2_010_000),
    ]);
    const bytes = getAggregatedMetric(result, 'transferred_bytes');
    expect(bytes?.median).toBe(1_000_000);
    expect(bytes?.mad).toBe(1_000);
    expect(bytes?.min).toBe(999_000);
    expect(bytes?.max).toBe(2_010_000);
    expect(bytes?.sampleCount).toBe(5);
  });

  it('refuses to average cold and warm passes together', () => {
    expect(() => aggregateRuns([run(100, 'cold'), run(100, 'warm')])).toThrow(
      'never averaged together',
    );
  });

  it('refuses to impute a metric missing from one run', () => {
    const broken: MetricSet = {
      pass: 'cold',
      values: [{ metricId: 'transferred_bytes', value: 100, unit: 'bytes' }],
    };
    expect(() => aggregateRuns([run(100), broken])).toThrow('never imputed');
  });

  it('throws on an empty run list', () => {
    expect(() => aggregateRuns([])).toThrow('at least one run');
  });

  it('throws on inconsistent units for the same metric', () => {
    const wrongUnit: MetricSet = {
      pass: 'cold',
      values: [
        { metricId: 'transferred_bytes', value: 100, unit: 'count' },
        { metricId: 'request_count', value: 84, unit: 'count' },
      ],
    };
    expect(() => aggregateRuns([run(100), wrongUnit])).toThrow('inconsistent units');
  });
});

describe('medianRunIndex', () => {
  it('names the run the reported median came from', () => {
    const runs = [run(1_002_000), run(1_010_000), run(1_000_000), run(998_000), run(1_004_000)];
    const index = medianRunIndex(runs, 'transferred_bytes');
    expect(index).toBe(0);
    expect(getAggregatedMetric(aggregateRuns(runs), 'transferred_bytes')?.median).toBe(
      runs[index!]!.values[0]!.value,
    );
  });

  it('names no run when the median falls between two of them', () => {
    // an aggregate of four has a median no capture recorded, and an inventory
    // shown under it would not add up to the figure above it.
    expect(medianRunIndex([run(100), run(200), run(300), run(400)], 'transferred_bytes')).toBeNull();
  });

  it('names the only run of a single-run scenario', () => {
    expect(medianRunIndex([run(100)], 'transferred_bytes')).toBe(0);
  });

  it('refuses a metric missing from a run', () => {
    const broken: MetricSet = { pass: 'cold', values: [] };
    expect(() => medianRunIndex([run(100), broken, run(300)], 'transferred_bytes')).toThrow(
      'never imputed',
    );
  });
});
