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
