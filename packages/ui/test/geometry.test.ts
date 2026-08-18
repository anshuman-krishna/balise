import { describe, expect, it } from 'vitest';
import {
  envelopePolygon,
  medianDashArray,
  resolveBandState,
  tickValues,
  trendDomain,
  xPosition,
} from '../src/geometry.js';

const scale = { domainMin: 0.2, domainMax: 0.7, rangeMin: 30, rangeMax: 430 };

describe('xPosition', () => {
  it('maps the domain linearly onto the range', () => {
    expect(xPosition(scale, 0.2)).toBe(30);
    expect(xPosition(scale, 0.7)).toBe(430);
    expect(xPosition(scale, 0.45)).toBeCloseTo(230, 10);
  });

  it('clamps values outside the domain instead of drawing off the plot', () => {
    expect(xPosition(scale, 0.1)).toBe(30);
    expect(xPosition(scale, 0.9)).toBe(430);
  });

  it('degrades to the range minimum on a degenerate domain', () => {
    expect(xPosition({ ...scale, domainMax: 0.2 }, 0.2)).toBe(30);
  });
});

describe('tickValues', () => {
  it('spaces ticks evenly, endpoints included', () => {
    const ticks = tickValues(0.2, 0.7, 6);
    expect(ticks).toHaveLength(6);
    const expected = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7];
    ticks.forEach((tick, i) => expect(tick).toBeCloseTo(expected[i]!, 12));
  });

  it('rejects fewer than two ticks', () => {
    expect(() => tickValues(0, 1, 1)).toThrow('at least two');
  });
});

describe('resolveBandState (product rule 2)', () => {
  it('allows breach when the delta cleared the noise floor', () => {
    expect(resolveBandState('breach', 'regression')).toBe('breach');
  });

  it('refuses breach for a delta inside the noise floor', () => {
    expect(resolveBandState('breach', 'no-significant-change')).toBe('normal');
  });

  it('refuses breach for an indeterminate delta', () => {
    expect(resolveBandState('breach', 'indeterminate')).toBe('normal');
  });

  it('refuses breach for an improvement', () => {
    expect(resolveBandState('breach', 'improvement')).toBe('normal');
  });

  it('allows breach with no delta involved (absolute threshold)', () => {
    expect(resolveBandState('breach')).toBe('breach');
  });

  it('passes through normal and caution untouched', () => {
    expect(resolveBandState('normal', 'regression')).toBe('normal');
    expect(resolveBandState('caution', 'no-significant-change')).toBe('caution');
  });
});

describe('medianDashArray (product rule 3)', () => {
  it('dashes the median only on low confidence', () => {
    expect(medianDashArray('high', 'canonical')).toBeUndefined();
    expect(medianDashArray('medium', 'canonical')).toBeUndefined();
    expect(medianDashArray('low', 'canonical')).toBe('4 2');
  });

  it('keeps the dash legible at small sizes instead of dropping it', () => {
    expect(medianDashArray('low', 'compact')).toBe('3 2');
    expect(medianDashArray('low', 'badge')).toBe('3 2');
  });
});

describe('trendDomain', () => {
  const points = [
    { median: 100, low: 90, high: 110 },
    { median: 120, low: 112, high: 128 },
  ];

  it('spans the full envelope, not the medians', () => {
    const domain = trendDomain(points);
    expect(domain.min).toBeLessThan(90);
    expect(domain.max).toBeGreaterThan(128);
  });

  it('adds a margin of six percent of the extent', () => {
    const domain = trendDomain(points);
    expect(domain.min).toBeCloseTo(90 - 38 * 0.06, 10);
    expect(domain.max).toBeCloseTo(128 + 38 * 0.06, 10);
  });

  it('includes a budget rule that sits outside the data', () => {
    const domain = trendDomain(points, 300);
    expect(domain.max).toBeGreaterThan(300);
  });

  it('keeps a flat series drawable', () => {
    const flat = [{ median: 5, low: 5, high: 5 }];
    expect(trendDomain(flat)).toEqual({ min: 4, max: 6 });
  });

  it('refuses an empty series rather than inventing a domain', () => {
    expect(() => trendDomain([])).toThrow();
  });
});

describe('envelopePolygon', () => {
  const points = [
    { median: 1, low: 0, high: 2 },
    { median: 3, low: 2, high: 4 },
  ];
  const x = (index: number) => index * 10;
  const y = (value: number) => 100 - value;

  it('traces the high edge forward then the low edge back', () => {
    expect(envelopePolygon(points, x, y)).toBe('0,98 10,96 10,98 0,100');
  });

  it('emits two points per sample so the polygon closes', () => {
    expect(envelopePolygon(points, x, y).split(' ')).toHaveLength(points.length * 2);
  });
});
