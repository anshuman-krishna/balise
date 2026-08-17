import type { AggregatedMetric, Confidence } from '@balise/schemas';

/**
 * PROVISIONAL thresholds, flagged in PLAN.md. Confidence is derived from run
 * dispersion, sample count and fingerprint stability, and it appears next to
 * every figure it applies to (CLAUDE.md section 9).
 */
export const CONFIDENCE_THRESHOLDS = {
  minRunsForHigh: 5,
  minRunsForMedium: 3,
  maxRelativeMadForHigh: 0.05,
  maxRelativeMadForMedium: 0.15,
} as const;

export interface ConfidenceContext {
  // False when the runs behind this aggregate carry differing fingerprints.
  fingerprintStable: boolean;
}

export function gradeConfidence(metric: AggregatedMetric, context: ConfidenceContext): Confidence {
  if (!context.fingerprintStable) {
    return 'low';
  }
  if (metric.sampleCount < CONFIDENCE_THRESHOLDS.minRunsForMedium) {
    return 'low';
  }

  // A zero median with any dispersion is unstable by definition; with no
  // dispersion it is perfectly stable.
  const relativeMad = metric.median === 0 ? (metric.mad === 0 ? 0 : Infinity) : metric.mad / Math.abs(metric.median);

  if (
    metric.sampleCount >= CONFIDENCE_THRESHOLDS.minRunsForHigh &&
    relativeMad <= CONFIDENCE_THRESHOLDS.maxRelativeMadForHigh
  ) {
    return 'high';
  }
  if (relativeMad <= CONFIDENCE_THRESHOLDS.maxRelativeMadForMedium) {
    return 'medium';
  }
  return 'low';
}
