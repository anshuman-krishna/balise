import { describe, expect, it } from 'vitest';
import type { ModelInput } from '@balise/schemas';
import { swdModel } from '../src/models/swd.js';

// Golden fixtures. Expected values computed by running the Green Web
// Foundation co2.js SWD v4 implementation (perByteTrace) on 2026-08-17.
// Any drift from the published model fails.
const GOLDEN = [
  { bytes: 1_258_000, grid: 56, greenHostingFactor: 1, expected: 0.07566618400000001 },
  { bytes: 1_258_000, grid: 56, greenHostingFactor: 0, expected: 0.07954082400000001 },
  { bytes: 500_000, grid: 56, greenHostingFactor: 1, expected: 0.030073999999999997 },
  // The published headline check: 1 GB at the global average, grey hosting,
  // is 0.3 kWh/GB x 494 gCO2e/kWh = 148.2 gCO2e.
  { bytes: 1_000_000_000, grid: 494, greenHostingFactor: 0, expected: 148.2 },
] as const;

function input(bytes: number, grid: number, greenHostingFactor: number): ModelInput {
  return {
    transferredBytes: bytes,
    gridIntensity: { gCO2ePerKwh: grid, source: 'declared-default', zone: grid === 56 ? 'FR' : 'WORLD' },
    greenHostingFactor,
  };
}

describe('swd v4 golden fixtures', () => {
  for (const golden of GOLDEN) {
    it(`bytes=${golden.bytes} grid=${golden.grid} ghf=${golden.greenHostingFactor} -> ${golden.expected} gCO2e`, () => {
      const output = swdModel.estimate(input(golden.bytes, golden.grid, golden.greenHostingFactor));
      expect(output.value).toBeCloseTo(golden.expected, 9);
      expect(output.unit).toBe('gCO2e');
    });
  }

  it('green hosting removes operational data centre emissions only', () => {
    const grey = swdModel.estimate(input(1_258_000, 56, 0));
    const green = swdModel.estimate(input(1_258_000, 56, 1));
    // Difference = operational DC = gb x 0.055 kWh/GB x 56 gCO2e/kWh
    const expectedDifference = (1_258_000 / 1_000_000_000) * 0.055 * 56;
    expect(grey.value - green.value).toBeCloseTo(expectedDifference, 12);
  });

  it('states the grid intensity zone and source in its notes', () => {
    const output = swdModel.estimate(input(1_258_000, 56, 1));
    expect(output.notes.join(' ')).toContain('FR');
    expect(output.notes.join(' ')).toContain('declared-default');
  });

  it('declares embodied emissions as included, as an assumption', () => {
    const ids = swdModel.assumptions.map((assumption) => assumption.id);
    expect(ids).toContain('swd-embodied-global');
  });
});
