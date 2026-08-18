import {
  CriterionTier,
  type BlockingFinding,
  type CompletionByTier,
  type CriterionAssessment,
  type RulePack,
} from '@balise/schemas';

/**
 * an answer only counts when it is one. an unevaluated criterion is not
 * answered, and neither is an assisted proposal nobody has confirmed: the
 * split by tier exists precisely so that auto-answered criteria are never
 * mistaken for a finished declaration.
 */
export function isAnswered(assessment: CriterionAssessment): boolean {
  return assessment.status !== 'non_evalue' && !assessment.requiresConfirmation;
}

export function completion(assessments: readonly CriterionAssessment[]): CompletionByTier {
  const byTier = CriterionTier.options.map((tier) => {
    const inTier = assessments.filter((assessment) => assessment.tier === tier);
    return {
      tier,
      answered: inTier.filter(isAnswered).length,
      total: inTier.length,
    };
  });

  // the rate is over applicable criteria: non_applicable is out of the
  // denominator, and unevaluated criteria stay in it, because not having
  // looked is not the same as having nothing to answer.
  const applicable = assessments.filter((a) => a.status !== 'non_applicable');
  const conforme = applicable.filter((a) => a.status === 'conforme' && isAnswered(a));

  return { byTier, conforme: conforme.length, applicable: applicable.length };
}

/**
 * what stands between a draft and a publishable declaration. the official
 * grid requires a justification for anything that is not conforme, and this
 * is the mechanical version of that rule: the template cannot render without
 * these being empty.
 */
export function blockingFindings(
  pack: RulePack,
  assessments: readonly CriterionAssessment[],
): BlockingFinding[] {
  const findings: BlockingFinding[] = [];
  const criteria = new Map(pack.criteria.map((criterion) => [criterion.id, criterion]));

  for (const assessment of assessments) {
    const criterion = criteria.get(assessment.criterionId);

    if (assessment.status === 'non_evalue') {
      findings.push({
        criterionId: assessment.criterionId,
        tier: assessment.tier,
        reason: 'unassessed-criterion',
        detailFr: assessment.evidenceFr,
      });
      continue;
    }

    if (assessment.requiresConfirmation) {
      findings.push({
        criterionId: assessment.criterionId,
        tier: assessment.tier,
        reason: 'unconfirmed-proposal',
        detailFr: `Réponse proposée (${assessment.status}), en attente de confirmation.`,
      });
      continue;
    }

    const needsJustification =
      assessment.status === 'partiellement_conforme' ||
      assessment.status === 'non_conforme' ||
      assessment.status === 'non_applicable';
    if (needsJustification && (assessment.justification ?? '').trim() === '') {
      findings.push({
        criterionId: assessment.criterionId,
        tier: assessment.tier,
        reason: 'missing-justification',
        detailFr: `Statut ${assessment.status} sans texte de justification.`,
      });
    }

    if (criterion !== undefined && criterion.evidenceRequired.length > 0 && assessment.source !== 'attested') {
      findings.push({
        criterionId: assessment.criterionId,
        tier: assessment.tier,
        reason: 'missing-evidence',
        detailFr: criterion.evidenceRequired.map((item) => item.labelFr).join(', '),
      });
    }
  }

  return findings;
}

/** a declaration may be published only when nothing is blocking it. */
export function canPublish(findings: readonly BlockingFinding[]): boolean {
  return findings.length === 0;
}
