import { describe, expect, it } from 'vitest';
import { DEFAULT_RUNS, MIN_RUNS, resolveRunCount, sufficientForAggregate } from '../src/policy.js';

describe('resolveRunCount', () => {
  it('defaults to five runs per scenario', () => {
    expect(resolveRunCount()).toBe(DEFAULT_RUNS);
    expect(DEFAULT_RUNS).toBe(5);
  });

  it('allows configuring up', () => {
    expect(resolveRunCount(20)).toBe(20);
  });

  it('refuses to go below the minimum', () => {
    expect(resolveRunCount(MIN_RUNS)).toBe(MIN_RUNS);
    expect(() => resolveRunCount(MIN_RUNS - 1)).toThrow(/at least 3/);
    expect(() => resolveRunCount(1)).toThrow();
  });

  it('refuses a fractional run count', () => {
    expect(() => resolveRunCount(4.5)).toThrow(/whole number/);
  });
});

describe('sufficientForAggregate', () => {
  it('needs the minimum number of runs to have succeeded', () => {
    expect(sufficientForAggregate(MIN_RUNS)).toBe(true);
    expect(sufficientForAggregate(MIN_RUNS - 1)).toBe(false);
    expect(sufficientForAggregate(0)).toBe(false);
  });
});
