import type { BudgetAssessment, CheckPolicy, CheckSummary } from '@balise/schemas';

/**
 * what the assessments do to a pull request.
 *
 * three rules hold this together. a merge is blocked only by a budget the
 * policy says blocks it. an override lifts the block and never the breach: the
 * breach is still counted, still shown, and still goes to the execution
 * report. and anything the engine refused to decide leaves the check neutral,
 * because a green tick over an unevaluated budget would be a lie in the
 * customer's favour.
 */
export function summariseCheck(
  assessments: readonly BudgetAssessment[],
  policy: CheckPolicy,
): CheckSummary {
  const counts = { conforme: 0, warn: 0, breach: 0, nonEvalue: 0 };
  const blocking: BudgetAssessment[] = [];
  const overridden: BudgetAssessment[] = [];

  for (const assessment of assessments) {
    switch (assessment.status) {
      case 'conforme':
        counts.conforme += 1;
        break;
      case 'warn':
        counts.warn += 1;
        break;
      case 'breach':
        counts.breach += 1;
        break;
      case 'non_evalue':
        counts.nonEvalue += 1;
        break;
    }

    const blocks =
      policy.blockMergeOn === 'never'
        ? false
        : policy.blockMergeOn === 'warn'
          ? assessment.status === 'breach' || assessment.status === 'warn'
          : assessment.status === 'breach';

    if (!blocks) continue;
    if (assessment.override !== null) overridden.push(assessment);
    else blocking.push(assessment);
  }

  const conclusion: CheckSummary['conclusion'] =
    blocking.length > 0
      ? 'failure'
      : counts.breach + counts.warn + counts.nonEvalue > 0
        ? 'neutral'
        : 'success';

  return { conclusion, counts, blocking, overridden };
}
