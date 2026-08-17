import { describe, expect, it } from 'vitest';
import type { ModelInput } from '@balise/schemas';
import { onebyteModel } from '../src/models/onebyte.js';

// Golden fixtures. Expected values computed by running the Green Web
// Foundation co2.js 1byte implementation on 2026-08-17. Any drift fails.
const GOLDEN = [
  { bytes: 1_258_000, greenHostingFactor: 0, expected: 0.36584275399999994 },
  { bytes: 1_258_000, greenHostingFactor: 1, expected: 0.29180358333333334 },
  { bytes: 500_000, greenHostingFactor: 0, expected: 0.14540649999999997 },
  { bytes: 1_000_000_000, greenHostingFactor: 0, expected: 290.81299999999993 },
] as const;

function input(bytes: number, greenHostingFactor: number): ModelInput {
  return {
    transferredBytes: bytes,
    gridIntensity: { gCO2ePerKwh: 56, source: 'declared-default', zone: 'FR' },
    greenHostingFactor,
  };
}

describe('onebyte golden fixtures', () => {
  for (const golden of GOLDEN) {
    it(`bytes=${golden.bytes} ghf=${golden.greenHostingFactor} -> ${golden.expected} gCO2e`, () => {
      const output = onebyteModel.estimate(input(golden.bytes, golden.greenHostingFactor));
      expect(output.value).toBeCloseTo(golden.expected, 9);
      expect(output.unit).toBe('gCO2e');
    });
  }

  it('ignores the visitor grid intensity, per its declared assumption', () => {
    const fr = onebyteModel.estimate(input(1_258_000, 0));
    const world = onebyteModel.estimate({
      ...input(1_258_000, 0),
      gridIntensity: { gCO2ePerKwh: 494, source: 'declared-default', zone: 'WORLD' },
    });
    expect(fr.value).toBe(world.value);
  });

  it('treats a partial green hosting factor as grey (binary model)', () => {
    const partial = onebyteModel.estimate(input(1_258_000, 0.5));
    const grey = onebyteModel.estimate(input(1_258_000, 0));
    expect(partial.value).toBe(grey.value);
  });

  it('returns zero below one byte, as the reference does', () => {
    expect(onebyteModel.estimate(input(0, 0)).value).toBe(0);
  });
});
