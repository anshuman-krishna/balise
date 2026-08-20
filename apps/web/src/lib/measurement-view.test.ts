import { describe, expect, it } from 'vitest';
import { classifyDelta } from '@balise/measure-core';
import {
  aggregation,
  asAggregate,
  confidenceLabel,
  confidenceOf,
  floorOf,
  floorValue,
  kb,
  metric,
  noiseEdge,
  runsVaried,
  trendPoints,
} from './measurement-view';

describe('selecting an aggregation', () => {
  it('finds the ones the screens read', () => {
    expect(aggregation('service').scenarioId).toBe('service');
    expect(aggregation('baseline').scenarioId).toBe('route-acte-naissance');
    expect(aggregation('candidate').scenarioId).toBe('route-acte-naissance');
  });

  it('throws rather than returning an empty shape for an id nothing measured', () => {
    expect(() => aggregation('nope')).toThrow(/holds no aggregation/);
    expect(() => metric('service', 'third_party_bytes')).not.toThrow();
    expect(() => metric('scan', 'js_execution_ms')).toThrow(/measured no js_execution_ms/);
  });
});

describe('the aggregate handed to the kernel', () => {
  it('carries the run extremes, not a multiple of the mad', () => {
    const entry = metric('candidate', 'transferred_bytes');
    const aggregate = asAggregate(entry);
    expect(aggregate.min).toBe(Math.min(...entry.runValues));
    expect(aggregate.max).toBe(Math.max(...entry.runValues));
    expect(aggregate.sampleCount).toBe(entry.runValues.length);
  });

  it('classifies the route delta as a regression against the route floor', () => {
    const before = metric('baseline', 'transferred_bytes');
    const after = metric('candidate', 'transferred_bytes');
    const delta = classifyDelta(asAggregate(before), asAggregate(after), after.floor);
    expect(delta.classification).toBe('regression');
    expect(delta.value).toBe(184_000);
  });
});

describe('the noise floor a surface draws', () => {
  it('is one number for both runs of one route', () => {
    expect(floorOf('baseline', 'transferred_bytes')).toEqual(floorOf('candidate', 'transferred_bytes'));
  });

  it('is null, not zero, where no history established one', () => {
    expect(floorValue(metric('scan', 'transferred_bytes'))).toBeNull();
    expect(floorValue(metric('service', 'transferred_bytes'))).toBeGreaterThan(0);
  });

  it('draws no region at all when there is no floor', () => {
    expect(noiseEdge(980, null, 1)).toBeUndefined();
    expect(noiseEdge(980, null, -1)).toBeUndefined();
    expect(noiseEdge(1258, 7.38, 1)).toBeCloseTo(1265.38, 6);
    expect(noiseEdge(1258, 7.38, -1)).toBeCloseTo(1250.62, 6);
  });
});

describe('confidence', () => {
  it('is low on a single cold pass with no history, whatever a surface would prefer', () => {
    expect(confidenceOf('scan', 'transferred_bytes')).toBe('low');
    expect(confidenceOf('scan', 'dom_node_count')).toBe('low');
  });

  it('is not high where the runs disperse, and the grade names itself', () => {
    expect(confidenceOf('service', 'dom_node_count')).toBe('medium');
    expect(confidenceOf('service', 'transferred_bytes')).toBe('high');
    expect(confidenceLabel('medium')).not.toBe(confidenceLabel('high'));
    expect(confidenceLabel('low')).not.toBe(confidenceLabel('medium'));
  });

  it('counts the runs that landed off the median, which is why the grade is what it is', () => {
    const dom = metric('service', 'dom_node_count');
    expect(runsVaried(dom)).toBeGreaterThan(0);
    expect(runsVaried(dom)).toBeLessThanOrEqual(dom.sampleCount);
    // a page measured once has no run that differs from its own median.
    expect(runsVaried(metric('scan', 'dom_node_count'))).toBe(0);
  });
});

describe('the trend', () => {
  const points = trendPoints('journey', 'transferred_bytes', 14);

  it('ends on the aggregation being shown, not on a past one', () => {
    expect(points).toHaveLength(14);
    expect(points.at(-1)?.median).toBe(kb(metric('journey', 'transferred_bytes').median));
  });

  it('draws each point inside its own run spread rather than a shared envelope', () => {
    for (const point of points) {
      expect(point.low).toBeLessThanOrEqual(point.median);
      expect(point.high).toBeGreaterThanOrEqual(point.median);
    }
    const widths = points.map((point) => point.high - point.low);
    expect(new Set(widths.map((width) => width.toFixed(3))).size).toBeGreaterThan(1);
  });

  it('carries the step the regression introduced and the return after it', () => {
    // the deploy markers the dashboard draws sit at indexes 9 and 12.
    expect(points[9]!.median).toBeGreaterThan(points[8]!.median + 100);
    expect(points[12]!.median).toBeLessThan(points[11]!.median - 100);
  });
});
