import { describe, expect, it } from 'vitest';
import { formatInt, formatNumber, formatSigned, NARROW_NBSP } from '../src/format.js';

describe('formatInt', () => {
  it('groups thousands with a narrow no-break space, never a comma', () => {
    expect(formatInt(1258)).toBe(`1${NARROW_NBSP}258`);
    expect(formatInt(4812)).toBe(`4${NARROW_NBSP}812`);
    expect(formatInt(1234567)).toBe(`1${NARROW_NBSP}234${NARROW_NBSP}567`);
  });

  it('leaves small numbers ungrouped', () => {
    expect(formatInt(84)).toBe('84');
    expect(formatInt(0)).toBe('0');
  });

  it('keeps the sign outside the grouping', () => {
    expect(formatInt(-1258)).toBe(`-1${NARROW_NBSP}258`);
  });
});

describe('formatNumber', () => {
  it('uses a period decimal in the screen register', () => {
    expect(formatNumber(0.42, 2)).toBe('0.42');
  });

  it('groups the integer part', () => {
    expect(formatNumber(1258.5, 1)).toBe(`1${NARROW_NBSP}258.5`);
  });
});

describe('formatSigned', () => {
  it('always shows the sign', () => {
    expect(formatSigned(184)).toBe('+184');
    expect(formatSigned(-5)).toBe('-5');
    expect(formatSigned(0)).toBe('+0');
  });
});
