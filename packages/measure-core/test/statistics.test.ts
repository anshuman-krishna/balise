import { describe, expect, it } from 'vitest';
import { median, medianAbsoluteDeviation } from '../src/statistics.js';

describe('median', () => {
  it('throws on an empty sample', () => {
    expect(() => median([])).toThrow('at least one value');
  });

  it('returns the value for a single sample', () => {
    expect(median([42])).toBe(42);
  });

  it('returns the middle value for odd counts', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([5, 1, 4, 2, 3])).toBe(3);
  });

  it('returns the mean of the two middle values for even counts', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([10, 20])).toBe(15);
  });

  it('does not mutate its input', () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });

  it('is robust to a single extreme outlier, unlike a mean', () => {
    expect(median([100, 101, 99, 100, 100_000])).toBe(100);
  });

  it('handles negative values', () => {
    expect(median([-5, -1, -3])).toBe(-3);
  });
});

describe('medianAbsoluteDeviation', () => {
  it('is zero for identical samples', () => {
    expect(medianAbsoluteDeviation([7, 7, 7, 7, 7])).toBe(0);
  });

  it('computes the median of absolute deviations from the median', () => {
    // median = 3, |deviations| = [2, 1, 0, 1, 2], MAD = 1
    expect(medianAbsoluteDeviation([1, 2, 3, 4, 5])).toBe(1);
  });

  it('is robust to a single extreme outlier', () => {
    // median = 100; deviations [0, 1, 1, 0, 99900]; MAD = 1
    expect(medianAbsoluteDeviation([100, 101, 99, 100, 100_000])).toBe(1);
  });
});
