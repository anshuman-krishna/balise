import { describe, expect, it } from 'vitest';
import { canonicalise } from '../src/canonical.js';

describe('canonicalise', () => {
  it('sorts object keys, so build order cannot change the digest', () => {
    expect(canonicalise({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalise({ a: 2, b: 1 })).toBe(canonicalise({ b: 1, a: 2 }));
  });

  it('sorts at every depth', () => {
    expect(canonicalise({ outer: { z: 1, a: { y: 2, b: 3 } } })).toBe(
      '{"outer":{"a":{"b":3,"y":2},"z":1}}',
    );
  });

  it('keeps array order, because order is data', () => {
    expect(canonicalise([3, 1, 2])).toBe('[3,1,2]');
    expect(canonicalise([1, 2, 3])).not.toBe(canonicalise([3, 2, 1]));
  });

  it('drops undefined from objects', () => {
    expect(canonicalise({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it('refuses undefined inside an array, which would shift every later element', () => {
    expect(() => canonicalise([1, undefined, 2])).toThrow(/undefined inside an array at 1/);
  });

  it('refuses values with no json form', () => {
    expect(() => canonicalise({ a: NaN })).toThrow(/non-finite/);
    expect(() => canonicalise({ a: Infinity })).toThrow(/non-finite/);
    expect(() => canonicalise({ a: () => 1 })).toThrow(/function/);
    expect(() => canonicalise({ a: 1n })).toThrow(/bigint/);
  });

  it('names where the offending value was', () => {
    expect(() => canonicalise({ run: { metrics: { js: NaN } } })).toThrow(/run.metrics.js/);
  });

  it('does not let negative zero hash differently from zero', () => {
    expect(canonicalise({ a: -0 })).toBe(canonicalise({ a: 0 }));
  });

  it('round-trips through json unchanged', () => {
    const value = { z: [1, { b: 'x', a: null }], a: true };
    expect(JSON.parse(canonicalise(value))).toEqual(value);
  });
});
