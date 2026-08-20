import { describe, expect, it } from 'vitest';
import { AggregatedMetric, NoiseFloor } from '@balise/schemas';
import { classifyDelta, gradeConfidence, median, medianAbsoluteDeviation } from '@balise/measure-core';
import { buildMeasurementCanon } from '../../scripts/measurement-canon-source';
import { measurementCanon } from './measurement-canon';

const rebuilt = buildMeasurementCanon();

describe('the checked-in measurement canon', () => {
  it('is what the generator produces', () => {
    expect(JSON.parse(JSON.stringify(measurementCanon.aggregations))).toEqual(
      JSON.parse(JSON.stringify(rebuilt.aggregations)),
    );
    expect(JSON.parse(JSON.stringify(measurementCanon.scenarios))).toEqual(
      JSON.parse(JSON.stringify(rebuilt.scenarios)),
    );
  });

  it('records the scaling factor and history minimum the kernel used', () => {
    expect(measurementCanon.scalingFactor).toBe(1.2);
    expect(measurementCanon.minHistory).toBe(20);
  });

  it('parses every aggregate through the schema', () => {
    for (const aggregation of measurementCanon.aggregations) {
      for (const metric of aggregation.metrics) {
        expect(() =>
          AggregatedMetric.parse({
            metricId: metric.metricId,
            unit: metric.unit,
            median: metric.median,
            mad: metric.mad,
            min: metric.min,
            max: metric.max,
            sampleCount: metric.sampleCount,
          }),
        ).not.toThrow();
        expect(() => NoiseFloor.parse(metric.floor)).not.toThrow();
      }
    }
  });
});

describe('every statistic is the one its runs produce', () => {
  it('states the median of the runs recorded beside it', () => {
    for (const aggregation of measurementCanon.aggregations) {
      for (const metric of aggregation.metrics) {
        expect(metric.median).toBeCloseTo(median(metric.runValues), 9);
      }
    }
  });

  it('states the mad of those same runs, never a number chosen to look right', () => {
    for (const aggregation of measurementCanon.aggregations) {
      for (const metric of aggregation.metrics) {
        expect(metric.mad).toBeCloseTo(medianAbsoluteDeviation(metric.runValues), 9);
      }
    }
  });

  it('states the extremes of those runs rather than the median plus a multiple of the mad', () => {
    for (const aggregation of measurementCanon.aggregations) {
      for (const metric of aggregation.metrics) {
        expect(metric.min).toBe(Math.min(...metric.runValues));
        expect(metric.max).toBe(Math.max(...metric.runValues));
        expect(metric.sampleCount).toBe(metric.runValues.length);
      }
    }
  });

  it('grades confidence with the kernel rather than by hand', () => {
    for (const aggregation of measurementCanon.aggregations) {
      for (const metric of aggregation.metrics) {
        const graded = gradeConfidence(
          {
            metricId: metric.metricId,
            unit: metric.unit,
            median: metric.median,
            mad: metric.mad,
            min: metric.min,
            max: metric.max,
            sampleCount: metric.sampleCount,
          },
          { fingerprintStable: aggregation.fingerprintStable },
        );
        expect(metric.confidence).toBe(graded);
      }
    }
  });
});

describe('the noise floor', () => {
  it('belongs to the scenario, so two runs of one route read against one number', () => {
    const baseline = aggregation('baseline');
    const candidate = aggregation('candidate');
    expect(baseline.scenarioId).toBe(candidate.scenarioId);
    for (const metric of baseline.metrics) {
      const other = candidate.metrics.find((entry) => entry.metricId === metric.metricId);
      expect(other?.floor).toEqual(metric.floor);
    }
  });

  it('is not established where there is not enough history, and nothing fills it in', () => {
    for (const metric of aggregation('scan').metrics) {
      expect(metric.floor.status).toBe('insufficient-history');
      if (metric.floor.status === 'insufficient-history') {
        expect(metric.floor.sampleCount).toBe(0);
        expect(metric.floor.requiredCount).toBe(20);
      }
      // one cold pass is below the minimum for any grade above low.
      expect(metric.confidence).toBe('low');
    }
  });

  it('is scaled from history, never equal to the run dispersion it sits beside', () => {
    const metric = metricOf('service', 'transferred_bytes');
    if (metric.floor.status !== 'established') throw new Error('expected an established floor');
    expect(metric.floor.scalingFactor).toBe(1.2);
    expect(metric.floor.sampleCount).toBe(24);
    expect(metric.floor.value).toBeGreaterThan(metric.mad);
  });
});

describe('the verdicts the comparison reads', () => {
  it('classifies the route deltas through the kernel', () => {
    const verdicts = new Map<string, string>();
    for (const before of aggregation('baseline').metrics) {
      const after = aggregation('candidate').metrics.find(
        (entry) => entry.metricId === before.metricId,
      )!;
      verdicts.set(before.metricId, classifyDelta(asAggregate(before), asAggregate(after), before.floor).classification);
    }
    // the bundle the pull request added: 184 KB, two requests and 64 ms above
    // floors of 7.4 KB, 1.2 requests and 14.8 ms.
    expect(verdicts.get('transferred_bytes')).toBe('regression');
    expect(verdicts.get('request_count')).toBe('regression');
    expect(verdicts.get('js_execution_ms')).toBe('regression');
    // 22 nodes against a floor of 185 is not a change, however much a chart
    // would prefer it to be one.
    expect(verdicts.get('dom_node_count')).toBe('no-significant-change');
  });
});

function aggregation(id: string) {
  const found = measurementCanon.aggregations.find((entry) => entry.id === id);
  if (found === undefined) throw new Error(`the measurement canon holds no aggregation ${id}`);
  return found;
}

function metricOf(aggregationId: string, metricId: string) {
  const found = aggregation(aggregationId).metrics.find((entry) => entry.metricId === metricId);
  if (found === undefined) throw new Error(`${aggregationId} holds no ${metricId}`);
  return found;
}

function asAggregate(metric: (typeof measurementCanon.aggregations)[number]['metrics'][number]) {
  return {
    metricId: metric.metricId,
    unit: metric.unit,
    median: metric.median,
    mad: metric.mad,
    min: metric.min,
    max: metric.max,
    sampleCount: metric.sampleCount,
  };
}
