import type { Confidence, DeltaClassification } from '@balise/schemas';

// pure geometry and state resolution for the tolerance band. kept out of the
// component so the product rules are unit-testable without a dom.

export interface LinearScale {
  domainMin: number;
  domainMax: number;
  rangeMin: number;
  rangeMax: number;
}

/** linear map from domain to range, clamped to the range. */
export function xPosition(scale: LinearScale, value: number): number {
  const { domainMin, domainMax, rangeMin, rangeMax } = scale;
  if (domainMax === domainMin) {
    return rangeMin;
  }
  const t = (value - domainMin) / (domainMax - domainMin);
  const clamped = Math.min(1, Math.max(0, t));
  return rangeMin + clamped * (rangeMax - rangeMin);
}

/** evenly spaced tick values across the domain, endpoints included. */
export function tickValues(domainMin: number, domainMax: number, count: number): number[] {
  if (count < 2) {
    throw new Error('tickValues needs at least two ticks');
  }
  const step = (domainMax - domainMin) / (count - 1);
  return Array.from({ length: count }, (_, i) => domainMin + i * step);
}

export type BandState = 'normal' | 'breach' | 'caution';

/**
 * product rule 2, enforced in code: a delta renders as breach only if it
 * cleared the noise floor, meaning it was classified as a regression. an
 * absolute threshold breach (no delta involved) passes no classification and
 * renders as requested.
 */
export function resolveBandState(
  requested: BandState,
  deltaClassification?: DeltaClassification,
): BandState {
  if (
    requested === 'breach' &&
    deltaClassification !== undefined &&
    deltaClassification !== 'regression'
  ) {
    return 'normal';
  }
  return requested;
}

export type BandSize = 'canonical' | 'compact' | 'badge';

/**
 * product rule 3: low confidence dashes the median rule. never omitted to
 * save space; other layers are dropped first.
 */
export function medianDashArray(confidence: Confidence, size: BandSize): string | undefined {
  if (confidence !== 'low') {
    return undefined;
  }
  return size === 'canonical' ? '4 2' : '3 2';
}

export interface BandLayout {
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  noiseY: number;
  noiseHeight: number;
  bandY: number;
  bandHeight: number;
  medianTop: number;
  medianBottom: number;
  medianWidth: number;
  axisY: number;
  tickLength: number;
  labelY: number;
  showAxisLabels: boolean;
  showModelTicks: boolean;
  showMedianTriangle: boolean;
  tickCount: number;
}

// dimensions from the design prototypes (tolerance band.dc.html), verbatim.
export const BAND_LAYOUTS: Record<BandSize, BandLayout> = {
  canonical: {
    width: 460,
    height: 88,
    plotLeft: 30,
    plotRight: 430,
    noiseY: 10,
    noiseHeight: 42,
    bandY: 18,
    bandHeight: 26,
    medianTop: 4,
    medianBottom: 52,
    medianWidth: 2.5,
    axisY: 60,
    tickLength: 5,
    labelY: 78,
    showAxisLabels: true,
    showModelTicks: true,
    showMedianTriangle: true,
    tickCount: 6,
  },
  compact: {
    width: 130,
    height: 14,
    plotLeft: 0,
    plotRight: 130,
    noiseY: 1,
    noiseHeight: 12,
    bandY: 4,
    bandHeight: 6,
    medianTop: 1,
    medianBottom: 13,
    medianWidth: 1.8,
    axisY: 7,
    tickLength: 0,
    labelY: 0,
    showAxisLabels: false,
    showModelTicks: false,
    showMedianTriangle: false,
    tickCount: 0,
  },
  badge: {
    width: 74,
    height: 16,
    plotLeft: 0,
    plotRight: 74,
    noiseY: 2,
    noiseHeight: 12,
    bandY: 5,
    bandHeight: 6,
    medianTop: 2,
    medianBottom: 14,
    medianWidth: 1.8,
    axisY: 8,
    tickLength: 0,
    labelY: 0,
    showAxisLabels: false,
    showModelTicks: false,
    showMedianTriangle: false,
    tickCount: 0,
  },
};

export const BAND_COLORS = {
  ink: '#15181B',
  noise: '#5A6169',
  noiseCaution: '#C4761A',
  band: '#2B3FD9',
  bandBreach: '#B3312C',
  median: '#2B3FD9',
  medianBreach: '#B3312C',
  axis: '#5A6169',
} as const;

// ---- trend rendering (band over time) ----

export interface TrendLayout {
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  axisY: number;
  labelY: number;
}

// dimensions from the design prototype (rendering 1b), verbatim.
export const TREND_LAYOUT: TrendLayout = {
  width: 460,
  height: 152,
  plotLeft: 30,
  plotRight: 430,
  plotTop: 26,
  plotBottom: 112,
  axisY: 126,
  labelY: 150,
};

export interface TrendPoint {
  median: number;
  low: number;
  high: number;
}

/**
 * the drawn domain: the full dispersion envelope plus a budget rule if one
 * exists, with a small margin so nothing touches the frame. the envelope is
 * never clipped, because clipping it would hide dispersion, which is the
 * one thing this chart exists to show.
 */
export function trendDomain(
  points: readonly TrendPoint[],
  budget?: number,
): { min: number; max: number } {
  if (points.length === 0) {
    throw new Error('trendDomain needs at least one point');
  }
  const values = points.flatMap((point) => [point.low, point.high]);
  if (budget !== undefined) {
    values.push(budget);
  }
  const low = Math.min(...values);
  const high = Math.max(...values);
  // a flat series still needs a drawable domain
  const margin = (high - low) * 0.06 || 1;
  return { min: low - margin, max: high + margin };
}

/**
 * the envelope polygon: the high edge left to right, then the low edge back.
 * returned as svg point pairs.
 */
export function envelopePolygon(
  points: readonly TrendPoint[],
  x: (index: number) => number,
  y: (value: number) => number,
): string {
  const forward = points.map((point, index) => `${x(index)},${y(point.high)}`);
  const back = points.map((point, index) => `${x(index)},${y(point.low)}`).reverse();
  return [...forward, ...back].join(' ');
}

// ---- dispersion rendering (individual runs, median and mad) ----

export interface DispersionLayout {
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  baselineY: number;
  candidateY: number;
  axisY: number;
  rowHalfHeight: number;
  medianHalfHeight: number;
  noiseY: number;
  noiseHeight: number;
  runRadius: number;
  tickCount: number;
}

// dimensions from the design prototype (rendering 1c), verbatim.
export const DISPERSION_LAYOUT: DispersionLayout = {
  width: 460,
  height: 128,
  plotLeft: 91,
  plotRight: 430,
  baselineY: 42,
  candidateY: 76,
  axisY: 98,
  rowHalfHeight: 7,
  medianHalfHeight: 11,
  noiseY: 10,
  noiseHeight: 76,
  runRadius: 2.4,
  tickCount: 4,
};
