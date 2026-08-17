import type { DeltaClassification } from '@balise/schemas';

export type VerdictKey = 'breach' | 'real' | 'noSig' | 'indeterminate';

/**
 * maps a kernel classification plus threshold state to the fixed verdict
 * vocabulary. breach requires both clearing the noise floor and exceeding a
 * threshold; a significant change without a threshold breach is real, in
 * either direction. this never overrides the classification: a sub-floor
 * delta can never become breach here.
 */
export function verdictKeyFor(
  classification: DeltaClassification,
  overThreshold: boolean,
): VerdictKey {
  switch (classification) {
    case 'regression':
      return overThreshold ? 'breach' : 'real';
    case 'improvement':
      return 'real';
    case 'no-significant-change':
      return 'noSig';
    case 'indeterminate':
      return 'indeterminate';
  }
}

export const VERDICT_COLOR: Record<VerdictKey, string> = {
  breach: 'var(--breach)',
  real: 'var(--caution)',
  noSig: 'var(--text-secondary)',
  indeterminate: 'var(--text-tertiary)',
};
