import type { AggregatedMetric, Confidence, NoiseFloor } from '@balise/schemas';

/**
 * provisional thresholds, flagged in PLAN.md. confidence is derived from run
 * dispersion, sample count, fingerprint stability and whether the scenario has
 * a floor at all, and it appears next to every figure it applies to (the
 * operating manual section 9).
 */
export const CONFIDENCE_THRESHOLDS = {
  minRunsForHigh: 5,
  minRunsForMedium: 3,
  maxRelativeMadForHigh: 0.05,
  maxRelativeMadForMedium: 0.15,
} as const;

export interface ConfidenceContext {
  // false when the runs behind this aggregate carry differing fingerprints.
  fingerprintStable: boolean;
  /**
   * the scenario's floor for this metric, or null where none was computed.
   *
   * required rather than optional, so that a caller has to answer the question
   * instead of inheriting a default. dispersion says how repeatable five runs
   * were; the floor says whether a change on this scenario could be detected
   * at all, and a figure that is tight and undetectable is not a figure much is
   * known about.
   */
  noiseFloor: NoiseFloor | null;
}

export function gradeConfidence(metric: AggregatedMetric, context: ConfidenceContext): Confidence {
  if (!context.fingerprintStable) {
    return 'low';
  }
  // METHODOLOGY.md section 7: below the minimum history there is no floor, and
  // everything on that scenario is low confidence.
  if (context.noiseFloor === null || context.noiseFloor.status !== 'established') {
    return 'low';
  }
  if (metric.sampleCount < CONFIDENCE_THRESHOLDS.minRunsForMedium) {
    return 'low';
  }

  // a zero median with any dispersion is unstable by definition; with no
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
