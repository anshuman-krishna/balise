import { describe, expect, it } from 'vitest';
import {
  formatInt,
  formatMeasured,
  formatMeasuredSigned,
  formatNumber,
  formatSigned,
  NARROW_NBSP,
} from '../src/format.js';

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

describe('formatMeasured', () => {
  it('shows bytes in kilobytes, and small ones in bytes', () => {
    expect(formatMeasured(1_298_000, 'bytes')).toBe(`1${NARROW_NBSP}298 KB`);
    expect(formatMeasured(840, 'bytes')).toBe('840 B');
  });

  it('keeps a decimal on a percentage, because that is what was measured', () => {
    expect(formatMeasured(38.70967741935484, 'pct')).toBe('38.7 %');
  });

  it('writes the unit on a duration and on nothing else', () => {
    expect(formatMeasured(1_284, 'ms')).toBe(`1${NARROW_NBSP}284 ms`);
    expect(formatMeasured(84, 'count')).toBe('84');
  });
});

describe('formatMeasuredSigned', () => {
  it('signs a byte delta and keeps its unit', () => {
    expect(formatMeasuredSigned(184_000, 'bytes')).toBe('+184 KB');
    expect(formatMeasuredSigned(-840, 'bytes')).toBe('-840 B');
  });

  it('counts a share in points, never in percent of a percent', () => {
    expect(formatMeasuredSigned(-8.71, 'pct')).toBe('-8.7 pt');
  });
});
