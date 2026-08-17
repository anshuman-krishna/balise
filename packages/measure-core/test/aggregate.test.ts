import { describe, expect, it } from 'vitest';
import type { MetricSet } from '@balise/schemas';
import { aggregateRuns, getAggregatedMetric } from '../src/aggregate.js';

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
