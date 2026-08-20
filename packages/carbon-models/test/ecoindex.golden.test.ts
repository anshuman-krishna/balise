import { describe, expect, it } from 'vitest';
import type { ModelInput } from '@balise/schemas';
import { ecoindexModel, ecoIndexPercentile } from '../src/models/ecoindex.js';

// golden fixtures. expected values computed by running the cnumr reference
// implementation (GreenIT-Analysis ecoIndex.js, quantiles from the published
// ecoindex method) on 2026-08-17. any drift fails.
const GOLDEN = [
  { dom: 2140, req: 84, sizeKb: 1258, score: 28.370642293477175, grade: 'E', ges: 2.4325871541304567 },
  { dom: 600, req: 40, sizeKb: 1024, score: 60.917231866923856, grade: 'C', ges: 1.7816553626615228 },
  { dom: 300, req: 20, sizeKb: 500, score: 79.80443358905427, grade: 'B', ges: 1.4039113282189146 },
  { dom: 0, req: 0, sizeKb: 0, score: 100, grade: 'A', ges: 1 },
  // upper bound of every quantile table pins the score to 0, grade g.
  { dom: 594601, req: 3920, sizeKb: 223212.26, score: 0, grade: 'G', ges: 3 },
] as const;

function input(dom: number, req: number, sizeKb: number): ModelInput {
  return {
    transferredBytes: sizeKb * 1000,
    requestCount: req,
    domNodeCount: dom,
    gridIntensity: { gCO2ePerKwh: 56, source: 'declared-default', zone: 'FR' },
    greenHostingFactor: 0,
  };
}

describe('ecoindex golden fixtures', () => {
  for (const golden of GOLDEN) {
    it(`dom=${golden.dom} req=${golden.req} size=${golden.sizeKb}KB scores ${golden.score.toFixed(2)} (${golden.grade})`, () => {
      const output = ecoindexModel.estimate(input(golden.dom, golden.req, golden.sizeKb));
      expect(output.score).toBeCloseTo(golden.score, 9);
      expect(output.grade).toBe(golden.grade);
      expect(output.value).toBeCloseTo(golden.ges, 9);
      expect(output.unit).toBe('gCO2e');
    });
  }

  it('throws when dom or request counts are missing instead of guessing', () => {
    const bare: ModelInput = {
      transferredBytes: 1_000_000,
      gridIntensity: { gCO2ePerKwh: 56, source: 'declared-default', zone: 'FR' },
      greenHostingFactor: 0,
    };
    expect(() => ecoindexModel.estimate(bare)).toThrow('requires');
  });

  it('declares its assumptions as data', () => {
    expect(ecoindexModel.assumptions.length).toBeGreaterThanOrEqual(4);
    for (const assumption of ecoindexModel.assumptions) {
      expect(assumption.textFr.length).toBeGreaterThan(0);
      expect(assumption.textEn.length).toBeGreaterThan(0);
    }
  });
});

describe('the published reference distribution', () => {
  // the quantile tables are twenty ventiles, so a value landing on the
  // eighteenth boundary is the ninetieth percentile of the distribution
  // ecoindex publishes. these are read off the same tables the score uses.
  it('places a value at its percentile of the published table', () => {
    expect(ecoIndexPercentile('dom_node_count', 1801)).toBeCloseTo(90, 6);
    expect(ecoIndexPercentile('request_count', 205)).toBeCloseTo(90, 6);
    expect(ecoIndexPercentile('transferred_bytes', 5_400_080)).toBeCloseTo(90, 6);
  });

  it('interpolates inside a ventile rather than rounding to it', () => {
    // 1830 sits just above the 90th percentile boundary of 1801.
    const percentile = ecoIndexPercentile('dom_node_count', 1_830)!;
    expect(percentile).toBeGreaterThan(90);
    expect(percentile).toBeLessThan(90.5);
  });

  it('reads page weight in decimal kilobytes, as the model does', () => {
    expect(ecoIndexPercentile('transferred_bytes', 144_700)).toBeCloseTo(10, 6);
  });

  it('bounds the ends of the table', () => {
    expect(ecoIndexPercentile('dom_node_count', 0)).toBe(0);
    expect(ecoIndexPercentile('dom_node_count', 10_000_000)).toBe(100);
  });

  it('answers nothing for a metric ecoindex publishes no table for', () => {
    expect(ecoIndexPercentile('js_execution_ms', 548)).toBeNull();
    expect(ecoIndexPercentile('third_party_bytes', 478_000)).toBeNull();
  });
});
