import { describe, expect, it } from 'vitest';
import type { AggregatedMetrics, MetricSet } from '@balise/schemas';
import { aggregateRuns } from '@balise/measure-core';
import { gradeAggregate } from '../src/measure.js';

/** n runs of one scenario, all tight around the same centre. */
function session(centre: number, runs = 5): MetricSet[] {
  return Array.from({ length: runs }, (_, index) => ({
    pass: 'cold' as const,
    values: [
      {
        metricId: 'transferred_bytes' as const,
        value: centre + (index - Math.floor(runs / 2)) * 200,
        unit: 'bytes' as const,
      },
    ],
  }));
}

function history(length: number): AggregatedMetrics[] {
  return Array.from({ length }, () => aggregateRuns(session(1_000_000)));
}

describe('gradeAggregate', () => {
  const aggregate = aggregateRuns(session(1_000_000));

  it('grades low with no history, however tight the runs were', () => {
    // five runs whose dispersion is well inside the high threshold. without a
    // floor the scenario cannot detect a change at all, so what is known about
    // the figure is low, and this is the call site that used to say otherwise.
    const metric = aggregate.metrics[0]!;
    expect(metric.mad / metric.median).toBeLessThan(0.05);
    expect(metric.sampleCount).toBe(5);

    expect(gradeAggregate(aggregate, { fingerprintStable: true }).transferred_bytes).toBe('low');
  });

  it('grades on dispersion once the scenario has enough history', () => {
    expect(
      gradeAggregate(aggregate, { fingerprintStable: true, history: history(20) })
        .transferred_bytes,
    ).toBe('high');
  });

  it('still grades low one aggregation short of the minimum history', () => {
    expect(
      gradeAggregate(aggregate, { fingerprintStable: true, history: history(19) })
        .transferred_bytes,
    ).toBe('low');
  });

  it('grades low on an unstable fingerprint whatever the history says', () => {
    expect(
      gradeAggregate(aggregate, { fingerprintStable: false, history: history(20) })
        .transferred_bytes,
    ).toBe('low');
  });

  it('grades every metric in the aggregate', () => {
    const twoMetrics = aggregateRuns(
      session(1_000_000).map((set, index) => ({
        ...set,
        values: [
          ...set.values,
          { metricId: 'request_count' as const, value: 80 + index, unit: 'count' as const },
        ],
      })),
    );
    const grades = gradeAggregate(twoMetrics, { fingerprintStable: true });
    expect(Object.keys(grades).sort()).toEqual(['request_count', 'transferred_bytes']);
  });
});
